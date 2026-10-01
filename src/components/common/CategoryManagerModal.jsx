import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  RotateCcw,
  Search,
  HandCoins,
  Boxes,
  Briefcase,
  Wallet,
  Home,
  CheckCircle2,
  AlertCircle,
  Folder,
  Scale
} from 'lucide-react';

export const CategoryManagerModal = ({
  isOpen,
  onClose,
  defaultGroup = 'debtPersonalRelations',
  onSelectCategory
}) => {
  const {
    categories,
    addCategory,
    renameCategory,
    deleteCategory,
    resetCategories,
    personalDebts = [],
    businessDebts = [],
    products = [],
    businessExpenses = [],
    personalExpenses = [],
    personalIncomes = [],
    lang,
    showToast
  } = useApp();

  const [activeGroup, setActiveGroup] = useState(defaultGroup);
  const [searchTerm, setSearchTerm] = useState('');
  const [newCatInput, setNewCatInput] = useState('');
  const [editingItem, setEditingItem] = useState(null); // { originalName, currentInput }

  if (!isOpen) return null;

  const categoryGroups = [
    {
      id: 'debtPersonalRelations',
      label: lang === 'bn' ? 'দেনা-পাওনা (ব্যক্তিগত সম্পর্ক)' : 'Debt Relations (Personal)',
      icon: HandCoins,
      color: '#10b981',
      desc: lang === 'bn' ? 'ব্যক্তিগত দেনা-পাওনা খাতায় ব্যক্তির সম্পর্ক বা ধরন' : 'Relation types for personal debt ledger'
    },
    {
      id: 'debtBusinessRelations',
      label: lang === 'bn' ? 'দেনা-পাওনা (ব্যবসায়িক সম্পর্ক)' : 'Debt Relations (Business)',
      icon: HandCoins,
      color: '#059669',
      desc: lang === 'bn' ? 'ব্যবসায়িক দেনা-পাওনা খাতায় ব্যক্তির সম্পর্ক বা ভূমিকা' : 'Relation/Role types for business cash credit ledger'
    },
    {
      id: 'productCategories',
      label: lang === 'bn' ? 'পণ্যের ক্যাটাগরি (ইনভেন্টরি ও POS)' : 'Product Categories (POS & Inventory)',
      icon: Boxes,
      color: '#6366f1',
      desc: lang === 'bn' ? 'দোকানের সকল পণ্য ও আইটেমের ক্যাটাগরি তালিকা' : 'Categories for inventory and point-of-sale'
    },
    {
      id: 'businessExpenseCategories',
      label: lang === 'bn' ? 'ব্যবসায়িক খরচের খাত' : 'Business Expense Categories',
      icon: Briefcase,
      color: '#f43f5e',
      desc: lang === 'bn' ? 'দোকান পরিচালনা, বিল ও বিবিধ খরচের খাত' : 'Operational & business expense categories'
    },
    {
      id: 'personalExpenseCategories',
      label: lang === 'bn' ? 'ব্যক্তিগত খরচের খাত' : 'Personal Expense Categories',
      icon: Home,
      color: '#eab308',
      desc: lang === 'bn' ? 'দৈনিক বাজার, সংসার ও ব্যক্তিগত খরচের খাত' : 'Daily household & personal expense categories'
    },
    {
      id: 'personalIncomeCategories',
      label: lang === 'bn' ? 'ব্যক্তিগত আয়ের উৎস' : 'Personal Income Sources',
      icon: Wallet,
      color: '#3b82f6',
      desc: lang === 'bn' ? 'বেতন, ব্যবসা, ফ্রিল্যান্সিং ইত্যাদি আয়ের খাত' : 'Income source categories'
    },
    {
      id: 'familyExpenseFolders',
      label: lang === 'bn' ? '📁 পারিবারিক খরচ ফোল্ডার' : '📁 Family Expense Folders',
      icon: Folder,
      color: '#f97316',
      desc: lang === 'bn' ? 'পারিবারিক খরচের জন্য কাস্টম ফোল্ডার ক্যাটাগরি' : 'Folder categories for family expenses'
    },
    {
      id: 'expenseUnits',
      label: lang === 'bn' ? '⚖️ পরিমাপের একক (গ্রাম, কেজি, ফুট, টিপ)' : '⚖️ Units (g, kg, L, ft, trip)',
      icon: Scale,
      color: '#06b6d4',
      desc: lang === 'bn' ? 'বাজার ও খরচের পরিমাপক একক (গ্রাম, কেজি, ফুট, অটো ভাড়া, টিপ ইত্যাদি)' : 'Measurement units for expenses'
    }
  ];

  const currentGroupMeta = categoryGroups.find((g) => g.id === activeGroup) || categoryGroups[0];
  const currentList = categories[activeGroup] || [];

  // Count usage of a category across the app
  const getUsageCount = (catName) => {
    if (activeGroup === 'debtPersonalRelations') {
      return personalDebts.filter((p) => p.relation === catName).length;
    }
    if (activeGroup === 'debtBusinessRelations') {
      return businessDebts.filter((p) => p.relation === catName).length;
    }
    if (activeGroup === 'productCategories') {
      return products.filter((p) => p.category === catName).length;
    }
    if (activeGroup === 'businessExpenseCategories') {
      return businessExpenses.filter((e) => e.category === catName).length;
    }
    if (activeGroup === 'personalExpenseCategories') {
      return personalExpenses.filter((e) => e.category === catName).length;
    }
    if (activeGroup === 'personalIncomeCategories') {
      return personalIncomes.filter((i) => i.source === catName).length;
    }
    if (activeGroup === 'familyExpenseFolders') {
      return personalExpenses.filter((e) => e.folder === catName).length;
    }
    if (activeGroup === 'expenseUnits') {
      return personalExpenses.filter((e) => e.unit === catName).length;
    }
    return 0;
  };

  const filteredCategories = currentList.filter((cat) =>
    cat.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  const handleAddSubmit = (e) => {
    e.preventDefault();
    const clean = newCatInput.trim();
    if (!clean) return;
    const success = addCategory(activeGroup, clean);
    if (success) {
      setNewCatInput('');
      if (onSelectCategory) {
        onSelectCategory(clean);
      }
    }
  };

  const handleStartRename = (catName) => {
    setEditingItem({
      originalName: catName,
      currentInput: catName
    });
  };

  const handleSaveRename = (e) => {
    e?.preventDefault();
    if (!editingItem) return;
    const cleanNew = editingItem.currentInput.trim();
    if (!cleanNew) {
      showToast(lang === 'bn' ? 'ক্যাটাগরির নাম দিন' : 'Category name cannot be empty', 'warning');
      return;
    }
    const success = renameCategory(activeGroup, editingItem.originalName, cleanNew);
    if (success) {
      if (onSelectCategory) {
        onSelectCategory(cleanNew);
      }
      setEditingItem(null);
    }
  };

  const handleDelete = (catName) => {
    const usage = getUsageCount(catName);
    const warning =
      usage > 0
        ? lang === 'bn'
          ? `এই ক্যাটাগরিতে বর্তমানে ${usage}টি রেকর্ড যুক্ত রয়েছে। আপনি কি নিশ্চিত যে এটি তালিকা থেকে মুছে ফেলতে চান?`
          : `This category is used by ${usage} items. Are you sure you want to delete it?`
        : lang === 'bn'
        ? `আপনি কি নিশ্চিত যে "${catName}" ক্যাটাগরি মুছে ফেলতে চান?`
        : `Are you sure you want to delete "${catName}"?`;

    if (window.confirm(warning)) {
      deleteCategory(activeGroup, catName);
    }
  };

  const handleResetGroup = () => {
    if (
      window.confirm(
        lang === 'bn'
          ? 'আপনি কি এই গ্রুপের ক্যাটাগরিগুলো ডিফল্ট অবস্থায় ফিরিয়ে আনতে চান?'
          : 'Reset this category group to original default list?'
      )
    ) {
      resetCategories(activeGroup);
    }
  };

  return (
    <div
      className="modal-overlay modal-backdrop modal-top-align"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1400,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '20px 14px',
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        overflowY: 'auto'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-content animate-scale-up"
        style={{
          maxWidth: '750px',
          width: '95%',
          marginTop: '8px',
          background: 'var(--bg-card)',
          borderRadius: '18px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
          padding: '1.5rem',
          maxHeight: 'calc(100vh - 40px)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Modal Top Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '0.85rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(99, 102, 241, 0.15)',
                color: '#6366f1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Tag size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)' }}>
                {lang === 'bn' ? 'ক্যাটাগরি ও ধরন ব্যবস্থাপনা (ম্যানেজার)' : 'Category & Type Manager'}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {lang === 'bn'
                  ? 'নতুন ক্যাটাগরি যোগ করুন, নাম পরিবর্তন (রিনেম) ও মুছে ফেলুন'
                  : 'Add, rename, and delete categories with auto-updating records'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Group Selection Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            paddingBottom: '8px',
            marginBottom: '1rem',
            borderBottom: '1px solid var(--border-color)'
          }}
        >
          {categoryGroups.map((group) => {
            const isActive = activeGroup === group.id;
            const Icon = group.icon;
            const count = (categories[group.id] || []).length;
            return (
              <button
                key={group.id}
                onClick={() => {
                  setActiveGroup(group.id);
                  setEditingItem(null);
                  setSearchTerm('');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  borderRadius: '10px',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  whiteSpace: 'nowrap',
                  border: isActive ? `1.5px solid ${group.color}` : '1px solid var(--border-color)',
                  background: isActive ? `${group.color}20` : 'transparent',
                  color: isActive ? group.color : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={14} />
                <span>{group.label}</span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    background: isActive ? group.color : 'var(--border-color)',
                    color: isActive ? '#ffffff' : 'var(--text-main)',
                    fontWeight: '800'
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Group Sub-Header & Add New Bar */}
        <div
          style={{
            background: 'var(--bg-main)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: '800', color: currentGroupMeta.color }}>
                {currentGroupMeta.label}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{currentGroupMeta.desc}</div>
            </div>
            <button
              onClick={handleResetGroup}
              title={lang === 'bn' ? 'ডিফল্ট তালিকায় ফিরিয়ে নিন' : 'Reset to defaults'}
              style={{
                background: 'transparent',
                border: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '0.72rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <RotateCcw size={12} />
              <span>{lang === 'bn' ? 'ডিফল্ট রিস্টোর' : 'Reset'}</span>
            </button>
          </div>

          {/* Add Category Input */}
          <form onSubmit={handleAddSubmit} style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                placeholder={
                  lang === 'bn'
                    ? `নতুন ক্যাটাগরি / ধরনের নাম লিখুন (যেমন: ${
                        activeGroup.includes('debt') ? 'চাচাতো ভাই, জমি পার্টনার' : 'নতুন খাদ্যপণ্য'
                      })...`
                    : 'Enter new category name...'
                }
                value={newCatInput}
                onChange={(e) => setNewCatInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-main)',
                  fontSize: '0.88rem'
                }}
              />
            </div>
            <button
              type="submit"
              disabled={!newCatInput.trim()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 16px',
                borderRadius: '8px',
                background: newCatInput.trim() ? currentGroupMeta.color : 'var(--border-color)',
                color: '#ffffff',
                border: 'none',
                fontWeight: '700',
                fontSize: '0.88rem',
                cursor: newCatInput.trim() ? 'pointer' : 'not-allowed',
                boxShadow: newCatInput.trim() ? `0 4px 12px ${currentGroupMeta.color}40` : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Plus size={16} />
              <span>{lang === 'bn' ? 'যুক্ত করুন' : 'Add Category'}</span>
            </button>
          </form>
        </div>

        {/* Search inside this group */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-muted)' }}>
            {lang === 'bn' ? `বিদ্যমান ক্যাটাগরি তালিকা (${filteredCategories.length}টি)` : `Categories List (${filteredCategories.length})`}
          </div>
          {currentList.length > 5 && (
            <div style={{ position: 'relative', width: '200px' }}>
              <Search size={14} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder={lang === 'bn' ? 'খুঁজুন...' : 'Search...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '5px 8px 5px 28px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-main)',
                  color: 'var(--text-main)',
                  fontSize: '0.78rem'
                }}
              />
            </div>
          )}
        </div>

        {/* Scrollable Category List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            paddingRight: '4px',
            maxHeight: '320px'
          }}
        >
          {filteredCategories.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              {searchTerm
                ? (lang === 'bn' ? 'কোনো ক্যাটাগরি খুঁজে পাওয়া যায়নি' : 'No matching categories')
                : (lang === 'bn' ? 'এই গ্রুপে কোনো ক্যাটাগরি নেই' : 'No categories yet in this group')}
            </div>
          ) : (
            filteredCategories.map((cat) => {
              const isEditing = editingItem && editingItem.originalName === cat;
              const usageCount = getUsageCount(cat);

              return (
                <div
                  key={cat}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: isEditing ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-card)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {isEditing ? (
                    // Inline Rename Form
                    <form onSubmit={handleSaveRename} style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                      <input
                        type="text"
                        autoFocus
                        value={editingItem.currentInput}
                        onChange={(e) => setEditingItem({ ...editingItem, currentInput: e.target.value })}
                        style={{
                          flex: 1,
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '2px solid #6366f1',
                          background: 'var(--bg-main)',
                          color: 'var(--text-main)',
                          fontSize: '0.88rem',
                          fontWeight: '700'
                        }}
                      />
                      <button
                        type="submit"
                        title={lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save'}
                        style={{
                          background: '#10b981',
                          border: 'none',
                          color: '#ffffff',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontWeight: '700',
                          fontSize: '0.78rem'
                        }}
                      >
                        <Check size={14} />
                        <span>{lang === 'bn' ? 'সেভ' : 'Save'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingItem(null)}
                        title={lang === 'bn' ? 'বাতিল' : 'Cancel'}
                        style={{
                          background: 'transparent',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-muted)',
                          padding: '6px 8px',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        <X size={14} />
                      </button>
                    </form>
                  ) : (
                    // Standard Row
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Tag size={15} style={{ color: currentGroupMeta.color }} />
                        <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-main)' }}>
                          {cat}
                        </span>
                        {usageCount > 0 && (
                          <span
                            style={{
                              fontSize: '0.7rem',
                              padding: '2px 7px',
                              borderRadius: '12px',
                              background: 'var(--bg-main)',
                              color: 'var(--text-muted)',
                              border: '1px solid var(--border-color)',
                              fontWeight: '600'
                            }}
                          >
                            {usageCount} {lang === 'bn' ? 'টি এন্ট্রি' : 'entries'}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {/* If onSelectCategory provided, offer Select button */}
                        {onSelectCategory && (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectCategory(cat);
                              onClose();
                            }}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              background: 'rgba(16, 185, 129, 0.12)',
                              color: '#10b981',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                              fontSize: '0.75rem',
                              fontWeight: '700',
                              cursor: 'pointer'
                            }}
                          >
                            {lang === 'bn' ? 'বাছাই করুন' : 'Select'}
                          </button>
                        )}

                        {/* Rename Button */}
                        <button
                          type="button"
                          onClick={() => handleStartRename(cat)}
                          title={lang === 'bn' ? 'ক্যাটাগরি রিনেম করুন' : 'Rename category'}
                          style={{
                            background: 'transparent',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-muted)',
                            padding: '5px 8px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.74rem'
                          }}
                        >
                          <Edit2 size={13} />
                          <span>{lang === 'bn' ? 'রিনেম' : 'Rename'}</span>
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDelete(cat)}
                          title={lang === 'bn' ? 'ক্যাটাগরি মুছে ফেলুন' : 'Delete category'}
                          style={{
                            background: 'transparent',
                            border: '1px solid var(--border-color)',
                            color: '#f43f5e',
                            padding: '5px 8px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.74rem'
                          }}
                        >
                          <Trash2 size={13} />
                          <span>{lang === 'bn' ? 'মুছুন' : 'Delete'}</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div
          style={{
            marginTop: '1rem',
            paddingTop: '0.85rem',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            💡 {lang === 'bn' ? 'রিনেম করলে বিদ্যমান পূর্বের ডাটাতেও স্বয়ংক্রিয়ভাবে নতুন নামটি আপডেট হবে।' : 'Renaming auto-updates all existing tagged items.'}
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '7px 18px',
              borderRadius: '8px',
              background: 'var(--bg-main)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-color)',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            {lang === 'bn' ? 'সম্পন্ন / বন্ধ করুন' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryManagerModal;
