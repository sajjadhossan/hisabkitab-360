import React from 'react';
import { ChevronRight, Home, LayoutGrid, ShoppingCart, Boxes, Users, HandCoins, FileText, Settings, HeartPulse } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const DynamicBreadcrumbs = () => {
  const { activeTab, setActiveTab, profile, lang } = useApp() || {};

  const tabLabels = {
    pos: { bn: 'পয়েন্ট অব সেল (POS)', en: 'Point of Sale (POS)', icon: ShoppingCart },
    debts: { bn: 'দেনা-পাওনা খাতা', en: 'Debt Khata', icon: HandCoins },
    inventory: { bn: 'পণ্য ও ইনভেন্টরি', en: 'Inventory & Stock', icon: Boxes },
    invoices: { bn: 'চালান ও মেমো', en: 'Invoices & Receipts', icon: FileText },
    quotations: { bn: 'কোটেশন খাতা', en: 'Quotations', icon: FileText },
    crm: { bn: 'গ্রাহক ও সাপ্লায়ার', en: 'CRM & Contacts', icon: Users },
    healthcare: { bn: 'হাসপাতাল ও ফার্মাসি হাব', en: 'Healthcare Hub', icon: HeartPulse },
    reports: { bn: 'অ্যানালিটিক্স ও রিপোর্ট', en: 'Periodic Reports', icon: LayoutGrid },
    settings: { bn: 'সিস্টেম সেটিংস', en: 'Settings', icon: Settings },
    daily_expenses: { bn: 'দৈনিক খরচের খাতা', en: 'Daily Expenses', icon: HandCoins },
    personal_dashboard: { bn: 'পার্সোনাল ড্যাশবোর্ড', en: 'Personal Dashboard', icon: Home },
    family_expenses: { bn: 'পারিবারিক খরচের হিসাব', en: 'Family Expenses', icon: Users }
  };

  const current = tabLabels[activeTab] || { bn: activeTab, en: activeTab, icon: LayoutGrid };
  const IconComponent = current.icon;

  const profileLabel = profile === 'personal'
    ? (lang === 'bn' ? 'ব্যক্তিগত মোড' : 'Personal')
    : (lang === 'bn' ? 'ব্যবসায়িক মোড' : 'Business');

  return (
    <nav
      aria-label="Breadcrumb"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 14px',
        margin: '0 0 12px 0',
        borderRadius: '12px',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        fontSize: '0.82rem',
        color: 'var(--text-muted, #94a3b8)',
        backdropFilter: 'blur(8px)',
        overflowX: 'auto',
        whiteSpace: 'nowrap'
      }}
      className="dynamic-breadcrumb-bar"
    >
      <button
        onClick={() => setActiveTab(profile === 'personal' ? 'personal_dashboard' : 'pos')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          background: 'none',
          border: 'none',
          color: 'var(--text-muted, #94a3b8)',
          cursor: 'pointer',
          padding: '2px 4px',
          borderRadius: '6px',
          fontSize: 'inherit',
          fontWeight: '500'
        }}
        title={lang === 'bn' ? 'হোমে ফিরে যান' : 'Go to Home'}
      >
        <Home size={13} style={{ color: '#10b981' }} />
        <span>{profileLabel}</span>
      </button>

      <ChevronRight size={13} style={{ opacity: 0.5, flexShrink: 0 }} />

      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          color: 'var(--text-main, #f8fafc)',
          fontWeight: '600'
        }}
      >
        <IconComponent size={13} style={{ color: '#38bdf8' }} />
        <span>{lang === 'bn' ? current.bn : current.en}</span>
      </div>
    </nav>
  );
};
