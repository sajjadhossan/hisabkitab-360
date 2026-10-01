import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShoppingCart,
  Home,
  Scale,
  X,
  Filter,
  Layers,
  User,
  Compass
} from 'lucide-react';
import { CategoryManagerModal } from '../common/CategoryManagerModal';
import { SmartVoiceFormBanner } from '../common/SmartVoiceFormBanner';
import { VoiceInputButton } from '../common/VoiceInputButton';

const DEFAULT_CATEGORY_SUB_MAP = {
  transport: ['বাস ভাড়া', 'অটো / সিএনজি ভাড়া', 'রিকশা ভাড়া', 'উবার / পাঠাও রাইড', 'মেট্রোরেল ভাড়া', 'মোটরসাইকেল তেল', 'ট্রেন / লঞ্চ ভাড়া'],
  education: ['স্কুলের মাসিক বেতন', 'কোচিং ফি', 'প্রাইভেট টিউটর বেতন', 'বই ও খাতা কেনা', 'স্কুল ড্রেস / জুতো', 'টিফিন খরচ', 'পরীক্ষার ফি'],
  bazaar: ['কাঁচা শাকসবজি', 'তাজা মাছ', 'মাংস (মুরগি/গরু)', 'চাল ও আটা', 'ডাল ও সয়াবিন তেল', 'ডিম ও দুধ', 'ফলমূল'],
  medical: ['ডাক্তারের ভিজিট ফি', 'প্রেসক্রিপশনের ওষুধ', 'ল্যাব ও প্যাথলজি টেস্ট', 'হাসপাতাল চার্জ'],
  snacks: ['বিকালের চা-নাস্তা', 'মিষ্টি ও বেকারি', 'রেস্টুরেন্ট ডাইনিং', 'ফাস্টফুড ও কফি'],
  utility: ['বিদ্যুৎ বিল', 'গ্যাস বিল', 'ওয়াসা পানি বিল', 'ইন্টারনেট বিল', 'কেব্‌ল টিভি বিল', 'ময়লা বিল'],
  rent: ['বাসা ভাড়া', 'গ্যারেজ ভাড়া', 'সার্ভিস চার্জ'],
  shopping: ['পোশাক ও জুতা', 'প্রসাধন ও রূপচর্চা', 'গৃহস্থালি তৈজসপত্র', 'ইলেকট্রনিক্স সরঞ্জাম'],
  other: ['দান ও সদকা', 'উপহার সামগ্রী', 'বিবিধ টুকিটাকি']
};

export const DailyExpenseAddEditModal = ({
  isOpen,
  onClose,
  editingExpense = null,
  initialType = 'daily'
}) => {
  const {
    addPersonalExpense,
    updatePersonalExpense,
    personalEvents = [],
    addPersonalEvent,
    categories = {},
    addCategory,
    t,
    lang
  } = useApp();

  const [formData, setFormData] = useState({
    title: '',
    item: '',
    amount: '',
    category: 'bazaar',
    subCategory: 'কাঁচা শাকসবজি',
    quantity: '',
    unit: 'কেজি (kg)',
    familyMember: 'পুরো পরিবার (সবার জন্য)',
    purpose: 'নিত্যপ্রয়োজনীয় বাজার',
    folder: 'দৈনন্দিন বাজার খরচ',
    type: initialType || 'daily',
    eventId: '',
    date: new Date().toISOString().split('T')[0],
    note: ''
  });

  const [showUnitModal, setShowUnitModal] = useState(false);

  // Inline "Add New" states
  const [isAddingNewMember, setIsAddingNewMember] = useState(false);
  const [newMemberInput, setNewMemberInput] = useState('');
  const [isAddingNewSubCat, setIsAddingNewSubCat] = useState(false);
  const [newSubCatInput, setNewSubCatInput] = useState('');
  const [isAddingNewPurpose, setIsAddingNewPurpose] = useState(false);
  const [newPurposeInput, setNewPurposeInput] = useState('');
  const [isAddingNewFolder, setIsAddingNewFolder] = useState(false);
  const [newFolderInput, setNewFolderInput] = useState('');
  const [isAddingNewEvent, setIsAddingNewEvent] = useState(false);
  const [newEventInput, setNewEventInput] = useState('');
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');

  // Available Measurement Units from dynamic categories
  const availableUnits = categories.expenseUnits || [
    'গ্রাম (g)',
    'কেজি (kg)',
    'লিটার (L)',
    'মিলি (ml)',
    'ফুট (ft)',
    'ইঞ্চি (in)',
    'টিপ / ট্রিপ (Trip)',
    'অটো ভাড়া',
    'বস্তা (Bag)',
    'পিস (Pcs)',
    'ডজন (Dzn)',
    'প্যাকেট (Pkt)',
    'প্লেট / বাটি',
    'কাপ (Cup)',
    'মাসিক (Monthly)'
  ];

  // Available Family Members
  const availableMembers = categories.familyMembers || [
    'পুরো পরিবার (সবার জন্য)',
    'নিজে (Self)',
    'বাবা (Father)',
    'মা (Mother)',
    'স্ত্রী / স্বামী (Spouse)',
    'সন্তান (Child)'
  ];

  // Available Expense Purposes
  const availablePurposes = categories.expensePurposes || [
    'নিত্যপ্রয়োজনীয় বাজার',
    'অফিস যাতায়াত',
    'স্কুলে যাতায়াত',
    'টিউশন ফি',
    'চিকিৎসা ও ওষুধ',
    'মেহমানদারি ও অতিথি আপ্যায়ন',
    'জরুরি কেনাকাটা'
  ];

  // Available Family Folders
  const availableFolders = categories.familyExpenseFolders || [
    'দৈনন্দিন বাজার খরচ',
    'বাসা ভাড়া ও সার্ভিস চার্জ',
    'ইউটিলিটি ও বিল সমূহ',
    'চিকিৎসা ও ঔষধ খরচ',
    'শিক্ষা ও বইপত্র',
    'যাতায়াত ও ভ্রমণ',
    'অন্যান্য জরুরি খরচ'
  ];

  // Standard & Custom Categories
  const standardCategoryKeys = Object.keys(t.personal?.expenseCategories || {});
  const standardCategoryLabels = Object.values(t.personal?.expenseCategories || {});
  const customCategories = (categories.personalExpenseCategories || []).filter(
    cat => !standardCategoryKeys.includes(cat) && !standardCategoryLabels.includes(cat)
  );

  // Dynamic Sub-Categories
  const standardSubs = DEFAULT_CATEGORY_SUB_MAP[formData.category] || [];
  const customSubs = (categories.expenseSubCategories || []).filter(s => !standardSubs.includes(s));
  const activeSubCategories = [...standardSubs, ...customSubs];

  // Inline Handlers
  const handleAddNewEvent = (e) => {
    if (e) e.preventDefault();
    const cleanTitle = newEventInput.trim();
    if (!cleanTitle) return;
    const newEvent = addPersonalEvent({
      title: cleanTitle,
      category: 'পারিবারিক',
      budget: 0,
      startDate: formData.date || new Date().toISOString().split('T')[0]
    });
    if (newEvent && newEvent.id) {
      setFormData(prev => ({
        ...prev,
        eventId: newEvent.id
      }));
    }
    setNewEventInput('');
    setIsAddingNewEvent(false);
  };

  const handleAddNewCategory = (e) => {
    if (e) e.preventDefault();
    const cleanCat = newCategoryInput.trim();
    if (!cleanCat) return;
    addCategory('personalExpenseCategories', cleanCat);
    setFormData(prev => ({
      ...prev,
      category: cleanCat,
      subCategory: ''
    }));
    setNewCategoryInput('');
    setIsAddingNewCategory(false);
  };

  // Synchronize when modal opens or editingExpense changes
  useEffect(() => {
    if (isOpen) {
      if (editingExpense) {
        setFormData({
          title: editingExpense.title || editingExpense.item || '',
          item: editingExpense.item || editingExpense.title || '',
          amount: editingExpense.amount || '',
          category: editingExpense.category || 'bazaar',
          subCategory: editingExpense.subCategory || '',
          quantity: editingExpense.quantity || '',
          unit: editingExpense.unit || 'কেজি (kg)',
          familyMember: editingExpense.familyMember || availableMembers[0] || 'পুরো পরিবার (সবার জন্য)',
          purpose: editingExpense.purpose || '',
          folder: editingExpense.folder || availableFolders[0] || 'দৈনন্দিন বাজার খরচ',
          type: editingExpense.type || initialType || 'daily',
          eventId: editingExpense.eventId || '',
          date: editingExpense.date || new Date().toISOString().split('T')[0],
          note: editingExpense.note || ''
        });
      } else {
        setFormData({
          title: '',
          item: '',
          amount: '',
          category: initialType === 'family' ? 'rent' : 'bazaar',
          subCategory: (DEFAULT_CATEGORY_SUB_MAP[initialType === 'family' ? 'rent' : 'bazaar'] || [])[0] || '',
          quantity: '',
          unit: availableUnits[1] || 'কেজি (kg)',
          familyMember: availableMembers[0] || 'পুরো পরিবার (সবার জন্য)',
          purpose: availablePurposes[0] || 'নিত্যপ্রয়োজনীয় বাজার',
          folder: availableFolders[0] || 'দৈনন্দিন বাজার খরচ',
          type: initialType || 'daily',
          eventId: '',
          date: new Date().toISOString().split('T')[0],
          note: ''
        });
      }
      setIsAddingNewMember(false);
      setIsAddingNewSubCat(false);
      setIsAddingNewPurpose(false);
      setIsAddingNewFolder(false);
      setNewMemberInput('');
      setNewSubCatInput('');
      setNewPurposeInput('');
      setNewFolderInput('');
    }
  }, [isOpen, editingExpense, initialType]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.item && !formData.title) return;
    if (!formData.amount || Number(formData.amount) <= 0) return;

    const finalTitle = (formData.item || formData.title || '').trim();
    const finalAmount = Number(formData.amount) || 0;
    const linkedEvent = personalEvents.find(ev => ev.id === formData.eventId);

    const expensePayload = {
      title: finalTitle,
      item: finalTitle,
      amount: finalAmount,
      category: formData.category,
      subCategory: formData.subCategory || '',
      quantity: formData.quantity ? Number(formData.quantity) : null,
      unit: formData.quantity ? formData.unit : '',
      familyMember: formData.familyMember || '',
      purpose: formData.purpose || '',
      folder: formData.type === 'family' ? (formData.folder || 'পারিবারিক সাধারণ খরচ') : (formData.folder || 'দৈনন্দিন বাজার খরচ'),
      type: formData.type || 'daily',
      eventId: formData.eventId || '',
      eventName: linkedEvent ? linkedEvent.title : '',
      date: formData.date || new Date().toISOString().split('T')[0],
      note: (formData.note || '').trim()
    };

    if (editingExpense) {
      updatePersonalExpense(editingExpense.id, expensePayload);
    } else {
      addPersonalExpense(expensePayload);
    }

    onClose();
  };

  return (
    <>
      <div
        className="modal-overlay modal-backdrop modal-top-align"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1300,
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
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingCart size={20} style={{ color: '#10b981' }} />
              <span>
                {editingExpense
                  ? (lang === 'bn' ? 'খরচ পরিবর্তন / এডিট' : 'Edit Expense')
                  : (formData.type === 'family' ? t.personal.addFamilyExpense : t.personal.addDailyExpense)}
              </span>
            </h3>
            <button
              onClick={onClose}
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
                title: parsed.title || prev.title,
                item: parsed.title || prev.item,
                amount: parsed.amount ? String(parsed.amount) : prev.amount,
                category: parsed.category || prev.category,
                subCategory: parsed.subCategory || prev.subCategory,
                date: parsed.date || prev.date
              }));
            }}
          />

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* 1. Scope, Event & Folder */}
            <div
              style={{
                background: 'var(--bg-main)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <div style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Filter size={14} style={{ color: '#10b981' }} />
                <span>{lang === 'bn' ? '১. খরচের ক্ষেত্র ও ইভেন্ট নির্বাচন:' : '1. Scope & Event Selection:'}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '10px' }}>
                {/* Scope Type */}
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                    {lang === 'bn' ? 'খরচের প্রধান ধরন *' : 'Expense Type *'}
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    style={{ width: '100%', borderRadius: '6px', fontSize: '0.86rem' }}
                  >
                    <option value="daily">🛒 {lang === 'bn' ? 'দৈনন্দিন খরচ' : 'Daily Expense'}</option>
                    <option value="family">🏠 {lang === 'bn' ? 'পারিবারিক খরচ' : 'Family Expense'}</option>
                  </select>
                </div>

                {/* Linked Event Dropdown & Inline Add Button */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                      {lang === 'bn' ? 'ইভেন্ট / অনুষ্ঠান (ঐচ্ছিক)' : 'Event / Occasion'}
                    </label>
                    {!isAddingNewEvent && (
                      <button
                        type="button"
                        onClick={() => setIsAddingNewEvent(true)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#6366f1',
                          fontSize: '0.72rem',
                          fontWeight: '800',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                      >
                        + {lang === 'bn' ? 'নতুন ইভেন্ট' : 'New Event'}
                      </button>
                    )}
                  </div>

                  {isAddingNewEvent ? (
                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder={lang === 'bn' ? 'নতুন ইভেন্টের নাম লিখুন...' : 'New event title...'}
                        value={newEventInput}
                        onChange={(e) => setNewEventInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddNewEvent(e);
                          }
                        }}
                        autoFocus
                        style={{
                          flex: 1,
                          height: '32px',
                          padding: '0 8px',
                          fontSize: '0.82rem',
                          borderRadius: '6px',
                          border: '1.5px solid #6366f1',
                          background: 'var(--bg-main)',
                          color: 'var(--text-main)'
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddNewEvent}
                        style={{
                          padding: '0 10px',
                          height: '32px',
                          background: '#6366f1',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: '800',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        ✓ {lang === 'bn' ? 'যোগ' : 'Add'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingNewEvent(false);
                          setNewEventInput('');
                        }}
                        style={{
                          padding: '0 8px',
                          height: '32px',
                          background: 'var(--bg-main)',
                          color: 'var(--text-muted)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          cursor: 'pointer'
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div>
                      <select
                        value={formData.eventId}
                        onChange={(e) => {
                          if (e.target.value === '__add_new_event__') {
                            setIsAddingNewEvent(true);
                          } else {
                            setFormData({ ...formData, eventId: e.target.value });
                          }
                        }}
                        style={{ width: '100%', borderRadius: '6px', fontSize: '0.86rem', fontWeight: formData.eventId ? '700' : 'normal' }}
                      >
                        <option value="">{lang === 'bn' ? 'সাধারণ খরচ (কোনো ইভেন্ট নয়)' : 'General Expense (No Event)'}</option>
                        {personalEvents.map((evt) => (
                          <option key={evt.id} value={evt.id}>
                            🎯 {evt.title}
                          </option>
                        ))}
                        <option value="__add_new_event__" style={{ fontWeight: '800', color: '#6366f1' }}>
                          ➕ {lang === 'bn' ? 'নতুন ইভেন্ট তৈরি করুন...' : 'Add New Event...'}
                        </option>
                      </select>
                      <div style={{ marginTop: '3px' }}>
                        <button
                          type="button"
                          onClick={() => setIsAddingNewEvent(true)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#6366f1',
                            fontSize: '0.72rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            padding: '0',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                        >
                          + {lang === 'bn' ? 'নতুন ইভেন্ট যোগ করুন' : 'Add New Event'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* If Family Expense is selected: show Folder dropdown */}
              {formData.type === 'family' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                      {lang === 'bn' ? 'পারিবারিক ফোল্ডার *' : 'Family Folder *'}
                    </label>
                    {!isAddingNewFolder && (
                      <button
                        type="button"
                        onClick={() => setIsAddingNewFolder(true)}
                        style={{ background: 'transparent', border: 'none', color: '#ea580c', fontSize: '0.72rem', fontWeight: '800', cursor: 'pointer' }}
                      >
                        + {lang === 'bn' ? 'নতুন ফোল্ডার' : 'New Folder'}
                      </button>
                    )}
                  </div>

                  {isAddingNewFolder ? (
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder={lang === 'bn' ? 'নতুন ফোল্ডারের নাম...' : 'New folder name...'}
                        value={newFolderInput}
                        onChange={(e) => setNewFolderInput(e.target.value)}
                        autoFocus
                        style={{ flex: 1, height: '34px', fontSize: '0.82rem' }}
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
                        style={{ background: '#ea580c', color: '#fff', border: 'none', borderRadius: '6px', padding: '0 10px', height: '34px', fontWeight: '800', cursor: 'pointer' }}
                      >
                        ✓
                      </button>
                      <button
                        type="button"
                        onClick={() => { setIsAddingNewFolder(false); setNewFolderInput(''); }}
                        style={{ background: 'var(--bg-main)', color: 'var(--text-muted)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0 8px', height: '34px', cursor: 'pointer' }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <select
                      value={formData.folder}
                      onChange={(e) => setFormData({ ...formData, folder: e.target.value })}
                      style={{ width: '100%', borderRadius: '6px', fontSize: '0.86rem' }}
                    >
                      {availableFolders.map((f) => (
                        <option key={f} value={f}>
                          📁 {f}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>

            {/* 2. Item Name */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '700', margin: 0, color: 'var(--text-main)' }}>
                  {lang === 'bn' ? 'কি কিনলেন / খরচের বিবরণ *' : 'Item / Expense Description *'}
                </label>
                <VoiceInputButton
                  onTranscript={(txt) => setFormData(prev => ({ ...prev, item: txt, title: txt }))}
                  title="মুখে বলুন খরচের বিবরণ"
                />
              </div>
              <input
                type="text"
                required
                className="input-field"
                placeholder={formData.type === 'family' ? (lang === 'bn' ? 'যেমন: বাসা ভাড়া, বিদ্যুৎ বিল, গ্যাস বিল...' : 'e.g. House Rent, Electricity Bill...') : (lang === 'bn' ? 'যেমন: তীর সয়াবিন তেল, ডিম, আলু, নাস্তা, অটো ভাড়া...' : 'e.g. Cooking Oil, Eggs, Potatoes, Auto Fare...')}
                value={formData.item}
                onChange={(e) => setFormData({ ...formData, item: e.target.value, title: e.target.value })}
                style={{ width: '100%', borderRadius: '8px' }}
              />
            </div>

            {/* 3. Quantity & Unit */}
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
                  onClick={() => setShowUnitModal(true)}
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
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                    {lang === 'bn' ? 'পরিমাণ (সংখ্যা)' : 'Quantity'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder={lang === 'bn' ? 'যেমন: ৫০০ বা ৫ বা ১' : 'e.g. 500, 5, 1'}
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

                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                    {lang === 'bn' ? 'পরিমাপের একক' : 'Unit'}
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => {
                      if (e.target.value === '__add_new__') {
                        setShowUnitModal(true);
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

            {/* 4. Amount & Category */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-main)' }}>
                  {t.amount} (৳) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  className="input-field"
                  placeholder="০"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  style={{ width: '100%', borderRadius: '8px', fontSize: '1.05rem', fontWeight: '800' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', margin: 0, color: 'var(--text-main)' }}>
                    {t.category} *
                  </label>
                  {!isAddingNewCategory && (
                    <button
                      type="button"
                      onClick={() => setIsAddingNewCategory(true)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--personal-primary, #10b981)',
                        fontSize: '0.74rem',
                        fontWeight: '800',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}
                    >
                      + {lang === 'bn' ? 'নতুন ক্যাটাগরি' : 'New Category'}
                    </button>
                  )}
                </div>

                {isAddingNewCategory ? (
                  <div style={{ display: 'flex', gap: '5px', alignItems: 'center', marginTop: '2px' }}>
                    <input
                      type="text"
                      placeholder={lang === 'bn' ? 'নতুন ক্যাটাগরির নাম লিখুন...' : 'New category name...'}
                      value={newCategoryInput}
                      onChange={(e) => setNewCategoryInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddNewCategory(e);
                        }
                      }}
                      autoFocus
                      style={{
                        flex: 1,
                        height: '38px',
                        padding: '0 10px',
                        fontSize: '0.86rem',
                        borderRadius: '6px',
                        border: '1.5px solid var(--personal-primary, #10b981)',
                        background: 'var(--bg-main)',
                        color: 'var(--text-main)'
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddNewCategory}
                      style={{
                        height: '38px',
                        padding: '0 12px',
                        background: 'var(--personal-primary, #10b981)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: '800',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      ✓ {lang === 'bn' ? 'যোগ' : 'Add'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingNewCategory(false);
                        setNewCategoryInput('');
                      }}
                      style={{
                        height: '38px',
                        padding: '0 10px',
                        background: 'var(--bg-main)',
                        color: 'var(--text-muted)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div>
                    <select
                      className="select-field"
                      value={formData.category}
                      onChange={(e) => {
                        if (e.target.value === '__add_new_category__') {
                          setIsAddingNewCategory(true);
                        } else {
                          const newCat = e.target.value;
                          setFormData({
                            ...formData,
                            category: newCat,
                            subCategory: (DEFAULT_CATEGORY_SUB_MAP[newCat] || [])[0] || ''
                          });
                        }
                      }}
                      style={{ width: '100%', borderRadius: '8px' }}
                    >
                      <optgroup label={lang === 'bn' ? 'স্ট্যান্ডার্ড ক্যাটাগরি' : 'Standard Categories'}>
                        {Object.entries(t.personal.expenseCategories).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </optgroup>
                      {customCategories.length > 0 && (
                        <optgroup label={lang === 'bn' ? 'নতুন ও কাস্টম ক্যাটাগরি' : 'Custom Categories'}>
                          {customCategories.map((cat) => (
                            <option key={cat} value={cat}>🏷️ {cat}</option>
                          ))}
                        </optgroup>
                      )}
                      <option value="__add_new_category__" style={{ fontWeight: '800', color: 'var(--personal-primary, #10b981)' }}>
                        ➕ {lang === 'bn' ? 'নতুন ক্যাটাগরি যোগ করুন...' : 'Add New Category...'}
                      </option>
                    </select>

                    {/* Directly below the category dropdown */}
                    <div style={{ marginTop: '5px' }}>
                      <button
                        type="button"
                        onClick={() => setIsAddingNewCategory(true)}
                        style={{
                          background: 'rgba(16, 185, 129, 0.08)',
                          border: '1px dashed var(--personal-primary, #10b981)',
                          borderRadius: '6px',
                          color: 'var(--personal-primary, #10b981)',
                          padding: '5px 10px',
                          fontSize: '0.76rem',
                          fontWeight: '800',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          width: '100%',
                          justifyContent: 'center'
                        }}
                      >
                        + {lang === 'bn' ? 'নতুন ক্যাটাগরি যোগ করুন' : 'Add New Category'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 5. Sub-Category */}
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
                  <span>{lang === 'bn' ? 'সাব-ক্যাটাগরি (নির্দিষ্ট ধরন):' : 'Sub-Category:'}</span>
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
                    placeholder={lang === 'bn' ? 'নতুন সাব-ক্যাটাগরি (যেমন: বাস ভাড়া)...' : 'Sub-category name...'}
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
                    style={{ width: '100%', borderRadius: '6px', fontSize: '0.86rem', marginBottom: '8px' }}
                  >
                    <option value="">{lang === 'bn' ? '-- সাব-ক্যাটাগরি বেছে নিন --' : '-- Select Sub-Category --'}</option>
                    {activeSubCategories.map((sub) => (
                      <option key={sub} value={sub}>
                        🔀 {sub}
                      </option>
                    ))}
                    <option value="__add_new__" style={{ fontWeight: '800', color: '#0ea5e9' }}>
                      ➕ {lang === 'bn' ? 'নতুন সাব-ক্যাটাগরি যোগ করুন...' : 'Add New Sub-Category...'}
                    </option>
                  </select>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {activeSubCategories.slice(0, 8).map((sub, idx) => (
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

            {/* 6. Family Member & Purpose */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
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
                      className="input-field"
                      placeholder="যেমন: রোহান..."
                      value={newMemberInput}
                      onChange={(e) => setNewMemberInput(e.target.value)}
                      autoFocus
                      style={{ flex: 1, height: '34px', fontSize: '0.82rem' }}
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
                      style={{ background: 'var(--bg-main)', color: 'var(--text-muted)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0 6px', height: '34px', cursor: 'pointer' }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <select
                    value={formData.familyMember || (availableMembers[0] || 'নিজে (Self)')}
                    onChange={(e) => {
                      if (e.target.value === '__add_new__') {
                        setIsAddingNewMember(true);
                      } else {
                        setFormData({ ...formData, familyMember: e.target.value });
                      }
                    }}
                    style={{ width: '100%', borderRadius: '8px', fontSize: '0.85rem' }}
                  >
                    {availableMembers.map((m) => (
                      <option key={m} value={m}>
                        👤 {m}
                      </option>
                    ))}
                    <option value="__add_new__" style={{ fontWeight: '800', color: '#059669' }}>
                      ➕ {lang === 'bn' ? 'নতুন সদস্য যোগ...' : 'Add Member...'}
                    </option>
                  </select>
                )}
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Compass size={13} style={{ color: '#d97706' }} />
                    <span>{lang === 'bn' ? 'উদ্দেশ্য / খাত' : 'Purpose / Tag'}</span>
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
                      className="input-field"
                      placeholder="যেমন: স্কুলে যাতায়াত..."
                      value={newPurposeInput}
                      onChange={(e) => setNewPurposeInput(e.target.value)}
                      autoFocus
                      style={{ flex: 1, height: '34px', fontSize: '0.82rem' }}
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
                      style={{ background: 'var(--bg-main)', color: 'var(--text-muted)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0 6px', height: '34px', cursor: 'pointer' }}
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
                    style={{ width: '100%', borderRadius: '8px', fontSize: '0.85rem' }}
                  >
                    <option value="">{lang === 'bn' ? '-- উদ্দেশ্য বেছে নিন --' : '-- Select Purpose --'}</option>
                    {availablePurposes.map((p) => (
                      <option key={p} value={p}>
                        🎯 {p}
                      </option>
                    ))}
                    <option value="__add_new__" style={{ fontWeight: '800', color: '#d97706' }}>
                      ➕ {lang === 'bn' ? 'নতুন উদ্দেশ্য যোগ...' : 'Add Purpose...'}
                    </option>
                  </select>
                )}
              </div>
            </div>

            {/* 7. Date & Note */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-main)' }}>
                {t.date}
              </label>
              <input
                type="date"
                className="input-field"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                style={{ width: '100%', borderRadius: '8px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-main)' }}>
                {t.note}
              </label>
              <input
                type="text"
                className="input-field"
                placeholder={lang === 'bn' ? 'স্থান বা অতিরিক্ত বিবরণ বা ভাউচার নম্বর...' : 'Location, voucher or notes...'}
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                style={{ width: '100%', borderRadius: '8px' }}
              />
            </div>

            {/* Submit / Cancel Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={onClose}
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
                {t.cancel}
              </button>
              <button
                type="submit"
                style={{
                  padding: '9px 24px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
                }}
              >
                {editingExpense
                  ? (lang === 'bn' ? 'আপডেট করুন' : 'Update Expense')
                  : t.save}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Embedded Units Manager Modal */}
      <CategoryManagerModal
        isOpen={showUnitModal}
        onClose={() => setShowUnitModal(false)}
        defaultGroup="expenseUnits"
      />
    </>
  );
};

export default DailyExpenseAddEditModal;
