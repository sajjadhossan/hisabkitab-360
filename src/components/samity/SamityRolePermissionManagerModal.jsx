import React, { useState, useEffect, useMemo } from 'react';
import {
  getActiveWorkspaceId,
  isFeatureAllowedForTenant,
  canRolePerformAction,
  getSamityRolePermissions,
  saveSamityRolePermissions,
  resetSamityRolePermissionsToDefault,
  GRANULAR_FEATURE_CATEGORIES,
  getGranularFeatureMeta,
  getTenantById
} from '../../services/tenantManagerService';
import {
  ShieldCheck,
  Users,
  Check,
  X,
  Lock,
  Unlock,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  UserCheck,
  FileText,
  Wallet,
  Receipt,
  PieChart,
  Trash2,
  Download,
  Eye,
  Sliders,
  ChevronRight,
  TrendingUp,
  Building2,
  Navigation,
  Send,
  Zap,
  Info,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const ROLES_CONFIG = [
  {
    key: 'president',
    titleBn: 'সভাপতি / প্রধান এডমিন (President)',
    titleEn: 'President / Head Admin',
    descBn: 'সমিতির শীর্ষ নীতিনির্ধারক — সকল ক্ষমতাপ্রাপ্ত ও প্রধান নিয়ন্ত্রক',
    color: '#8b5cf6',
    icon: '👑',
    category: 'staff'
  },
  {
    key: 'secretary',
    titleBn: 'সাধারণ সম্পাদক (General Secretary)',
    titleEn: 'General Secretary',
    descBn: 'কার্যনির্বাহী ব্যবস্থাপনা, সদস্য ভর্তি ও নোটিশ বোর্ড পরিচালনা',
    color: '#3b82f6',
    icon: '👔',
    category: 'staff'
  },
  {
    key: 'treasurer',
    titleBn: 'কোষাধ্যক্ষ / ক্যাশিয়ার (Treasurer / Cashier)',
    titleEn: 'Treasurer / Cashier',
    descBn: 'ব্যাংক হিসাব, ক্যাশ ইন হ্যান্ড এবং দৈনিক জমা ও খরচ এন্ট্রি',
    color: '#10b981',
    icon: '💼',
    category: 'staff'
  },
  {
    key: 'field_officer',
    titleBn: 'মাঠকর্মী / কালেক্টর (Field Collector)',
    titleEn: 'Field Officer / Collector',
    descBn: 'মাঠে গিয়ে সদস্যদের কাছ থেকে কিস্তি ও সঞ্চয় সংগ্রহ ও রসিদ তৈরি',
    color: '#f59e0b',
    icon: '🚶',
    category: 'staff'
  },
  {
    key: 'auditor',
    titleBn: 'হিসাব নিরীক্ষক (Auditor / Inspector)',
    titleEn: 'Auditor / Inspector',
    descBn: 'হিসাবের স্বচ্ছতা পর্যবেক্ষণ — শুধুমাত্র রিপোর্ট ও অডিট লগ ভিউয়ার',
    color: '#06b6d4',
    icon: '🔍',
    category: 'staff'
  },
  {
    key: 'general_member',
    titleBn: 'সাধারণ সদস্য ও গ্রাহক (General Member Portal)',
    titleEn: 'General Member Portal',
    descBn: 'সাধারণ সদস্যের মোবাইল পোর্টাল — নিজের জমার ব্যালেন্স, ডিজিটাল পাসবই ও আবেদন',
    color: '#ec4899',
    icon: '👤',
    category: 'member'
  }
];

// Helper to determine which features are relevant for each role view
const getRoleRelevantFeatures = (roleKey) => {
  if (roleKey === 'general_member') {
    const memberCat = GRANULAR_FEATURE_CATEGORIES.find(c => c.id === 'member_portal');
    return memberCat ? memberCat.features : [];
  }

  if (roleKey === 'field_officer') {
    const fieldCat = GRANULAR_FEATURE_CATEGORIES.find(c => c.id === 'field_collection');
    const savingsCat = GRANULAR_FEATURE_CATEGORIES.find(c => c.id === 'savings_deposits');
    const aiCat = GRANULAR_FEATURE_CATEGORIES.find(c => c.id === 'ai_smart_tools');
    return [
      ...(fieldCat ? fieldCat.features : []),
      ...(savingsCat ? savingsCat.features.filter(f => ['savings_daily', 'savings_dps'].includes(f.id)) : []),
      ...(aiCat ? aiCat.features.filter(f => ['ai_nid_ocr_scanner', 'ai_merchant_qr_pos'].includes(f.id)) : []),
      {
        id: 'report_qr_verify_portal',
        nameBn: 'কিউআর কোড অনলাইন ভেরিফিকেশন পোর্টাল',
        nameEn: 'QR Verification Portal',
        descBn: 'গ্রাহকের রশিদের কিউআর কোড স্ক্যান করে সত্যতা যাচাই'
      }
    ];
  }

  if (roleKey === 'treasurer') {
    const cashCat = GRANULAR_FEATURE_CATEGORIES.find(c => c.id === 'cash_banking');
    const savingsCat = GRANULAR_FEATURE_CATEGORIES.find(c => c.id === 'savings_deposits');
    const auditCat = GRANULAR_FEATURE_CATEGORIES.find(c => c.id === 'audit_reports');
    return [
      ...(cashCat ? cashCat.features : []),
      ...(savingsCat ? savingsCat.features.filter(f => ['savings_withdraw', 'savings_profit_distribute'].includes(f.id)) : []),
      ...(auditCat ? auditCat.features.filter(f => ['report_cashbook_ledger', 'report_income_balance_sheet'].includes(f.id)) : [])
    ];
  }

  if (roleKey === 'auditor') {
    const auditCat = GRANULAR_FEATURE_CATEGORIES.find(c => c.id === 'audit_reports');
    const adminCat = GRANULAR_FEATURE_CATEGORIES.find(c => c.id === 'admin_governance');
    const cashCat = GRANULAR_FEATURE_CATEGORIES.find(c => c.id === 'cash_banking');
    return [
      ...(auditCat ? auditCat.features : []),
      ...(cashCat ? cashCat.features.filter(f => ['cash_standard_coa', 'cash_trial_balance_sheet', 'cash_bank_reconciliation'].includes(f.id)) : []),
      ...(adminCat ? adminCat.features.filter(f => ['admin_database_backup', 'gov_somobay_audit_pdf', 'gov_forensic_audit_trail'].includes(f.id)) : [])
    ];
  }

  if (roleKey === 'secretary') {
    const loanCat = GRANULAR_FEATURE_CATEGORIES.find(c => c.id === 'microloan_ops');
    const adminCat = GRANULAR_FEATURE_CATEGORIES.find(c => c.id === 'admin_governance');
    const auditCat = GRANULAR_FEATURE_CATEGORIES.find(c => c.id === 'audit_reports');
    const aiCat = GRANULAR_FEATURE_CATEGORIES.find(c => c.id === 'ai_smart_tools');
    return [
      {
        id: 'field_member_onboard',
        nameBn: 'নতুন সদস্যের আবেদন ও নিবন্ধন অনুমোদন',
        nameEn: 'Member Registration',
        descBn: 'সদস্যের প্রাথমিক ফরম যাচাই ও ভর্তি অনুমোদন'
      },
      ...(loanCat ? loanCat.features : []),
      ...(auditCat ? auditCat.features.filter(f => ['report_cashbook_ledger', 'report_official_pdf', 'report_excel_export'].includes(f.id)) : []),
      ...(adminCat ? adminCat.features.filter(f => ['admin_staff_manage', 'admin_database_backup', 'gov_meeting_minutes_book', 'gov_digital_notice_board'].includes(f.id)) : []),
      ...(aiCat ? aiCat.features.filter(f => ['ai_nid_ocr_scanner', 'ai_default_prediction'].includes(f.id)) : [])
    ];
  }

  // President (Executive control over all operational features)
  const allFeatures = [];
  GRANULAR_FEATURE_CATEGORIES.forEach(cat => {
    cat.features.forEach(f => {
      if (!cat.id.includes('member_portal')) {
        allFeatures.push(f);
      }
    });
  });
  return allFeatures;
};

/**
 * Global Permission Checker Utility
 */
export const checkRolePermission = (customRolePermissions, roleKey, permissionKey) => {
  if (!roleKey || roleKey === 'president' || roleKey === 'admin') return true;
  const activeTenantId = getActiveWorkspaceId();
  const check = canRolePerformAction(activeTenantId, roleKey, permissionKey);
  return check.allowed;
};

export const SamityRolePermissionManagerModal = ({
  isOpen,
  onClose,
  isLight = false,
  lang = 'bn',
  customRolePermissions = {},
  onSaveRolePermissions,
  activeUserRole = 'president',
  onSwitchUserRole
}) => {
  const isEn = lang === 'en';
  const activeTenantId = getActiveWorkspaceId();
  const tenant = useMemo(() => getTenantById(activeTenantId), [activeTenantId]);

  const [activeTabGroup, setActiveTabGroup] = useState('staff'); // 'staff' | 'member'
  const [selectedRoleKey, setSelectedRoleKey] = useState('field_officer');
  const [rolePermissions, setRolePermissions] = useState(() => getSamityRolePermissions(activeTenantId));
  const [simulatedRole, setSimulatedRole] = useState('field_officer');
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (activeTenantId) {
      setRolePermissions(getSamityRolePermissions(activeTenantId));
    }
  }, [activeTenantId, isOpen]);

  if (!isOpen) return null;

  const showNotice = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleToggle = (roleKey, featureId) => {
    // President always has full rights
    if (roleKey === 'president') {
      showNotice(
        isEn ? 'President must retain executive permissions' : 'সভাপতির নির্বাহী ক্ষমতা সার্বক্ষণিক সংরক্ষিত',
        'error'
      );
      return;
    }

    // Gate 1: Check if Super Admin allowed this feature in this tenant's license
    const isSuperAdminAllowed = isFeatureAllowedForTenant(featureId, activeTenantId);
    if (!isSuperAdminAllowed) {
      showNotice(
        isEn
          ? 'This feature is locked by the Super Admin license for your organization!'
          : 'সুপার এডমিন কর্তৃক এই মডিউলটি আপনার প্ল্যানে লক করা রয়েছে! আপনি এটি চালু করতে পারবেন না।',
        'error'
      );
      return;
    }

    const currentRolePerms = rolePermissions[roleKey] || {};
    const nextVal = !currentRolePerms[featureId];

    const updated = {
      ...rolePermissions,
      [roleKey]: {
        ...currentRolePerms,
        [featureId]: nextVal
      }
    };

    setRolePermissions(updated);
    saveSamityRolePermissions(activeTenantId, roleKey, updated[roleKey]);

    if (onSaveRolePermissions) {
      onSaveRolePermissions(updated);
    }

    const meta = getGranularFeatureMeta(featureId);
    const role = ROLES_CONFIG.find(r => r.key === roleKey);
    showNotice(
      nextVal
        ? `${role?.titleBn || roleKey}: ${meta?.nameBn || featureId} চালু করা হয়েছে`
        : `${role?.titleBn || roleKey}: ${meta?.nameBn || featureId} বন্ধ করা হয়েছে`,
      'success'
    );
  };

  const handleResetToDefaults = () => {
    if (confirm(isEn ? 'Reset all permissions to official standard defaults?' : 'সকল পদের পারমিশন অফিশিয়াল স্ট্যান্ডার্ড ডিফল্ট মানে রিসেট করবেন?')) {
      const reset = resetSamityRolePermissionsToDefault(activeTenantId);
      setRolePermissions(reset);
      if (onSaveRolePermissions) {
        onSaveRolePermissions(reset);
      }
      showNotice(isEn ? 'Reset to standard defaults complete!' : 'স্ট্যান্ডার্ড ডিফল্ট কনফিগারেশনে সফলভাবে রিসেট করা হয়েছে!');
    }
  };

  const currentRole = ROLES_CONFIG.find(r => r.key === selectedRoleKey);
  const relevantFeatures = getRoleRelevantFeatures(selectedRoleKey);

  // Group roles for navigation
  const staffRoles = ROLES_CONFIG.filter(r => r.category === 'staff');
  const memberRoles = ROLES_CONFIG.filter(r => r.category === 'member');

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
        boxShadow: '0 25px 60px -15px rgba(0,0,0,0.6)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        color: isLight ? '#0f172a' : '#f8fafc',
        border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        {/* Header Bar */}
        <div style={{
          padding: '20px 24px',
          background: isLight
            ? 'linear-gradient(135deg, #f0fdf4, #dcfce7)'
            : 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95))',
          borderBottom: isLight ? '1px solid #bbf7d0' : '1px solid rgba(16, 185, 129, 0.25)',
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
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
              flexShrink: 0
            }}>
              <ShieldCheck size={26} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '1.18rem', fontWeight: '900', letterSpacing: '-0.3px' }}>
                  {isEn ? 'Samity Controller: Role & Member Permission Manager' : 'সমিতি কন্ট্রোলার: স্টাফ ও সদস্য পারমিশন ম্যানেজার'}
                </h2>
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: '900',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.3)'
                }}>
                  {tenant?.name || (isEn ? 'Current Samity' : 'বর্তমান সমিতি')}
                </span>
              </div>
              <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: isLight ? '#166534' : '#94a3b8' }}>
                {isEn
                  ? 'Super Admin delegates features to your samity; you delegate permissions to staff and members.'
                  : 'সুপার এডমিনের অনুমোদিত ফিচারসমূহ থেকে আপনি আপনার কমিটির স্টাফ ও সদস্যদের জন্য অন/অফ করতে পারবেন।'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleResetToDefaults}
              style={{
                background: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.08)',
                border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
                color: isLight ? '#475569' : '#cbd5e1',
                padding: '6px 12px',
                borderRadius: '10px',
                fontSize: '0.74rem',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
              title={isEn ? 'Reset to official standard defaults' : 'অফিশিয়াল ডিফল্ট পারমিশনে রিসেট'}
            >
              <RotateCcw size={13} />
              <span>{isEn ? 'Reset Defaults' : 'ডিফল্ট রিসেট'}</span>
            </button>

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
        </div>

        {/* Dual Tab Group Switcher: Staff Roles vs Member Self-Service */}
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
          {/* Main Group Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => {
                setActiveTabGroup('staff');
                setSelectedRoleKey('field_officer');
              }}
              style={{
                padding: '7px 14px',
                borderRadius: '10px',
                fontSize: '0.8rem',
                fontWeight: '900',
                cursor: 'pointer',
                border: 'none',
                background: activeTabGroup === 'staff'
                  ? '#10b981'
                  : (isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)'),
                color: activeTabGroup === 'staff' ? '#ffffff' : (isLight ? '#475569' : '#94a3b8'),
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Users size={14} />
              <span>{isEn ? '1. Staff & Committee Roles (5 Roles)' : '১. কমিটি ও স্টাফ পদসমূহ (৫টি পদ)'}</span>
            </button>

            <button
              onClick={() => {
                setActiveTabGroup('member');
                setSelectedRoleKey('general_member');
              }}
              style={{
                padding: '7px 14px',
                borderRadius: '10px',
                fontSize: '0.8rem',
                fontWeight: '900',
                cursor: 'pointer',
                border: 'none',
                background: activeTabGroup === 'member'
                  ? '#ec4899'
                  : (isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)'),
                color: activeTabGroup === 'member' ? '#ffffff' : (isLight ? '#475569' : '#94a3b8'),
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <UserCheck size={14} />
              <span>{isEn ? '2. General Member Self-Service' : '২. সাধারণ সদস্য পোর্টাল (গ্রাহক)'}</span>
            </button>
          </div>

          {/* Active Role Selector Sub-Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {(activeTabGroup === 'staff' ? staffRoles : memberRoles).map(role => {
              const isSelected = selectedRoleKey === role.key;
              return (
                <button
                  key={role.key}
                  onClick={() => setSelectedRoleKey(role.key)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '8px',
                    fontSize: '0.74rem',
                    fontWeight: '800',
                    cursor: 'pointer',
                    background: isSelected
                      ? (isLight ? '#0f172a' : '#ffffff')
                      : (isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.05)'),
                    color: isSelected
                      ? (isLight ? '#ffffff' : '#0f172a')
                      : (isLight ? '#475569' : '#cbd5e1'),
                    border: isSelected
                      ? 'none'
                      : (isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.1)'),
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>{role.icon}</span>
                  <span>{role.titleBn.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Notice Toast */}
        {notification && (
          <div style={{
            background: notification.type === 'error' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #10b981, #059669)',
            color: '#ffffff',
            padding: '8px 24px',
            fontSize: '0.8rem',
            fontWeight: '800',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'fadeIn 0.2s ease'
          }}>
            {notification.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            <span>{notification.msg}</span>
          </div>
        )}

        {/* Content Body: Permissions Matrix */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {/* Selected Role Header Info Banner */}
          <div style={{
            background: isLight ? '#f1f5f9' : 'rgba(30, 41, 59, 0.6)',
            borderRadius: '16px',
            padding: '14px 18px',
            marginBottom: '18px',
            border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: currentRole?.color || '#10b981',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                fontWeight: '900'
              }}>
                {currentRole?.icon || '👤'}
              </div>

              <div>
                <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: '900' }}>
                  {isEn ? currentRole?.titleEn : currentRole?.titleBn}
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: isLight ? '#64748b' : '#94a3b8' }}>
                  {currentRole?.descBn}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: '800',
                padding: '2px 8px',
                borderRadius: '6px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}>
                {relevantFeatures.filter(f => rolePermissions[selectedRoleKey]?.[f.id]).length} / {relevantFeatures.length} {isEn ? 'Enabled' : 'সক্রিয়'}
              </span>
            </div>
          </div>

          {/* Granular Permissions Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '12px'
          }}>
            {relevantFeatures.map(item => {
              const isSuperAdminAllowed = isFeatureAllowedForTenant(item.id, activeTenantId);
              const isGranted = Boolean(rolePermissions[selectedRoleKey]?.[item.id]);

              return (
                <div
                  key={item.id}
                  style={{
                    background: !isSuperAdminAllowed
                      ? (isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.02)')
                      : isGranted
                        ? (isLight ? '#f0fdf4' : 'rgba(16, 185, 129, 0.08)')
                        : (isLight ? '#ffffff' : 'rgba(30, 41, 59, 0.4)'),
                    borderRadius: '14px',
                    border: !isSuperAdminAllowed
                      ? (isLight ? '1px dashed #cbd5e1' : '1px dashed rgba(255, 255, 255, 0.15)')
                      : isGranted
                        ? '1.5px solid rgba(16, 185, 129, 0.4)'
                        : (isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)'),
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    opacity: !isSuperAdminAllowed ? 0.65 : 1,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        fontSize: '0.84rem',
                        fontWeight: '800',
                        color: !isSuperAdminAllowed
                          ? '#94a3b8'
                          : isGranted
                            ? (isLight ? '#065f46' : '#34d399')
                            : (isLight ? '#1e293b' : '#f8fafc')
                      }}>
                        {isEn ? item.nameEn : item.nameBn}
                      </span>
                    </div>

                    <p style={{ margin: '3px 0 0', fontSize: '0.7rem', color: isLight ? '#64748b' : '#94a3b8', lineHeight: 1.35 }}>
                      {item.descBn}
                    </p>

                    {/* Locked by Super Admin Indicator */}
                    {!isSuperAdminAllowed && (
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginTop: '6px',
                        fontSize: '0.66rem',
                        fontWeight: '800',
                        color: '#f59e0b',
                        background: 'rgba(245, 158, 11, 0.12)',
                        padding: '1px 6px',
                        borderRadius: '4px'
                      }}>
                        <Lock size={10} />
                        <span>{isEn ? 'Locked by Super Admin License' : '🔒 সুপার এডমিন কর্তৃক এই প্ল্যানে লক করা'}</span>
                      </div>
                    )}
                  </div>

                  {/* Toggle Button */}
                  <button
                    type="button"
                    disabled={!isSuperAdminAllowed || selectedRoleKey === 'president'}
                    onClick={() => handleToggle(selectedRoleKey, item.id)}
                    style={{
                      width: '42px',
                      height: '24px',
                      borderRadius: '12px',
                      background: !isSuperAdminAllowed
                        ? '#64748b'
                        : isGranted
                          ? '#10b981'
                          : (isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.2)'),
                      border: 'none',
                      padding: '2px',
                      cursor: !isSuperAdminAllowed || selectedRoleKey === 'president' ? 'not-allowed' : 'pointer',
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
                      transform: isGranted && isSuperAdminAllowed ? 'translateX(18px)' : 'translateX(0px)',
                      transition: 'transform 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {!isSuperAdminAllowed ? (
                        <Lock size={10} color="#64748b" />
                      ) : isGranted ? (
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

          {/* Role Simulator Sandbox */}
          <div style={{
            marginTop: '20px',
            background: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.5)',
            borderRadius: '16px',
            padding: '16px 20px',
            border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} color="#10b981" />
                <h4 style={{ margin: 0, fontSize: '0.86rem', fontWeight: '900' }}>
                  {isEn ? 'Live Role Authorization Simulator' : 'লাইভ রোল পারমিশন সিমুলেটর (লগইন ভেরিফিকেশন)'}
                </h4>
              </div>

              <select
                value={simulatedRole}
                onChange={(e) => setSimulatedRole(e.target.value)}
                style={{
                  background: isLight ? '#ffffff' : 'rgba(30, 41, 59, 0.9)',
                  color: isLight ? '#0f172a' : '#f8fafc',
                  border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  padding: '4px 10px',
                  fontSize: '0.76rem',
                  fontWeight: '800',
                  outline: 'none'
                }}
              >
                {ROLES_CONFIG.map(r => (
                  <option key={r.key} value={r.key}>
                    {r.titleBn}
                  </option>
                ))}
              </select>
            </div>

            <p style={{ margin: '0 0 10px', fontSize: '0.74rem', color: isLight ? '#64748b' : '#94a3b8' }}>
              {isEn
                ? 'Test how this person experiences the app in real time:'
                : `বর্তমানে '${ROLES_CONFIG.find(r => r.key === simulatedRole)?.titleBn}' লগইন করলে সিস্টেমে তার ক্ষমতা:`}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {getRoleRelevantFeatures(simulatedRole).map(f => {
                const check = canRolePerformAction(activeTenantId, simulatedRole, f.id);
                return (
                  <span
                    key={f.id}
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: '800',
                      padding: '3px 9px',
                      borderRadius: '6px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: check.allowed
                        ? 'rgba(16, 185, 129, 0.15)'
                        : check.reason === 'LOCKED_BY_SUPER_ADMIN'
                          ? 'rgba(245, 158, 11, 0.15)'
                          : 'rgba(239, 68, 68, 0.12)',
                      color: check.allowed
                        ? '#10b981'
                        : check.reason === 'LOCKED_BY_SUPER_ADMIN'
                          ? '#f59e0b'
                          : '#ef4444',
                      border: check.allowed
                        ? '1px solid rgba(16, 185, 129, 0.3)'
                        : check.reason === 'LOCKED_BY_SUPER_ADMIN'
                          ? '1px solid rgba(245, 158, 11, 0.3)'
                          : '1px solid rgba(239, 68, 68, 0.3)'
                    }}
                  >
                    {check.allowed ? (
                      <Check size={11} strokeWidth={3} />
                    ) : check.reason === 'LOCKED_BY_SUPER_ADMIN' ? (
                      <Lock size={11} />
                    ) : (
                      <X size={11} strokeWidth={3} />
                    )}
                    <span>{f.nameBn}</span>
                  </span>
                );
              })}
            </div>
          </div>
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
                ? 'Permissions are automatically enforced for all users in this samity.'
                : 'প্রতিটি পারমিশন পরিবর্তন তাৎক্ষণিকভাবে সংরক্ষিত ও এই সমিতির সকল ব্যবহারকারীর জন্য কার্যকর হচ্ছে।'}
            </span>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
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
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
            }}
          >
            <Check size={15} />
            <span>{isEn ? 'Save & Close' : 'সংরক্ষণ ও বন্ধ করুন'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
