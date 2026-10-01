import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Home,
  Plus,
  Calendar,
  Tag,
  Trash2,
  Edit2,
  Folder,
  FolderOpen,
  FolderPlus,
  Scale,
  Search,
  X,
  Filter,
  ArrowRight,
  TrendingDown,
  Layers,
  Sparkles,
  FileSpreadsheet,
  User,
  Users,
  Compass,
  Check,
  MoreVertical
} from 'lucide-react';
import { CategoryManagerModal } from '../common/CategoryManagerModal';
import { DataExportImportModal } from '../common/DataExportImportModal';
import { MasterHubModal } from '../common/MasterHubModal';
import { SmartVoiceFormBanner } from '../common/SmartVoiceFormBanner';
import { VoiceInputButton } from '../common/VoiceInputButton';

export const FamilyExpenses = () => {
  const {
    personalExpenses,
    personalEvents = [],
    addPersonalExpense,
    updatePersonalExpense,
    deletePersonalExpense,
    categories = {},
    addCategory,
    t,
    lang
  } = useApp();

  const [selectedFolder, setSelectedFolder] = useState('all');
  const [selectedMember, setSelectedMember] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showExportImportModal, setShowExportImportModal] = useState(false);
  const [showMasterHubModal, setShowMasterHubModal] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [categoryModalDefaultGroup, setCategoryModalDefaultGroup] = useState('familyExpenseFolders');
  const [editingExpense, setEditingExpense] = useState(null);

  // Inline "Add New" states for uninterrupted workflow
  const [isAddingNewMember, setIsAddingNewMember] = useState(false);
  const [newMemberInput, setNewMemberInput] = useState('');
  const [isAddingNewSubCat, setIsAddingNewSubCat] = useState(false);
  const [newSubCatInput, setNewSubCatInput] = useState('');
  const [isAddingNewPurpose, setIsAddingNewPurpose] = useState(false);
  const [newPurposeInput, setNewPurposeInput] = useState('');
  const [isAddingNewFolder, setIsAddingNewFolder] = useState(false);
  const [newFolderInput, setNewFolderInput] = useState('');

  // Available Folders and Measurement Units from dynamic categories
  const availableFolders = categories.familyExpenseFolders || [
    'বাসা ও ফ্ল্যাট খরচ',
    'বিদ্যুৎ, গ্যাস ও ইউটিলিটি',
    'সন্তানের পড়াশোনা ও স্কুল',
    'পারিবারিক চিকিৎসা ও ওষুধ',
    'ইন্টারনেট ও মোবাইল রিচার্জ',
    'গৃহস্থালি ও নিত্য কেনাকাটা',
    'অন্যান্য পারিবারিক খরচ'
  ];

  const availableUnits = categories.expenseUnits || [
    'গ্রাম (g)',
    'কেজি (kg)',
    'লিটার (L)',
    'মিলি (ml)',
    'ফুট (ft)',
    'ইঞ্চি (in)',
    'টিপ / ট্রিপ (Trip)',
    'অটো ভাড়া',
    'পিস (Pcs)',
    'প্যাকেট (Pkt)',
    'ডজন (Dzn)'
  ];

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

  const availablePurposes = categories.expensePurposes || [
    'স্কুলে যাতায়াত ও পড়াশোনা',
    'অফিসে যাতায়াত ও কাজ',
    'কোচিং ও প্রাইভেট টিউশন',
    'নিত্যদিনের বাজার সদাই',
    'ডাক্তার দেখানো ও চিকিৎসা',
    'পারিবারিক অনুষ্ঠান ও দাওয়াত',
    'ঈদ ও উৎসবের কেনাকাটা',
    'ভ্রমণ ও ট্যুর',
    'জরুরি প্রয়োজন',
    'সাধারণ খরচ'
  ];

  const availableSubCategories = categories.expenseSubCategories || [
    'বাস ভাড়া', 'অটো / সিএনজি ভাড়া', 'রিকশা ভাড়া', 'উবার / রাইড',
    'স্কুল বেতন', 'কোচিং ফি', 'বই ও খাতা', 'টিফিন খরচ',
    'কাঁচা শাকসবজি', 'মাছ ও মাংস', 'চাল ও ডাল',
    'ডাক্তারের ভিজিট', 'প্রেসক্রিপশনের ওষুধ',
    'বিদ্যুৎ বিল', 'গ্যাস বিল', 'ইন্টারনেট বিল', 'মোবাইল রিচার্জ'
  ];

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    item: '',
    quantity: '',
    unit: availableUnits[0] || 'কেজি (kg)',
    amount: '',
    folder: availableFolders[0] || 'অন্যান্য পারিবারিক খরচ',
    category: 'other',
    subCategory: '',
    familyMember: availableMembers[0] || 'নিজে (Self)',
    purpose: '',
    date: new Date().toISOString().split('T')[0],
    note: '',
    eventId: ''
  });

  const familyList = useMemo(() => {
    return personalExpenses.filter((e) => e.type === 'family');
  }, [personalExpenses]);

  // Folder metrics calculation
  const folderStats = useMemo(() => {
    const stats = {};
    availableFolders.forEach((f) => {
      stats[f] = { count: 0, total: 0 };
    });

    familyList.forEach((item) => {
      const folderKey = item.folder || 'অন্যান্য পারিবারিক খরচ';
      if (!stats[folderKey]) {
        stats[folderKey] = { count: 0, total: 0 };
      }
      stats[folderKey].count += 1;
      stats[folderKey].total += Number(item.amount) || 0;
    });

    return stats;
  }, [familyList, availableFolders]);

  // Member metrics calculation (Spending per family member)
  const memberStats = useMemo(() => {
    const stats = {};
    familyList.forEach((item) => {
      const m = item.familyMember || 'নিজে (Self)';
      if (!stats[m]) stats[m] = { count: 0, total: 0 };
      stats[m].count += 1;
      stats[m].total += Number(item.amount) || 0;
    });
    return stats;
  }, [familyList]);

  const totalFamily = useMemo(() => {
    return familyList.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [familyList]);

  // Filtered List based on Folder, Member, and Search
  const filteredList = useMemo(() => {
    return familyList.filter((item) => {
      const matchesFolder = selectedFolder === 'all' || (item.folder || 'অন্যান্য পারিবারিক খরচ') === selectedFolder;
      const matchesMember = selectedMember === 'all' || (item.familyMember || 'নিজে (Self)') === selectedMember;
      const search = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !search ||
        (item.item && item.item.toLowerCase().includes(search)) ||
        (item.title && item.title.toLowerCase().includes(search)) ||
        (item.folder && item.folder.toLowerCase().includes(search)) ||
        (item.subCategory && item.subCategory.toLowerCase().includes(search)) ||
        (item.familyMember && item.familyMember.toLowerCase().includes(search)) ||
        (item.purpose && item.purpose.toLowerCase().includes(search)) ||
        (item.note && item.note.toLowerCase().includes(search));

      return matchesFolder && matchesMember && matchesSearch;
    });
  }, [familyList, selectedFolder, selectedMember, searchTerm]);

  const filteredTotal = useMemo(() => {
    return filteredList.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [filteredList]);

  // Open Add Modal
  const handleOpenAddModal = (presetFolder = null) => {
    setEditingExpense(null);
    setIsAddingNewMember(false);
    setIsAddingNewSubCat(false);
    setIsAddingNewPurpose(false);
    setIsAddingNewFolder(false);
    setFormData({
      title: '',
      item: '',
      quantity: '',
      unit: availableUnits[0] || 'কেজি (kg)',
      amount: '',
      folder: presetFolder || (selectedFolder !== 'all' ? selectedFolder : availableFolders[0]),
      category: 'other',
      subCategory: '',
      familyMember: availableMembers[0] || 'নিজে (Self)',
      purpose: '',
      date: new Date().toISOString().split('T')[0],
      note: '',
      eventId: ''
    });
    setShowAddModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (expense) => {
    setEditingExpense(expense);
    setIsAddingNewMember(false);
    setIsAddingNewSubCat(false);
    setIsAddingNewPurpose(false);
    setIsAddingNewFolder(false);
    setFormData({
      title: expense.title || expense.item || '',
      item: expense.item || expense.title || '',
      quantity: expense.quantity !== null && expense.quantity !== undefined ? expense.quantity : '',
      unit: expense.unit || availableUnits[0] || '',
      amount: expense.amount || '',
      folder: expense.folder || availableFolders[0] || 'অন্যান্য পারিবারিক খরচ',
      category: expense.category || 'other',
      subCategory: expense.subCategory || '',
      familyMember: expense.familyMember || availableMembers[0] || 'নিজে (Self)',
      purpose: expense.purpose || '',
      date: expense.date || new Date().toISOString().split('T')[0],
      note: expense.note || '',
      eventId: expense.eventId || ''
    });
    setShowAddModal(true);
  };

  // Submit Expense Form (Add or Edit)
  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanItem = (formData.item || formData.title || '').trim();
    if (!cleanItem || !formData.amount) return;

    const linkedEvent = personalEvents.find(ev => ev.id === formData.eventId);

    const payload = {
      title: cleanItem,
      item: cleanItem,
      quantity: formData.quantity !== '' ? Number(formData.quantity) : null,
      unit: formData.quantity !== '' ? formData.unit : '',
      amount: Number(formData.amount),
      folder: formData.folder,
      category: formData.folder,
      subCategory: formData.subCategory || '',
      familyMember: formData.familyMember || 'নিজে (Self)',
      purpose: formData.purpose || '',
      type: 'family',
      date: formData.date || new Date().toISOString().split('T')[0],
      note: formData.note.trim(),
      eventId: formData.eventId || '',
      eventName: linkedEvent ? linkedEvent.title : ''
    };

    if (editingExpense) {
      updatePersonalExpense(editingExpense.id, payload);
    } else {
      addPersonalExpense(payload);
    }

    setShowAddModal(false);
    setEditingExpense(null);
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '2.5rem' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <h2
            style={{
              fontSize: '1.4rem',
              fontWeight: '800',
              color: 'var(--text-main)',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #f97316, #ea580c)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)'
              }}
            >
              <Home size={22} />
            </div>
            <span>{lang === 'bn' ? 'পারিবারিক খরচের খাতা (ফোল্ডারভিত্তিক)' : 'Family Household Expenses'}</span>
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {lang === 'bn'
              ? 'বাসা ভাড়া, ইউটিলিটি, বাজার ও পড়াশোনার খরচ ফোল্ডারে গুছিয়ে রাখুন এবং পরিমাপ/একক (গ্রাম, কেজি, ফুট, টিপ) ট্র্যাক করুন'
              : 'Organize family costs into folders and track purchased items with quantity and units'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Total Household Amount Badge */}
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
            <span style={{ fontWeight: '800', color: '#f43f5e', fontSize: '1.05rem' }}>
              ৳{totalFamily.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Add Family Expense Button */}
          <button
            onClick={() => handleOpenAddModal()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 18px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              color: '#ffffff',
              border: 'none',
              fontSize: '0.88rem',
              fontWeight: '800',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 14px rgba(249, 115, 22, 0.35)'
            }}
          >
            <Plus size={16} />
            <span>{lang === 'bn' ? '+ পারিবারিক খরচ' : '+ Add Expense'}</span>
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
                    setCategoryModalDefaultGroup('familyExpenseFolders');
                    setShowCategoryModal(true);
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
                  <FolderPlus size={15} style={{ color: '#f97316' }} />
                  <span>{lang === 'bn' ? 'ফোল্ডার ও একক ম্যানেজ' : 'Manage Folders & Units'}</span>
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
                  <FolderOpen size={15} style={{ color: '#6366f1' }} />
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

      {/* ======================================================== */}
      {/* 📁 FOLDER CARDS OVERVIEW (ফোল্ডার ক্যাটাগরি গ্রিড)        */}
      {/* ======================================================== */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ fontSize: '0.88rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FolderOpen size={16} style={{ color: '#f97316' }} />
            <span>{lang === 'bn' ? 'পারিবারিক খরচের ফোল্ডারসমূহ:' : 'Family Expense Folders:'}</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {lang === 'bn' ? 'যেকোনো ফোল্ডারে ক্লিক করে ফিল্টার করুন' : 'Click any folder to filter expenses'}
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
            gap: '12px'
          }}
        >
          {/* "All Folders" Card */}
          <div
            onClick={() => setSelectedFolder('all')}
            style={{
              background: selectedFolder === 'all' ? 'rgba(249, 115, 22, 0.12)' : 'var(--bg-card)',
              border: selectedFolder === 'all' ? '2px solid #f97316' : '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '12px 14px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: selectedFolder === 'all' ? '0 4px 14px rgba(249, 115, 22, 0.2)' : 'none'
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: selectedFolder === 'all' ? '#f97316' : 'var(--bg-main)',
                color: selectedFolder === 'all' ? '#fff' : '#f97316',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--border-color)'
              }}
            >
              <Layers size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                {lang === 'bn' ? 'সকল ফোল্ডার' : 'All Folders'}
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: '900', color: 'var(--text-main)', marginTop: '2px' }}>
                ৳{totalFamily.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {familyList.length} {lang === 'bn' ? 'টি এন্ট্রি' : 'items'}
              </div>
            </div>
          </div>

          {/* Dynamic Folder Cards */}
          {availableFolders.map((folderName) => {
            const isSelected = selectedFolder === folderName;
            const stats = folderStats[folderName] || { count: 0, total: 0 };

            return (
              <div
                key={folderName}
                onClick={() => setSelectedFolder(isSelected ? 'all' : folderName)}
                style={{
                  background: isSelected ? 'rgba(249, 115, 22, 0.12)' : 'var(--bg-card)',
                  border: isSelected ? '2px solid #f97316' : '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  boxShadow: isSelected ? '0 4px 14px rgba(249, 115, 22, 0.2)' : 'none'
                }}
              >
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: isSelected ? '#f97316' : 'var(--bg-main)',
                    color: isSelected ? '#fff' : '#f97316',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid var(--border-color)',
                    flexShrink: 0
                  }}
                >
                  <Folder size={18} />
                </div>
                <div style={{ overflow: 'hidden', flex: 1 }}>
                  <div
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: '700',
                      color: isSelected ? '#ea580c' : 'var(--text-main)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                    title={folderName}
                  >
                    {folderName}
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: '900', color: stats.total > 0 ? '#f43f5e' : 'var(--text-muted)', marginTop: '2px' }}>
                    ৳{stats.total.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {stats.count} {lang === 'bn' ? 'টি এন্ট্রি' : 'items'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Search & Active Filter Bar */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '0.75rem 1rem',
          marginBottom: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 360px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: '380px' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }}
            />
            <input
              type="text"
              placeholder={lang === 'bn' ? 'আইটেম, পণ্য, মেম্বার বা বিবরণ দিয়ে খুঁজুন...' : 'Search items, members, notes...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-main)',
                color: 'var(--text-main)',
                fontSize: '0.88rem'
              }}
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

          {/* Member Filter Dropdown */}
          <select
            value={selectedMember}
            onChange={(e) => setSelectedMember(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-main)',
              color: 'var(--text-main)',
              fontSize: '0.85rem'
            }}
          >
            <option value="all">👥 {lang === 'bn' ? 'সকল সদস্য' : 'All Members'}</option>
            {availableMembers.map((m) => (
              <option key={m} value={m}>
                👤 {m}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {selectedFolder !== 'all' && (
            <div
              style={{
                fontSize: '0.82rem',
                fontWeight: '700',
                background: 'rgba(249, 115, 22, 0.12)',
                color: '#ea580c',
                padding: '4px 10px',
                borderRadius: '20px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>📁 {selectedFolder}</span>
              <button
                onClick={() => setSelectedFolder('all')}
                style={{ background: 'transparent', border: 'none', color: '#ea580c', cursor: 'pointer', padding: 0 }}
              >
                <X size={12} />
              </button>
            </div>
          )}

          {selectedMember !== 'all' && (
            <div
              style={{
                fontSize: '0.82rem',
                fontWeight: '700',
                background: 'rgba(5, 150, 105, 0.12)',
                color: '#059669',
                padding: '4px 10px',
                borderRadius: '20px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>👤 {selectedMember}</span>
              <button
                onClick={() => setSelectedMember('all')}
                style={{ background: 'transparent', border: 'none', color: '#059669', cursor: 'pointer', padding: 0 }}
              >
                <X size={12} />
              </button>
            </div>
          )}

          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            {lang === 'bn' ? `মোট প্রদর্শিত:` : `Filtered Total:`}{' '}
            <strong style={{ color: '#f43f5e', fontSize: '0.95rem' }}>৳{filteredTotal.toLocaleString('en-IN')}</strong> ({filteredList.length}টি)
          </div>
        </div>
      </div>

      {/* Member Spending Quick Filter Bar */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '8px',
          marginBottom: '1rem',
          scrollbarWidth: 'thin'
        }}
      >
        <button
          onClick={() => setSelectedMember('all')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '0.78rem',
            fontWeight: '700',
            border: selectedMember === 'all' ? '1px solid #f97316' : '1px solid var(--border-color)',
            background: selectedMember === 'all' ? 'rgba(249, 115, 22, 0.15)' : 'var(--bg-card)',
            color: selectedMember === 'all' ? '#ea580c' : 'var(--text-main)',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          <Users size={13} />
          <span>{lang === 'bn' ? 'সব সদস্য' : 'All'}</span>
          <span style={{ background: 'var(--bg-main)', padding: '1px 6px', borderRadius: '10px', fontSize: '0.72rem', color: '#f43f5e' }}>
            ৳{totalFamily.toLocaleString('en-IN')}
          </span>
        </button>

        {availableMembers.map((member) => {
          const stat = memberStats[member] || { count: 0, total: 0 };
          const isSelected = selectedMember === member;
          return (
            <button
              key={member}
              onClick={() => setSelectedMember(isSelected ? 'all' : member)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '0.78rem',
                fontWeight: '700',
                border: isSelected ? '1px solid #059669' : '1px solid var(--border-color)',
                background: isSelected ? 'rgba(5, 150, 105, 0.15)' : 'var(--bg-card)',
                color: isSelected ? '#059669' : 'var(--text-main)',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              <User size={13} style={{ color: '#059669' }} />
              <span>{member}</span>
              <span
                style={{
                  background: 'var(--bg-main)',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  fontSize: '0.72rem',
                  color: stat.total > 0 ? '#f43f5e' : 'var(--text-muted)'
                }}
              >
                ৳{stat.total.toLocaleString('en-IN')}
              </span>
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* EXPENSES TABLE WITH QUANTITY & UNITS                     */}
      {/* ======================================================== */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '10px 14px' }}>{lang === 'bn' ? 'তারিখ' : 'Date'}</th>
                <th style={{ padding: '10px 14px' }}>{lang === 'bn' ? 'ফোল্ডার' : 'Folder'}</th>
                <th style={{ padding: '10px 14px' }}>{lang === 'bn' ? 'কি কিনলাম / খরচের বিবরণ' : 'Item Description'}</th>
                <th style={{ padding: '10px 14px' }}>{lang === 'bn' ? 'পরিমাণ ও একক' : 'Quantity & Unit'}</th>
                <th style={{ padding: '10px 14px' }}>{lang === 'bn' ? 'নোট / মেমো' : 'Notes'}</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>{lang === 'bn' ? 'টাকার পরিমাণ' : 'Amount (৳)'}</th>
                <th style={{ padding: '10px 14px', textAlign: 'center' }}>{lang === 'bn' ? 'অ্যাকশন' : 'Action'}</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '1.2rem', marginBottom: '6px' }}>📁</div>
                    <div>{lang === 'bn' ? 'কোনো খরচের রেকর্ড পাওয়া যায়নি।' : 'No expense entries found.'}</div>
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => {
                  const hasQty = item.quantity !== null && item.quantity !== undefined && item.quantity !== '';

                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      {/* Date */}
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                          <span>{item.date}</span>
                        </div>
                      </td>

                      {/* Folder Badge */}
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: 'rgba(249, 115, 22, 0.12)',
                            color: '#ea580c',
                            fontSize: '0.76rem',
                            fontWeight: '700'
                          }}
                        >
                          <Folder size={12} />
                          <span>{item.folder || 'অন্যান্য পারিবারিক খরচ'}</span>
                        </span>
                      </td>

                      {/* Item Name / Description & Badges */}
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.9rem' }}>
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
                                color: '#0284c7',
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

                      {/* Quantity & Unit (e.g. 500 গ্রাম, 5 কেজি, 1 টিপ) */}
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

                      {/* Notes / Memo */}
                      <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {item.note || '—'}
                      </td>

                      {/* Amount */}
                      <td
                        style={{
                          padding: '10px 14px',
                          textAlign: 'right',
                          fontWeight: '800',
                          color: '#f43f5e',
                          fontSize: '0.95rem'
                        }}
                      >
                        -৳{Number(item.amount).toLocaleString('en-IN')}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '4px' }}>
                          <button
                            className="btn-icon"
                            title={lang === 'bn' ? 'সম্পাদনা করুন' : 'Edit'}
                            onClick={() => handleOpenEditModal(item)}
                            style={{ color: 'var(--text-muted)' }}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            className="btn-icon"
                            title={lang === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
                            onClick={() => {
                              if (window.confirm(lang === 'bn' ? 'এই খরচের এন্ট্রিটি মুছে ফেলতে চান?' : 'Delete this expense?')) {
                                deletePersonalExpense(item.id);
                              }
                            }}
                            style={{ color: '#f43f5e' }}
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

      {/* ======================================================== */}
      {/* ADD / EDIT FAMILY EXPENSE MODAL                          */}
      {/* ======================================================== */}
      {showAddModal && (
        <div
          className="modal-overlay modal-backdrop modal-top-align"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1200,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            padding: '20px 14px',
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            overflowY: 'auto'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddModal(false);
          }}
        >
          <div
            className="modal-content animate-scale-up"
            style={{
              maxWidth: '540px',
              width: '95%',
              marginTop: '8px',
              background: 'var(--bg-card)',
              borderRadius: '16px',
              border: '1px solid var(--border-color)',
              boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
              padding: '1.5rem',
              maxHeight: 'calc(100vh - 40px)',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Home size={20} style={{ color: '#f97316' }} />
                <span>
                  {editingExpense
                    ? (lang === 'bn' ? 'পারিবারিক খরচ পরিবর্তন' : 'Edit Household Expense')
                    : (lang === 'bn' ? 'নতুন পারিবারিক খরচ এন্ট্রি' : 'Add Household Expense')}
                </span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Smart Voice Auto-Fill Banner */}
            <SmartVoiceFormBanner
              mode="expense"
              lang={lang}
              onParsed={(parsed) => {
                setFormData(prev => ({
                  ...prev,
                  item: parsed.title || prev.item,
                  title: parsed.title || prev.title,
                  amount: parsed.amount ? String(parsed.amount) : prev.amount,
                  date: parsed.date || prev.date
                }));
              }}
            />

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Folder Selection with Manage Button */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
                    {lang === 'bn' ? 'খরচের ফোল্ডার *' : 'Expense Folder *'}
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {!isAddingNewFolder && (
                      <button
                        type="button"
                        onClick={() => setIsAddingNewFolder(true)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#ea580c',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        + {lang === 'bn' ? 'নতুন ফোল্ডার' : 'New Folder'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setCategoryModalDefaultGroup('familyExpenseFolders');
                        setShowCategoryModal(true);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#f97316',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}
                    >
                      ⚙️ {lang === 'bn' ? 'ফোল্ডার রিনেম' : 'Manage'}
                    </button>
                  </div>
                </div>

                {isAddingNewFolder ? (
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder={lang === 'bn' ? 'নতুন ফোল্ডারের নাম (যেমন: বাড়ি ভাড়া)...' : 'New folder name...'}
                      value={newFolderInput}
                      onChange={(e) => setNewFolderInput(e.target.value)}
                      autoFocus
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-main)',
                        color: 'var(--text-main)',
                        fontSize: '0.85rem'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const clean = newFolderInput.trim();
                        if (clean) {
                          addCategory('familyExpenseFolders', clean);
                          setFormData({ ...formData, folder: clean });
                          setNewFolderInput('');
                          setIsAddingNewFolder(false);
                        }
                      }}
                      style={{
                        background: '#ea580c',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0 12px',
                        height: '36px',
                        fontWeight: '800',
                        cursor: 'pointer'
                      }}
                    >
                      ✓ যোগ
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingNewFolder(false);
                        setNewFolderInput('');
                      }}
                      style={{
                        background: 'var(--bg-main)',
                        color: 'var(--text-muted)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        padding: '0 10px',
                        height: '36px',
                        cursor: 'pointer'
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <select
                    value={formData.folder}
                    onChange={(e) => {
                      if (e.target.value === '__add_new__') {
                        setIsAddingNewFolder(true);
                      } else {
                        setFormData({ ...formData, folder: e.target.value });
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-main)',
                      color: 'var(--text-main)',
                      fontSize: '0.9rem'
                    }}
                  >
                    {availableFolders.map((f) => (
                      <option key={f} value={f}>
                        📁 {f}
                      </option>
                    ))}
                    <option value="__add_new__" style={{ fontWeight: '700', color: '#f97316' }}>
                      ➕ {lang === 'bn' ? 'নতুন ফোল্ডার তৈরি বা রিনেম করুন...' : 'Add / Rename Folder...'}
                    </option>
                  </select>
                )}
              </div>

              {/* Linked Event / Occasion Dropdown */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-main)' }}>
                  {lang === 'bn' ? 'কোনো ইভেন্ট / অনুষ্ঠানের খরচ? (ঐচ্ছিক)' : 'Linked Event / Occasion (Optional)'}
                </label>
                <select
                  value={formData.eventId}
                  onChange={(e) => setFormData({ ...formData, eventId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-main)',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="">{lang === 'bn' ? 'সাধারণ পারিবারিক খরচ (কোনো নির্দিষ্ট ইভেন্ট নয়)' : 'General Family Expense (No Event)'}</option>
                  {personalEvents.map((evt) => (
                    <option key={evt.id} value={evt.id}>
                      🎯 {evt.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Item Name (কি কিনলাম) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '700', margin: 0, color: 'var(--text-main)' }}>
                    {lang === 'bn' ? 'কি কিনলেন / খরচের শিরোনাম *' : 'Item / Title *'}
                  </label>
                  <VoiceInputButton
                    onTranscript={(txt) => setFormData(prev => ({ ...prev, item: txt, title: txt }))}
                    title="মুখে বলুন খরচের শিরোনাম"
                  />
                </div>
                <input
                  type="text"
                  required
                  placeholder={lang === 'bn' ? 'যেমন: সয়াবিন তেল, চাল, বিদ্যুৎ বিল, বাচ্চার স্কুলের বেতন...' : 'e.g. Cooking Oil, Rice, Electricity Bill...'}
                  value={formData.item}
                  onChange={(e) => setFormData({ ...formData, item: e.target.value, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-main)',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              {/* Quantity & Unit in 2 Columns */}
              <div
                style={{
                  background: 'var(--bg-main)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Scale size={14} style={{ color: '#06b6d4' }} />
                    <span>{lang === 'bn' ? 'পরিমাপ ও একক (কতটুকু কিনলেন):' : 'Quantity & Unit (Measurement):'}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryModalDefaultGroup('expenseUnits');
                      setShowCategoryModal(true);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#06b6d4',
                      fontSize: '0.74rem',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    ⚙️ {lang === 'bn' ? 'একক তালিকা ম্যানেজ' : 'Manage Units'}
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '10px' }}>
                  {/* Quantity input */}
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                      {lang === 'bn' ? 'পরিমাণ (সংখ্যা)' : 'Quantity'}
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder={lang === 'bn' ? 'যেমন: ২৫০ বা ৫ বা ১' : 'e.g. 250, 5, 1'}
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-card)',
                        color: 'var(--text-main)',
                        fontSize: '0.9rem',
                        fontWeight: '700'
                      }}
                    />
                  </div>

                  {/* Unit select */}
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                      {lang === 'bn' ? 'পরিমাপের একক' : 'Unit'}
                    </label>
                    <select
                      value={formData.unit}
                      onChange={(e) => {
                        if (e.target.value === '__add_new__') {
                          setCategoryModalDefaultGroup('expenseUnits');
                          setShowCategoryModal(true);
                        } else {
                          setFormData({ ...formData, unit: e.target.value });
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-card)',
                        color: 'var(--text-main)',
                        fontSize: '0.85rem'
                      }}
                    >
                      {availableUnits.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                      <option value="__add_new__" style={{ fontWeight: '700', color: '#06b6d4' }}>
                        ➕ {lang === 'bn' ? 'নতুন একক যোগ করুন...' : 'Add Unit...'}
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              {/* ---------------------------------------------------- */}
              {/* SUB-CATEGORY (সাব-ক্যাটাগরি ও কুইক চিপস)           */}
              {/* ---------------------------------------------------- */}
              <div
                style={{
                  background: 'var(--bg-main)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Layers size={14} style={{ color: '#0ea5e9' }} />
                    <span>{lang === 'bn' ? 'সাব-ক্যাটাগরি (নির্দিষ্ট খরচ খাত):' : 'Sub-Category:'}</span>
                  </label>
                  {!isAddingNewSubCat && (
                    <button
                      type="button"
                      onClick={() => setIsAddingNewSubCat(true)}
                      style={{ background: 'transparent', border: 'none', color: '#0ea5e9', fontSize: '0.74rem', fontWeight: '800', cursor: 'pointer' }}
                    >
                      + {lang === 'bn' ? 'নতুন সাব-ক্যাটাগরি' : 'Add Sub-Category'}
                    </button>
                  )}
                </div>

                {isAddingNewSubCat ? (
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <input
                      type="text"
                      className="input-field"
                      placeholder={lang === 'bn' ? 'নতুন সাব-ক্যাটাগরি (যেমন: স্কুল বেতন, বাড়ি ভাড়া, বিদ্যুৎ বিল)...' : 'Sub-category name...'}
                      value={newSubCatInput}
                      onChange={(e) => setNewSubCatInput(e.target.value)}
                      autoFocus
                      style={{ flex: 1, height: '36px', fontSize: '0.85rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const clean = newSubCatInput.trim();
                        if (clean) {
                          addCategory('expenseSubCategories', clean);
                          setFormData({ ...formData, subCategory: clean });
                          setNewSubCatInput('');
                          setIsAddingNewSubCat(false);
                        }
                      }}
                      style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: '6px', padding: '0 12px', height: '36px', fontWeight: '800', cursor: 'pointer' }}
                    >
                      ✓ যোগ
                    </button>
                    <button
                      type="button"
                      onClick={() => { setIsAddingNewSubCat(false); setNewSubCatInput(''); }}
                      style={{ background: 'var(--bg-main)', color: 'var(--text-muted)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0 10px', height: '36px', cursor: 'pointer' }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <>
                    <select
                      value={formData.subCategory || ''}
                      onChange={(e) => {
                        if (e.target.value === '__add_new__') {
                          setIsAddingNewSubCat(true);
                        } else {
                          setFormData({ ...formData, subCategory: e.target.value });
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-card)',
                        color: 'var(--text-main)',
                        fontSize: '0.86rem',
                        marginBottom: '8px'
                      }}
                    >
                      <option value="">{lang === 'bn' ? '-- সাব-ক্যাটাগরি বেছে নিন --' : '-- Select Sub-Category --'}</option>
                      {availableSubCategories.map((sub) => (
                        <option key={sub} value={sub}>
                          🔀 {sub}
                        </option>
                      ))}
                      <option value="__add_new__" style={{ fontWeight: '800', color: '#0ea5e9' }}>
                        ➕ {lang === 'bn' ? 'নতুন সাব-ক্যাটাগরি যোগ করুন...' : 'Add New Sub-Category...'}
                      </option>
                    </select>

                    {/* Quick clickable chips */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                      {availableSubCategories.slice(0, 10).map((sub, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setFormData({ ...formData, subCategory: sub })}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: formData.subCategory === sub ? '800' : '600',
                            border: formData.subCategory === sub ? '1px solid #0ea5e9' : '1px solid var(--border-color)',
                            background: formData.subCategory === sub ? 'rgba(14, 165, 233, 0.15)' : 'var(--bg-card)',
                            color: formData.subCategory === sub ? '#0ea5e9' : 'var(--text-muted)',
                            cursor: 'pointer'
                          }}
                        >
                          {sub}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* ---------------------------------------------------- */}
              {/* FAMILY MEMBER & PURPOSE (২ কলামে মেম্বার ও উদ্দেশ্য) */}
              {/* ---------------------------------------------------- */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {/* Family Member */}
                <div
                  style={{
                    background: 'var(--bg-main)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <User size={13} style={{ color: '#059669' }} />
                      <span>{lang === 'bn' ? 'কার জন্য খরচ *' : 'Family Member *'}</span>
                    </label>
                    {!isAddingNewMember && (
                      <button
                        type="button"
                        onClick={() => setIsAddingNewMember(true)}
                        style={{ background: 'transparent', border: 'none', color: '#059669', fontSize: '0.72rem', fontWeight: '800', cursor: 'pointer' }}
                      >
                        + {lang === 'bn' ? 'নতুন' : 'New'}
                      </button>
                    )}
                  </div>

                  {isAddingNewMember ? (
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="যেমন: রোহান..."
                        value={newMemberInput}
                        onChange={(e) => setNewMemberInput(e.target.value)}
                        autoFocus
                        style={{
                          flex: 1,
                          height: '34px',
                          fontSize: '0.82rem',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-card)',
                          color: 'var(--text-main)',
                          padding: '0 8px'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const clean = newMemberInput.trim();
                          if (clean) {
                            addCategory('familyMembers', clean);
                            setFormData({ ...formData, familyMember: clean });
                            setNewMemberInput('');
                            setIsAddingNewMember(false);
                          }
                        }}
                        style={{ background: '#059669', color: '#fff', border: 'none', borderRadius: '6px', padding: '0 8px', height: '34px', fontWeight: '800', cursor: 'pointer' }}
                      >
                        ✓
                      </button>
                      <button
                        type="button"
                        onClick={() => { setIsAddingNewMember(false); setNewMemberInput(''); }}
                        style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0 8px', height: '34px', cursor: 'pointer' }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <select
                      value={formData.familyMember || ''}
                      onChange={(e) => {
                        if (e.target.value === '__add_new__') {
                          setIsAddingNewMember(true);
                        } else {
                          setFormData({ ...formData, familyMember: e.target.value });
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-card)',
                        color: 'var(--text-main)',
                        fontSize: '0.85rem'
                      }}
                    >
                      {availableMembers.map((m) => (
                        <option key={m} value={m}>
                          👤 {m}
                        </option>
                      ))}
                      <option value="__add_new__" style={{ fontWeight: '800', color: '#059669' }}>
                        ➕ {lang === 'bn' ? 'নতুন সদস্য যোগ করুন...' : 'Add New Member...'}
                      </option>
                    </select>
                  )}
                </div>

                {/* Purpose */}
                <div
                  style={{
                    background: 'var(--bg-main)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Compass size={13} style={{ color: '#d97706' }} />
                      <span>{lang === 'bn' ? 'খরচের উদ্দেশ্য' : 'Purpose'}</span>
                    </label>
                    {!isAddingNewPurpose && (
                      <button
                        type="button"
                        onClick={() => setIsAddingNewPurpose(true)}
                        style={{ background: 'transparent', border: 'none', color: '#d97706', fontSize: '0.72rem', fontWeight: '800', cursor: 'pointer' }}
                      >
                        + {lang === 'bn' ? 'নতুন' : 'New'}
                      </button>
                    )}
                  </div>

                  {isAddingNewPurpose ? (
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="যেমন: পড়াশোনা..."
                        value={newPurposeInput}
                        onChange={(e) => setNewPurposeInput(e.target.value)}
                        autoFocus
                        style={{
                          flex: 1,
                          height: '34px',
                          fontSize: '0.82rem',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-card)',
                          color: 'var(--text-main)',
                          padding: '0 8px'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const clean = newPurposeInput.trim();
                          if (clean) {
                            addCategory('expensePurposes', clean);
                            setFormData({ ...formData, purpose: clean });
                            setNewPurposeInput('');
                            setIsAddingNewPurpose(false);
                          }
                        }}
                        style={{ background: '#d97706', color: '#fff', border: 'none', borderRadius: '6px', padding: '0 8px', height: '34px', fontWeight: '800', cursor: 'pointer' }}
                      >
                        ✓
                      </button>
                      <button
                        type="button"
                        onClick={() => { setIsAddingNewPurpose(false); setNewPurposeInput(''); }}
                        style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0 8px', height: '34px', cursor: 'pointer' }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <select
                      value={formData.purpose || ''}
                      onChange={(e) => {
                        if (e.target.value === '__add_new__') {
                          setIsAddingNewPurpose(true);
                        } else {
                          setFormData({ ...formData, purpose: e.target.value });
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-card)',
                        color: 'var(--text-main)',
                        fontSize: '0.85rem'
                      }}
                    >
                      <option value="">{lang === 'bn' ? '-- উদ্দেশ্য (ঐচ্ছিক) --' : '-- Select Purpose --'}</option>
                      {availablePurposes.map((p) => (
                        <option key={p} value={p}>
                          🎯 {p}
                        </option>
                      ))}
                      <option value="__add_new__" style={{ fontWeight: '800', color: '#d97706' }}>
                        ➕ {lang === 'bn' ? 'নতুন উদ্দেশ্য যোগ করুন...' : 'Add Purpose...'}
                      </option>
                    </select>
                  )}
                </div>
              </div>

              {/* Amount (৳) & Date in 2 Columns */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-main)' }}>
                    {lang === 'bn' ? 'টাকার পরিমাণ (৳) *' : 'Amount (৳) *'}
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="০"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
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

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-main)' }}>
                    {lang === 'bn' ? 'তারিখ *' : 'Date *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-main)',
                      color: 'var(--text-main)',
                      fontSize: '0.88rem'
                    }}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-main)' }}>
                  {lang === 'bn' ? 'নোট / মেমো / রসিদ বিবরণ' : 'Note / Memo'}
                </label>
                <input
                  type="text"
                  placeholder={lang === 'bn' ? 'রসিদ নম্বর বা বিশেষ মন্তব্য...' : 'Memo notes...'}
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-main)',
                    color: 'var(--text-main)',
                    fontSize: '0.88rem'
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
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
                  type="submit"
                  style={{
                    padding: '9px 24px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #f97316, #ea580c)',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(249, 115, 22, 0.35)'
                  }}
                >
                  {editingExpense
                    ? (lang === 'bn' ? 'আপডেট করুন' : 'Update Expense')
                    : (lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save Expense')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CATEGORY & UNITS MANAGER MODAL                           */}
      {/* ======================================================== */}
      <CategoryManagerModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        defaultGroup={categoryModalDefaultGroup}
        onSelectCategory={(selected) => {
          if (categoryModalDefaultGroup === 'familyExpenseFolders') {
            setFormData((prev) => ({ ...prev, folder: selected }));
          } else if (categoryModalDefaultGroup === 'expenseUnits') {
            setFormData((prev) => ({ ...prev, unit: selected }));
          }
        }}
      />

      {/* EXPORT / IMPORT MODAL */}
      <DataExportImportModal
        isOpen={showExportImportModal}
        onClose={() => setShowExportImportModal(false)}
        defaultTab="export"
        initialTarget="family"
      />

      {/* MASTER HUB MODAL */}
      <MasterHubModal
        isOpen={showMasterHubModal}
        onClose={() => setShowMasterHubModal(false)}
        defaultTab="folders"
      />
    </div>
  );
};

export default FamilyExpenses;
