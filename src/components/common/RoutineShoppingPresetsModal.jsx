import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Plus,
  CheckCircle2,
  Trash2,
  Edit2,
  Zap,
  RotateCcw,
  Tag,
  Folder,
  Layers,
  User,
  CheckSquare,
  Square,
  Check,
  Filter
} from 'lucide-react';
import { hapticFeedback } from '../../services/nativeAppService';

const STORAGE_KEY = 'hk360_routine_shopping_presets';

const DEFAULT_PRESETS = [
  {
    id: 'preset-fam-weekly',
    name: 'সাপ্তাহিক পারিবারিক বাজার',
    profile: 'personal',
    folder: 'গৃহস্থালি ও নিত্য কেনাকাটা',
    subFolder: 'কাঁচা শাকসবজি',
    familyMember: 'পুরো পরিবার (সবার জন্য)',
    type: 'daily',
    items: [
      { id: 'it-1', name: 'মিনিকেট চাল', unit: '৫ কেজি', defaultAmount: 400 },
      { id: 'it-2', name: 'সয়াবিন তেল', unit: '২ লিটার', defaultAmount: 380 },
      { id: 'it-3', name: 'দেশি ডিম', unit: '১ ডজন', defaultAmount: 160 },
      { id: 'it-4', name: 'আলু ও পেঁয়াজ', unit: '৩ কেজি', defaultAmount: 220 },
      { id: 'it-5', name: 'তাজা মাছ ও শাকসবজি', unit: 'বাজার', defaultAmount: 650 },
      { id: 'it-6', name: 'গরু/মুরগির মাংস', unit: '১ কেজি', defaultAmount: 350 }
    ]
  },
  {
    id: 'preset-fam-daily',
    name: 'দৈনন্দিন নিত্য মুদি বাজার',
    profile: 'personal',
    folder: 'দৈনন্দিন বাজার খরচ',
    subFolder: 'কাঁচা শাকসবজি',
    familyMember: 'নিজে (Self)',
    type: 'daily',
    items: [
      { id: 'it-7', name: 'দুধ ও পাউরুটি', unit: '১ প্যাকেট', defaultAmount: 120 },
      { id: 'it-8', name: 'কাঁচাবাজার ও কাঁচামরিচ', unit: 'বাজার', defaultAmount: 150 },
      { id: 'it-9', name: 'মিনারেল ওয়াটার / নাস্তা', unit: 'আইটেম', defaultAmount: 80 }
    ]
  },
  {
    id: 'preset-biz-supplies',
    name: 'দোকানের নিয়মিত সাপ্লাই ও টিফিন',
    profile: 'business',
    folder: 'দোকান ও টিফিন খরচ',
    subFolder: 'স্টাফ নাস্তা ও টিফিন',
    familyMember: 'দোকান স্টাফ',
    type: 'business',
    items: [
      { id: 'it-10', name: 'স্টাফ চা, বিস্কুট ও নাস্তা', unit: 'দৈনিক', defaultAmount: 180 },
      { id: 'it-11', name: 'দোকান পরিষ্কারের সামগ্রী', unit: 'প্যাক', defaultAmount: 120 },
      { id: 'it-12', name: 'প্যাকেজিং পলিথিন ও টেপ', unit: 'রোল', defaultAmount: 350 }
    ]
  }
];

export const RoutineShoppingPresetsModal = ({
  isOpen,
  onClose,
  defaultProfile = 'personal'
}) => {
  const {
    profile,
    addPersonalExpense,
    addBusinessExpense,
    categories = {},
    addCategory,
    showToast,
    lang
  } = useApp();

  const [activeProfile, setActiveProfile] = useState(defaultProfile || profile || 'personal');
  const [presets, setPresets] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to parse presets:', e);
    }
    return DEFAULT_PRESETS;
  });

  const [selectedPresetId, setSelectedPresetId] = useState(null);
  const [executionItems, setExecutionItems] = useState([]);
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);

  // Destination Categories & Setup for Routine Purchases
  const availableFolders = useMemo(() => {
    return categories.familyExpenseFolders || [
      'গৃহস্থালি ও নিত্য কেনাকাটা',
      'দৈনন্দিন বাজার খরচ',
      'বাসা ও ফ্ল্যাট খরচ',
      'বিদ্যুৎ, গ্যাস ও ইউটিলিটি',
      'সন্তানের পড়াশোনা ও স্কুল',
      'পারিবারিক চিকিৎসা ও ওষুধ',
      'অন্যান্য পারিবারিক খরচ'
    ];
  }, [categories.familyExpenseFolders]);

  const availableSubFolders = useMemo(() => {
    return categories.expenseSubCategories || [
      'কাঁচা শাকসবজি',
      'তাজা মাছ',
      'মুরগি / গরুর মাংস',
      'চাল ও আটা',
      'ডাল ও সয়াবিন তেল',
      'ডিম ও দুধ',
      'ফলমূল'
    ];
  }, [categories.expenseSubCategories]);

  const availableMembers = useMemo(() => {
    return categories.familyMembers || [
      'নিজে (Self)',
      'পুরো পরিবার (সবার জন্য)',
      'স্ত্রী (Wife)',
      'ছেলে (Son)',
      'মেয়ে (Daughter)',
      'বাবা (Father)',
      'মা (Mother)'
    ];
  }, [categories.familyMembers]);

  // Target Destination States
  const [targetExpenseType, setTargetExpenseType] = useState('daily'); // 'daily' or 'family'
  const [targetFolder, setTargetFolder] = useState('গৃহস্থালি ও নিত্য কেনাকাটা');
  const [targetSubFolder, setTargetSubFolder] = useState('কাঁচা শাকসবজি');
  const [targetMember, setTargetMember] = useState('নিজে (Self)');

  // Inline Add Category/Folder/Member States
  const [isAddingNewFolder, setIsAddingNewFolder] = useState(false);
  const [newFolderInput, setNewFolderInput] = useState('');
  const [isAddingNewSubFolder, setIsAddingNewSubFolder] = useState(false);
  const [newSubFolderInput, setNewSubFolderInput] = useState('');
  const [isAddingNewMember, setIsAddingNewMember] = useState(false);
  const [newMemberInput, setNewMemberInput] = useState('');

  // New Preset / Edit State
  const [isEditingPreset, setIsEditingPreset] = useState(false);
  const [editingPresetId, setEditingPresetId] = useState(null);
  const [presetNameInput, setPresetNameInput] = useState('');
  const [presetFolderInput, setPresetFolderInput] = useState('গৃহস্থালি ও নিত্য কেনাকাটা');
  const [newPresetItems, setNewPresetItems] = useState([
    { name: '', unit: '', defaultAmount: '' }
  ]);

  // Quick Rename State
  const [quickRenameTarget, setQuickRenameTarget] = useState(null);
  const [quickRenameName, setQuickRenameName] = useState('');

  // Sync presets to storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
    } catch (e) {
      console.warn('Failed to save presets:', e);
    }
  }, [presets]);

  // Select first preset for active profile on open or when selection becomes invalid
  useEffect(() => {
    if (presets.length > 0) {
      const currentValid = presets.find(p => p.id === selectedPresetId && p.profile === activeProfile);
      if (!currentValid) {
        const matched = presets.find(p => p.profile === activeProfile) || presets[0];
        if (matched) {
          setSelectedPresetId(matched.id);
          setExecutionItems(matched.items.map(it => ({
            ...it,
            amount: it.defaultAmount || 0,
            selected: false // Default unchecked: user checks what they want!
          })));
          setTargetFolder(matched.folder || (activeProfile === 'business' ? 'দোকান ও টিফিন খরচ' : 'গৃহস্থালি ও নিত্য কেনাকাটা'));
          if (matched.subFolder) setTargetSubFolder(matched.subFolder);
          if (matched.familyMember || matched.person) setTargetMember(matched.familyMember || matched.person);
          if (matched.type) setTargetExpenseType(matched.type);
        }
      }
    }
  }, [activeProfile, presets, selectedPresetId]);

  // When switching preset
  const handleSelectPreset = (preset) => {
    hapticFeedback.light();
    setSelectedPresetId(preset.id);
    setExecutionItems(preset.items.map(it => ({
      ...it,
      amount: it.defaultAmount || 0,
      selected: false // Default unchecked!
    })));
    setTargetFolder(preset.folder || (preset.profile === 'business' ? 'দোকান ও টিফিন খরচ' : 'গৃহস্থালি ও নিত্য কেনাকাটা'));
    if (preset.subFolder) setTargetSubFolder(preset.subFolder);
    if (preset.familyMember || preset.person) setTargetMember(preset.familyMember || preset.person);
    if (preset.type) setTargetExpenseType(preset.type);
  };

  // Quick Amount Adjustment Chips (+50, +100, +500)
  const handleQuickAdd = (itemId, addVal) => {
    hapticFeedback.light();
    setExecutionItems(prev => prev.map(it => {
      if (it.id === itemId) {
        const nextAmt = Math.max(0, (Number(it.amount) || 0) + addVal);
        return { ...it, amount: nextAmt };
      }
      return it;
    }));
  };

  const handleAmountChange = (itemId, val) => {
    const parsed = parseFloat(val) || 0;
    setExecutionItems(prev => prev.map(it => it.id === itemId ? { ...it, amount: parsed } : it));
  };

  const toggleItemSelect = (itemId) => {
    setExecutionItems(prev => prev.map(it => it.id === itemId ? { ...it, selected: !it.selected } : it));
  };

  // Toggle Select All / Unselect All
  const allSelected = executionItems.length > 0 && executionItems.every(i => i.selected);
  const handleToggleSelectAll = () => {
    hapticFeedback.light();
    setExecutionItems(prev => prev.map(it => ({ ...it, selected: !allSelected })));
  };

  // Grand Total of Execution Items
  const currentTotal = useMemo(() => {
    return executionItems
      .filter(it => it.selected)
      .reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
  }, [executionItems]);

  const activePreset = useMemo(() => {
    return presets.find(p => p.id === selectedPresetId);
  }, [presets, selectedPresetId]);

  // Execute Batch 1-Click Injection
  const handleExecuteRoutineShopping = () => {
    const selected = executionItems.filter(it => it.selected && Number(it.amount) > 0);
    if (selected.length === 0) {
      showToast(
        lang === 'bn'
          ? 'কমপক্ষে একটি আইটেমে টিক চিহ্ন দিয়ে টাকার পরিমাণ দিন'
          : 'Select at least one item with an amount',
        'warning'
      );
      return;
    }

    hapticFeedback.medium();
    let count = 0;
    const destFolder = (targetFolder || activePreset?.folder || (targetExpenseType === 'family' ? 'অন্যান্য পারিবারিক খরচ' : 'দৈনন্দিন বাজার খরচ')).trim();
    const destSub = (targetSubFolder || activePreset?.subFolder || '').trim();
    const destMember = (targetMember || activePreset?.familyMember || 'নিজে (Self)').trim();

    selected.forEach(it => {
      if (activeProfile === 'business') {
        addBusinessExpense({
          title: it.name,
          amount: Number(it.amount),
          category: destFolder,
          subCategory: destSub,
          date: expenseDate,
          note: `⚡ নিয়মিত কেনাকাটা প্রি-সেট (${activePreset?.name || 'রুটিন'})`
        });
      } else {
        addPersonalExpense({
          title: it.name,
          item: it.name,
          amount: Number(it.amount),
          quantity: 1,
          unit: it.unit || '',
          folder: destFolder,
          category: destFolder,
          subFolder: destSub,
          subCategory: destSub,
          familyMember: destMember,
          person: destMember,
          member: destMember,
          type: targetExpenseType || 'daily', // Directly assigns to chosen type (daily vs family)
          date: expenseDate,
          note: `⚡ নিয়মিত কেনাকাটা প্রি-সেট (${activePreset?.name || 'রুটিন'})`
        });
      }
      count++;
    });

    const destinationLabel = activeProfile === 'business'
      ? 'দোকান/ব্যবসায়িক'
      : (targetExpenseType === 'daily' ? 'ব্যক্তিগত / দৈনন্দিন' : 'পারিবারিক');

    showToast(
      lang === 'bn'
        ? `🎉 সফলভাবে ${count}টি কেনাকাটা (মোট ৳${currentTotal.toLocaleString('en-IN')}) সরাসরি "${destFolder}" ফোল্ডারে ${destinationLabel} খরচে যুক্ত হয়েছে!`
        : `Added ${count} routine expenses (৳${currentTotal.toLocaleString('en-IN')})!`,
      'success'
    );
    onClose();
  };

  // Open Preset Builder / Editor
  const handleOpenPresetBuilder = (preset = null) => {
    if (preset) {
      setEditingPresetId(preset.id);
      setPresetNameInput(preset.name);
      setPresetFolderInput(preset.folder || (preset.profile === 'business' ? 'দোকান ও টিফিন খরচ' : 'গৃহস্থালি ও নিত্য কেনাকাটা'));
      setNewPresetItems(preset.items.map(i => ({
        id: i.id,
        name: i.name,
        unit: i.unit || '',
        defaultAmount: i.defaultAmount ?? ''
      })));
    } else {
      setEditingPresetId(null);
      setPresetNameInput('');
      setPresetFolderInput(activeProfile === 'business' ? 'দোকান ও টিফিন খরচ' : 'গৃহস্থালি ও নিত্য কেনাকাটা');
      setNewPresetItems([
        { id: `it-new-1`, name: '', unit: 'কেজি', defaultAmount: '' },
        { id: `it-new-2`, name: '', unit: 'লিটার', defaultAmount: '' }
      ]);
    }
    setIsEditingPreset(true);
  };

  const handleSavePresetCustom = (e) => {
    e.preventDefault();
    const trimmedName = presetNameInput.trim();
    if (!trimmedName) {
      showToast(lang === 'bn' ? 'প্রি-সেটের একটি নাম দিন' : 'Enter preset name', 'warning');
      return;
    }
    const cleanItems = newPresetItems
      .filter(it => it.name && it.name.trim().length > 0)
      .map((it, idx) => ({
        id: it.id || `it-${Date.now()}-${idx}`,
        name: it.name.trim(),
        unit: (it.unit && it.unit.trim()) || 'পিস',
        defaultAmount: parseFloat(it.defaultAmount) || 0
      }));

    if (cleanItems.length === 0) {
      showToast(lang === 'bn' ? 'কমপক্ষে একটি পণ্যের নাম লিখুন' : 'Enter at least one item', 'warning');
      return;
    }

    if (editingPresetId) {
      const updatedList = presets.map(p => p.id === editingPresetId ? {
        ...p,
        name: trimmedName,
        folder: presetFolderInput.trim() || p.folder,
        items: cleanItems
      } : p);
      setPresets(updatedList);

      if (selectedPresetId === editingPresetId) {
        setExecutionItems(cleanItems.map(it => ({
          ...it,
          amount: it.defaultAmount || 0,
          selected: false
        })));
      }
      showToast(lang === 'bn' ? 'প্রি-সেট সফলভাবে আপডেট করা হয়েছে!' : 'Preset updated!', 'success');
    } else {
      const newPreset = {
        id: `preset-${Date.now()}`,
        name: trimmedName,
        profile: activeProfile,
        folder: presetFolderInput.trim() || (activeProfile === 'business' ? 'দোকান ও টিফিন খরচ' : 'গৃহস্থালি ও নিত্য কেনাকাটা'),
        items: cleanItems
      };
      setPresets(prev => [newPreset, ...prev]);
      setSelectedPresetId(newPreset.id);
      setExecutionItems(cleanItems.map(it => ({
        ...it,
        amount: it.defaultAmount || 0,
        selected: false
      })));
      showToast(lang === 'bn' ? 'নতুন প্রি-সেট তৈরি হয়েছে!' : 'Preset created!', 'success');
    }
    setIsEditingPreset(false);
  };

  // Quick Rename Handlers
  const handleStartQuickRename = (preset) => {
    if (!preset) return;
    setQuickRenameTarget(preset);
    setQuickRenameName(preset.name);
  };

  const handleSaveQuickRename = (e) => {
    if (e) e.preventDefault();
    if (!quickRenameTarget) return;
    const trimmed = quickRenameName.trim();
    if (!trimmed) {
      showToast(lang === 'bn' ? 'প্রি-সেটের নাম খালি রাখা যাবে না' : 'Preset name cannot be empty', 'warning');
      return;
    }
    setPresets(prev => prev.map(p => p.id === quickRenameTarget.id ? { ...p, name: trimmed } : p));
    setQuickRenameTarget(null);
    showToast(lang === 'bn' ? `প্রি-সেটের নাম পরিবর্তন করে "${trimmed}" রাখা হয়েছে!` : 'Preset renamed!', 'success');
  };

  // Delete Preset with Confirmation
  const handleDeletePreset = (id) => {
    const targetId = id || selectedPresetId;
    const target = presets.find(p => p.id === targetId);
    if (!target) return;

    if (presets.length <= 1) {
      showToast(lang === 'bn' ? 'কমপক্ষে একটি প্রি-সেট থাকা প্রয়োজন' : 'Must keep at least one preset', 'warning');
      return;
    }

    const confirmed = window.confirm(
      lang === 'bn'
        ? `আপনি কি নিশ্চিতভাবে "${target.name}" প্রি-সেটটি মুছে ফেলতে চান?`
        : `Are you sure you want to delete preset "${target.name}"?`
    );
    if (!confirmed) return;

    hapticFeedback.light();
    const remaining = presets.filter(p => p.id !== targetId);
    setPresets(remaining);

    if (selectedPresetId === targetId) {
      const nextPreset = remaining.find(p => p.profile === activeProfile) || remaining[0];
      if (nextPreset) {
        setSelectedPresetId(nextPreset.id);
        setExecutionItems(nextPreset.items.map(it => ({
          ...it,
          amount: it.defaultAmount || 0,
          selected: false
        })));
      }
    }

    if (isEditingPreset && editingPresetId === targetId) {
      setIsEditingPreset(false);
    }

    showToast(lang === 'bn' ? `"${target.name}" প্রি-সেট সফলভাবে মুছে ফেলা হয়েছে!` : 'Preset deleted!', 'info');
  };

  // Restore Default Presets
  const handleRestoreDefaultPresets = () => {
    const confirmed = window.confirm(
      lang === 'bn'
        ? 'আপনি কি নিয়মিত কেনাকাটার সকল ডিফল্ট প্রি-সেট ফিরিয়ে আনতে চান?'
        : 'Do you want to restore default routine presets?'
    );
    if (!confirmed) return;
    setPresets(DEFAULT_PRESETS);
    const first = DEFAULT_PRESETS.find(p => p.profile === activeProfile) || DEFAULT_PRESETS[0];
    if (first) {
      setSelectedPresetId(first.id);
      setExecutionItems(first.items.map(it => ({
        ...it,
        amount: it.defaultAmount || 0,
        selected: false
      })));
    }
    showToast(lang === 'bn' ? 'ডিফল্ট প্রি-সেট সফলভাবে ফিরিয়ে আনা হয়েছে' : 'Default presets restored', 'info');
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
                background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)'
              }}
            >
              <Zap size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.18rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>⚡ নিয়মিত কেনাকাটা ১-ক্লিক প্রি-সেট</span>
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {lang === 'bn' ? 'বারবার কেনা বাজার ফর্দ সেভ রাখুন—১-ক্লিকে লোড করে খরচ যোগ করুন' : 'Pre-saved routine baskets with fast 1-click batch entry'}
              </p>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Profile Switcher */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <button
            type="button"
            onClick={() => setActiveProfile('personal')}
            style={{
              flex: 1,
              padding: '6px 12px',
              borderRadius: '8px',
              border: activeProfile === 'personal' ? '2px solid #10b981' : '1px solid var(--border-color)',
              background: activeProfile === 'personal' ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-main)',
              color: activeProfile === 'personal' ? '#10b981' : 'var(--text-muted)',
              fontWeight: '800',
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            👤 পার্সোনাল / ফ্যামিলি বাজার
          </button>

          <button
            type="button"
            onClick={() => setActiveProfile('business')}
            style={{
              flex: 1,
              padding: '6px 12px',
              borderRadius: '8px',
              border: activeProfile === 'business' ? '2px solid var(--business-primary)' : '1px solid var(--border-color)',
              background: activeProfile === 'business' ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-main)',
              color: activeProfile === 'business' ? 'var(--business-primary)' : 'var(--text-muted)',
              fontWeight: '800',
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            💼 দোকান / ব্যবসায়িক সাপ্লাই
          </button>
        </div>

        {/* Preset Selector Chips Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px', flex: 1, minWidth: '200px' }}>
            {presets.filter(p => p.profile === activeProfile).map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectPreset(p)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '10px',
                  border: selectedPresetId === p.id ? '2px solid #0ea5e9' : '1px solid var(--border-color)',
                  background: selectedPresetId === p.id ? 'rgba(14, 165, 233, 0.15)' : 'var(--bg-main)',
                  color: selectedPresetId === p.id ? '#0ea5e9' : 'var(--text-main)',
                  fontWeight: '800',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{p.name}</span>
                <span style={{ fontSize: '0.68rem', opacity: 0.8 }}>({p.items.length})</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => handleOpenPresetBuilder()}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.15), rgba(2, 132, 199, 0.2))',
              border: '1px solid rgba(14, 165, 233, 0.4)',
              color: '#0ea5e9',
              fontSize: '0.76rem',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              whiteSpace: 'nowrap'
            }}
          >
            <Plus size={14} />
            <span>নতুন প্রি-সেট</span>
          </button>
        </div>

        {/* Active Preset Action Toolbar */}
        {activePreset && (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '8px 12px',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-main)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ color: '#0ea5e9' }}>📌</span>
                {activePreset.name}
              </span>
              <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '12px', background: 'rgba(14, 165, 233, 0.12)', color: '#0ea5e9', fontWeight: '700' }}>
                {activePreset.items.length}টি পণ্য • {activePreset.folder || 'ক্যাটাগরি'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              {/* Rename Button */}
              <button
                type="button"
                onClick={() => handleStartQuickRename(activePreset)}
                title="প্রিসেটের নাম পরিবর্তন (রিনেম) করুন"
                style={{
                  padding: '5px 9px',
                  borderRadius: '7px',
                  background: 'rgba(59, 130, 246, 0.12)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  color: '#3b82f6',
                  fontSize: '0.73rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Tag size={12} />
                <span>রিনেম</span>
              </button>

              {/* Edit Preset Button */}
              <button
                type="button"
                onClick={() => handleOpenPresetBuilder(activePreset)}
                title="আইটেম ও টাকার রেট এডিট করুন"
                style={{
                  padding: '5px 9px',
                  borderRadius: '7px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#10b981',
                  fontSize: '0.73rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Edit2 size={12} />
                <span>এডিট</span>
              </button>

              {/* Delete Preset Button */}
              <button
                type="button"
                onClick={() => handleDeletePreset(activePreset.id, activePreset.name)}
                title="এই প্রিসেট মুছে ফেলুন"
                style={{
                  padding: '5px 9px',
                  borderRadius: '7px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#ef4444',
                  fontSize: '0.73rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Trash2 size={12} />
                <span>ডিলিট</span>
              </button>

              {/* Restore Defaults */}
              <button
                type="button"
                onClick={handleRestoreDefaultPresets}
                title="ডিফল্ট প্রিসেটগুলো রিস্টোর করুন"
                style={{
                  padding: '5px 8px',
                  borderRadius: '7px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-muted)',
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px'
                }}
              >
                <RotateCcw size={11} />
                <span>রিস্টোর</span>
              </button>
            </div>
          </div>
        )}

        {/* Preset Customizer Modal Drawer */}
        {isEditingPreset && (
          <form onSubmit={handleSavePresetCustom} style={{
            background: 'var(--bg-main)',
            border: '1.5px solid var(--border-color)',
            borderRadius: '12px',
            padding: '14px',
            marginBottom: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.86rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {editingPresetId ? <Edit2 size={15} color="#10b981" /> : <Plus size={15} color="#0ea5e9" />}
                {editingPresetId ? `প্রি-সেট এডিট: ${presetNameInput || 'নামহীন'}` : 'নতুন নিয়মিত কেনাকাটা প্রি-সেট তৈরি করুন'}
              </span>
              <button type="button" onClick={() => setIsEditingPreset(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                  প্রি-সেটের নাম *
                </label>
                <input
                  type="text"
                  placeholder="যেমন: সাপ্তাহিক বাজার"
                  value={presetNameInput}
                  onChange={(e) => setPresetNameInput(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.8rem', fontWeight: '700' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                  ডিফল্ট ফোল্ডার / ক্যাটাগরি
                </label>
                <input
                  type="text"
                  value={presetFolderInput}
                  onChange={(e) => setPresetFolderInput(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.8rem' }}
                />
              </div>
            </div>

            <div style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--text-muted)', marginTop: '4px' }}>
              আইটেম তালিকা (নাম, একক ও আনুমানিক রেট):
            </div>

            {newPresetItems.map((item, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 30px', gap: '6px', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="পণ্যের নাম (যেমন: চাল)"
                  value={item.name}
                  onChange={(e) => {
                    const next = [...newPresetItems];
                    next[idx].name = e.target.value;
                    setNewPresetItems(next);
                  }}
                  style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.78rem' }}
                />
                <input
                  type="text"
                  placeholder="একক (কেজি)"
                  value={item.unit}
                  onChange={(e) => {
                    const next = [...newPresetItems];
                    next[idx].unit = e.target.value;
                    setNewPresetItems(next);
                  }}
                  style={{ padding: '5px 6px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.78rem' }}
                />
                <input
                  type="number"
                  placeholder="রেট (৳)"
                  value={item.defaultAmount}
                  onChange={(e) => {
                    const next = [...newPresetItems];
                    next[idx].defaultAmount = e.target.value;
                    setNewPresetItems(next);
                  }}
                  style={{ padding: '5px 6px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.78rem' }}
                />
                <button
                  type="button"
                  title="এই পণ্যটি বাদ দিন"
                  onClick={() => setNewPresetItems(newPresetItems.filter((_, i) => i !== idx))}
                  style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => setNewPresetItems([...newPresetItems, { id: `it-new-${Date.now()}`, name: '', unit: 'কেজি', defaultAmount: '' }])}
              style={{
                alignSelf: 'flex-start',
                padding: '4px 8px',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                fontSize: '0.72rem',
                cursor: 'pointer'
              }}
            >
              + আরও আইটেম যোগ করুন
            </button>

            <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
              <button
                type="submit"
                style={{
                  flex: 2,
                  minWidth: '140px',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                  color: '#fff',
                  border: 'none',
                  fontWeight: '800',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <CheckCircle2 size={15} />
                <span>{editingPresetId ? 'পরিবর্তন সেভ করুন' : 'প্রি-সেট তৈরি করুন'}</span>
              </button>

              {editingPresetId && (
                <button
                  type="button"
                  onClick={() => handleDeletePreset(editingPresetId, presetNameInput)}
                  style={{
                    flex: 1,
                    minWidth: '110px',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    color: '#ef4444',
                    fontWeight: '800',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >
                  <Trash2 size={14} />
                  <span>মুছে ফেলুন</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsEditingPreset(false)}
                style={{
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-muted)',
                  fontWeight: '700',
                  fontSize: '0.78rem',
                  cursor: 'pointer'
                }}
              >
                বাতিল
              </button>
            </div>
          </form>
        )}

        {/* Top Summary Banner for 1-Click Purchase */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.12), rgba(16, 185, 129, 0.1))',
          border: '1.5px solid rgba(14, 165, 233, 0.35)',
          borderRadius: '12px',
          padding: '12px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: '12px'
        }}>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: '800', color: '#0ea5e9', textTransform: 'uppercase' }}>
              {activePreset ? activePreset.name : 'রুটিন বাজার'} • {lang === 'bn' ? 'আজকের মোট খরচ:' : 'Grand Total:'}
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: '900', color: 'var(--text-main)', marginTop: '2px' }}>
              ৳{currentTotal.toLocaleString('en-IN')}
              <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', marginLeft: '6px' }}>
                ({executionItems.filter(i => i.selected).length}টি আইটেম সিলেক্টেড)
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              style={{ padding: '6px 8px', borderRadius: '7px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.75rem', fontWeight: '700' }}
            />
          </div>
        </div>

        {/* Destination Setup: Expense Type, Folder, Sub-Folder & Person */}
        <div
          style={{
            background: 'var(--bg-main)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '12px',
            marginBottom: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Folder size={15} style={{ color: '#0ea5e9' }} />
              <span>{lang === 'bn' ? 'খরচের ফোল্ডার, সাব-ফোল্ডার ও ব্যক্তি সেটআপ:' : 'Destination Setup (Folder, Sub-Folder & Person):'}</span>
            </span>

            {/* Profile/Scope Selector (When personal profile active) */}
            {activeProfile === 'personal' && (
              <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-card)', padding: '2px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <button
                  type="button"
                  onClick={() => setTargetExpenseType('daily')}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '0.74rem',
                    fontWeight: '800',
                    cursor: 'pointer',
                    border: 'none',
                    background: targetExpenseType === 'daily' ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent',
                    color: targetExpenseType === 'daily' ? '#fff' : 'var(--text-muted)'
                  }}
                >
                  🛒 {lang === 'bn' ? 'ব্যক্তিগত / দৈনন্দিন' : 'Daily'}
                </button>
                <button
                  type="button"
                  onClick={() => setTargetExpenseType('family')}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '0.74rem',
                    fontWeight: '800',
                    cursor: 'pointer',
                    border: 'none',
                    background: targetExpenseType === 'family' ? 'linear-gradient(135deg, #f97316, #ea580c)' : 'transparent',
                    color: targetExpenseType === 'family' ? '#fff' : 'var(--text-muted)'
                  }}
                >
                  🏠 {lang === 'bn' ? 'পারিবারিক' : 'Family'}
                </button>
              </div>
            )}
          </div>

          {/* 3 Selectors Grid: Folder, Sub-Folder, Member */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px' }}>
            {/* 1. Folder */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0, fontWeight: '700' }}>
                  📁 {lang === 'bn' ? 'খরচের ফোল্ডার' : 'Folder'}
                </label>
                {!isAddingNewFolder && (
                  <button
                    type="button"
                    onClick={() => setIsAddingNewFolder(true)}
                    style={{ background: 'transparent', border: 'none', color: '#0ea5e9', fontSize: '0.68rem', fontWeight: '800', cursor: 'pointer' }}
                  >
                    + {lang === 'bn' ? 'নতুন' : 'New'}
                  </button>
                )}
              </div>
              {isAddingNewFolder ? (
                <div style={{ display: 'flex', gap: '4px' }}>
                  <input
                    type="text"
                    placeholder={lang === 'bn' ? 'নতুন ফোল্ডার...' : 'New folder...'}
                    value={newFolderInput}
                    onChange={(e) => setNewFolderInput(e.target.value)}
                    autoFocus
                    style={{ flex: 1, padding: '4px 6px', fontSize: '0.78rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)' }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const clean = newFolderInput.trim();
                      if (clean) {
                        addCategory('familyExpenseFolders', clean);
                        setTargetFolder(clean);
                        setNewFolderInput('');
                        setIsAddingNewFolder(false);
                      }
                    }}
                    style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: '6px', padding: '0 8px', fontSize: '0.74rem', fontWeight: '800', cursor: 'pointer' }}
                  >
                    ✓
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsAddingNewFolder(false); setNewFolderInput(''); }}
                    style={{ background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0 6px', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <select
                  value={targetFolder}
                  onChange={(e) => {
                    if (e.target.value === '__add_new__') setIsAddingNewFolder(true);
                    else setTargetFolder(e.target.value);
                  }}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: '7px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.78rem', fontWeight: '700' }}
                >
                  {availableFolders.map((f, i) => (
                    <option key={i} value={f}>📁 {f}</option>
                  ))}
                  <option value="__add_new__" style={{ color: '#0ea5e9', fontWeight: '800' }}>➕ {lang === 'bn' ? 'নতুন ফোল্ডার যোগ করুন...' : 'Add Folder...'}</option>
                </select>
              )}
            </div>

            {/* 2. Sub-Folder */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0, fontWeight: '700' }}>
                  🔀 {lang === 'bn' ? 'সাব-ফোল্ডার / খাত' : 'Sub-Category'}
                </label>
                {!isAddingNewSubFolder && (
                  <button
                    type="button"
                    onClick={() => setIsAddingNewSubFolder(true)}
                    style={{ background: 'transparent', border: 'none', color: '#10b981', fontSize: '0.68rem', fontWeight: '800', cursor: 'pointer' }}
                  >
                    + {lang === 'bn' ? 'নতুন' : 'New'}
                  </button>
                )}
              </div>
              {isAddingNewSubFolder ? (
                <div style={{ display: 'flex', gap: '4px' }}>
                  <input
                    type="text"
                    placeholder={lang === 'bn' ? 'যেমন: চাল ও ডাল...' : 'Sub-category...'}
                    value={newSubFolderInput}
                    onChange={(e) => setNewSubFolderInput(e.target.value)}
                    autoFocus
                    style={{ flex: 1, padding: '4px 6px', fontSize: '0.78rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)' }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const clean = newSubFolderInput.trim();
                      if (clean) {
                        addCategory('expenseSubCategories', clean);
                        setTargetSubFolder(clean);
                        setNewSubFolderInput('');
                        setIsAddingNewSubFolder(false);
                      }
                    }}
                    style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', padding: '0 8px', fontSize: '0.74rem', fontWeight: '800', cursor: 'pointer' }}
                  >
                    ✓
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsAddingNewSubFolder(false); setNewSubFolderInput(''); }}
                    style={{ background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0 6px', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <select
                  value={targetSubFolder}
                  onChange={(e) => {
                    if (e.target.value === '__add_new__') setIsAddingNewSubFolder(true);
                    else setTargetSubFolder(e.target.value);
                  }}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: '7px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.78rem' }}
                >
                  <option value="">-- {lang === 'bn' ? 'সাধারণ কেনাকাটা' : 'General'} --</option>
                  {availableSubFolders.map((sf, i) => (
                    <option key={i} value={sf}>🔀 {sf}</option>
                  ))}
                  <option value="__add_new__" style={{ color: '#10b981', fontWeight: '800' }}>➕ {lang === 'bn' ? 'নতুন সাব-ফোল্ডার...' : 'Add Sub-Folder...'}</option>
                </select>
              )}
            </div>

            {/* 3. Member / Person */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0, fontWeight: '700' }}>
                  👤 {lang === 'bn' ? 'কার জন্য / ব্যক্তি' : 'Person / Member'}
                </label>
                {!isAddingNewMember && (
                  <button
                    type="button"
                    onClick={() => setIsAddingNewMember(true)}
                    style={{ background: 'transparent', border: 'none', color: '#f59e0b', fontSize: '0.68rem', fontWeight: '800', cursor: 'pointer' }}
                  >
                    + {lang === 'bn' ? 'নতুন' : 'New'}
                  </button>
                )}
              </div>
              {isAddingNewMember ? (
                <div style={{ display: 'flex', gap: '4px' }}>
                  <input
                    type="text"
                    placeholder={lang === 'bn' ? 'সদস্যের নাম...' : 'Member name...'}
                    value={newMemberInput}
                    onChange={(e) => setNewMemberInput(e.target.value)}
                    autoFocus
                    style={{ flex: 1, padding: '4px 6px', fontSize: '0.78rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)' }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const clean = newMemberInput.trim();
                      if (clean) {
                        addCategory('familyMembers', clean);
                        setTargetMember(clean);
                        setNewMemberInput('');
                        setIsAddingNewMember(false);
                      }
                    }}
                    style={{ background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '6px', padding: '0 8px', fontSize: '0.74rem', fontWeight: '800', cursor: 'pointer' }}
                  >
                    ✓
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsAddingNewMember(false); setNewMemberInput(''); }}
                    style={{ background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0 6px', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <select
                  value={targetMember}
                  onChange={(e) => {
                    if (e.target.value === '__add_new__') setIsAddingNewMember(true);
                    else setTargetMember(e.target.value);
                  }}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: '7px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.78rem' }}
                >
                  {availableMembers.map((m, i) => (
                    <option key={i} value={m}>👤 {m}</option>
                  ))}
                  <option value="__add_new__" style={{ color: '#f59e0b', fontWeight: '800' }}>➕ {lang === 'bn' ? 'নতুন ব্যক্তি যোগ করুন...' : 'Add Person...'}</option>
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Item Selection Toolbar: Checkbox info + Toggle All */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', padding: '0 4px', flexWrap: 'wrap', gap: '6px' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🛒</span>
            <span>{lang === 'bn' ? 'যে পণ্যগুলো কিনেছেন শুধু সেগুলোতে টিক দিন:' : 'Check the items you want to add:'}</span>
            <span style={{ fontSize: '0.72rem', padding: '2px 7px', borderRadius: '10px', background: executionItems.filter(i => i.selected).length > 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.08)', color: executionItems.filter(i => i.selected).length > 0 ? '#10b981' : 'var(--text-muted)', fontWeight: '800' }}>
              {executionItems.filter(i => i.selected).length} / {executionItems.length}
            </span>
          </div>

          <button
            type="button"
            onClick={handleToggleSelectAll}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              background: allSelected ? 'rgba(239, 68, 68, 0.12)' : 'rgba(14, 165, 233, 0.12)',
              color: allSelected ? '#ef4444' : '#0ea5e9',
              fontSize: '0.74rem',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            {allSelected ? <Square size={13} /> : <CheckSquare size={13} />}
            <span>{allSelected ? (lang === 'bn' ? 'সব আনচেক করুন' : 'Uncheck All') : (lang === 'bn' ? 'সব নির্বাচন করুন' : 'Select All')}</span>
          </button>
        </div>

        {/* Execution Items Interactive Fast-Tender List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '340px', overflowY: 'auto', marginBottom: '14px' }}>
          {executionItems.map((item) => (
            <div
              key={item.id}
              style={{
                background: item.selected ? 'var(--bg-main)' : 'rgba(255, 255, 255, 0.02)',
                border: item.selected ? '1px solid var(--border-color)' : '1px solid transparent',
                borderRadius: '10px',
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                opacity: item.selected ? 1 : 0.45,
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                <input
                  type="checkbox"
                  checked={item.selected}
                  onChange={() => toggleItemSelect(item.id)}
                  style={{ cursor: 'pointer' }}
                />
                <div>
                  <div style={{ fontWeight: '800', fontSize: '0.86rem', color: 'var(--text-main)' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {item.unit || 'ইউনিট'}
                  </div>
                </div>
              </div>

              {/* Quick Numpad Chips + Amount Input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ display: 'flex', gap: '3px' }}>
                  {[50, 100, 500].map(chip => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => handleQuickAdd(item.id, chip)}
                      style={{
                        padding: '2px 6px',
                        borderRadius: '6px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-main)',
                        fontSize: '0.68rem',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      +{chip}
                    </button>
                  ))}
                </div>

                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '7px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-muted)' }}>৳</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={item.amount}
                    onChange={(e) => handleAmountChange(item.id, e.target.value)}
                    style={{
                      width: '85px',
                      padding: '5px 6px 5px 20px',
                      borderRadius: '7px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-card)',
                      color: '#10b981',
                      fontWeight: '900',
                      fontSize: '0.84rem',
                      textAlign: 'right'
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 1-Click Fast Ingest Action Button */}
        <button
          type="button"
          onClick={handleExecuteRoutineShopping}
          style={{
            width: '100%',
            padding: '12px 18px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
            color: '#ffffff',
            border: 'none',
            fontSize: '0.95rem',
            fontWeight: '900',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 18px rgba(14, 165, 233, 0.4)',
            transition: 'all 0.2s ease'
          }}
        >
          <Zap size={18} />
          <span>
            {lang === 'bn'
              ? `⚡ ১-ক্লিকে সকল নিয়মিত খরচ যোগ করুন (মোট ৳${currentTotal.toLocaleString('en-IN')})`
              : `⚡ Add Routine Expenses (৳${currentTotal.toLocaleString('en-IN')})`}
          </span>
        </button>

        {/* Quick Rename Dialog Overlay */}
        {quickRenameTarget && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1450,
              background: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(3px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }}
            onClick={() => setQuickRenameTarget(null)}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '380px',
                background: 'var(--bg-card)',
                border: '1.5px solid var(--border-color)',
                borderRadius: '14px',
                padding: '18px',
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.45)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Tag size={16} color="#0ea5e9" />
                  <span>প্রি-সেটের নাম পরিবর্তন (রিনেম)</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setQuickRenameTarget(null)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={16} />
                </button>
              </div>

              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                নতুন নাম লিখুন:
              </label>
              <input
                type="text"
                value={quickRenameName}
                onChange={(e) => setQuickRenameName(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSaveQuickRename();
                  }
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid #0ea5e9',
                  background: 'var(--bg-main)',
                  color: 'var(--text-main)',
                  fontSize: '0.88rem',
                  fontWeight: '700',
                  marginBottom: '16px',
                  outline: 'none'
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setQuickRenameTarget(null)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    fontWeight: '700',
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleSaveQuickRename}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                    color: '#fff',
                    fontWeight: '800',
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  নাম সেভ করুন
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoutineShoppingPresetsModal;
