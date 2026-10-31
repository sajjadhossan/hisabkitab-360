import React from 'react';
import { Lock, AlertTriangle, MessageSquare, ArrowLeft, Zap, ShieldCheck } from 'lucide-react';
import {
  getActiveWorkspaceId,
  getTenantById,
  toggleTenantModule,
  checkIsSuperAdmin,
  SAAS_MODULES
} from '../../services/tenantManagerService';

export const ModuleLockedBySuperAdminCard = ({
  moduleId,
  isLight = false,
  lang = 'bn',
  onReturnToDashboard,
  onModuleUnlocked
}) => {
  const isEn = lang === 'en';
  const activeTenantId = getActiveWorkspaceId();
  const tenant = getTenantById(activeTenantId);
  const moduleMeta = SAAS_MODULES.find(m => m.id === moduleId) || {
    nameBn: 'এই সেবাটি',
    nameEn: 'This Module',
    descBn: 'উন্নত সাংগঠনিক ফিচার'
  };

  const isSuperAdmin = checkIsSuperAdmin();

  const handleQuickUnlock = () => {
    toggleTenantModule(activeTenantId, moduleId, true);
    if (onModuleUnlocked) onModuleUnlocked(moduleId);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('somiti_module_toggled', {
        detail: { tenantId: activeTenantId, moduleId, state: true }
      }));
    }
  };

  const samityName = tenant?.name || (isEn ? 'Your Organization' : 'আপনার সমিতি');
  const waMsg = encodeURIComponent(
    `আসসালামু আলাইকুম। আমি "${samityName}" (ID: ${activeTenantId}) থেকে লিখছি। আমাদের সমিতিতে "${moduleMeta.nameBn}" (${moduleMeta.nameEn || moduleId}) মডিউলটি আনলক / আপগ্রেড করতে চাই। বিস্তারিত জানাবেন।`
  );
  const waUrl = `https://wa.me/8801732049970?text=${waMsg}`;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '440px',
        padding: '30px 20px',
        width: '100%'
      }}
    >
      <div
        style={{
          maxWidth: '560px',
          width: '100%',
          background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.85)',
          borderRadius: '24px',
          border: isLight ? '1.5px solid #fee2e2' : '1.5px solid rgba(239, 68, 68, 0.3)',
          boxShadow: isLight
            ? '0 20px 40px -15px rgba(239, 68, 68, 0.15)'
            : '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          padding: '36px 28px',
          textAlign: 'center',
          backdropFilter: 'blur(16px)'
        }}
      >
        <div
          style={{
            width: '76px',
            height: '76px',
            borderRadius: '22px',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(245, 158, 11, 0.2))',
            border: '2px solid rgba(239, 68, 68, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto',
            color: '#ef4444'
          }}
        >
          <Lock size={38} strokeWidth={2.2} />
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '20px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', fontSize: '0.75rem', fontWeight: '800', marginBottom: '14px' }}>
          <AlertTriangle size={13} />
          {isEn ? 'MODULE LOCKED IN YOUR SAAS PLAN' : 'মডিউলটি আপনার প্ল্যানে লক করা'}
        </div>

        <h2 style={{ fontSize: '1.4rem', fontWeight: '900', color: isLight ? '#0f172a' : '#f8fafc', margin: '0 0 10px 0' }}>
          {isEn ? `${moduleMeta.nameEn} is Locked` : `"${moduleMeta.nameBn}" সেবাটি লক করা রয়েছে`}
        </h2>

        <p style={{ fontSize: '0.88rem', color: isLight ? '#475569' : '#94a3b8', lineHeight: '1.6', margin: '0 0 24px 0' }}>
          {isEn
            ? `The Super Admin has disabled this module for ${samityName}. To enable this operational feature, please contact the platform administration or upgrade your organization's subscription tier.`
            : `সুপার এডমিন কর্তৃক "${samityName}"-এর বর্তমান সাবস্ক্রিপশন প্ল্যানে এই মডিউলটি বন্ধ রাখা হয়েছে। আপনার প্রতিষ্ঠানের জন্য এই সেবাটি চালু করতে এখনই প্ল্যাটফর্ম সুপার এডমিন বা সাপোর্টে যোগাযোগ করে প্যাকেজ আপগ্রেড করুন।`}
        </p>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '13px 20px',
              borderRadius: '14px',
              background: '#25D366',
              color: '#ffffff',
              fontWeight: '800',
              fontSize: '0.92rem',
              textDecoration: 'none',
              boxShadow: '0 8px 20px -6px rgba(37, 211, 102, 0.5)',
              transition: 'all 0.2s ease'
            }}
          >
            <MessageSquare size={18} />
            {isEn ? 'Request Activation via WhatsApp' : 'হোয়াটসঅ্যাপে মডিউল চালুর আবেদন'}
          </a>

          {isSuperAdmin && (
            <button
              onClick={handleQuickUnlock}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 18px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                color: '#ffffff',
                border: 'none',
                fontWeight: '800',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              <Zap size={16} />
              {isEn ? 'Super Admin Quick Unlock (Enable Now)' : 'সুপার এডমিন কুইক আনলক (এখনই চালু করুন)'}
            </button>
          )}

          {onReturnToDashboard && (
            <button
              onClick={onReturnToDashboard}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '11px 18px',
                borderRadius: '14px',
                background: isLight ? '#f1f5f9' : 'rgba(30, 41, 59, 0.8)',
                color: isLight ? '#475569' : '#cbd5e1',
                border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(148, 163, 184, 0.2)',
                fontWeight: '700',
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              <ArrowLeft size={16} />
              {isEn ? 'Return to Dashboard' : 'ড্যাশবোর্ডে ফিরে যান'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
