import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  ShoppingCart,
  Boxes,
  HandCoins,
  FileText,
  Users,
  Settings,
  HeartPulse,
  LayoutGrid,
  ShieldAlert,
  Volume2,
  VolumeX,
  Lock,
  Plus,
  ArrowRight,
  Sparkles,
  Command,
  Palette,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { soundService } from '../../services/soundService';

export const CommandPaletteModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const {
    setActiveTab,
    products = [],
    crmCustomers = [],
    lockScreen,
    openThemeCustomizer,
    lang = 'bn'
  } = useApp() || {};

  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Global Ctrl+K / Cmd+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      soundService.playBeep();
      setSearchQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 50);
    }
  }, [isOpen]);

  // Master command & navigation registry
  const commands = useMemo(() => {
    const list = [
      // Primary ERP Navigation
      {
        id: 'nav_pos',
        category: lang === 'bn' ? 'নেভিগেশন' : 'Navigation',
        title: lang === 'bn' ? 'পয়েন্ট অব সেল (POS) কাউন্টার' : 'POS Checkout Counter',
        subtitle: lang === 'bn' ? 'নতুন বিক্রি ও দ্রুত ক্যাশ মেমো' : 'Fast checkout & sales',
        icon: ShoppingCart,
        action: () => setActiveTab('pos')
      },
      {
        id: 'nav_inventory',
        category: lang === 'bn' ? 'নেভিগেশন' : 'Navigation',
        title: lang === 'bn' ? 'পণ্য ও ইনভেন্টরি স্টক' : 'Inventory & Stock Management',
        subtitle: lang === 'bn' ? 'স্টক ব্যালেন্স, ক্রয় ও পণ্য তালিকা' : 'Stock level & purchase',
        icon: Boxes,
        action: () => setActiveTab('inventory')
      },
      {
        id: 'nav_debts',
        category: lang === 'bn' ? 'নেভিগেশন' : 'Navigation',
        title: lang === 'bn' ? 'দেনা-পাওনা বাকি খাতা' : 'Debt Khata & Customer Due',
        subtitle: lang === 'bn' ? 'বকেয়া হিসাব ও পাওনা তাগাদা' : 'Customer & supplier ledger',
        icon: HandCoins,
        action: () => setActiveTab('debts')
      },
      {
        id: 'nav_invoices',
        category: lang === 'bn' ? 'নেভিগেশন' : 'Navigation',
        title: lang === 'bn' ? 'চালান ও ইনভয়েস হিস্ট্রি' : 'Invoices & Sales History',
        subtitle: lang === 'bn' ? 'সকল বিক্রিত মেমো ও বিল প্রিন্ট' : 'All sale invoices & print',
        icon: FileText,
        action: () => setActiveTab('invoices')
      },
      {
        id: 'nav_crm',
        category: lang === 'bn' ? 'নেভিগেশন' : 'Navigation',
        title: lang === 'bn' ? 'গ্রাহক ও সাপ্লায়ার (CRM)' : 'CRM & Contact Directory',
        subtitle: lang === 'bn' ? 'গ্রাহকদের ফোন ও লেনদেন প্রোফাইল' : 'Customer phone & history',
        icon: Users,
        action: () => setActiveTab('crm')
      },
      {
        id: 'nav_daily_expenses',
        category: lang === 'bn' ? 'নেভিগেশন' : 'Navigation',
        title: lang === 'bn' ? 'দৈনিক খরচের খাতা' : 'Daily Expenses Tracker',
        subtitle: lang === 'bn' ? 'দোকান ও ব্যক্তিগত খরচের হিসাব' : 'Store & daily expense logs',
        icon: HandCoins,
        action: () => setActiveTab('daily_expenses')
      },
      {
        id: 'nav_reports',
        category: lang === 'bn' ? 'নেভিগেশন' : 'Navigation',
        title: lang === 'bn' ? 'লাভ-ক্ষতি ও ব্যবসায়িক রিপোর্ট' : 'Profit & Loss Periodic Reports',
        subtitle: lang === 'bn' ? 'মাসিক ও বার্ষিক আর্থিক বিবরণী' : 'Financial summary & analytics',
        icon: LayoutGrid,
        action: () => setActiveTab('reports')
      },
      {
        id: 'nav_healthcare',
        category: lang === 'bn' ? 'নেভিগেশন' : 'Navigation',
        title: lang === 'bn' ? 'হাসপাতাল ও ফার্মাসি হাব' : 'Healthcare & Pharmacy Suite',
        subtitle: lang === 'bn' ? 'ফার্মাসি, ডাক্তার চেম্বার ও ল্যাব' : 'Pharmacy FEFO & Chamber',
        icon: HeartPulse,
        action: () => setActiveTab('healthcare')
      },
      {
        id: 'nav_settings',
        category: lang === 'bn' ? 'নেভিগেশন' : 'Navigation',
        title: lang === 'bn' ? 'সিস্টেম ও ব্যবসা সেটিংস' : 'System & Business Settings',
        subtitle: lang === 'bn' ? 'দোকানের নাম, ভ্যাট ও প্রিন্টার কনফিগ' : 'Shop profile & print options',
        icon: Settings,
        action: () => setActiveTab('settings')
      },

      // Quick Utility Actions
      {
        id: 'act_theme_customizer',
        category: lang === 'bn' ? 'কুইক অ্যাকশন' : 'Quick Actions',
        title: lang === 'bn' ? '🎨 থিম ও ডিসপ্লে কাস্টমাইজেশন' : '🎨 Theme & Display Customizer',
        subtitle: lang === 'bn' ? 'কালার প্যালেট, ওলেড মোড, ফন্ট স্কেল ও মেমো স্টাইল' : 'Color palette, OLED mode, font scale & invoices',
        icon: Palette,
        action: () => openThemeCustomizer && openThemeCustomizer()
      },
      {
        id: 'act_lock',
        category: lang === 'bn' ? 'কুইক অ্যাকশন' : 'Quick Actions',
        title: lang === 'bn' ? 'স্ক্রিন লক করুন' : 'Lock Application Screen',
        subtitle: lang === 'bn' ? 'তাৎক্ষণিক প্রাইভেসি ও নিরাপত্তা মোড' : 'Instant privacy lock',
        icon: Lock,
        action: () => lockScreen && lockScreen()
      },
      {
        id: 'act_sound',
        category: lang === 'bn' ? 'কুইক অ্যাকশন' : 'Quick Actions',
        title: soundService.isSoundEnabled()
          ? (lang === 'bn' ? 'সাউন্ড বন্ধ করুন' : 'Mute System Sounds')
          : (lang === 'bn' ? 'সাউন্ড চালু করুন' : 'Enable System Sounds'),
        subtitle: lang === 'bn' ? 'বিপ ও চিম সাউন্ড টগল' : 'Toggle audio feedback',
        icon: soundService.isSoundEnabled() ? VolumeX : Volume2,
        action: () => {
          soundService.toggleSound();
          soundService.playSuccessChime();
        }
      }
    ];

    // Append Matching Products if search query entered
    if (searchQuery.trim().length >= 2) {
      const q = searchQuery.toLowerCase();
      const matchedProds = (products || [])
        .filter((p) => (p.name || '').toLowerCase().includes(q) || (p.barcode || '').includes(q))
        .slice(0, 5)
        .map((p) => ({
          id: `prod_${p.id}`,
          category: lang === 'bn' ? 'ইনভেন্টরি পণ্য' : 'Products',
          title: p.name,
          subtitle: `৳${p.sellingPrice || p.price || 0} • স্টক: ${p.stock || 0} ${p.unit || ''}`,
          icon: Boxes,
          action: () => {
            setActiveTab('inventory');
          }
        }));

      const matchedCusts = (crmCustomers || [])
        .filter((c) => (c.name || '').toLowerCase().includes(q) || (c.phone || '').includes(q))
        .slice(0, 3)
        .map((c) => ({
          id: `cust_${c.id}`,
          category: lang === 'bn' ? 'গ্রাহক' : 'Customers',
          title: c.name,
          subtitle: `ফোন: ${c.phone || '-'} • বাকি: ৳${c.totalDue || 0}`,
          icon: Users,
          action: () => {
            setActiveTab('crm');
          }
        }));

      return [...matchedProds, ...matchedCusts, ...list];
    }

    return list;
  }, [lang, searchQuery, products, crmCustomers, setActiveTab, lockScreen]);

  // Filter commands by search query
  const filteredCommands = useMemo(() => {
    if (!searchQuery.trim()) return commands;
    const q = searchQuery.toLowerCase();
    return commands.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.subtitle.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
    );
  }, [commands, searchQuery]);

  // Keyboard navigation inside palette
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredCommands.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredCommands.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        soundService.playSuccessChime();
        filteredCommands[selectedIndex].action();
        setIsOpen(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100dvh',
        background: 'rgba(5, 10, 20, 0.75)',
        backdropFilter: 'blur(16px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '12vh 16px 24px 16px',
        animation: 'fadeIn 0.15s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsOpen(false);
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '620px',
          background: 'linear-gradient(135deg, rgba(20, 30, 48, 0.96), rgba(15, 23, 42, 0.98))',
          borderRadius: '20px',
          border: '1.5px solid rgba(56, 189, 248, 0.35)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 35px rgba(56, 189, 248, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'scaleUp 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Search Bar Input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <Search size={20} style={{ color: '#38bdf8', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder={lang === 'bn' ? 'যেকোনো মেনু, পণ্য, বা কাজ খুঁজুন... (Ctrl + K)' : 'Search anything... (Ctrl + K)'}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '1.05rem',
              color: '#f8fafc',
              fontWeight: '500'
            }}
          />
          <div
            style={{
              padding: '3px 8px',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.08)',
              fontSize: '0.72rem',
              color: '#94a3b8',
              fontWeight: '700',
              letterSpacing: '0.04em'
            }}
          >
            ESC
          </div>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          style={{
            maxHeight: '380px',
            overflowY: 'auto',
            padding: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}
        >
          {filteredCommands.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8' }}>
              <p style={{ margin: 0, fontSize: '0.92rem' }}>
                {lang === 'bn' ? 'কোনো ফলাফল পাওয়া যায়নি' : 'No matching commands or products found'}
              </p>
            </div>
          ) : (
            filteredCommands.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const IconComp = item.icon || Sparkles;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    soundService.playSuccessChime();
                    item.action();
                    setIsOpen(false);
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    background: isSelected
                      ? 'linear-gradient(90deg, rgba(56, 189, 248, 0.18), rgba(99, 102, 241, 0.12))'
                      : 'transparent',
                    border: isSelected ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid transparent',
                    transition: 'all 0.12s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: isSelected ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isSelected ? '#38bdf8' : '#94a3b8',
                        flexShrink: 0
                      }}
                    >
                      <IconComp size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.92rem', fontWeight: '600', color: isSelected ? '#ffffff' : '#e2e8f0' }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: isSelected ? '#bae6fd' : '#94a3b8' }}>
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: '600',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        color: '#94a3b8'
                      }}
                    >
                      {item.category}
                    </span>
                    {isSelected && <ArrowRight size={15} style={{ color: '#38bdf8' }} />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div
          style={{
            padding: '10px 18px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            background: 'rgba(0, 0, 0, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            color: '#64748b'
          }}
        >
          <div style={{ display: 'flex', gap: '14px' }}>
            <span><strong style={{ color: '#94a3b8' }}>↑↓</strong> নেভিগেট</span>
            <span><strong style={{ color: '#94a3b8' }}>↵ Enter</strong> সিলেক্ট</span>
            <span><strong style={{ color: '#94a3b8' }}>ESC</strong> বন্ধ</span>
          </div>
          <span style={{ color: '#38bdf8', fontWeight: '600' }}>হিসাবকিতাব ৩৬০ স্পটলাইট</span>
        </div>
      </div>
    </div>
  );
};
