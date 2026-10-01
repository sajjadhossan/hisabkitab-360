import React, { useState, Suspense, lazy } from 'react';
import { AuthProvider } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/auth/AuthModal';
import { NotificationToast } from './components/common/NotificationToast';
import { ReceiptModal } from './components/common/ReceiptModal';
import { InvoicePrintModal } from './components/common/InvoicePrintModal';
import { QuotationPrintModal } from './components/common/QuotationPrintModal';
import { BarcodePrintModal } from './components/common/BarcodePrintModal';
import { BarcodeScannerModal } from './components/common/BarcodeScannerModal';
import { ShareInvoiceModal } from './components/common/ShareInvoiceModal';
import { HelpSupportModal } from './components/common/HelpSupportModal';
import { InvoiceVerificationView } from './components/common/InvoiceVerificationView';
import { GlobalVoiceWidget } from './components/common/GlobalVoiceWidget';
import { HealthcareProvider } from './context/HealthcareContext';
import { useAuth } from './context/AuthContext';

// Helper for code-splitting named exports
const lazyNamed = (importFn, name) => lazy(() => importFn().then(m => ({ default: m[name] })));

// Common Components (Code-split)
const DebtKhataManager = lazyNamed(() => import('./components/common/DebtKhataManager'), 'DebtKhataManager');
const MasterHub = lazyNamed(() => import('./components/common/MasterHub'), 'MasterHub');

// Personal Components (Code-split)
const PersonalDashboard = lazyNamed(() => import('./components/personal/PersonalDashboard'), 'PersonalDashboard');
const DailyExpenses = lazyNamed(() => import('./components/personal/DailyExpenses'), 'DailyExpenses');
const FamilyExpenses = lazyNamed(() => import('./components/personal/FamilyExpenses'), 'FamilyExpenses');
const PersonalEventsManager = lazyNamed(() => import('./components/personal/PersonalEventsManager'), 'PersonalEventsManager');
const PersonalIncome = lazyNamed(() => import('./components/personal/PersonalIncome'), 'PersonalIncome');
const PersonalAnalytics = lazyNamed(() => import('./components/personal/PersonalAnalytics'), 'PersonalAnalytics');

// Business Components (Code-split)
const BusinessDashboard = lazyNamed(() => import('./components/business/BusinessDashboard'), 'BusinessDashboard');
const POSTerminal = lazyNamed(() => import('./components/business/POSTerminal'), 'POSTerminal');
const InvoicesManager = lazyNamed(() => import('./components/business/InvoicesManager'), 'InvoicesManager');
const QuotationsManager = lazyNamed(() => import('./components/business/QuotationsManager'), 'QuotationsManager');
const InventoryManager = lazyNamed(() => import('./components/business/InventoryManager'), 'InventoryManager');
const ERPAcounts = lazyNamed(() => import('./components/business/ERPAcounts'), 'ERPAcounts');
const CRMCustomers = lazyNamed(() => import('./components/business/CRMCustomers'), 'CRMCustomers');
const HRPayroll = lazyNamed(() => import('./components/business/HRPayroll'), 'HRPayroll');
const BusinessSettings = lazyNamed(() => import('./components/business/BusinessSettings'), 'BusinessSettings');
const SRFieldManager = lazyNamed(() => import('./components/business/SRFieldManager'), 'SRFieldManager');
const BranchCashControlCenter = lazyNamed(() => import('./components/business/BranchCashControlCenter'), 'BranchCashControlCenter');
const SuperAdminPanel = lazyNamed(() => import('./components/admin/SuperAdminPanel'), 'SuperAdminPanel');
const HealthcareHub = lazy(() => import('./components/healthcare/HealthcareHub'));

// Shimmer skeleton loading fallback
const ViewLoadingFallback = () => (
  <div style={{ padding: '1.5rem', maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div className="shimmer-skeleton" style={{ height: '36px', width: '220px', borderRadius: '10px' }} />
      <div className="shimmer-skeleton" style={{ height: '36px', width: '140px', borderRadius: '10px' }} />
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
      <div className="shimmer-skeleton" style={{ height: '110px', borderRadius: '16px' }} />
      <div className="shimmer-skeleton" style={{ height: '110px', borderRadius: '16px' }} />
      <div className="shimmer-skeleton" style={{ height: '110px', borderRadius: '16px' }} />
      <div className="shimmer-skeleton" style={{ height: '110px', borderRadius: '16px' }} />
    </div>
    <div className="shimmer-skeleton" style={{ height: '320px', borderRadius: '16px' }} />
  </div>
);

const AppContent = () => {
  const { profile, activeTab, licenseInfo, setActiveTab, lang } = useApp();
  const { user, openAuthModal, isSuperAdmin } = useAuth();

  const [verifyParam, setVerifyParam] = useState(() => {
    return new URLSearchParams(window.location.search).get('verify');
  });
  const [tokenParam, setTokenParam] = useState(() => {
    return new URLSearchParams(window.location.search).get('data');
  });

  const handleBackToApp = () => {
    const url = new URL(window.location);
    url.searchParams.delete('verify');
    url.searchParams.delete('data');
    window.history.replaceState({}, '', url);
    setVerifyParam(null);
  };

  // If opened via QR code scan or link verification
  if (verifyParam) {
    return (
      <InvoiceVerificationView
        verifyId={verifyParam}
        tokenData={tokenParam}
        onBackToApp={handleBackToApp}
      />
    );
  }

  const renderContent = () => {
    // Strictly lock system until authenticated as requested by user
    if (!user) {
      return (
        <div style={{
          minHeight: '65vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '24px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '2px solid #ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.5rem',
            marginBottom: '1.25rem',
            boxShadow: '0 0 30px rgba(239, 68, 68, 0.25)',
            animation: 'pulse 2s infinite'
          }}>
            🔒
          </div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            borderRadius: '16px',
            background: 'rgba(239, 68, 68, 0.12)',
            color: '#ef4444',
            fontWeight: '700',
            fontSize: '0.8rem',
            marginBottom: '10px'
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
            <span>লাল বাতি: সিস্টেমে কোনো সক্রিয় লগইন নেই</span>
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '800', margin: '0 0 8px', color: 'var(--text-main)' }}>
            সুপাবেসের অনুমোদন ছাড়া সিস্টেমে প্রবেশ নিষেধ
          </h2>
          <p style={{ maxWidth: '520px', fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 1.5rem' }}>
            দোকানের হিসাব, পণ্য স্টক ও ক্যাশ কাউন্টারের তথ্য সম্পূর্ণ সুরক্ষিত রাখতে দয়া করে আপনার সুপাবেস একাউন্ট দিয়ে সাইন ইন করুন।
          </p>
          <button
            onClick={() => openAuthModal('login')}
            className="btn btn-primary"
            style={{
              padding: '12px 28px',
              fontSize: '1rem',
              fontWeight: '800',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              boxShadow: '0 4px 18px rgba(16, 185, 129, 0.4)',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            🔐 সাইন ইন করুন (Sign In)
          </button>
        </div>
      );
    }
    // Check if software is expired or suspended and current user is not super admin
    const isLockedOut = (licenseInfo?.status === 'expired' || licenseInfo?.status === 'suspended') && !isSuperAdmin && activeTab !== 'super_admin';
    if (isLockedOut) {
      return (
        <div style={{
          minHeight: '70vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <div style={{
            width: '85px',
            height: '85px',
            borderRadius: '24px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '2px solid #ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.5rem',
            marginBottom: '1.25rem',
            boxShadow: '0 0 30px rgba(239, 68, 68, 0.3)'
          }}>
            ⛔
          </div>
          <h2 style={{ fontSize: '1.7rem', fontWeight: '900', margin: '0 0 8px', color: '#ef4444' }}>
            {lang === 'bn' ? 'সফটওয়্যার লাইসেন্সের মেয়াদ শেষ হয়েছে' : 'Software License Expired'}
          </h2>
          <p style={{ maxWidth: '520px', fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 1.5rem' }}>
            {lang === 'bn'
              ? `আপনার প্রতিষ্ঠান "${licenseInfo?.clientShopName || 'দোকান'}" এর সাবস্ক্রিপশন মেয়াদ শেষ। সফটওয়্যারটি পুনরায় সচল করতে অবিলম্বে সফটওয়্যার প্রোভাইডারের সাথে যোগাযোগ করুন।`
              : 'Your software subscription has expired. Please contact the vendor to renew your license.'}
          </p>
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            padding: '1rem 1.5rem',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            textAlign: 'left',
            minWidth: '320px'
          }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>সফটওয়্যার প্রোভাইডার:</div>
            <div style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--text-main)', marginBottom: '8px' }}>
              {licenseInfo?.resellerName || 'হিসাব কিতাব ৩৬০ টেকনোলজিস'}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
              📞 হটলাইন: <strong>{licenseInfo?.resellerPhone || '+880 1700-000000'}</strong>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('super_admin')}
            className="btn"
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              border: '1px solid #ef4444',
              fontWeight: '800',
              cursor: 'pointer'
            }}
          >
            🛡️ ভেন্ডর মাস্টার পিন দিয়ে আনলক করুন
          </button>
        </div>
      );
    }

    // Super Admin & Master Control must always be accessible from any profile or operating mode
    if (activeTab === 'super_admin') {
      return <SuperAdminPanel />;
    }

    if (profile === 'personal') {
      switch (activeTab) {
        case 'dashboard':
          return <PersonalDashboard />;
        case 'daily':
          return <DailyExpenses />;
        case 'family':
          return <FamilyExpenses />;
        case 'events':
          return <PersonalEventsManager />;
        case 'debts':
          return <DebtKhataManager profile="personal" />;
        case 'income':
          return <PersonalIncome />;
        case 'analytics':
          return <PersonalAnalytics />;
        case 'super_admin':
          return <SuperAdminPanel />;
        default:
          return <PersonalDashboard />;
      }
    } else {
      switch (activeTab) {
        case 'dashboard':
          return <BusinessDashboard />;
        case 'pos':
          return <POSTerminal />;
        case 'debts':
          return <DebtKhataManager profile="business" />;
        case 'invoices':
          return <InvoicesManager />;
        case 'quotations':
          return <QuotationsManager />;
        case 'inventory':
          return <InventoryManager />;
        case 'erp':
          return <ERPAcounts />;
        case 'crm':
          return <CRMCustomers />;
        case 'hr':
          return <HRPayroll />;
        case 'sr':
          return <SRFieldManager />;
        case 'branch_control':
          return <BranchCashControlCenter />;
        case 'settings':
          return <BusinessSettings />;
        case 'healthcare':
          return <HealthcareHub />;
        case 'master_hub':
          return <MasterHub onNavigateToPos={() => setActiveTab('pos')} onNavigateToInventory={() => setActiveTab('inventory')} />;
        case 'super_admin':
          return <SuperAdminPanel />;
        default:
          return <BusinessDashboard />;
      }
    }
  };

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <Suspense fallback={<ViewLoadingFallback />}>
          {renderContent()}
        </Suspense>
      </main>
      <AuthModal />
      <ReceiptModal />
      <InvoicePrintModal />
      <QuotationPrintModal />
      <BarcodePrintModal />
      <BarcodeScannerModal />
      <ShareInvoiceModal />
      <HelpSupportModal />
      <NotificationToast />
      <GlobalVoiceWidget />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <HealthcareProvider>
          <AppContent />
        </HealthcareProvider>
      </AppProvider>
    </AuthProvider>
  );
}
