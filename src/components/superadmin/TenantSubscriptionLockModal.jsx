import React, { useState } from 'react';
import {
  extendTenantSubscription,
  setActiveWorkspaceId,
  checkIsSuperAdmin
} from '../../services/tenantManagerService';
import {
  Lock,
  AlertTriangle,
  Calendar,
  MessageSquare,
  Crown,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Building2,
  CheckCircle2
} from 'lucide-react';

export const TenantSubscriptionLockModal = ({
  isOpen,
  subscriptionStatus,
  user,
  isLight = false,
  lang = 'bn',
  onRenewed
}) => {
  const isEn = lang === 'en';
  const isSuperAdmin = checkIsSuperAdmin(user);
  const [isRenewing, setIsRenewing] = useState(false);
  const [renewNotice, setRenewNotice] = useState(null);

  if (!isOpen || !subscriptionStatus || subscriptionStatus.isValid) return null;

  const { tenant, isSuspended, isExpired, validUntil } = subscriptionStatus;

  const handle1ClickRenew = () => {
    if (!tenant?.id) return;
    setIsRenewing(true);
    try {
      const updated = extendTenantSubscription(tenant.id, 365);
      setRenewNotice(isEn ? 'Subscription successfully renewed for 1 Year!' : 'সফলভাবে ১ বছরের জন্য সাবস্ক্রিপশন মেয়াদ বৃদ্ধি করা হয়েছে!');
      setTimeout(() => {
        setIsRenewing(false);
        onRenewed?.(updated);
      }, 1200);
    } catch (e) {
      console.error(e);
      setIsRenewing(false);
    }
  };

  const handleSwitchToMaster = () => {
    setActiveWorkspaceId('tenant_master_headquarters');
    window.location.reload();
  };

  const superAdminPhone = '8801700000000';
  const whatsappMsg = encodeURIComponent(
    `হ্যালো HisabKitab 360 / Somiti 360 সাপোর্ট 👋\nআমি *${tenant?.name || 'সমিতি'}* থেকে যোগাযোগ করছি।\nআমাদের সফটওয়্যারের সাবস্ক্রিপশন নবায়ন করতে চাই। অনুগ্রহ করে রিনিউ প্রসেস জানিয়ে সাহায্য করবেন। ধন্যবাদ!`
  );

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.88)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200000,
      padding: '16px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '560px',
        background: isLight ? '#ffffff' : '#0f172a',
        borderRadius: '24px',
        boxShadow: '0 25px 60px -15px rgba(0,0,0,0.8), 0 0 0 1.5px rgba(239, 68, 68, 0.4)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        color: isLight ? '#0f172a' : '#f8fafc',
        textAlign: 'center',
        padding: '32px 28px'
      }}>
        {/* Lock Icon Emblem */}
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '24px',
          background: isSuspended ? 'linear-gradient(135deg, #ef4444, #b91c1c)' : 'linear-gradient(135deg, #f59e0b, #d97706)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          boxShadow: isSuspended ? '0 8px 24px rgba(239, 68, 68, 0.35)' : '0 8px 24px rgba(245, 158, 11, 0.35)'
        }}>
          {isSuspended ? <ShieldAlert size={36} /> : <Lock size={36} />}
        </div>

        {/* Title */}
        <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: '900', letterSpacing: '-0.3px' }}>
          {isSuspended
            ? (isEn ? 'Workspace Access Suspended' : 'সমিতির সফটওয়্যার লাইসেন্স স্থগিত রয়েছে')
            : (isEn ? 'Subscription Plan Expired' : 'সফটওয়্যার সাবস্ক্রিপশনের মেয়াদ উত্তীর্ণ হয়েছে')}
        </h2>

        {/* Tenant Info Card */}
        <div style={{
          background: isLight ? '#f8fafc' : 'rgba(30, 41, 59, 0.6)',
          borderRadius: '16px',
          padding: '16px',
          margin: '18px 0',
          border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          textAlign: 'left'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.78rem', color: isLight ? '#64748b' : '#94a3b8', fontWeight: '700' }}>
              {isEn ? 'Samity Name:' : 'প্রতিষ্ঠানের নাম:'}
            </span>
            <span style={{ fontSize: '0.85rem', fontWeight: '900' }}>
              {tenant?.name}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.78rem', color: isLight ? '#64748b' : '#94a3b8', fontWeight: '700' }}>
              {isEn ? 'Package Plan:' : 'প্যাকেজ প্ল্যান:'}
            </span>
            <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#10b981' }}>
              {tenant?.plan || 'Standard'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.78rem', color: isLight ? '#64748b' : '#94a3b8', fontWeight: '700' }}>
              {isEn ? 'Validity Ended:' : 'মেয়াদ শেষ হওয়ার তারিখ:'}
            </span>
            <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#ef4444' }}>
              {validUntil}
            </span>
          </div>
        </div>

        <p style={{ margin: '0 0 24px', fontSize: '0.82rem', color: isLight ? '#64748b' : '#94a3b8', lineHeight: 1.5 }}>
          {isEn
            ? 'To ensure uninterrupted service and safe accounting, please renew your organization subscription.'
            : 'অবিচ্ছিন্ন ক্লাউড হিসাব সংরক্ষণ ও সেবা সচল রাখতে অনুগ্রহ করে সুপার অ্যাডমিনের সাথে যোগাযোগ করে লাইসেন্স নবায়ন করুন।'}
        </p>

        {/* Success Alert Banner */}
        {renewNotice && (
          <div style={{
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: '#ffffff',
            padding: '10px 18px',
            borderRadius: '12px',
            fontSize: '0.82rem',
            fontWeight: '900',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            <CheckCircle2 size={16} />
            <span>{renewNotice}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Direct WhatsApp Contact Button */}
          <a
            href={`https://wa.me/${superAdminPhone}?text=${whatsappMsg}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: '#25D366',
              color: '#ffffff',
              borderRadius: '12px',
              padding: '12px 20px',
              fontSize: '0.86rem',
              fontWeight: '900',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(37, 211, 102, 0.35)'
            }}
          >
            <MessageSquare size={16} />
            <span>{isEn ? 'Contact Vendor on WhatsApp to Renew' : 'হোয়াটসঅ্যাপে যোগাযোগ করে রিনিউ করুন'}</span>
          </a>

          {/* Super Admin 1-Click Renew Bypass Button */}
          {isSuperAdmin && (
            <button
              onClick={handle1ClickRenew}
              disabled={isRenewing}
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 20px',
                fontSize: '0.86rem',
                fontWeight: '900',
                cursor: isRenewing ? 'wait' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)'
              }}
            >
              <Crown size={16} />
              <span>{isRenewing ? (isEn ? 'Renewing...' : 'মেয়াদ বৃদ্ধি হচ্ছে...') : (isEn ? 'Super Admin: 1-Click Renew (+1 Year)' : '👑 সুপার এডমিন: ১-ক্লিকে মেয়াদ বৃদ্ধি (+১ বছর)')}</span>
            </button>
          )}

          {/* Switch to Head Office Button */}
          <button
            onClick={handleSwitchToMaster}
            style={{
              background: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.08)',
              color: isLight ? '#475569' : '#cbd5e1',
              border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '12px',
              padding: '10px 16px',
              fontSize: '0.8rem',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Building2 size={14} />
            <span>{isEn ? 'Switch to My Head Office Samity' : 'আমার নিজস্ব হেড অফিসে ফিরে যান'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
