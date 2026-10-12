import React from 'react';
import { Store, ShoppingCart, Sliders, ArrowLeft, Sparkles, Check, Layers } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { playButtonClick } from '../../services/soundFeedback';
import { hapticFeedback } from '../../services/nativeAppService';

export const AdaptivePosSwitcherBar = ({
  activeEngine = 'retail', // 'retail' | 'cattle' | 'pharmacy'
  onSwitchEngine,
  activeIndustryId,
  onOpenTemplateManager,
  onBackToDashboard
}) => {
  const { lang, MASTER_INDUSTRY_TEMPLATES, setActiveTab } = useApp();

  const activeTpl = (MASTER_INDUSTRY_TEMPLATES || []).find(t => t.id === activeIndustryId) || {
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

  const templateDefaultEngine = isTemplateCattle ? 'cattle' : (isTemplatePharmacy ? 'pharmacy' : 'retail');
  const isAutoMatched = activeEngine === templateDefaultEngine;

  const handleSelectEngine = (engineKey) => {
    hapticFeedback.light();
    playButtonClick();
    if (onSwitchEngine) {
      onSwitchEngine(engineKey);
    }
  };

  return (
    <div
      className="glass-card animate-fade-in adaptive-pos-switcher-bar"
      style={{
        padding: '0.65rem 0.9rem',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(99, 102, 241, 0.07) 100%)',
        border: '1.5px solid rgba(99, 102, 241, 0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
        flexWrap: 'wrap',
        marginBottom: '0.75rem',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.12)'
      }}
    >
      {/* Left: Template Context & Status Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {onBackToDashboard && (
          <button
            type="button"
            onClick={onBackToDashboard}
            className="btn btn-secondary press-scale"
            style={{
              padding: '5px 9px',
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div
            style={{
              padding: '4px 8px',
              borderRadius: '8px',
              background: isTemplateCattle ? 'rgba(16, 185, 129, 0.18)' : isTemplatePharmacy ? 'rgba(6, 182, 212, 0.18)' : 'rgba(99, 102, 241, 0.18)',
              color: isTemplateCattle ? '#10b981' : isTemplatePharmacy ? '#06b6d4' : '#818cf8',
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

          <span
            className="badge"
            style={{
              fontSize: '0.66rem',
              fontWeight: '800',
              background: isAutoMatched ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              color: isAutoMatched ? '#10b981' : '#f59e0b',
              border: isAutoMatched ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(245, 158, 11, 0.35)'
            }}
          >
            {isAutoMatched ? (lang === 'bn' ? '⚡ অ্যাডাপ্টিভ অটো' : 'Auto-Adaptive') : (lang === 'bn' ? '🔄 ওভাররাইড' : 'Manual')}
          </span>
        </div>
      </div>

      {/* Middle: The 3 Dedicated POS Mode Switcher Buttons */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'var(--bg-secondary)',
          padding: '4px',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          overflowX: 'auto',
          maxWidth: '100%'
        }}
      >
        {/* 1. General Retail POS */}
        <button
          type="button"
          onClick={() => handleSelectEngine('retail')}
          className="press-scale"
          style={{
            padding: '6px 12px',
            borderRadius: '9px',
            fontSize: '0.78rem',
            fontWeight: '800',
            border: activeEngine === 'retail' ? '1.5px solid #6366f1' : '1px solid transparent',
            background: activeEngine === 'retail' ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(79, 70, 229, 0.35))' : 'transparent',
            color: activeEngine === 'retail' ? '#ffffff' : 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap',
            boxShadow: activeEngine === 'retail' ? '0 2px 8px rgba(99, 102, 241, 0.3)' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          <span>🏪</span>
          <span>{lang === 'bn' ? 'সাধারণ রিটেইল POS' : 'Retail POS'}</span>
          {activeEngine === 'retail' && <Check size={13} style={{ color: '#818cf8' }} />}
        </button>

        {/* 2. Cattle & Dairy Farm POS */}
        <button
          type="button"
          onClick={() => handleSelectEngine('cattle')}
          className="press-scale"
          style={{
            padding: '6px 12px',
            borderRadius: '9px',
            fontSize: '0.78rem',
            fontWeight: '800',
            border: activeEngine === 'cattle' ? '1.5px solid #10b981' : '1px solid transparent',
            background: activeEngine === 'cattle' ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(5, 150, 105, 0.35))' : 'transparent',
            color: activeEngine === 'cattle' ? '#ffffff' : 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap',
            boxShadow: activeEngine === 'cattle' ? '0 2px 8px rgba(16, 185, 129, 0.3)' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          <span>🐄</span>
          <span>{lang === 'bn' ? 'খামার ও ডেইরি POS' : 'Cattle & Dairy POS'}</span>
          {activeEngine === 'cattle' && <Check size={13} style={{ color: '#10b981' }} />}
        </button>

        {/* 3. Pharmacy & Healthcare FEFO POS */}
        <button
          type="button"
          onClick={() => handleSelectEngine('pharmacy')}
          className="press-scale"
          style={{
            padding: '6px 12px',
            borderRadius: '9px',
            fontSize: '0.78rem',
            fontWeight: '800',
            border: activeEngine === 'pharmacy' ? '1.5px solid #06b6d4' : '1px solid transparent',
            background: activeEngine === 'pharmacy' ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.25), rgba(13, 148, 136, 0.35))' : 'transparent',
            color: activeEngine === 'pharmacy' ? '#ffffff' : 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap',
            boxShadow: activeEngine === 'pharmacy' ? '0 2px 8px rgba(6, 182, 212, 0.3)' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          <span>💊</span>
          <span>{lang === 'bn' ? 'ফার্মেসি ও মেডিকেল POS' : 'Pharmacy POS'}</span>
          {activeEngine === 'pharmacy' && <Check size={13} style={{ color: '#06b6d4' }} />}
        </button>
      </div>

      {/* Right: Quick Template Customizer Button */}
      {onOpenTemplateManager && (
        <button
          type="button"
          onClick={onOpenTemplateManager}
          className="btn btn-secondary press-scale"
          style={{
            padding: '5px 10px',
            borderRadius: '8px',
            fontSize: '0.74rem',
            fontWeight: '700',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-primary)',
            color: 'var(--text-main)',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            cursor: 'pointer'
          }}
          title={lang === 'bn' ? 'দোকানের টেমপ্লেট পরিবর্তন বা ফিচার কাস্টমাইজ করুন' : 'Change Store Template'}
        >
          <Sliders size={13} />
          <span>{lang === 'bn' ? 'টেমপ্লেট কাস্টমাইজ' : 'Customizer'}</span>
        </button>
      )}
    </div>
  );
};
