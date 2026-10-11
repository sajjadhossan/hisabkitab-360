import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Plus,
  ShoppingCart,
  CheckCircle2,
  Trash2,
  Edit2,
  Sparkles,
  Zap,
  ListPlus,
  RotateCcw,
  Tag,
  Calendar,
  Layers,
  ShoppingBag,
  DollarSign
} from 'lucide-react';
import { hapticFeedback } from '../../services/nativeAppService';

const STORAGE_KEY = 'hk360_routine_shopping_presets';

const DEFAULT_PRESETS = [
  {
    id: 'preset-fam-weekly',
    name: 'সাপ্তাহিক পারিবারিক বাজার',
    profile: 'personal',
    folder: 'গৃহস্থালি ও নিত্য কেনাকাটা',
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
    folder: 'গৃহস্থালি ও নিত্য কেনাকাটা',
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

  // New Preset / Edit State
  const [isEditingPreset, setIsEditingPreset] = useState(false);
  const [editingPresetId, setEditingPresetId] = useState(null);
  const [presetNameInput, setPresetNameInput] = useState('');
  const [presetFolderInput, setPresetFolderInput] = useState('গৃহস্থালি ও নিত্য কেনাকাটা');
  const [newPresetItems, setNewPresetItems] = useState([
    { name: '', unit: '', defaultAmount: '' }
  ]);

  // Sync presets to storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
    } catch (e) {
      console.warn('Failed to save presets:', e);
    }
  }, [presets]);

  // Select first preset for active profile on open
  useEffect(() => {
    if (presets.length > 0) {
      const matched = presets.find(p => p.profile === activeProfile) || presets[0];
      if (matched) {
        setSelectedPresetId(matched.id);
        setExecutionItems(matched.items.map(it => ({
          ...it,
          amount: it.defaultAmount || 0,
          selected: true
        })));
      }
    }
  }, [activeProfile, presets]);

  // When switching preset
  const handleSelectPreset = (preset) => {
    hapticFeedback.light();
    setSelectedPresetId(preset.id);
    setExecutionItems(preset.items.map(it => ({
      ...it,
      amount: it.defaultAmount || 0,
      selected: true
    })));
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
      showToast(lang === 'bn' ? 'কমপক্ষে একটি আইটেমের টাকার পরিমাণ দিন' : 'Enter amount for at least one item', 'warning');
      return;
    }

    hapticFeedback.medium();
    let count = 0;
    const destFolder = activePreset?.folder || 'গৃহস্থালি ও নিত্য কেনাকাটা';

    selected.forEach(it => {
      if (activeProfile === 'business') {
        addBusinessExpense({
          title: it.name,
          amount: Number(it.amount),
          category: destFolder,
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
          type: 'family',
          date: expenseDate,
          note: `⚡ নিয়মিত কেনাকাটা প্রি-সেট (${activePreset?.name || 'রুটিন'})`
        });
      }
      count++;
    });

    showToast(
      lang === 'bn'
        ? `🎉 সফলভাবে ${count}টি নিয়মিত খরচ (মোট ৳${currentTotal.toLocaleString('en-IN')}) রানিং হিসাবে যুক্ত হয়েছে!`
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
      setPresetFolderInput(preset.folder || 'গৃহস্থালি ও নিত্য কেনাকাটা');
      setNewPresetItems(preset.items.map(i => ({ name: i.name, unit: i.unit, defaultAmount: i.defaultAmount })));
    } else {
      setEditingPresetId(null);
      setPresetNameInput('');
      setPresetFolderInput(activeProfile === 'business' ? 'দোকান ও টিফিন খরচ' : 'গৃহস্থালি ও নিত্য কেনাকাটা');
      setNewPresetItems([
        { name: '', unit: 'কেজি', defaultAmount: '' },
        { name: '', unit: 'লিটার', defaultAmount: '' }
      ]);
    }
    setIsEditingPreset(true);
  };

  const handleSavePresetCustom = (e) => {
    e.preventDefault();
    if (!presetNameInput.trim()) {
      showToast(lang === 'bn' ? 'প্রি-সেটের একটি নাম দিন' : 'Enter preset name', 'warning');
      return;
    }
    const cleanItems = newPresetItems
      .filter(it => it.name.trim().length > 0)
      .map((it, idx) => ({
        id: `it-${Date.now()}-${idx}`,
        name: it.name.trim(),
        unit: it.unit.trim() || 'পিস',
        defaultAmount: parseFloat(it.defaultAmount) || 0
      }));

    if (cleanItems.length === 0) {
      showToast(lang === 'bn' ? 'কমপক্ষে একটি পণ্যের নাম লিখুন' : 'Enter at least one item', 'warning');
      return;
    }

    if (editingPresetId) {
      setPresets(prev => prev.map(p => p.id === editingPresetId ? {
        ...p,
        name: presetNameInput.trim(),
        folder: presetFolderInput.trim(),
        items: cleanItems
      } : p));
      showToast(lang === 'bn' ? 'প্রি-সেট আপডেট সম্পন্ন!' : 'Preset updated!');
    } else {
      const newPreset = {
        id: `preset-${Date.now()}`,
        name: presetNameInput.trim(),
        profile: activeProfile,
        folder: presetFolderInput.trim(),
        items: cleanItems
      };
      setPresets(prev => [newPreset, ...prev]);
      setSelectedPresetId(newPreset.id);
      showToast(lang === 'bn' ? 'নতুন প্রি-সেট তৈরি হয়েছে!' : 'Preset created!');
    }
    setIsEditingPreset(false);
  };

  const handleDeletePreset = (id) => {
    if (presets.length <= 1) {
      showToast(lang === 'bn' ? 'কমপক্ষে একটি প্রি-সেট থাকা প্রয়োজন' : 'Must keep at least one preset', 'warning');
      return;
    }
    setPresets(prev => prev.filter(p => p.id !== id));
    showToast(lang === 'bn' ? 'প্রি-সেট মোছা হয়েছে' : 'Preset removed');
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px', flex: 1 }}>
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
                  gap: '6px'
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
              padding: '6px 10px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              fontSize: '0.75rem',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Plus size={14} />
            <span>নতুন প্রি-সেট</span>
          </button>
        </div>

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
              <span style={{ fontSize: '0.86rem', fontWeight: '800', color: 'var(--text-main)' }}>
                {editingPresetId ? '✏️ প্রি-সেট এডিট করুন' : '➕ নতুন নিয়মিত কেনাকাটা প্রি-সেট তৈরি করুন'}
              </span>
              <button type="button" onClick={() => setIsEditingPreset(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
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
                  onClick={() => setNewPresetItems(newPresetItems.filter((_, i) => i !== idx))}
                  style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => setNewPresetItems([...newPresetItems, { name: '', unit: 'কেজি', defaultAmount: '' }])}
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

            <button
              type="submit"
              style={{
                marginTop: '6px',
                padding: '8px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                color: '#fff',
                border: 'none',
                fontWeight: '800',
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              সেভ করুন
            </button>
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
      </div>
    </div>
  );
};

export default RoutineShoppingPresetsModal;
