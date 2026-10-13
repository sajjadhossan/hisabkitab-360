import React, { useState, useRef, useEffect } from 'react';
import {
  Store,
  Sliders,
  ArrowLeft,
  Check,
  ChevronDown,
  Sparkles,
  Wheat,
  Pill,
  ShoppingBag,
  Layers,
  RefreshCw
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { playButtonClick } from '../../services/soundFeedback';
import { hapticFeedback } from '../../services/nativeAppService';
import { RealtimeSyncBadge } from '../common/RealtimeSyncBadge';

export const AdaptivePosSwitcherBar = ({
  activeEngine = 'retail', // 'retail' | 'cattle' | 'pharmacy'
  onSwitchEngine,
  activeIndustryId,
  onOpenTemplateManager,
  onBackToDashboard
}) => {
  const { lang, MASTER_INDUSTRY_TEMPLATES = [], setActiveIndustryId, showToast } = useApp();
  const [showSwitchDropdown, setShowSwitchDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowSwitchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeTpl = MASTER_INDUSTRY_TEMPLATES.find(t => t.id === activeIndustryId) || {
    id: activeIndustryId || 'retail_grocery',
    name: 'স্ট্যান্ডার্ড রিটেইল শপ'
  };

  const isTemplateCattle = Boolean(
    activeIndustryId?.includes('cattle') ||
    activeIndustryId?.includes('dairy') ||
    activeIndustryId?.includes('milk') ||
    activeIndustryId?.includes('agro') ||
    activeIndustryId?.includes('cow')
  );

  const isTemplatePharmacy = Boolean(
    activeIndustryId?.includes('pharmacy') ||
    activeIndustryId?.includes('health') ||
    activeIndustryId?.includes('medic')
  );

  // Switch POS by Template
  const handleSelectTemplate = (templateKey, engineKey, templateNameBn, templateNameEn) => {
    hapticFeedback.light();
    playButtonClick();
    setShowSwitchDropdown(false);

    if (setActiveIndustryId) {
      setActiveIndustryId(templateKey);
    }
    if (onSwitchEngine) {
      onSwitchEngine(engineKey);
    }

    if (showToast) {
      const msg = lang === 'bn'
        ? `পিওএস সফলভাবে ${templateNameBn}-এ কনভার্ট হয়েছে`
        : `POS converted to ${templateNameEn}`;
      showToast(msg, 'success');
    }
  };

  return (
    <div
      className="glass-card animate-fade-in adaptive-pos-switcher-bar"
      style={{
        padding: '0.6rem 0.9rem',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(99, 102, 241, 0.07) 100%)',
        border: '1.5px solid rgba(99, 102, 241, 0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
        flexWrap: 'wrap',
        marginBottom: '0.75rem',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.12)',
        position: 'relative'
      }}
    >
      {/* Left: Home Button & Current Store Context */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {onBackToDashboard && (
          <button
            type="button"
            onClick={onBackToDashboard}
            className="btn btn-secondary press-scale"
            style={{
              padding: '5px 10px',
              fontSize: '0.75rem',
              fontWeight: '800',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-primary)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer'
            }}
            title={lang === 'bn' ? 'ড্যাশবোর্ডে ফিরে যান' : 'Back to Dashboard'}
          >
            <ArrowLeft size={13} />
            <span>{lang === 'bn' ? 'হোম' : 'Home'}</span>
          </button>
        )}

        <div
          style={{
            padding: '4px 10px',
            borderRadius: '8px',
            background: isTemplateCattle
              ? 'rgba(16, 185, 129, 0.18)'
              : isTemplatePharmacy
              ? 'rgba(6, 182, 212, 0.18)'
              : 'rgba(99, 102, 241, 0.18)',
            color: isTemplateCattle
              ? '#10b981'
              : isTemplatePharmacy
              ? '#06b6d4'
              : '#818cf8',
            fontSize: '0.74rem',
            fontWeight: '800',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          <Store size={13} />
          <span>{activeTpl.name}</span>
        </div>
      </div>

      {/* Center: Dynamic Single Converted POS Indicator (No 3-button clutter) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {activeEngine === 'cattle' && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.3))',
              border: '1.5px solid #10b981',
              color: '#10b981',
              fontWeight: '800',
              fontSize: '0.82rem',
              boxShadow: '0 2px 10px rgba(16, 185, 129, 0.25)'
            }}
          >
            <span>🐄</span>
            <span>{lang === 'bn' ? 'ডেইরি ও খামার POS সক্রিয়' : 'Dairy & Cattle Farm POS Active'}</span>
            <Check size={14} style={{ color: '#10b981' }} />
          </div>
        )}

        {activeEngine === 'pharmacy' && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(13, 148, 136, 0.3))',
              border: '1.5px solid #06b6d4',
              color: '#06b6d4',
              fontWeight: '800',
              fontSize: '0.82rem',
              boxShadow: '0 2px 10px rgba(6, 182, 212, 0.25)'
            }}
          >
            <span>💊</span>
            <span>{lang === 'bn' ? 'ফার্মেসি ও মেডিকেশন POS সক্রিয়' : 'Pharmacy & Medicine POS Active'}</span>
            <Check size={14} style={{ color: '#06b6d4' }} />
          </div>
        )}

        {activeEngine === 'retail' && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(79, 70, 229, 0.3))',
              border: '1.5px solid #6366f1',
              color: '#818cf8',
              fontWeight: '800',
              fontSize: '0.82rem',
              boxShadow: '0 2px 10px rgba(99, 102, 241, 0.25)'
            }}
          >
            <span>🏪</span>
            <span>{lang === 'bn' ? 'সাধারণ রিটেইল POS সক্রিয়' : 'Retail Sales POS Active'}</span>
            <Check size={14} style={{ color: '#818cf8' }} />
          </div>
        )}
      </div>

      {/* Right: Smart Template Switcher Dropdown & Live Realtime Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} ref={dropdownRef}>
        <RealtimeSyncBadge compact={true} />
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setShowSwitchDropdown(!showSwitchDropdown)}
            className="btn btn-secondary press-scale"
            style={{
              padding: '6px 12px',
              borderRadius: '9px',
              fontSize: '0.78rem',
              fontWeight: '800',
              border: '1.5px solid var(--border-color)',
              background: showSwitchDropdown ? 'var(--business-primary)' : 'var(--bg-secondary)',
              color: showSwitchDropdown ? '#ffffff' : 'var(--text-main)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title={lang === 'bn' ? 'ব্যবসায়ের ধরন অনুযায়ী পিওএস কনভার্ট করুন' : 'Convert POS by Business Type'}
          >
            <RefreshCw size={13} style={{ transform: showSwitchDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
            <span>{lang === 'bn' ? '🔄 পিওএস মোড পরিবর্তন' : '🔄 Switch Mode'}</span>
            <ChevronDown size={13} />
          </button>

          {/* Switch Dropdown Menu */}
          {showSwitchDropdown && (
            <div
              className="glass-card animate-slide-up"
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                width: '260px',
                borderRadius: '14px',
                padding: '6px',
                zIndex: 1100,
                border: '1.5px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <div style={{ padding: '6px 10px', fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>
                {lang === 'bn' ? 'পিওএস কোন ব্যবসায় কনভার্ট করবেন?' : 'Convert POS to which business?'}
              </div>

              {/* 1. Dairy & Cattle Farm */}
              <button
                type="button"
                onClick={() => handleSelectTemplate('agro_cattle_farm', 'cattle', 'ডেইরি ও খামার পিওএস', 'Dairy & Cattle Farm POS')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: '9px',
                  border: 'none',
                  background: activeEngine === 'cattle' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                  color: activeEngine === 'cattle' ? '#10b981' : 'var(--text-main)',
                  fontWeight: activeEngine === 'cattle' ? '800' : '600',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1rem' }}>🐄</span>
                  <div>
                    <div>{lang === 'bn' ? 'ডেইরি ও খামার মোড' : 'Dairy & Cattle Farm'}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>দুধ, পাল, খাদ্য ও ডেইরি POS</div>
                  </div>
                </div>
                {activeEngine === 'cattle' && <Check size={14} style={{ color: '#10b981' }} />}
              </button>

              {/* 2. Pharmacy & Healthcare */}
              <button
                type="button"
                onClick={() => handleSelectTemplate('pharma_store', 'pharmacy', 'ফার্মেসি ও মেডিকেশন পিওএস', 'Pharmacy & Medicine POS')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: '9px',
                  border: 'none',
                  background: activeEngine === 'pharmacy' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                  color: activeEngine === 'pharmacy' ? '#06b6d4' : 'var(--text-main)',
                  fontWeight: activeEngine === 'pharmacy' ? '800' : '600',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1rem' }}>💊</span>
                  <div>
                    <div>{lang === 'bn' ? 'ফার্মেসি ও মেডিকেশন মোড' : 'Pharmacy & Healthcare'}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>ওষুধ, FEFO মেয়াদ ও প্রেসক্রিপশন</div>
                  </div>
                </div>
                {activeEngine === 'pharmacy' && <Check size={14} style={{ color: '#06b6d4' }} />}
              </button>

              {/* 3. General Retail & Grocery */}
              <button
                type="button"
                onClick={() => handleSelectTemplate('retail_grocery', 'retail', 'সাধারণ রিটেইল পিওএস', 'General Retail POS')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: '9px',
                  border: 'none',
                  background: activeEngine === 'retail' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  color: activeEngine === 'retail' ? 'var(--business-primary)' : 'var(--text-main)',
                  fontWeight: activeEngine === 'retail' ? '800' : '600',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1rem' }}>🏪</span>
                  <div>
                    <div>{lang === 'bn' ? 'সাধারণ রিটেইল মোড' : 'General Retail Mode'}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>গ্রোসারি, সুপারশপ ও অন্যান্য</div>
                  </div>
                </div>
                {activeEngine === 'retail' && <Check size={14} style={{ color: 'var(--business-primary)' }} />}
              </button>

              {/* 4. Open 100+ Template Customizer */}
              {onOpenTemplateManager && (
                <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '4px', paddingTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSwitchDropdown(false);
                      onOpenTemplateManager();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'rgba(99, 102, 241, 0.08)',
                      color: 'var(--text-main)',
                      fontWeight: '700',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <Sliders size={14} style={{ color: 'var(--business-primary)' }} />
                    <span>{lang === 'bn' ? '🎨 ১০০+ টেমপ্লেট রিভিউ ও কাস্টমাইজ' : '🎨 100+ Template Customizer'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
