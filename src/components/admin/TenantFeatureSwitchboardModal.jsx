import React, { useState, useMemo } from 'react';
import {
  X,
  Check,
  Search,
  ShieldCheck,
  Sliders,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Store,
  Boxes,
  HandCoins,
  Truck,
  Users,
  UtensilsCrossed,
  Building2,
  Crown,
  Smartphone,
  Layers,
  AlertCircle,
  HelpCircle,
  Save,
  RotateCcw
} from 'lucide-react';
import {
  MASTER_FEATURE_CATEGORIES,
  MASTER_FEATURE_REGISTRY,
  SUPERADMIN_PACKAGE_PRESETS,
  resolveFeaturesForIndustryTemplate,
  getTenantActiveModules
} from '../../services/masterFeatureMatrixService';
import { MASTER_INDUSTRY_TEMPLATES } from '../../data/industryTemplates';
import { playButtonClick, playSuccessChime } from '../../services/soundFeedback';
import { hapticFeedback } from '../../services/nativeAppService';

export const TenantFeatureSwitchboardModal = ({
  isOpen,
  onClose,
  tenant,
  onSaveTenantModules
}) => {
  if (!isOpen || !tenant) return null;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTemplateId, setSelectedTemplateId] = useState(() => {
    return tenant.industryTemplateId || 'food_restaurant';
  });

  // Local state for module toggles
  const [modulesState, setModulesState] = useState(() => {
    return getTenantActiveModules(tenant);
  });

  // Statistics
  const { enabledCount, totalCount } = useMemo(() => {
    let en = 0;
    MASTER_FEATURE_REGISTRY.forEach(f => {
      if (modulesState[f.id] !== false) en++;
    });
    return { enabledCount: en, totalCount: MASTER_FEATURE_REGISTRY.length };
  }, [modulesState]);

  // Filtered features
  const filteredFeatures = useMemo(() => {
    let list = MASTER_FEATURE_REGISTRY;

    if (selectedCategory !== 'all') {
      list = list.filter(f => f.categoryId === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(f =>
        f.name.toLowerCase().includes(q) ||
        f.enName.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        (f.badge || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [selectedCategory, searchQuery]);

  // Toggle single module
  const handleToggleModule = (moduleId) => {
    playButtonClick();
    hapticFeedback();
    setModulesState(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  // Apply preset
  const handleApplyPreset = (preset) => {
    playButtonClick();
    hapticFeedback();
    const nextState = {};
    MASTER_FEATURE_REGISTRY.forEach(f => {
      nextState[f.id] = preset.enabledIds.includes(f.id);
    });
    setModulesState(nextState);
  };

  // Apply Template Defaults
  const handleApplyTemplateDefaults = (templateId) => {
    playButtonClick();
    hapticFeedback();
    setSelectedTemplateId(templateId);
    const defaults = resolveFeaturesForIndustryTemplate(templateId);
    setModulesState(defaults);
  };

  // Enable / Disable All
  const handleSetAll = (enable) => {
    playButtonClick();
    hapticFeedback();
    const nextState = {};
    MASTER_FEATURE_REGISTRY.forEach(f => {
      nextState[f.id] = enable;
    });
    setModulesState(nextState);
  };

  // Save handler
  const handleSave = () => {
    playSuccessChime();
    hapticFeedback();
    if (onSaveTenantModules) {
      onSaveTenantModules(tenant.id, {
        modules: modulesState,
        industryTemplateId: selectedTemplateId
      });
    }
    // Broadcast live event for active tabs
    try {
      window.dispatchEvent(new CustomEvent('hk360_tenant_features_updated', {
        detail: {
          tenantId: tenant.id,
          clientEmail: tenant.clientEmail,
          modules: modulesState,
          industryTemplateId: selectedTemplateId
        }
      }));
    } catch (e) {
      console.warn('Broadcast error:', e);
    }
    onClose();
  };

  // Icon mapping helper
  const getCategoryIcon = (iconName) => {
    switch (iconName) {
      case 'Store': return <Store size={16} />;
      case 'Boxes': return <Boxes size={16} />;
      case 'HandCoins': return <HandCoins size={16} />;
      case 'Truck': return <Truck size={16} />;
      case 'Users': return <Users size={16} />;
      case 'UtensilsCrossed': return <UtensilsCrossed size={16} />;
      case 'Building2': return <Building2 size={16} />;
      default: return <Sliders size={16} />;
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10050,
        background: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(8px)',
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
          maxWidth: '960px',
          maxHeight: '92vh',
          background: 'var(--bg-primary, #0f172a)',
          color: 'var(--text-main, #f8fafc)',
          borderRadius: '20px',
          border: '1.5px solid rgba(16, 185, 129, 0.35)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 35px rgba(16, 185, 129, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 20px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.18), rgba(6, 95, 70, 0.12))',
            borderBottom: '1px solid rgba(16, 185, 129, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
              }}
            >
              <ShieldCheck size={26} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900', color: '#fff' }}>
                  ব্যবসায়ী ফিচার ও মডিউল অন/অফ সুইচবোর্ড
                </h3>
                <span
                  style={{
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '0.74rem',
                    fontWeight: '800'
                  }}
                >
                  সুপার অ্যাডমিন সেন্ট্রাল
                </span>
              </div>
              <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                প্রতিষ্ঠান: <strong style={{ color: '#fff' }}>{tenant.clientShopName}</strong> • {tenant.clientEmail}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={onClose}
              className="btn"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Top Control Bar: Fast Presets & Industry Template Selector */}
        <div
          style={{
            padding: '12px 18px',
            background: 'rgba(0, 0, 0, 0.25)',
            borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          {/* Preset Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)', fontWeight: '700' }}>
              ⚡ রেডি-মেড প্যাকেজ প্রিসেট:
            </span>
            {SUPERADMIN_PACKAGE_PRESETS.map(preset => (
              <button
                key={preset.id}
                onClick={() => handleApplyPreset(preset)}
                className="btn"
                title={preset.description}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${preset.color}50`,
                  color: preset.color,
                  padding: '5px 10px',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                {preset.name}
              </button>
            ))}

            <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
              <button
                onClick={() => handleSetAll(true)}
                className="btn"
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}
              >
                সব চালু
              </button>
              <button
                onClick={() => handleSetAll(false)}
                className="btn"
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}
              >
                সব বন্ধ
              </button>
            </div>
          </div>

          {/* Industry Template & Search Filter Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* 100+ Template Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '280px', flex: '1 1 280px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)', whiteSpace: 'nowrap' }}>
                🏪 বিজনেস টেমপ্লেট:
              </span>
              <select
                value={selectedTemplateId}
                onChange={(e) => handleApplyTemplateDefaults(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-secondary, #1e293b)',
                  color: 'var(--text-main, #f8fafc)',
                  border: '1px solid var(--border-color, rgba(255, 255, 255, 0.15))',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  outline: 'none'
                }}
              >
                {MASTER_INDUSTRY_TEMPLATES.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.enName})
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', minWidth: '220px', flex: '1 1 220px' }}>
              <Search
                size={14}
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ফিচার বা মেনু খুঁজুন..."
                style={{
                  width: '100%',
                  padding: '6px 10px 6px 30px',
                  borderRadius: '8px',
                  background: 'var(--bg-secondary, #1e293b)',
                  border: '1px solid var(--border-color, rgba(255, 255, 255, 0.15))',
                  color: 'var(--text-main, #fff)',
                  fontSize: '0.8rem',
                  outline: 'none'
                }}
              />
            </div>

            {/* Counter Badge */}
            <div
              style={{
                fontSize: '0.78rem',
                fontWeight: '800',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                padding: '5px 12px',
                borderRadius: '12px',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                whiteSpace: 'nowrap'
              }}
            >
              সক্রিয়: {enabledCount} / {totalCount}টি
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div
          style={{
            padding: '8px 18px',
            background: 'rgba(0, 0, 0, 0.15)',
            borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            overflowX: 'auto',
            scrollbarWidth: 'none'
          }}
        >
          <button
            onClick={() => setSelectedCategory('all')}
            className="btn"
            style={{
              padding: '5px 12px',
              borderRadius: '8px',
              fontSize: '0.76rem',
              fontWeight: '800',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              background: selectedCategory === 'all' ? '#10b981' : 'transparent',
              color: selectedCategory === 'all' ? '#ffffff' : 'var(--text-muted, #94a3b8)',
              border: selectedCategory === 'all' ? 'none' : '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            সব ক্যাটাগরি ({totalCount})
          </button>
          {MASTER_FEATURE_CATEGORIES.map(cat => {
            const catCount = MASTER_FEATURE_REGISTRY.filter(f => f.categoryId === cat.id).length;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className="btn"
                style={{
                  padding: '5px 12px',
                  borderRadius: '8px',
                  fontSize: '0.76rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: isSelected ? cat.color : 'transparent',
                  color: isSelected ? '#ffffff' : 'var(--text-muted, #94a3b8)',
                  border: isSelected ? 'none' : '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                {getCategoryIcon(cat.icon)}
                <span>{cat.name} ({catCount})</span>
              </button>
            );
          })}
        </div>

        {/* Feature Switches Grid (Scrollable) */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
            gap: '12px',
            alignContent: 'start'
          }}
        >
          {filteredFeatures.map(feat => {
            const isEnabled = modulesState[feat.id] !== false;
            const cat = MASTER_FEATURE_CATEGORIES.find(c => c.id === feat.categoryId);

            return (
              <div
                key={feat.id}
                onClick={() => handleToggleModule(feat.id)}
                style={{
                  background: isEnabled
                    ? 'rgba(16, 185, 129, 0.08)'
                    : 'rgba(255, 255, 255, 0.02)',
                  border: `1.5px solid ${isEnabled ? 'rgba(16, 185, 129, 0.35)' : 'rgba(255, 255, 255, 0.08)'}`,
                  borderRadius: '12px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isEnabled ? '0 4px 15px rgba(16, 185, 129, 0.08)' : 'none'
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                    <span style={{ fontWeight: '800', fontSize: '0.9rem', color: isEnabled ? '#fff' : 'var(--text-muted)' }}>
                      {feat.name}
                    </span>
                    {feat.badge && (
                      <span
                        style={{
                          background: `${cat?.color || '#3b82f6'}20`,
                          color: cat?.color || '#3b82f6',
                          border: `1px solid ${cat?.color || '#3b82f6'}40`,
                          padding: '1px 6px',
                          borderRadius: '8px',
                          fontSize: '0.68rem',
                          fontWeight: '800'
                        }}
                      >
                        {feat.badge}
                      </span>
                    )}
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.76rem',
                      color: 'var(--text-muted, #94a3b8)',
                      lineHeight: '1.3',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {feat.description}
                  </p>
                </div>

                {/* Tactile Toggle Switch */}
                <div
                  style={{
                    width: '46px',
                    height: '26px',
                    borderRadius: '13px',
                    background: isEnabled ? '#10b981' : 'rgba(255, 255, 255, 0.15)',
                    position: 'relative',
                    transition: 'background 0.2s ease',
                    flexShrink: 0,
                    boxShadow: isEnabled ? '0 0 10px rgba(16, 185, 129, 0.4)' : 'none'
                  }}
                >
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: '#ffffff',
                      position: 'absolute',
                      top: '3px',
                      left: isEnabled ? '23px' : '3px',
                      transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                    }}
                  >
                    {isEnabled ? (
                      <Check size={11} color="#10b981" strokeWidth={3} />
                    ) : (
                      <X size={11} color="#64748b" strokeWidth={3} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredFeatures.length === 0 && (
            <div
              style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: '3rem 1rem',
                color: 'var(--text-muted)'
              }}
            >
              কোনো ফিচার বা মেনু পাওয়া যায়নি। অন্য কিওয়ার্ড দিয়ে খুঁজুন।
            </div>
          )}
        </div>

        {/* Modal Footer with Save Actions */}
        <div
          style={{
            padding: '14px 20px',
            background: 'rgba(0, 0, 0, 0.35)',
            borderTop: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <Sparkles size={16} color="#10b981" />
            <span>পরিবর্তন সংরক্ষণ করলে সাথে সাথে ব্যবসায়ীর অ্যাপে সিঙ্ক হয়ে যাবে</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: 'var(--text-main, #fff)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.84rem',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              বাতিল
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="btn"
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#ffffff',
                border: 'none',
                padding: '8px 20px',
                borderRadius: '8px',
                fontSize: '0.86rem',
                fontWeight: '900',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
              }}
            >
              <Save size={16} />
              <span>✓ পরিবর্তন সংরক্ষণ ও সিঙ্ক করুন</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantFeatureSwitchboardModal;
