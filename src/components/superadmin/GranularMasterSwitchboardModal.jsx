import React, { useState, useEffect, useMemo } from 'react';
import {
  GRANULAR_FEATURE_CATEGORIES,
  getTenantGranularFeatures,
  toggleTenantGranularFeature,
  bulkSetCategoryGranularFeatures,
  getGranularFeatureMeta
} from '../../services/tenantManagerService';
import {
  Crown,
  ShieldCheck,
  Check,
  X,
  Search,
  Sliders,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap,
  Info,
  CheckCircle2,
  XCircle,
  Building2,
  Navigation,
  Users,
  Wallet,
  TrendingUp,
  Receipt,
  PieChart,
  Send,
  AlertTriangle
} from 'lucide-react';

const CATEGORY_ICON_MAP = {
  Navigation: Navigation,
  Users: Users,
  Wallet: Wallet,
  TrendingUp: TrendingUp,
  Building2: Building2,
  PieChart: PieChart,
  ShieldCheck: ShieldCheck,
  Send: Send
};

export const GranularMasterSwitchboardModal = ({
  isOpen,
  onClose,
  tenant,
  isLight = false,
  lang = 'bn',
  onUpdated
}) => {
  const isEn = lang === 'en';
  const tenantId = tenant?.id;

  const [featuresState, setFeaturesState] = useState(() => getTenantGranularFeatures(tenantId));
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState(() => ({
    field_collection: true,
    member_portal: true,
    savings_deposits: true,
    microloan_ops: true,
    cash_banking: false,
    audit_reports: false,
    admin_governance: false,
    automation_comms: false
  }));
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (tenantId) {
      setFeaturesState(getTenantGranularFeatures(tenantId));
    }
  }, [tenantId, isOpen]);

  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleToggle = (featureId) => {
    if (!tenantId) return;
    const currentState = Boolean(featuresState[featureId]);
    const next = !currentState;
    toggleTenantGranularFeature(tenantId, featureId, next);
    setFeaturesState(prev => ({ ...prev, [featureId]: next }));
    onUpdated?.();
  };

  const handleBulkCategory = (categoryId, enableAll) => {
    if (!tenantId) return;
    bulkSetCategoryGranularFeatures(tenantId, categoryId, enableAll);
    const category = GRANULAR_FEATURE_CATEGORIES.find(c => c.id === categoryId);
    if (category) {
      const updated = { ...featuresState };
      category.features.forEach(f => {
        updated[f.id] = enableAll;
      });
      setFeaturesState(updated);
      showToast(
        isEn
          ? `All features in ${category.nameEn} ${enableAll ? 'enabled' : 'disabled'}`
          : `${category.nameBn}-এর সকল ফিচার ${enableAll ? 'চালু' : 'বন্ধ'} করা হয়েছে`
      );
      onUpdated?.();
    }
  };

  const applyPreset = (presetType) => {
    if (!tenantId) return;
    const updated = { ...featuresState };

    if (presetType === 'all_on') {
      GRANULAR_FEATURE_CATEGORIES.forEach(cat => {
        cat.features.forEach(f => {
          toggleTenantGranularFeature(tenantId, f.id, true);
          updated[f.id] = true;
        });
      });
      showToast(isEn ? 'Full Enterprise preset applied: All 43 features ON!' : 'রকেট এন্টারপ্রাইজ: সকল ৪৩টি ফিচার চালু করা হয়েছে!');
    } else if (presetType === 'standard') {
      GRANULAR_FEATURE_CATEGORIES.forEach(cat => {
        cat.features.forEach(f => {
          // Standard enables all except heavy automation and risky admin actions
          const isStandard = !['comm_telegram_bot', 'admin_edit_transactions', 'admin_delete_records', 'savings_waive_fee', 'loan_restructure'].includes(f.id);
          toggleTenantGranularFeature(tenantId, f.id, isStandard);
          updated[f.id] = isStandard;
        });
      });
      showToast(isEn ? 'Standard Samity preset applied!' : 'স্ট্যান্ডার্ড সমবায় প্যাকেজ প্রযোজ্য করা হয়েছে!');
    } else if (presetType === 'savings_only') {
      GRANULAR_FEATURE_CATEGORIES.forEach(cat => {
        const isSavingsRelated = ['field_collection', 'member_portal', 'savings_deposits', 'audit_reports'].includes(cat.id);
        cat.features.forEach(f => {
          const enable = isSavingsRelated && !['savings_waive_fee', 'field_fine_reschedule', 'admin_delete_records'].includes(f.id);
          toggleTenantGranularFeature(tenantId, f.id, enable);
          updated[f.id] = enable;
        });
      });
      showToast(isEn ? 'Basic Savings & Deposits preset applied!' : 'বেসিক সঞ্চয় ও কিস্তি প্রিসেট প্রযোজ্য করা হয়েছে!');
    }

    setFeaturesState(updated);
    onUpdated?.();
  };

  const toggleCategoryExpand = (catId) => {
    setExpandedCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  // Metrics
  const totalFeaturesCount = useMemo(() => {
    return GRANULAR_FEATURE_CATEGORIES.reduce((acc, cat) => acc + cat.features.length, 0);
  }, []);

  const enabledFeaturesCount = useMemo(() => {
    return Object.values(featuresState || {}).filter(Boolean).length;
  }, [featuresState]);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return GRANULAR_FEATURE_CATEGORIES;
    const q = searchQuery.toLowerCase().trim();
    return GRANULAR_FEATURE_CATEGORIES.map(cat => {
      const matchingFeatures = cat.features.filter(f =>
        f.nameBn.toLowerCase().includes(q) ||
        f.nameEn.toLowerCase().includes(q) ||
        f.descBn.toLowerCase().includes(q) ||
        f.id.toLowerCase().includes(q)
      );
      if (matchingFeatures.length > 0 || cat.nameBn.toLowerCase().includes(q) || cat.nameEn.toLowerCase().includes(q)) {
        return {
          ...cat,
          features: matchingFeatures.length > 0 ? matchingFeatures : cat.features
        };
      }
      return null;
    }).filter(Boolean);
  }, [searchQuery]);

  if (!isOpen || !tenant) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.78)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100000,
      padding: '16px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '960px',
        maxHeight: '92vh',
        background: isLight ? '#ffffff' : '#0f172a',
        borderRadius: '24px',
        boxShadow: '0 25px 60px -15px rgba(0,0,0,0.6), 0 0 0 1px rgba(245, 158, 11, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        color: isLight ? '#0f172a' : '#f8fafc',
        border: '1.5px solid rgba(245, 158, 11, 0.4)'
      }}>
        {/* Header Bar */}
        <div style={{
          padding: '20px 24px',
          background: isLight
            ? 'linear-gradient(135deg, #fffbeb, #fef3c7)'
            : 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95))',
          borderBottom: isLight ? '1px solid #fde68a' : '1px solid rgba(245, 158, 11, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
              flexShrink: 0
            }}>
              <Crown size={24} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '1.18rem', fontWeight: '900', letterSpacing: '-0.3px' }}>
                  {isEn ? 'A-to-Z Master Feature Switchboard' : 'এ-টু-জেড সার্বভৌম মাস্টার ফিচার সুইচবোর্ড'}
                </h2>
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: '900',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: 'rgba(245, 158, 11, 0.2)',
                  color: '#f59e0b',
                  border: '1px solid rgba(245, 158, 11, 0.4)'
                }}>
                  {tenant.isOwnSamity ? (isEn ? 'MY OWN SAMITY' : 'নিজস্ব সমবায়') : (isEn ? 'CLIENT WORKSPACE' : 'ক্লায়েন্ট সমবায়')}
                </span>
              </div>
              <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: isLight ? '#78350f' : '#cbd5e1' }}>
                <strong>{tenant.name}</strong> • {isEn ? 'Toggle all 43 sub-features from field officer to member portal' : 'মাঠকর্মী থেকে সদস্য পর্যন্ত সকল ৪৩টি সাব-অপশন অন/অফ করুন'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)',
              border: 'none',
              borderRadius: '12px',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: isLight ? '#475569' : '#94a3b8'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick Presets & Metrics Track */}
        <div style={{
          padding: '12px 24px',
          background: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.6)',
          borderBottom: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          {/* Presets */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: '800', color: isLight ? '#64748b' : '#94a3b8' }}>
              {isEn ? 'Quick Presets:' : 'দ্রুত প্যাকেজ প্রিসেট:'}
            </span>

            <button
              onClick={() => applyPreset('all_on')}
              style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.2))',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                color: '#10b981',
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '0.74rem',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Zap size={12} />
              <span>{isEn ? 'Full Enterprise (All ON)' : 'রকেট এন্টারপ্রাইজ (সব অন)'}</span>
            </button>

            <button
              onClick={() => applyPreset('standard')}
              style={{
                background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.15), rgba(3, 105, 161, 0.2))',
                border: '1px solid rgba(2, 132, 199, 0.35)',
                color: '#0284c7',
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '0.74rem',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Sparkles size={12} />
              <span>{isEn ? 'Standard Samity' : 'স্ট্যান্ডার্ড সমবায় প্যাকেজ'}</span>
            </button>

            <button
              onClick={() => applyPreset('savings_only')}
              style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.2))',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                color: '#f59e0b',
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '0.74rem',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Wallet size={12} />
              <span>{isEn ? 'Savings Only (Basic)' : 'শুধুমাত্র সঞ্চয় ও কিস্তি'}</span>
            </button>
          </div>

          {/* Metrics & Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.78rem',
              fontWeight: '900',
              background: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)',
              padding: '4px 10px',
              borderRadius: '8px'
            }}>
              <span>{isEn ? 'Active Options:' : 'মোট সক্রিয় অপশন:'}</span>
              <span style={{ color: '#10b981' }}>{enabledFeaturesCount}</span>
              <span style={{ opacity: 0.5 }}>/</span>
              <span>{totalFeaturesCount}</span>
            </div>

            <div style={{ position: 'relative', width: '200px' }}>
              <Search size={13} style={{ position: 'absolute', left: '10px', top: '8px', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder={isEn ? 'Search options...' : 'অপশন খুঁজুন...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '5px 10px 5px 30px',
                  borderRadius: '8px',
                  background: isLight ? '#ffffff' : 'rgba(30, 41, 59, 0.8)',
                  color: isLight ? '#0f172a' : '#f8fafc',
                  border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.12)',
                  fontSize: '0.76rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>
        </div>

        {/* Toast Alert Notification */}
        {notification && (
          <div style={{
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: '#ffffff',
            padding: '8px 24px',
            fontSize: '0.8rem',
            fontWeight: '800',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'fadeIn 0.2s ease'
          }}>
            <CheckCircle2 size={16} />
            <span>{notification}</span>
          </div>
        )}

        {/* Scrollable Categories & Features Area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {filteredCategories.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
              <Sliders size={40} style={{ opacity: 0.4, marginBottom: '8px' }} />
              <p>{isEn ? 'No features matching your search query.' : 'অনুসন্ধানের সাথে মিলে এমন কোনো ফিচার পাওয়া যায়নি।'}</p>
            </div>
          ) : (
            filteredCategories.map(cat => {
              const IconComp = CATEGORY_ICON_MAP[cat.icon] || Sliders;
              const isExpanded = Boolean(expandedCategories[cat.id]);
              const catEnabledCount = cat.features.filter(f => featuresState[f.id]).length;
              const isAllCatEnabled = catEnabledCount === cat.features.length;

              return (
                <div
                  key={cat.id}
                  style={{
                    background: isLight ? '#ffffff' : 'rgba(30, 41, 59, 0.5)',
                    borderRadius: '16px',
                    border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {/* Category Header Bar */}
                  <div style={{
                    padding: '14px 18px',
                    background: isLight ? '#f1f5f9' : 'rgba(15, 23, 42, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                  onClick={() => toggleCategoryExpand(cat.id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.3))',
                        color: '#f59e0b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <IconComp size={18} />
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: '900' }}>
                            {isEn ? cat.nameEn : cat.nameBn}
                          </h4>
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: '900',
                            padding: '1px 8px',
                            borderRadius: '6px',
                            background: catEnabledCount > 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                            color: catEnabledCount > 0 ? '#10b981' : '#94a3b8',
                            border: catEnabledCount > 0 ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(148, 163, 184, 0.3)'
                          }}>
                            {catEnabledCount} / {cat.features.length} {isEn ? 'Active' : 'সক্রিয়'}
                          </span>
                        </div>
                        <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: isLight ? '#64748b' : '#94a3b8' }}>
                          {cat.descBn}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleBulkCategory(cat.id, true)}
                        style={{
                          background: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.08)',
                          border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
                          color: '#10b981',
                          borderRadius: '6px',
                          padding: '3px 8px',
                          fontSize: '0.68rem',
                          fontWeight: '800',
                          cursor: 'pointer'
                        }}
                      >
                        {isEn ? 'Enable All' : 'সব চালু'}
                      </button>

                      <button
                        onClick={() => handleBulkCategory(cat.id, false)}
                        style={{
                          background: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.08)',
                          border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
                          color: '#ef4444',
                          borderRadius: '6px',
                          padding: '3px 8px',
                          fontSize: '0.68rem',
                          fontWeight: '800',
                          cursor: 'pointer'
                        }}
                      >
                        {isEn ? 'Disable All' : 'সব বন্ধ'}
                      </button>

                      <div style={{ color: isLight ? '#64748b' : '#94a3b8', marginLeft: '4px' }}>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>
                  </div>

                  {/* Category Features Sub-Grid */}
                  {isExpanded && (
                    <div style={{
                      padding: '14px 18px',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
                      gap: '12px',
                      background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.3)'
                    }}>
                      {cat.features.map(f => {
                        const isEnabled = Boolean(featuresState[f.id]);

                        return (
                          <div
                            key={f.id}
                            style={{
                              background: isEnabled
                                ? (isLight ? '#f0fdf4' : 'rgba(16, 185, 129, 0.08)')
                                : (isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)'),
                              border: isEnabled
                                ? '1.5px solid rgba(16, 185, 129, 0.4)'
                                : isLight
                                  ? '1px solid #e2e8f0'
                                  : '1px solid rgba(255, 255, 255, 0.06)',
                              borderRadius: '12px',
                              padding: '12px 14px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '10px',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{
                                  fontSize: '0.82rem',
                                  fontWeight: '800',
                                  color: isEnabled ? (isLight ? '#065f46' : '#34d399') : (isLight ? '#475569' : '#94a3b8')
                                }}>
                                  {isEn ? f.nameEn : f.nameBn}
                                </span>
                              </div>
                              <p style={{ margin: '3px 0 0', fontSize: '0.7rem', color: isLight ? '#64748b' : '#94a3b8', lineHeight: 1.35 }}>
                                {f.descBn}
                              </p>
                            </div>

                            {/* iOS Style Custom Toggle Switch */}
                            <button
                              type="button"
                              onClick={() => handleToggle(f.id)}
                              style={{
                                width: '42px',
                                height: '24px',
                                borderRadius: '12px',
                                background: isEnabled ? '#10b981' : (isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.2)'),
                                border: 'none',
                                padding: '2px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                transition: 'background 0.2s ease',
                                flexShrink: 0
                              }}
                            >
                              <div style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                background: '#ffffff',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                transform: isEnabled ? 'translateX(18px)' : 'translateX(0px)',
                                transition: 'transform 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                {isEnabled ? (
                                  <Check size={12} color="#10b981" strokeWidth={3} />
                                ) : (
                                  <X size={12} color="#94a3b8" strokeWidth={3} />
                                )}
                              </div>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '16px 24px',
          background: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.9)',
          borderTop: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: isLight ? '#64748b' : '#94a3b8' }}>
            <ShieldCheck size={16} color="#10b981" />
            <span>
              {isEn
                ? 'All changes are automatically saved and immediately enforced across all client platforms.'
                : 'প্রতিটি পরিবর্তন তাৎক্ষণিকভাবে স্বয়ংক্রিয়ভাবে সংরক্ষিত ও সমিতির সফটওয়্যারে কার্যকর হচ্ছে।'}
            </span>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '8px 20px',
              fontSize: '0.84rem',
              fontWeight: '900',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
            }}
          >
            <Check size={15} />
            <span>{isEn ? 'Done & Close' : 'সম্পন্ন ও বন্ধ করুন'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
