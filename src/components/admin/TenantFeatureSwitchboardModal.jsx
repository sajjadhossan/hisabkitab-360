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
  RotateCcw,
  CheckSquare,
  Square,
  HeartPulse,
  Shirt,
  Bus,
  Gem,
  Scissors,
  Wheat,
  Film
} from 'lucide-react';
import {
  MASTER_FEATURE_CATEGORIES,
  MASTER_FEATURE_REGISTRY,
  SUPERADMIN_PACKAGE_PRESETS,
  TEMPLATE_QUICK_PRESETS,
  resolveFeaturesForIndustryTemplate,
  getTenantActiveModules
} from '../../services/masterFeatureMatrixService';
import {
  INDUSTRY_SECTORS,
  MASTER_INDUSTRY_TEMPLATES
} from '../../data/industryTemplates';
import { playButtonClick, playSuccessChime } from '../../services/soundFeedback';
import { hapticFeedback } from '../../services/nativeAppService';

export const TenantFeatureSwitchboardModal = ({
  isOpen,
  onClose,
  tenant,
  onSaveTenantModules
}) => {
  if (!isOpen || !tenant) return null;

  // Main Switchboard Sub-Tab: 'modules' | 'templates'
  const [activeMainTab, setActiveMainTab] = useState('modules');

  // Module filter states
  const [moduleSearchQuery, setModuleSearchQuery] = useState('');
  const [selectedModuleCategory, setSelectedModuleCategory] = useState('all');
  const [selectedTemplateId, setSelectedTemplateId] = useState(() => {
    return tenant.industryTemplateId || 'food_restaurant';
  });

  // Local state for module toggles
  const [modulesState, setModulesState] = useState(() => {
    return getTenantActiveModules(tenant);
  });

  // Template filter states
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState('all');

  // Local state for allowed templates
  const [allowedTemplates, setAllowedTemplates] = useState(() => {
    if (Array.isArray(tenant.allowedTemplates) && tenant.allowedTemplates.length > 0) {
      return [...tenant.allowedTemplates];
    }
    // If client has a specific assigned template, start with that
    if (tenant.industryTemplateId) {
      return [tenant.industryTemplateId];
    }
    // Otherwise default to all 100+ templates
    return MASTER_INDUSTRY_TEMPLATES.map(t => t.id);
  });

  // Statistics for modules
  const { enabledModuleCount, totalModuleCount } = useMemo(() => {
    let en = 0;
    MASTER_FEATURE_REGISTRY.forEach(f => {
      if (modulesState[f.id] !== false) en++;
    });
    return { enabledModuleCount: en, totalModuleCount: MASTER_FEATURE_REGISTRY.length };
  }, [modulesState]);

  // Statistics for templates
  const { enabledTemplateCount, totalTemplateCount } = useMemo(() => {
    return {
      enabledTemplateCount: allowedTemplates.length,
      totalTemplateCount: MASTER_INDUSTRY_TEMPLATES.length
    };
  }, [allowedTemplates]);

  // Filtered features
  const filteredFeatures = useMemo(() => {
    let list = MASTER_FEATURE_REGISTRY;

    if (selectedModuleCategory !== 'all') {
      list = list.filter(f => f.categoryId === selectedModuleCategory);
    }

    if (moduleSearchQuery.trim()) {
      const q = moduleSearchQuery.toLowerCase();
      list = list.filter(f =>
        f.name.toLowerCase().includes(q) ||
        f.enName.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        (f.badge || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [selectedModuleCategory, moduleSearchQuery]);

  // Filtered templates
  const filteredTemplates = useMemo(() => {
    let list = MASTER_INDUSTRY_TEMPLATES;

    if (selectedSector !== 'all') {
      list = list.filter(t => t.sectorId === selectedSector);
    }

    if (templateSearchQuery.trim()) {
      const q = templateSearchQuery.toLowerCase();
      list = list.filter(t =>
        t.name.toLowerCase().includes(q) ||
        (t.enName && t.enName.toLowerCase().includes(q)) ||
        (t.units && t.units.some(u => u.toLowerCase().includes(q))) ||
        (t.defaultCategories && t.defaultCategories.some(c => c.toLowerCase().includes(q)))
      );
    }

    return list;
  }, [selectedSector, templateSearchQuery]);

  // Safe Haptic Helper
  const triggerHaptic = () => {
    try {
      if (typeof hapticFeedback === 'function') {
        hapticFeedback('light');
      } else if (hapticFeedback && typeof hapticFeedback.light === 'function') {
        hapticFeedback.light();
      }
    } catch (e) {
      // Ignore haptic errors on web
    }
  };

  // Toggle single module
  const handleToggleModule = (moduleId) => {
    playButtonClick();
    triggerHaptic();
    setModulesState(prev => {
      const currentState = prev || {};
      const isCurrentlyEnabled = currentState[moduleId] !== false;
      return {
        ...currentState,
        [moduleId]: !isCurrentlyEnabled
      };
    });
  };

  // Toggle single template
  const handleToggleTemplate = (templateId) => {
    playButtonClick();
    triggerHaptic();
    setAllowedTemplates(prev => {
      const currentList = Array.isArray(prev) ? prev : [];
      if (currentList.includes(templateId)) {
        return currentList.filter(id => id !== templateId);
      } else {
        return [...currentList, templateId];
      }
    });
  };

  // Apply module preset
  const handleApplyModulePreset = (preset) => {
    playButtonClick();
    triggerHaptic();
    const nextState = {};
    MASTER_FEATURE_REGISTRY.forEach(f => {
      nextState[f.id] = preset.enabledIds.includes(f.id);
    });
    setModulesState(nextState);
  };

  // Apply template preset
  const handleApplyTemplatePreset = (presetId) => {
    playButtonClick();
    triggerHaptic();
    if (presetId === 'preset_all_templates') {
      setAllowedTemplates(MASTER_INDUSTRY_TEMPLATES.map(t => t.id));
    } else if (presetId === 'preset_grocery_retail') {
      const list = MASTER_INDUSTRY_TEMPLATES.filter(t => t.sectorId === 'retail_grocery').map(t => t.id);
      setAllowedTemplates(list);
    } else if (presetId === 'preset_food_hospitality') {
      const list = MASTER_INDUSTRY_TEMPLATES.filter(t => t.sectorId === 'food_dining').map(t => t.id);
      setAllowedTemplates(list);
    } else if (presetId === 'preset_pharmacy_health') {
      const list = MASTER_INDUSTRY_TEMPLATES.filter(t => t.sectorId === 'pharmacy_health').map(t => t.id);
      setAllowedTemplates(list);
    } else if (presetId === 'preset_fashion_lifestyle') {
      const list = MASTER_INDUSTRY_TEMPLATES.filter(t => t.sectorId === 'fashion_apparel').map(t => t.id);
      setAllowedTemplates(list);
    } else if (presetId === 'preset_electronics_mobile') {
      const list = MASTER_INDUSTRY_TEMPLATES.filter(t => t.sectorId === 'electronics_mobile').map(t => t.id);
      setAllowedTemplates(list);
    }
  };

  // Sector Bulk Toggle: Enable or disable all templates in current sector
  const handleToggleCurrentSector = (enable) => {
    playButtonClick();
    triggerHaptic();
    const targetTemplates = (selectedSector === 'all'
      ? MASTER_INDUSTRY_TEMPLATES
      : MASTER_INDUSTRY_TEMPLATES.filter(t => t.sectorId === selectedSector)
    ).map(t => t.id);

    setAllowedTemplates(prev => {
      if (enable) {
        const set = new Set([...prev, ...targetTemplates]);
        return Array.from(set);
      } else {
        return prev.filter(id => !targetTemplates.includes(id));
      }
    });
  };

  // Apply Template Defaults to Modules
  const handleApplyTemplateDefaultsToModules = (templateId) => {
    playButtonClick();
    triggerHaptic();
    setSelectedTemplateId(templateId);
    const defaults = resolveFeaturesForIndustryTemplate(templateId);
    setModulesState(defaults);
    // Also ensure this template is in allowedTemplates
    setAllowedTemplates(prev => prev.includes(templateId) ? prev : [...prev, templateId]);
  };

  // Enable / Disable All Modules
  const handleSetAllModules = (enable) => {
    playButtonClick();
    triggerHaptic();
    const nextState = {};
    MASTER_FEATURE_REGISTRY.forEach(f => {
      nextState[f.id] = enable;
    });
    setModulesState(nextState);
  };

  // Save handler
  const handleSave = () => {
    playSuccessChime();
    triggerHaptic();
    if (onSaveTenantModules) {
      onSaveTenantModules(tenant.id, {
        modules: modulesState,
        industryTemplateId: selectedTemplateId,
        allowedTemplates: allowedTemplates
      });
    }

    // Broadcast live event for active tabs
    try {
      window.dispatchEvent(new CustomEvent('hk360_tenant_features_updated', {
        detail: {
          tenantId: tenant.id,
          clientEmail: tenant.clientEmail,
          modules: modulesState,
          industryTemplateId: selectedTemplateId,
          allowedTemplates: allowedTemplates
        }
      }));

      window.dispatchEvent(new CustomEvent('hk360_tenant_templates_updated', {
        detail: {
          tenantId: tenant.id,
          clientEmail: tenant.clientEmail,
          allowedTemplates: allowedTemplates
        }
      }));
    } catch (e) {
      console.warn('Broadcast error:', e);
    }
    onClose();
  };

  // Sector Icon Helper
  const getSectorIcon = (sectorId) => {
    switch (sectorId) {
      case 'food_dining': return <UtensilsCrossed size={16} />;
      case 'retail_grocery': return <Store size={16} />;
      case 'pharmacy_health': return <HeartPulse size={16} />;
      case 'fashion_apparel': return <Shirt size={16} />;
      case 'electronics_mobile': return <Smartphone size={16} />;
      case 'transport_travel': return <Bus size={16} />;
      case 'construction_materials': return <Building2 size={16} />;
      case 'jewelry_gold': return <Gem size={16} />;
      case 'logistics_courier': return <Truck size={16} />;
      case 'services_lifestyle': return <Scissors size={16} />;
      case 'agro_poultry': return <Wheat size={16} />;
      case 'entertainment_events': return <Film size={16} />;
      default: return <Boxes size={16} />;
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10050,
        background: 'rgba(0, 0, 0, 0.8)',
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
          maxWidth: '1020px',
          maxHeight: '94vh',
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
        {/* Modal Top Header */}
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
                  ব্যবসায়ী ফিচার ও ১০০+ টেমপ্লেট মাস্টার কন্ট্রোল
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
                  সুপার অ্যাডমিন
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

        {/* Primary Tab Switcher: [1. ফিচার ও মডিউল অন/অফ] vs [2. ১০০+ বিজনেস টেমপ্লেট অন/অফ] */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(0, 0, 0, 0.35)',
            borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
            padding: '4px 16px',
            gap: '8px'
          }}
        >
          <button
            onClick={() => {
              playButtonClick();
              setActiveMainTab('modules');
            }}
            className="btn"
            style={{
              padding: '10px 18px',
              borderBottom: activeMainTab === 'modules' ? '3px solid #10b981' : '3px solid transparent',
              background: 'transparent',
              color: activeMainTab === 'modules' ? '#10b981' : 'var(--text-muted, #94a3b8)',
              fontWeight: '800',
              fontSize: '0.88rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer'
            }}
          >
            <Sliders size={18} />
            <span>১. ফিচার ও মডিউল অন/অফ ({enabledModuleCount}/{totalModuleCount})</span>
          </button>

          <button
            onClick={() => {
              playButtonClick();
              setActiveMainTab('templates');
            }}
            className="btn"
            style={{
              padding: '10px 18px',
              borderBottom: activeMainTab === 'templates' ? '3px solid #3b82f6' : '3px solid transparent',
              background: 'transparent',
              color: activeMainTab === 'templates' ? '#3b82f6' : 'var(--text-muted, #94a3b8)',
              fontWeight: '800',
              fontSize: '0.88rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer'
            }}
          >
            <Layers size={18} />
            <span>২. ১০০+ বিজনেস টেমপ্লেট অন/অফ ({enabledTemplateCount}/{totalTemplateCount})</span>
          </button>
        </div>

        {/* ==================================================================== */}
        {/* TAB 1: MODULES & FEATURES SWITCHBOARD                                */}
        {/* ==================================================================== */}
        {activeMainTab === 'modules' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
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
                  ⚡ প্যাকেজ প্রিসেট:
                </span>
                {SUPERADMIN_PACKAGE_PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => handleApplyModulePreset(preset)}
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
                    onClick={() => handleSetAllModules(true)}
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
                    onClick={() => handleSetAllModules(false)}
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

              {/* Template & Search Bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '280px', flex: '1 1 280px' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)', whiteSpace: 'nowrap' }}>
                    🏪 টেমপ্লেট ডিফল্ট প্রয়োগ:
                  </span>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => handleApplyTemplateDefaultsToModules(e.target.value)}
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

                <div style={{ position: 'relative', minWidth: '220px', flex: '1 1 220px' }}>
                  <Search
                    size={14}
                    style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                  />
                  <input
                    type="text"
                    value={moduleSearchQuery}
                    onChange={(e) => setModuleSearchQuery(e.target.value)}
                    placeholder="মডিউল বা ফিচার খুঁজুন..."
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
                  সক্রিয়: {enabledModuleCount} / {totalModuleCount}টি
                </div>
              </div>
            </div>

            {/* Feature Switches Grid */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px 20px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
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
                      transition: 'all 0.15s ease'
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
                        flexShrink: 0
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
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 2: 100+ INDUSTRY TEMPLATES SWITCHBOARD                           */}
        {/* ==================================================================== */}
        {activeMainTab === 'templates' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            {/* Top Control Bar for Templates */}
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
              {/* Quick Template Presets */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)', fontWeight: '700' }}>
                  ⚡ টেমপ্লেট বান্ডেল প্রিসেট:
                </span>
                {TEMPLATE_QUICK_PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => handleApplyTemplatePreset(preset.id)}
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
                    onClick={() => handleToggleCurrentSector(true)}
                    className="btn"
                    style={{
                      background: 'rgba(59, 130, 246, 0.15)',
                      color: '#3b82f6',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: '800',
                      cursor: 'pointer'
                    }}
                  >
                    ✓ এই সেক্টর চালু
                  </button>
                  <button
                    onClick={() => handleToggleCurrentSector(false)}
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
                    ✕ এই সেক্টর বন্ধ
                  </button>
                </div>
              </div>

              {/* Sector & Search Filters */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', minWidth: '240px', flex: '1 1 240px' }}>
                  <Search
                    size={14}
                    style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                  />
                  <input
                    type="text"
                    value={templateSearchQuery}
                    onChange={(e) => setTemplateSearchQuery(e.target.value)}
                    placeholder="টেমপ্লেটের নাম দিয়ে খুঁজুন (যেমন: রেস্টুরেন্ট, ফার্মেসি, মুদি, রড)..."
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

                <div
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: '800',
                    background: 'rgba(59, 130, 246, 0.15)',
                    color: '#3b82f6',
                    padding: '5px 12px',
                    borderRadius: '12px',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  অনুমোদিত টেমপ্লেট: {enabledTemplateCount} / {totalTemplateCount}টি
                </div>
              </div>
            </div>

            {/* Sector Tabs Bar */}
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
                onClick={() => setSelectedSector('all')}
                className="btn"
                style={{
                  padding: '5px 12px',
                  borderRadius: '8px',
                  fontSize: '0.76rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  background: selectedSector === 'all' ? '#3b82f6' : 'transparent',
                  color: selectedSector === 'all' ? '#ffffff' : 'var(--text-muted, #94a3b8)',
                  border: selectedSector === 'all' ? 'none' : '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                সব সেক্টর ({totalTemplateCount})
              </button>
              {INDUSTRY_SECTORS.map(sec => {
                const count = MASTER_INDUSTRY_TEMPLATES.filter(t => t.sectorId === sec.id).length;
                const isSelected = selectedSector === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => setSelectedSector(sec.id)}
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
                      background: isSelected ? sec.color : 'transparent',
                      color: isSelected ? '#ffffff' : 'var(--text-muted, #94a3b8)',
                      border: isSelected ? 'none' : '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    {getSectorIcon(sec.id)}
                    <span>{sec.name} ({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Templates Switch Grid (Scrollable) */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px 20px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '12px',
                alignContent: 'start'
              }}
            >
              {filteredTemplates.map(tpl => {
                const isAllowed = allowedTemplates.includes(tpl.id);
                const sec = INDUSTRY_SECTORS.find(s => s.id === tpl.sectorId);
                const isPrimary = selectedTemplateId === tpl.id;

                return (
                  <div
                    key={tpl.id}
                    onClick={() => handleToggleTemplate(tpl.id)}
                    style={{
                      background: isAllowed
                        ? 'rgba(59, 130, 246, 0.08)'
                        : 'rgba(255, 255, 255, 0.02)',
                      border: `1.5px solid ${isAllowed ? 'rgba(59, 130, 246, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
                      borderRadius: '12px',
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isAllowed ? '0 4px 15px rgba(59, 130, 246, 0.08)' : 'none'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: '800', fontSize: '0.88rem', color: isAllowed ? '#fff' : 'var(--text-muted)' }}>
                          {tpl.name}
                        </span>
                        {isPrimary && (
                          <span
                            style={{
                              background: 'rgba(16, 185, 129, 0.2)',
                              color: '#10b981',
                              border: '1px solid #10b981',
                              padding: '1px 6px',
                              borderRadius: '8px',
                              fontSize: '0.66rem',
                              fontWeight: '900'
                            }}
                          >
                            ★ প্রাইমারি
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted, #94a3b8)', marginBottom: '4px' }}>
                        {tpl.enName}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            background: `${sec?.color || '#3b82f6'}20`,
                            color: sec?.color || '#3b82f6',
                            border: `1px solid ${sec?.color || '#3b82f6'}40`,
                            padding: '1px 6px',
                            borderRadius: '6px',
                            fontSize: '0.66rem',
                            fontWeight: '700'
                          }}
                        >
                          {sec?.name?.split(' ')[0] || 'ব্যবসা'}
                        </span>
                        {tpl.units && (
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            একক: {tpl.units.slice(0, 3).join(', ')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Tactile Toggle Switch */}
                    <div
                      style={{
                        width: '46px',
                        height: '26px',
                        borderRadius: '13px',
                        background: isAllowed ? '#3b82f6' : 'rgba(255, 255, 255, 0.15)',
                        position: 'relative',
                        transition: 'background 0.2s ease',
                        flexShrink: 0
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
                          left: isAllowed ? '23px' : '3px',
                          transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                        }}
                      >
                        {isAllowed ? (
                          <Check size={11} color="#3b82f6" strokeWidth={3} />
                        ) : (
                          <X size={11} color="#64748b" strokeWidth={3} />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Modal Bottom Footer with Save Action */}
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
            <span>
              অনুমোদিত {enabledTemplateCount}টি টেমপ্লেট ও {enabledModuleCount}টি মডিউল সরাসরি ক্লায়েন্টের অ্যাপে সিঙ্ক হবে
            </span>
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
