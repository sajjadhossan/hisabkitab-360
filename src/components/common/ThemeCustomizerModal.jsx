import React, { useState } from 'react';
import {
  Palette,
  X,
  Check,
  Sun,
  Moon,
  Smartphone,
  Type,
  Eye,
  Sliders,
  Receipt,
  Sparkles,
  LayoutGrid
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { soundService } from '../../services/soundService';

export const ThemeCustomizerModal = ({ isOpen, onClose }) => {
  const {
    theme = 'dark',
    setTheme,
    brandAccent = 'emerald',
    setBrandAccent,
    fontScale = '100',
    setFontScale,
    highContrast = false,
    setHighContrast,
    densityMode = 'standard',
    toggleDensityMode,
    invoiceStyle = 'thermal',
    setInvoiceStyle,
    customMobileNav = ['pos', 'debts', 'inventory', 'daily_expenses', 'crm'],
    updateCustomMobileNav,
    lang = 'bn'
  } = useApp() || {};

  const [activeSubTab, setActiveSubTab] = useState('themes');

  if (!isOpen) return null;

  const themeOptions = [
    {
      id: 'dark',
      nameBn: 'ডিপ ডার্ক (ডিফল্ট)',
      nameEn: 'Deep Dark (Default)',
      descBn: 'প্রিমিয়াম রয়্যাল ইন্ডিগো ডার্ক মোড',
      bg: '#0a0d14',
      card: '#121826',
      border: 'rgba(99, 102, 241, 0.4)',
      accent: '#6366f1'
    },
    {
      id: 'oled',
      nameBn: 'ওলেড পিওর ব্ল্যাক',
      nameEn: 'OLED Pitch Black',
      descBn: '১০০% ব্যাটারি সেভার ট্রু-ব্ল্যাক',
      bg: '#000000',
      card: '#050505',
      border: 'rgba(255, 255, 255, 0.3)',
      accent: '#ffffff'
    },
    {
      id: 'cyber_slate',
      nameBn: 'সাইবার স্লেট',
      nameEn: 'Cyber Slate',
      descBn: 'ইলেকট্রিক নেভি ব্লু ও সাইবার লুক',
      bg: '#0b1329',
      card: '#12203c',
      border: 'rgba(56, 189, 248, 0.4)',
      accent: '#38bdf8'
    },
    {
      id: 'luxury_gold',
      nameBn: 'লাক্সারি গোল্ড',
      nameEn: 'Luxury Gold',
      descBn: 'রয়্যাল অবসিডিয়ান ও গোল্ডেন আভা',
      bg: '#0c0a09',
      card: '#1c1917',
      border: 'rgba(245, 158, 11, 0.45)',
      accent: '#f59e0b'
    },
    {
      id: 'emerald_matrix',
      nameBn: 'এমেরাল্ড ম্যাট্রিক্স',
      nameEn: 'Emerald Matrix',
      descBn: 'নিয়ন সবুজ ও ডার্ক কার্বন স্টাইল',
      bg: '#021a12',
      card: '#062e20',
      border: 'rgba(16, 185, 129, 0.45)',
      accent: '#10b981'
    },
    {
      id: 'nordic_clean',
      nameBn: 'নর্ডিক ক্লিন (ডে মোড)',
      nameEn: 'Nordic Clean (Day)',
      descBn: 'স্ক্যান্ডিনেভিয়ান ক্রিস্টাল হোয়াইট',
      bg: '#f4f5f7',
      card: '#ffffff',
      border: 'rgba(209, 213, 219, 0.9)',
      accent: '#2563eb',
      isLight: true
    },
    {
      id: 'light',
      nameBn: 'ক্লাসিক লাইট',
      nameEn: 'Classic Light',
      descBn: 'পরিষ্কার ও উজ্জ্বল দিনের আলো থিম',
      bg: '#f8fafc',
      card: '#ffffff',
      border: 'rgba(226, 232, 240, 0.95)',
      accent: '#4f46e5',
      isLight: true
    }
  ];

  const accentOptions = [
    { id: 'emerald', label: 'এমেরাল্ড গ্রিন', color: '#10b981' },
    { id: 'sapphire', label: 'স্যাফায়ার ব্লু', color: '#0284c7' },
    { id: 'amethyst', label: 'অ্যামেথিস্ট পার্পল', color: '#9333ea' },
    { id: 'ruby', label: 'রুবি রেড', color: '#e11d48' },
    { id: 'amber', label: 'রয়্যাল অ্যাম্বার', color: '#d97706' }
  ];

  const fontOptions = [
    { id: '100', label: '১০০% সাধারণ (Standard)', desc: 'স্বাভাবিক ফন্ট সাইজ' },
    { id: '115', label: '১১৫% বড় (Large)', desc: 'সহজে পড়ার জন্য উপযোগী' },
    { id: '130', label: '১৩০% এক্সট্রা লার্জ', desc: 'চশমা বা দূর থেকে দেখার জন্য' }
  ];

  const invoiceOptions = [
    { id: 'thermal', title: 'থার্মাল স্লিপ (Thermal 58/80mm)', desc: 'দ্রুত কাউন্টার বিক্রয় ও ছোট কাগজের জন্য সেরা' },
    { id: 'classic', title: 'ক্লাসিক শপ মেমো (Classic Pad)', desc: 'ঐতিহ্যবাহী দোকান ক্যাশ মেমো ফরম্যাট' },
    { id: 'gst', title: 'করপোরেট চালান (Corporate Tax/VAT)', desc: 'মূসক ৬.৩ ও ট্যাক্স কমপ্লায়েন্স ফরম্যাট' },
    { id: 'a4', title: 'মডার্ন A4 কিউআর ইনভয়েস (Modern A4 QR)', desc: 'অনলাইন কিউআর ভেরিফিকেশনসহ পূর্ণাঙ্গ চালান' }
  ];

  const availableNavTabs = [
    { id: 'pos', name: 'POS কাউন্টার' },
    { id: 'debts', name: 'দেনা-পাওনা' },
    { id: 'inventory', name: 'ইনভেন্টরি' },
    { id: 'daily_expenses', name: 'দৈনিক খরচ' },
    { id: 'crm', name: 'কাস্টমার' },
    { id: 'invoices', name: 'ইনভয়েস' },
    { id: 'healthcare', name: 'হেলথকেয়ার' },
    { id: 'reports', name: 'রিপোর্ট' }
  ];

  const handleToggleNavTab = (tabId) => {
    soundService.playBeep();
    if (customMobileNav.includes(tabId)) {
      if (customMobileNav.length <= 4) return; // Keep at least 4
      updateCustomMobileNav(customMobileNav.filter((t) => t !== tabId));
    } else {
      if (customMobileNav.length >= 6) return; // Max 6 tabs
      updateCustomMobileNav([...customMobileNav, tabId]);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100dvh',
        background: 'rgba(5, 10, 20, 0.8)',
        backdropFilter: 'blur(16px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90dvh',
          background: 'linear-gradient(145deg, #131c2e, #0b111d)',
          borderRadius: '24px',
          border: '1.5px solid rgba(56, 189, 248, 0.3)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(56, 189, 248, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'scaleUp 0.18s ease-out'
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(255, 255, 255, 0.02)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(99, 102, 241, 0.2))',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8'
              }}
            >
              <Palette size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#f8fafc' }}>
                {lang === 'bn' ? 'থিম ও ডিসপ্লে কাস্টমাইজেশন' : 'Theme & Display Customizer'}
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                {lang === 'bn' ? 'আপনার ব্যক্তিগত পছন্দ অনুযায়ী সফটওয়্যারের রূপ সাজান' : 'Personalize aesthetics, fonts, and controls'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Sub-Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            padding: '10px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            background: 'rgba(0, 0, 0, 0.2)',
            overflowX: 'auto'
          }}
        >
          {[
            { id: 'themes', label: 'কালার থিম', icon: Palette },
            { id: 'fonts', label: 'ফন্ট ও ভিশন', icon: Type },
            { id: 'invoices', label: 'ইনভয়েস স্টাইল', icon: Receipt },
            { id: 'nav', label: 'মোবাইল বটম বার', icon: Smartphone }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  soundService.playBeep();
                  setActiveSubTab(tab.id);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '10px',
                  background: isActive ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'transparent',
                  border: isActive ? '1px solid #38bdf8' : '1px solid transparent',
                  color: isActive ? '#ffffff' : '#94a3b8',
                  fontWeight: '600',
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Body Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {activeSubTab === 'themes' && (
            <>
              {/* Palette Selection Grid */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#cbd5e1', marginBottom: '12px' }}>
                  🎨 মূল কালার প্যালেট নির্বাচন করুন
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '12px' }}>
                  {themeOptions.map((opt) => {
                    const isSelected = theme === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => {
                          soundService.playSuccessChime();
                          setTheme(opt.id);
                        }}
                        style={{
                          borderRadius: '14px',
                          border: isSelected ? '2px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                          background: opt.bg,
                          padding: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          boxShadow: isSelected ? '0 0 16px rgba(56, 189, 248, 0.35)' : 'none',
                          transition: 'all 0.15s ease',
                          position: 'relative'
                        }}
                      >
                        {isSelected && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '8px',
                              right: '8px',
                              background: '#0284c7',
                              borderRadius: '50%',
                              width: '20px',
                              height: '20px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#fff'
                            }}
                          >
                            <Check size={13} />
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: opt.accent }} />
                          <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: opt.card, border: '1px solid rgba(255,255,255,0.2)' }} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.9rem', fontWeight: '700', color: opt.isLight ? '#0f172a' : '#f8fafc' }}>
                            {lang === 'bn' ? opt.nameBn : opt.nameEn}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: opt.isLight ? '#64748b' : '#94a3b8', marginTop: '2px' }}>
                            {opt.descBn}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Brand Accent Color */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#cbd5e1', marginBottom: '12px' }}>
                  ✨ ব্র্যান্ড অ্যাকসেন্ট হাইলাইট কালার
                </label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {accentOptions.map((accent) => {
                    const isSelected = brandAccent === accent.id;
                    return (
                      <button
                        key={accent.id}
                        onClick={() => {
                          soundService.playSuccessChime();
                          setBrandAccent(accent.id);
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 16px',
                          borderRadius: '12px',
                          background: isSelected ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                          border: isSelected ? `2px solid ${accent.color}` : '1px solid rgba(255, 255, 255, 0.08)',
                          color: '#f8fafc',
                          fontWeight: '600',
                          fontSize: '0.84rem',
                          cursor: 'pointer'
                        }}
                      >
                        <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: accent.color }} />
                        <span>{accent.label}</span>
                        {isSelected && <Check size={14} style={{ color: accent.color }} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {activeSubTab === 'fonts' && (
            <>
              {/* Font Scaler */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#cbd5e1', marginBottom: '12px' }}>
                  🔍 লেখার আকার স্কেলিং (Font Accessibility Scaling)
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {fontOptions.map((f) => {
                    const isSelected = fontScale === f.id;
                    return (
                      <div
                        key={f.id}
                        onClick={() => {
                          soundService.playSuccessChime();
                          setFontScale(f.id);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 18px',
                          borderRadius: '14px',
                          background: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                          border: isSelected ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                          cursor: 'pointer'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '0.94rem', fontWeight: '700', color: isSelected ? '#38bdf8' : '#f8fafc' }}>
                            {f.label}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{f.desc}</div>
                        </div>
                        {isSelected && <Check size={18} style={{ color: '#38bdf8' }} />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* High Contrast Sunlight Mode */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  borderRadius: '16px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: '700', color: '#f8fafc' }}>
                    ☀️ হাই-কনট্রাস্ট সূর্যের আলো মোড (Outdoor Sunlight Visibility)
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
                    বাইরে রোদ বা ডেলিভারির সময় স্ক্রিনের লেখা স্পষ্ট পড়ার জন্য উচ্চ কনট্রাস্ট বর্ডার
                  </div>
                </div>
                <button
                  onClick={() => {
                    soundService.playBeep();
                    setHighContrast(!highContrast);
                  }}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '10px',
                    background: highContrast ? '#10b981' : 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    color: '#fff',
                    fontWeight: '700',
                    fontSize: '0.84rem',
                    cursor: 'pointer'
                  }}
                >
                  {highContrast ? 'সক্রিয় (ON)' : 'বন্ধ (OFF)'}
                </button>
              </div>

              {/* Data Density Mode */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  borderRadius: '16px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: '700', color: '#f8fafc' }}>
                    📊 ডাটা ডেনসিটি (High-Density Compact Grid)
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
                    এক স্ক্রিনে বেশি পণ্য ও হিসাব দেখার জন্য কমপ্যাক্ট মোড
                  </div>
                </div>
                <button
                  onClick={() => {
                    soundService.playBeep();
                    toggleDensityMode();
                  }}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '10px',
                    background: densityMode === 'compact' ? '#0284c7' : 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    color: '#fff',
                    fontWeight: '700',
                    fontSize: '0.84rem',
                    cursor: 'pointer'
                  }}
                >
                  {densityMode === 'compact' ? 'কমপ্যাক্ট (Compact)' : 'স্ট্যান্ডার্ড (Spacious)'}
                </button>
              </div>
            </>
          )}

          {activeSubTab === 'invoices' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#cbd5e1', marginBottom: '12px' }}>
                🧾 ক্যাশ মেমো ও ইনভয়েস লেআউট প্রিসেট
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {invoiceOptions.map((inv) => {
                  const isSelected = invoiceStyle === inv.id;
                  return (
                    <div
                      key={inv.id}
                      onClick={() => {
                        soundService.playSuccessChime();
                        setInvoiceStyle(inv.id);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 18px',
                        borderRadius: '14px',
                        background: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                        border: isSelected ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                        cursor: 'pointer'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.94rem', fontWeight: '700', color: isSelected ? '#38bdf8' : '#f8fafc' }}>
                          {inv.title}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>{inv.desc}</div>
                      </div>
                      {isSelected && <Check size={18} style={{ color: '#38bdf8' }} />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeSubTab === 'nav' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#cbd5e1', marginBottom: '6px' }}>
                📱 মোবাইলের নিচের বটম মেনু কাস্টমাইজেশন
              </label>
              <p style={{ margin: '0 0 14px 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                আপনার মোবাইলের নিচের বারে কোন কোন মেনু থাকবে তা নির্বাচন করুন (৪ থেকে ৬টি মেনু):
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
                {availableNavTabs.map((t) => {
                  const isChecked = customMobileNav.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      onClick={() => handleToggleNavTab(t.id)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '12px',
                        background: isChecked ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                        border: isChecked ? '1.5px solid #10b981' : '1px solid rgba(255, 255, 255, 0.08)',
                        color: isChecked ? '#10b981' : '#94a3b8',
                        fontWeight: '700',
                        fontSize: '0.86rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <span>{t.name}</span>
                      {isChecked && <Check size={15} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(0, 0, 0, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
            {lang === 'bn' ? 'সকল পরিবর্তন তাৎক্ষণিক ও স্বয়ংক্রিয়ভাবে সংরক্ষিত হয়েছে' : 'All settings saved automatically'}
          </span>
          <button
            onClick={() => {
              soundService.playSuccessChime();
              onClose();
            }}
            style={{
              padding: '9px 24px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              border: 'none',
              color: '#ffffff',
              fontWeight: '800',
              fontSize: '0.88rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
            }}
          >
            {lang === 'bn' ? 'ঠিক আছে (Done)' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};
