import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  INDUSTRY_SECTORS,
  MASTER_INDUSTRY_TEMPLATES
} from '../../data/industryTemplates';
import {
  Sparkles,
  Search,
  CheckCircle2,
  X,
  Layers,
  Check,
  Eye,
  Sliders,
  Package,
  Boxes,
  ArrowRight,
  Store,
  Tag,
  ShieldCheck,
  Info,
  ChevronRight,
  Plus,
  Trash2
} from 'lucide-react';

export const TemplateReviewModal = ({ isOpen, onClose }) => {
  const {
    activeIndustryId,
    switchIndustryTemplate,
    lang,
    showToast
  } = useApp();

  const [selectedSector, setSelectedSector] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(() => {
    return MASTER_INDUSTRY_TEMPLATES.find(t => t.id === activeIndustryId) || MASTER_INDUSTRY_TEMPLATES[0];
  });

  // Customization state for currently reviewed template
  const [activeFeatures, setActiveFeatures] = useState({});
  const [customUnits, setCustomUnits] = useState([]);
  const [customCategories, setCustomCategories] = useState([]);
  const [newUnitInput, setNewUnitInput] = useState('');
  const [newCatInput, setNewCatInput] = useState('');

  // Sync features when selecting a template
  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    const initialFeats = {};
    (template.features || []).forEach(f => {
      initialFeats[f] = true;
    });
    setActiveFeatures(initialFeats);
    setCustomUnits([...(template.units || [])]);
    setCustomCategories([...(template.defaultCategories || [])]);
  };

  // Toggle a feature
  const handleToggleFeature = (featKey) => {
    setActiveFeatures(prev => ({
      ...prev,
      [featKey]: !prev[featKey]
    }));
  };

  // Add unit
  const handleAddUnit = () => {
    if (!newUnitInput.trim()) return;
    if (!customUnits.includes(newUnitInput.trim())) {
      setCustomUnits(prev => [...prev, newUnitInput.trim()]);
    }
    setNewUnitInput('');
  };

  // Remove unit
  const handleRemoveUnit = (unit) => {
    setCustomUnits(prev => prev.filter(u => u !== unit));
  };

  // Add category
  const handleAddCategory = () => {
    if (!newCatInput.trim()) return;
    if (!customCategories.includes(newCatInput.trim())) {
      setCustomCategories(prev => [...prev, newCatInput.trim()]);
    }
    setNewCatInput('');
  };

  // Remove category
  const handleRemoveCategory = (cat) => {
    setCustomCategories(prev => prev.filter(c => c !== cat));
  };

  // Activate & apply template to the whole app
  const handleApplyTemplate = () => {
    if (!selectedTemplate) return;
    switchIndustryTemplate(selectedTemplate.id);
    showToast(
      lang === 'bn'
        ? `🎉 "${selectedTemplate.name}" টেমপ্লেটটি সফলভাবে সক্রিয় করা হয়েছে!`
        : `🎉 "${selectedTemplate.enName}" template activated successfully!`,
      'success'
    );
    onClose();
  };

  // Filter templates list
  const filteredTemplates = useMemo(() => {
    return MASTER_INDUSTRY_TEMPLATES.filter(tpl => {
      const matchSector = selectedSector === 'all' || tpl.sectorId === selectedSector;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q ||
        tpl.name.toLowerCase().includes(q) ||
        (tpl.enName && tpl.enName.toLowerCase().includes(q)) ||
        (tpl.units && tpl.units.some(u => u.toLowerCase().includes(q))) ||
        (tpl.defaultCategories && tpl.defaultCategories.some(c => c.toLowerCase().includes(q)));
      return matchSector && matchSearch;
    });
  }, [selectedSector, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay animate-fade-in" style={{ zIndex: 1300 }}>
      <div
        className="glass-card modal-container"
        style={{
          maxWidth: '1150px',
          width: '96%',
          height: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          borderRadius: '20px',
          overflow: 'hidden',
          background: 'var(--bg-primary)'
        }}
      >
        {/* Top Header */}
        <div
          style={{
            padding: '1.2rem 1.75rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.1), rgba(16, 185, 129, 0.05))'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
              }}
            >
              <Store size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{lang === 'bn' ? 'ইন্ডাস্ট্রি টেমপ্লেট রিভিউ ও কাস্টমাইজার' : 'Industry Template Reviewer & Studio'}</span>
                <span className="badge" style={{ fontSize: '0.72rem', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                  ১০০+ টেমপ্লেট প্রস্তুত
                </span>
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {lang === 'bn'
                  ? 'প্রতিটি ইন্ডাস্ট্রির ফিচার, ক্যাটাগরি, পরিমাপের ইউনিট ও স্যাম্পল প্রোডাক্ট রিভিউ করুন এবং প্রয়োজন অনুযায়ী কাস্টমাইজ করুন'
                  : 'Review and customize features, categories, measurement units and sample products for each industry'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleApplyTemplate}
              className="btn btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                fontSize: '0.88rem',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                boxShadow: '0 4px 16px rgba(16, 185, 129, 0.35)'
              }}
            >
              <Check size={16} />
              <span>{lang === 'bn' ? 'এই টেমপ্লেট সক্রিয় করুন' : 'Activate Template'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-icon"
              style={{ padding: '6px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.05)' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Main 2-Column Body */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          
          {/* Left Column: Template Selector List */}
          <div
            style={{
              width: '340px',
              borderRight: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--bg-secondary)',
              minWidth: '300px'
            }}
          >
            {/* Search Box */}
            <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder={lang === 'bn' ? 'টেমপ্লেট খুঁজুন...' : 'Search templates...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '32px', fontSize: '0.82rem', padding: '6px 10px 6px 32px' }}
                />
              </div>

              {/* Sector Filter Dropdown */}
              <div style={{ marginTop: '8px' }}>
                <select
                  value={selectedSector}
                  onChange={(e) => setSelectedSector(e.target.value)}
                  className="select-field"
                  style={{ fontSize: '0.78rem', padding: '6px 8px' }}
                >
                  <option value="all">🌐 সব সেক্টর ({MASTER_INDUSTRY_TEMPLATES.length}টি টেমপ্লেট)</option>
                  {INDUSTRY_SECTORS.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Template Items List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {filteredTemplates.map((tpl) => {
                  const isCurrentActive = tpl.id === activeIndustryId;
                  const isSelected = selectedTemplate?.id === tpl.id;
                  const sector = INDUSTRY_SECTORS.find(s => s.id === tpl.sectorId);

                  return (
                    <div
                      key={tpl.id}
                      onClick={() => handleSelectTemplate(tpl)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                        background: isSelected
                          ? 'rgba(99, 102, 241, 0.15)'
                          : (isCurrentActive ? 'rgba(16, 185, 129, 0.08)' : 'transparent'),
                        border: isSelected
                          ? '1.5px solid #6366f1'
                          : (isCurrentActive ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid transparent'),
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: isSelected ? '800' : '600', color: isSelected ? 'var(--text-main)' : 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {tpl.name}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: sector?.color || 'var(--text-dim)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>{sector?.name?.split(' ')[0] || 'ব্যবসা'}</span>
                          {isCurrentActive && (
                            <span className="badge" style={{ fontSize: '0.62rem', padding: '1px 5px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>
                              চলতি
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight size={14} style={{ color: isSelected ? '#6366f1' : 'var(--text-dim)', opacity: isSelected ? 1 : 0.4 }} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Template Detailed Inspector & Customizer */}
          {selectedTemplate && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Template Title Banner */}
              <div
                style={{
                  padding: '1.25rem',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(16, 185, 129, 0.06))',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#6366f1', fontSize: '0.75rem', fontWeight: '700' }}>
                      ID: {selectedTemplate.id}
                    </span>
                    <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontSize: '0.75rem' }}>
                      UI মোড: {selectedTemplate.uiMode || 'retail'}
                    </span>
                    <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontSize: '0.75rem' }}>
                      POS ভিউ: {selectedTemplate.posViewMode || 'grid'}
                    </span>
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)' }}>
                    {selectedTemplate.name}
                  </h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {selectedTemplate.enName}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {activeIndustryId === selectedTemplate.id ? (
                    <span
                      style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: '#10b981',
                        fontWeight: '800',
                        fontSize: '0.8rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <CheckCircle2 size={16} />
                      <span>বর্তমানে সক্রিয় আছে</span>
                    </span>
                  ) : (
                    <button
                      onClick={handleApplyTemplate}
                      className="btn btn-primary"
                      style={{
                        padding: '8px 16px',
                        fontSize: '0.85rem',
                        fontWeight: '800',
                        background: 'linear-gradient(135deg, #6366f1, #4f46e5)'
                      }}
                    >
                      সুইচ করুন
                    </button>
                  )}
                </div>
              </div>

              {/* 1. Features Checklist (কী লাগবে, কী লাগবে না) */}
              <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Sliders size={18} style={{ color: '#6366f1' }} />
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)' }}>
                    ১. মডিউল ও ফিচারসমূহ (কী লাগবে, কী লাগবে না কাস্টমাইজ করুন)
                  </h4>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
                  {[
                    { key: 'table_system', label: 'টেবিল ও ডাইন-ইন ট্র্যাকিং', en: 'Table & Dine-in' },
                    { key: 'kot_kitchen', label: 'কেচেন অর্ডার টিকেট (KOT)', en: 'Kitchen Order Ticket' },
                    { key: 'variants_sizes', label: 'সাইজ ও ভ্যারিয়েন্ট (ফুল/হাফ/রং)', en: 'Variants & Sizes' },
                    { key: 'waiter_tracking', label: 'ওয়েটার ও স্টাফ অ্যাসাইনমেন্ট', en: 'Waiter Tracking' },
                    { key: 'batch_tracking', label: 'ব্যাচ নম্বর ও লট ট্র্যাকিং', en: 'Batch / Lot Tracking' },
                    { key: 'expiry_tracking', label: 'মেয়াদোত্তীর্ণ (FEFO) সতর্কতা', en: 'Expiry & FEFO Alert' },
                    { key: 'warranty_imei', label: 'ওয়ারেন্টি ও সিরিয়াল/IMEI', en: 'Serial & IMEI Warranty' },
                    { key: 'weight_scale', label: 'ডিজিটাল ওজন স্কেল সিঙ্ক', en: 'Digital Weighing Scale' },
                    { key: 'barcode_quick', label: 'দ্রুত বারকোড স্ক্যানার মোড', en: 'Rapid Barcode Scanning' },
                    { key: 'soundbox_voice', label: 'ভয়েস সাউন্ডবক্স পেমেন্ট নোটিফিকেশন', en: 'Voice Soundbox Chime' },
                    { key: 'lims_lab', label: 'ডায়াগনস্টিক ও ল্যাব অর্ডার', en: 'LIMS & Lab Testing' },
                    { key: 'delivery_shipping', label: 'হোম ডেলিভারি ও কুরিয়ার ট্র্যাকিং', en: 'Home Delivery & Courier' }
                  ].map((feat) => {
                    const isSupportedByDefault = (selectedTemplate.features || []).includes(feat.key);
                    const isChecked = activeFeatures[feat.key] ?? isSupportedByDefault;

                    return (
                      <label
                        key={feat.key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 12px',
                          borderRadius: '10px',
                          background: isChecked ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                          border: isChecked ? '1.5px solid rgba(99, 102, 241, 0.4)' : '1px solid var(--border-color)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleFeature(feat.key)}
                          style={{ width: '16px', height: '16px', accentColor: '#6366f1' }}
                        />
                        <div>
                          <div style={{ fontSize: '0.82rem', fontWeight: '700', color: isChecked ? 'var(--text-main)' : 'var(--text-muted)' }}>
                            {feat.label}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                            {feat.en}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* 2. Units of Measurement (পরিমাপের একক) */}
              <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Package size={18} style={{ color: '#10b981' }} />
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)' }}>
                      ২. পরিমাপের একক (Units)
                    </h4>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    মোট: {customUnits.length}টি ইউনিট
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                  {customUnits.map((unit) => (
                    <span
                      key={unit}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        color: '#10b981',
                        fontSize: '0.82rem',
                        fontWeight: '700',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>{unit}</span>
                      <X
                        size={12}
                        onClick={() => handleRemoveUnit(unit)}
                        style={{ cursor: 'pointer', opacity: 0.7 }}
                      />
                    </span>
                  ))}
                </div>

                {/* Add Unit Input */}
                <div style={{ display: 'flex', gap: '8px', maxWidth: '320px' }}>
                  <input
                    type="text"
                    placeholder="নতুন ইউনিট লিখুন (যেমন: ড্রাম, ক্যান)..."
                    value={newUnitInput}
                    onChange={(e) => setNewUnitInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddUnit()}
                    className="input-field"
                    style={{ fontSize: '0.82rem', padding: '6px 10px' }}
                  />
                  <button
                    type="button"
                    onClick={handleAddUnit}
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.8rem', fontWeight: '700' }}
                  >
                    <Plus size={14} />
                    <span>যোগ</span>
                  </button>
                </div>
              </div>

              {/* 3. Default Product Categories (পণ্যের ক্যাটাগরি) */}
              <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Tag size={18} style={{ color: '#f59e0b' }} />
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)' }}>
                      ৩. ডিফল্ট পণ্য ক্যাটাগরি (Categories)
                    </h4>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    মোট: {customCategories.length}টি ক্যাটাগরি
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                  {customCategories.map((cat) => (
                    <span
                      key={cat}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        background: 'rgba(245, 158, 11, 0.1)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        color: '#f59e0b',
                        fontSize: '0.82rem',
                        fontWeight: '700',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>{cat}</span>
                      <X
                        size={12}
                        onClick={() => handleRemoveCategory(cat)}
                        style={{ cursor: 'pointer', opacity: 0.7 }}
                      />
                    </span>
                  ))}
                </div>

                {/* Add Category Input */}
                <div style={{ display: 'flex', gap: '8px', maxWidth: '340px' }}>
                  <input
                    type="text"
                    placeholder="নতুন ক্যাটাগরি লিখুন..."
                    value={newCatInput}
                    onChange={(e) => setNewCatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                    className="input-field"
                    style={{ fontSize: '0.82rem', padding: '6px 10px' }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.8rem', fontWeight: '700' }}
                  >
                    <Plus size={14} />
                    <span>যোগ</span>
                  </button>
                </div>
              </div>

              {/* 4. Sample Products Preview (ডেমো পণ্য তালিকা) */}
              <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Boxes size={18} style={{ color: '#06b6d4' }} />
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)' }}>
                      ৪. স্যাম্পল প্রোডাক্ট তালিকা ({selectedTemplate.sampleProducts?.length || 0} টি)
                    </h4>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
                  {(selectedTemplate.sampleProducts || []).map((p, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '10px',
                        borderRadius: '12px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        gap: '10px',
                        alignItems: 'center'
                      }}
                    >
                      <div
                        style={{
                          width: '54px',
                          height: '54px',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          overflow: 'hidden',
                          flexShrink: 0
                        }}
                      >
                        {p.image ? (
                          <img
                            src={p.image}
                            alt={p.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                            📦
                          </div>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          ক্যাটাগরি: {p.category}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                            ৳{p.sellPrice} <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>/{p.unit}</span>
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                            স্টক: {p.stock}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
