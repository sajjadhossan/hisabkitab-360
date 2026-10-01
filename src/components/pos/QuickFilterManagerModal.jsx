import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  RotateCcw,
  Tag,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const QuickFilterManagerModal = ({
  isOpen,
  onClose,
  quickFilters,
  onSaveFilters,
  onResetDefaults,
  lang = 'bn'
}) => {
  const [filtersList, setFiltersList] = useState(quickFilters || []);
  const [newLabel, setNewLabel] = useState('');
  const [newIcon, setNewIcon] = useState('🏷️');
  const [newKeywords, setNewKeywords] = useState('');
  const [newSubFilters, setNewSubFilters] = useState('');
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'add'

  const emojiPresets = ['🏷️', '🛢️', '🍚', '🫘', '🥛', '🥤', '🧂', '🍪', '🧴', '🥩', '🐟', '🍎', '👕', '📱', '💊', '🎁', '⭐', '🔥'];

  if (!isOpen) return null;

  const handleDeleteFilter = (filterId) => {
    if (filterId === 'all') return;
    if (window.confirm(lang === 'bn' ? 'আপনি কি এই ফিল্টার শর্টকাটটি মুছে ফেলতে চান?' : 'Delete this filter shortcut?')) {
      const updated = filtersList.filter(f => f.id !== filterId);
      setFiltersList(updated);
      onSaveFilters(updated);
    }
  };

  const handleAddNewFilter = (e) => {
    e.preventDefault();
    if (!newLabel.trim()) return;

    const keywordsArray = newKeywords
      .split(',')
      .map(k => k.trim().toLowerCase())
      .filter(Boolean);

    const subFiltersArray = newSubFilters
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .map(s => ({
        label: s,
        keyword: s.toLowerCase()
      }));

    const newFilter = {
      id: `filter-${Date.now()}`,
      label: newLabel.trim(),
      enLabel: newLabel.trim(),
      icon: newIcon || '🏷️',
      keywords: keywordsArray.length > 0 ? keywordsArray : [newLabel.trim().toLowerCase()],
      subFilters: subFiltersArray.length > 0 ? [
        { label: lang === 'bn' ? `সব ${newLabel.trim()}` : `All ${newLabel.trim()}`, keyword: '' },
        ...subFiltersArray
      ] : []
    };

    const updated = [...filtersList, newFilter];
    setFiltersList(updated);
    onSaveFilters(updated);

    // Reset inputs
    setNewLabel('');
    setNewKeywords('');
    setNewSubFilters('');
    setActiveTab('list');
  };

  const handleResetToDefault = () => {
    if (window.confirm(lang === 'bn' ? 'আপনি কি সকল কাস্টম ফিল্টার মুছে মূল ডিফল্ট তালিকায় ফিরে যেতে চান?' : 'Reset all shortcuts to defaults?')) {
      onResetDefaults();
      onClose();
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1200 }}>
      <div className="modal-content animate-fade-in" style={{ maxWidth: '620px', width: '95%', padding: '1.5rem' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
              <Layers size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>
                {lang === 'bn' ? 'পিওএস মাল্টি-লেয়ার ফিল্টার ও শর্টকাট ম্যানেজার' : 'POS Multi-Layer Filter Manager'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                {lang === 'bn' ? 'ক্যাশ কাউন্টারের জন্য প্রয়োজনীয় পণ্যের কুইক বাটন যোগ, এডিট বা ডিলিট করুন' : 'Customize top quick filter buttons and sub-layers'}
              </p>
            </div>
          </div>

          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Tab Controls */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem' }}>
          <button
            type="button"
            className={`btn ${activeTab === 'list' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('list')}
            style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem', fontWeight: '700' }}
          >
            📋 {lang === 'bn' ? `বর্তমান ফিল্টার তালিকা (${filtersList.length})` : `Active Filters (${filtersList.length})`}
          </button>
          <button
            type="button"
            className={`btn ${activeTab === 'add' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('add')}
            style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem', fontWeight: '700', background: activeTab === 'add' ? '#10b981' : undefined, borderColor: activeTab === 'add' ? '#10b981' : undefined }}
          >
            <Plus size={16} />
            <span>{lang === 'bn' ? '➕ নতুন শর্টকাট যোগ করুন' : '➕ Add New Filter'}</span>
          </button>
        </div>

        {/* TAB 1: LIST ACTIVE SHORTCUTS */}
        {activeTab === 'list' && (
          <div>
            <div style={{ maxHeight: '360px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px', marginBottom: '1.25rem' }}>
              {filtersList.map((item, index) => {
                const isSystemAll = item.id === 'all';
                return (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '1.4rem' }}>{item.icon || '🏷️'}</span>
                      <div>
                        <div style={{ fontWeight: '800', fontSize: '0.92rem', color: 'var(--text-main)' }}>
                          {item.label}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
                          <span>কীওয়ার্ড: {item.keywords?.length > 0 ? item.keywords.slice(0, 3).join(', ') : 'সকল পণ্য'}</span>
                          {item.subFilters?.length > 0 && (
                            <span style={{ color: '#10b981', fontWeight: '600' }}>
                              • {item.subFilters.length}টি সাব-কোম্পানি/ব্র্যান্ড ফিল্টার
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      {isSystemAll ? (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }}>
                          ডিফল্ট
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => handleDeleteFilter(item.id)}
                          title={lang === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
                          style={{ color: '#ef4444' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleResetToDefault}
                style={{ fontSize: '0.78rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <RotateCcw size={14} />
                <span>{lang === 'bn' ? 'মূল ডিফল্ট ফিল্টারে রিসেট করুন' : 'Reset to Default Shortcuts'}</span>
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={onClose}
                style={{ padding: '8px 20px', fontWeight: '800' }}
              >
                {lang === 'bn' ? 'সম্পন্ন' : 'Done'}
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: ADD NEW SHORTCUT */}
        {activeTab === 'add' && (
          <form onSubmit={handleAddNewFilter}>
            {/* Label */}
            <div style={{ marginBottom: '1rem' }}>
              <label className="field-label" style={{ fontWeight: '700' }}>
                {lang === 'bn' ? 'ফিল্টার / শর্টকাটের নাম:' : 'Filter Label / Button Name:'} <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                required
                className="input-field"
                placeholder={lang === 'bn' ? 'যেমন: পানীয় ও জুস, আড়ং দুধ, রমজান স্পেশাল, ৫ লিটার তেল' : 'e.g. Cold Drinks, Aarong Milk, 5L Oil'}
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                autoFocus
              />
            </div>

            {/* Icon Picker */}
            <div style={{ marginBottom: '1rem' }}>
              <label className="field-label" style={{ fontWeight: '700' }}>
                {lang === 'bn' ? 'আইকন নির্বাচন করুন:' : 'Choose Emoji Icon:'}
              </label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                {emojiPresets.map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setNewIcon(em)}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      fontSize: '1.2rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: newIcon === em ? '2px solid var(--business-primary)' : '1px solid var(--border-color)',
                      background: newIcon === em ? 'rgba(99, 102, 241, 0.2)' : 'var(--bg-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>

            {/* Matching Keywords */}
            <div style={{ marginBottom: '1rem' }}>
              <label className="field-label" style={{ fontWeight: '700' }}>
                {lang === 'bn' ? 'পণ্যের নাম বা ক্যাটাগরির সাথে মেলাতে শব্দসমূহ (কমা দিয়ে লিখুন):' : 'Matching Keywords (comma separated):'}
              </label>
              <input
                type="text"
                className="input-field"
                placeholder={lang === 'bn' ? 'যেমন: দুধ, milk, দই, আড়ং' : 'e.g. milk, aarong, curd'}
                value={newKeywords}
                onChange={(e) => setNewKeywords(e.target.value)}
              />
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                {lang === 'bn' ? 'পণ্য বা ক্যাটাগরির নামের মধ্যে এই শব্দগুলো থাকলে তা এই বাটনে ক্লিক করলেই চলে আসবে' : 'Products matching any of these keywords will be displayed'}
              </div>
            </div>

            {/* Sub-Filters / Companies / Brands */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label className="field-label" style={{ fontWeight: '700' }}>
                {lang === 'bn' ? '২য় লেয়ারের সাব-ফিল্টার বা কোম্পানি তালিকা (কমা দিয়ে লিখুন, ঐচ্ছিক):' : 'Layer 2 Sub-Filters or Companies (comma separated, optional):'}
              </label>
              <input
                type="text"
                className="input-field"
                placeholder={lang === 'bn' ? 'যেমন: রূপচাঁদা, তীর, ফ্রেশ, বসুন্ধরা, প্রাণ' : 'e.g. Rupchanda, Teer, Fresh, Pran'}
                value={newSubFilters}
                onChange={(e) => setNewSubFilters(e.target.value)}
              />
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                {lang === 'bn' ? '১ম লেয়ার সিলেক্ট করার পর নিচে ২য় লেয়ারে এই সাব-বাটনগুলো আসবে' : 'These buttons will appear in Layer 2 below the main filter'}
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 1, background: '#10b981', borderColor: '#10b981', fontWeight: '800' }}
              >
                <Plus size={16} />
                <span>{lang === 'bn' ? 'ফিল্টারটি সংরক্ষণ করুন' : 'Save Filter'}</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setActiveTab('list')}
              >
                {lang === 'bn' ? 'ফিরে যান' : 'Back'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
