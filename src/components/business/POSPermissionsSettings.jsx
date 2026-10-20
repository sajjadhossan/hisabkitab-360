import React, { useState, useEffect, useMemo } from 'react';
import {
  Monitor,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Unlock,
  Percent,
  Banknote,
  Volume2,
  Share2,
  ScanLine,
  Mic,
  Sun,
  Activity,
  UserCheck,
  Truck,
  FileText,
  Save,
  Sparkles,
  Sliders,
  Search,
  Check,
  X,
  Boxes,
  FolderOpen,
  Calculator,
  HandCoins,
  Users,
  Settings,
  HelpCircle,
  RotateCcw,
  Eye,
  EyeOff
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { hapticFeedback } from '../../services/nativeAppService';
import { playButtonClick, playSuccessChime } from '../../services/soundFeedback';
import {
  STAFF_ROLES,
  MENU_CATEGORIES,
  DEFAULT_STAFF_MENU_PERMISSIONS,
  getStaffMenuPermissions
} from '../../services/staffRolePermissionEngine';

export const POSPermissionsSettings = ({ lang = 'bn', onSaved = () => {} }) => {
  const { businessSettings, updateBusinessSettings, showToast } = useApp();

  // Active Role Selected for Configuration ('cashier' | 'salesman' | 'delivery' | 'staff')
  const [selectedRole, setSelectedRole] = useState('cashier');
  const [searchQuery, setSearchQuery] = useState('');

  // Initial POS Permission State
  const [permissions, setPermissions] = useState(() => {
    const saved = businessSettings?.posPermissions || {};
    return {
      // Feature visibility in POS header & cart
      showCashDrawer: saved.showCashDrawer ?? true,
      showCustomerMirror: saved.showCustomerMirror ?? true,
      showHoldCart: saved.showHoldCart ?? true,
      showSoundbox: saved.showSoundbox ?? true,
      showDigitalMemo: saved.showDigitalMemo ?? true,
      showVoiceBilling: saved.showVoiceBilling ?? true,
      showWakeLock: saved.showWakeLock ?? true,
      showDiagnostics: saved.showDiagnostics ?? true,

      // Security & Restrictions
      allowCashierDiscount: saved.allowCashierDiscount ?? true,
      maxCashierDiscountPercent: saved.maxCashierDiscountPercent ?? 15,
      allowPriceOverride: saved.allowPriceOverride ?? false,
      requireShiftOpeningCash: saved.requireShiftOpeningCash ?? true,

      // Salesman & SR Role controls
      salesmanCanCollectCash: saved.salesmanCanCollectCash ?? false,
      srCanModifyOrderItems: saved.srCanModifyOrderItems ?? true,
      requireOtpOnDelivery: saved.requireOtpOnDelivery ?? false
    };
  });

  // Granular Menu & Feature Permissions Matrix per Role
  const [menuPermissions, setMenuPermissions] = useState(() => {
    return getStaffMenuPermissions(businessSettings);
  });

  const handleToggle = (key) => {
    playButtonClick();
    hapticFeedback.light();
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleToggleMenuPermission = (roleKey, itemId) => {
    playButtonClick();
    hapticFeedback.light();
    setMenuPermissions((prev) => {
      const roleConfig = prev[roleKey] || DEFAULT_STAFF_MENU_PERMISSIONS[roleKey] || {};
      const currentVal = roleConfig[itemId] !== undefined ? roleConfig[itemId] : false;
      return {
        ...prev,
        [roleKey]: {
          ...roleConfig,
          [itemId]: !currentVal
        }
      };
    });
  };

  // 1-Click Fast Role Presets
  const applyRolePreset = (presetType) => {
    playButtonClick();
    hapticFeedback.medium();

    if (presetType === 'salesman_only_stock') {
      // Salesman only needs Products, Stock Availability & Order Booking
      setMenuPermissions((prev) => ({
        ...prev,
        salesman: {
          ...DEFAULT_STAFF_MENU_PERMISSIONS.salesman,
          inventory: true,
          salesman_order: true,
          drawer_internal_chat: true,
          tool_calc: true,
          // Block everything else
          pos: false,
          sr_delivery: false,
          invoices: false,
          quotations: false,
          branch_control: false,
          master_hub: false,
          tool_categories: false,
          tool_cash: false,
          debts: false,
          erp: false,
          reports: false,
          crm: false,
          hr: false,
          sr: false,
          cattle: false,
          healthcare: false,
          settings: false,
          tool_diagnostics: false,
          tool_backup: false,
          tool_drive: false,
          drawer_quick_scanner: false,
          drawer_voice_billing: false,
          drawer_customer_display: false
        }
      }));
      setSelectedRole('salesman');
      showToast(lang === 'bn' ? '✓ সেলসম্যান প্রিসেট প্রয়োগ করা হয়েছে (শুধু পণ্য ও স্টক এবং অর্ডার বুকিং চালু)!' : '✓ Salesman preset applied!', 'info');
    } else if (presetType === 'delivery_only_orders') {
      // Delivery only needs Orders to deliver & supply
      setMenuPermissions((prev) => ({
        ...prev,
        delivery: {
          ...DEFAULT_STAFF_MENU_PERMISSIONS.delivery,
          sr_delivery: true,
          drawer_internal_chat: true,
          tool_calc: true,
          // Block everything else
          pos: false,
          salesman_order: false,
          inventory: false,
          invoices: false,
          quotations: false,
          branch_control: false,
          master_hub: false,
          tool_categories: false,
          tool_cash: false,
          debts: false,
          erp: false,
          reports: false,
          crm: false,
          hr: false,
          sr: false,
          cattle: false,
          healthcare: false,
          settings: false,
          tool_diagnostics: false,
          tool_backup: false,
          tool_drive: false
        }
      }));
      setSelectedRole('delivery');
      showToast(lang === 'bn' ? '✓ ডেলিভারি ম্যান প্রিসেট প্রয়োগ করা হয়েছে (শুধু অর্ডার সাপ্লাই ও ডেলিভারি চালু)!' : '✓ Delivery preset applied!', 'info');
    } else if (presetType === 'cashier_pos_only') {
      // Cashier only needs POS & Cash counter
      setMenuPermissions((prev) => ({
        ...prev,
        cashier: {
          ...DEFAULT_STAFF_MENU_PERMISSIONS.cashier,
          pos: true,
          tool_cash: true,
          drawer_quick_scanner: true,
          drawer_voice_billing: true,
          drawer_customer_display: true,
          drawer_internal_chat: true,
          tool_calc: true,
          // Block all management & setup
          master_hub: false,
          branch_control: false,
          salesman_order: false,
          sr_delivery: false,
          invoices: false,
          quotations: false,
          inventory: false,
          debts: false,
          erp: false,
          reports: false,
          crm: false,
          hr: false,
          sr: false,
          settings: false,
          tool_diagnostics: false,
          tool_backup: false,
          tool_drive: false
        }
      }));
      setSelectedRole('cashier');
      showToast(lang === 'bn' ? '✓ ক্যাশিয়ার প্রিসেট প্রয়োগ করা হয়েছে (শুধু POS ও ক্যাশ কাউন্টার চালু)!' : '✓ Cashier preset applied!', 'info');
    } else if (presetType === 'enable_all_for_role') {
      setMenuPermissions((prev) => {
        const fullRoleConfig = {};
        MENU_CATEGORIES.forEach((cat) => {
          cat.items.forEach((item) => {
            fullRoleConfig[item.id] = true;
          });
        });
        return {
          ...prev,
          [selectedRole]: fullRoleConfig
        };
      });
      showToast(lang === 'bn' ? `✓ ${selectedRole} রোলের সকল মেনু অপশন চালু করা হয়েছে!` : '✓ All options enabled for role!', 'info');
    } else if (presetType === 'disable_all_for_role') {
      setMenuPermissions((prev) => {
        const lockedRoleConfig = {};
        MENU_CATEGORIES.forEach((cat) => {
          cat.items.forEach((item) => {
            lockedRoleConfig[item.id] = false;
          });
        });
        return {
          ...prev,
          [selectedRole]: lockedRoleConfig
        };
      });
      showToast(lang === 'bn' ? `✓ ${selectedRole} রোলের সকল অপশন বন্ধ (লক) করা হয়েছে!` : '✓ All options disabled for role!', 'warning');
    }
  };

  const handleSave = (e) => {
    e?.preventDefault();
    playSuccessChime();
    hapticFeedback.success();

    const updated = {
      ...businessSettings,
      posPermissions: permissions,
      staffMenuPermissions: menuPermissions
    };

    updateBusinessSettings(updated);
    try {
      localStorage.setItem('hk360_pos_permissions', JSON.stringify(permissions));
      localStorage.setItem('hk360_staff_menu_permissions', JSON.stringify(menuPermissions));
      // Dispatch realtime live event across open windows / tabs
      window.dispatchEvent(new CustomEvent('hk360_staff_permissions_updated', { detail: menuPermissions }));
    } catch {}

    showToast(
      lang === 'bn'
        ? '✓ স্টাফ রোল পারমিশন ও মেনু অন/অফ সফলভাবে সংরক্ষিত হয়েছে!'
        : '✓ Staff role permissions & menu settings saved successfully!',
      'success'
    );
    onSaved({ permissions, menuPermissions });
  };

  // Filter items if searching
  const currentRoleConfig = menuPermissions[selectedRole] || DEFAULT_STAFF_MENU_PERMISSIONS[selectedRole] || {};

  const activeCountForSelectedRole = useMemo(() => {
    return Object.values(currentRoleConfig).filter(Boolean).length;
  }, [currentRoleConfig]);

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return MENU_CATEGORIES;
    const q = searchQuery.toLowerCase().trim();
    return MENU_CATEGORIES.map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.desc.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q)
      )
    })).filter((cat) => cat.items && cat.items.length > 0);
  }, [searchQuery]);

  const activeRoleObj = STAFF_ROLES.find((r) => r.id === selectedRole) || STAFF_ROLES[0];

  return (
    <div className="pos-permissions-settings animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Banner */}
      <div
        className="glass-card"
        style={{
          padding: '1.2rem',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(99, 102, 241, 0.08))',
          border: '1.5px solid rgba(16, 185, 129, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
            }}
          >
            <ShieldCheck size={26} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{lang === 'bn' ? 'স্টাফ রোল ও মেনু অন/অফ কন্ট্রোল সুইচবোর্ড' : 'Staff Role & Menu Switchboard'}</span>
              <span className="badge" style={{ background: '#10b981', color: '#fff', fontSize: '0.7rem', fontWeight: '800' }}>
                ADMIN MASTER
              </span>
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {lang === 'bn'
                ? 'সেলসম্যান, ক্যাশিয়ার বা ডেলিভারি ম্যানের জন্য যেকোনো অপশন অন/অফ করুন। যা অফ করবেন স্টাফের মোর মেনু ও স্ক্রিনে তা সম্পূর্ণ অদৃশ্য থাকবে।'
                : 'Independently toggle any menu option ON/OFF for each staff role. Disabled modules will be hidden completely.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="btn btn-primary"
          style={{
            padding: '10px 22px',
            borderRadius: '10px',
            fontWeight: '800',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
            cursor: 'pointer'
          }}
        >
          <Save size={17} />
          <span>{lang === 'bn' ? 'সকল পারমিশন সংরক্ষণ করুন' : 'Save All Permissions'}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: MASTER ROLE SWITCHER & 1-CLICK PRESET BUTTONS */}
      {/* ========================================================================= */}
      <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '16px', border: '1.5px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserCheck size={18} style={{ color: activeRoleObj.color }} />
              <span>{lang === 'bn' ? 'ধাপ ১: স্টাফ রোল নির্বাচন করুন' : 'Step 1: Select Staff Role to Configure'}</span>
            </h4>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {lang === 'bn'
                ? `বর্তমানে "${activeRoleObj.label}" রোলের সুবিধা কনফিগারেশন হচ্ছে (${activeCountForSelectedRole} টি অপশন চালু)`
                : `Currently configuring: ${activeRoleObj.enLabel} (${activeCountForSelectedRole} options active)`}
            </div>
          </div>

          {/* Quick Presets */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>
              ⚡ {lang === 'bn' ? '১-ক্লিক প্রিসেট:' : '1-Click Presets:'}
            </span>
            <button
              type="button"
              onClick={() => applyRolePreset('salesman_only_stock')}
              className="btn btn-secondary"
              style={{ padding: '5px 12px', fontSize: '0.76rem', fontWeight: '700', borderRadius: '8px', borderColor: '#f59e0b', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.08)' }}
              title="সেলসম্যানের জন্য শুধু প্রোডাক্ট ও স্টক এবং অর্ডার বুকিং অন থাকবে"
            >
              📦 {lang === 'bn' ? 'সেলসম্যান (শুধু স্টক ও পণ্য)' : 'Salesman (Stock Only)'}
            </button>
            <button
              type="button"
              onClick={() => applyRolePreset('delivery_only_orders')}
              className="btn btn-secondary"
              style={{ padding: '5px 12px', fontSize: '0.76rem', fontWeight: '700', borderRadius: '8px', borderColor: '#0ea5e9', color: '#0ea5e9', background: 'rgba(14, 165, 233, 0.08)' }}
              title="ডেলিভারি ম্যানের জন্য শুধু কোন দোকানে অর্ডার কাটা হয়েছে তা দেখবে"
            >
              🚚 {lang === 'bn' ? 'ডেলিভারি (শুধু অর্ডার সাপ্লাই)' : 'Delivery (Orders Only)'}
            </button>
            <button
              type="button"
              onClick={() => applyRolePreset('cashier_pos_only')}
              className="btn btn-secondary"
              style={{ padding: '5px 12px', fontSize: '0.76rem', fontWeight: '700', borderRadius: '8px', borderColor: '#10b981', color: '#10b981', background: 'rgba(16, 185, 129, 0.08)' }}
              title="ক্যাশিয়ারের জন্য শুধু POS সেলস কাউন্টার অন থাকবে"
            >
              🛒 {lang === 'bn' ? 'ক্যাশিয়ার (শুধু POS কাউন্টার)' : 'Cashier (POS Only)'}
            </button>
          </div>
        </div>

        {/* 4 Selectable Role Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
          {STAFF_ROLES.map((r) => {
            const isSelected = selectedRole === r.id;
            const roleConf = menuPermissions[r.id] || DEFAULT_STAFF_MENU_PERMISSIONS[r.id] || {};
            const activeCount = Object.values(roleConf).filter(Boolean).length;

            return (
              <div
                key={r.id}
                type="button"
                onClick={() => {
                  playButtonClick();
                  hapticFeedback.light();
                  setSelectedRole(r.id);
                }}
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: isSelected ? `2px solid ${r.color}` : '1px solid var(--border-color)',
                  background: isSelected ? `${r.color}15` : 'var(--bg-primary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? `0 4px 16px ${r.color}25` : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '0.92rem', color: isSelected ? r.color : 'var(--text-main)' }}>
                      {lang === 'bn' ? r.label : r.enLabel}
                    </strong>
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: '800',
                        padding: '1px 6px',
                        borderRadius: '6px',
                        background: `${r.color}22`,
                        color: r.color
                      }}
                    >
                      {r.badge}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                    {activeCount} {lang === 'bn' ? 'টি অপশন সক্রিয়' : 'active options'}
                  </div>
                </div>

                {isSelected ? (
                  <CheckCircle2 size={20} style={{ color: r.color }} />
                ) : (
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '1px solid var(--border-color)' }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: GRANULAR MENU TOGGLE SWITCHES (SEARCH & BATCH ACTIONS) */}
      {/* ========================================================================= */}
      <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={18} style={{ color: activeRoleObj.color }} />
              <span>
                {lang === 'bn'
                  ? `ধাপ ২: "${activeRoleObj.label}" এর জন্য মেনু অপশনসমূহ অন/অফ করুন`
                  : `Step 2: Toggle Menu Visibility for ${activeRoleObj.enLabel}`}
              </span>
            </h4>
            <p style={{ margin: '3px 0 0', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              {lang === 'bn'
                ? 'অন থাকলে স্টাফের মোর অপশনে ভাসবে। অফ থাকলে স্টাফের একাউন্ট থেকে সম্পূর্ণ মুছে যাবে।'
                : 'Toggled ON items will appear in the staff More Menu. Disabled items are strictly hidden.'}
            </p>
          </div>

          {/* Search Box & Mass Toggles */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: '220px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder={lang === 'bn' ? 'মেনু সার্চ করুন...' : 'Search menu...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 8px 6px 30px',
                  fontSize: '0.8rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-main)'
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => applyRolePreset('enable_all_for_role')}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #10b981',
                background: 'rgba(16, 185, 129, 0.1)',
                color: '#10b981',
                fontSize: '0.75rem',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              ✓ {lang === 'bn' ? 'সব অন' : 'Enable All'}
            </button>

            <button
              type="button"
              onClick={() => applyRolePreset('disable_all_for_role')}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #ef4444',
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                fontSize: '0.75rem',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              ✕ {lang === 'bn' ? 'সব অফ' : 'Disable All'}
            </button>
          </div>
        </div>

        {/* Categorized Modules Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filteredCategories.map((category) => (
            <div key={category.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '0.84rem', fontWeight: '800', color: 'var(--text-main)', opacity: 0.9 }}>
                {lang === 'bn' ? category.title : category.enTitle}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '8px' }}>
                {category.items.map((item) => {
                  const isEnabled = currentRoleConfig[item.id] !== undefined ? Boolean(currentRoleConfig[item.id]) : false;

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleToggleMenuPermission(selectedRole, item.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        border: isEnabled ? `1.5px solid ${activeRoleObj.color}80` : '1px solid var(--border-color)',
                        background: isEnabled ? `${activeRoleObj.color}0a` : 'var(--bg-primary)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: isEnabled ? `0 2px 8px ${activeRoleObj.color}15` : 'none'
                      }}
                    >
                      <div style={{ paddingRight: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <strong style={{ fontSize: '0.84rem', color: isEnabled ? 'var(--text-main)' : 'var(--text-dim)' }}>
                            {item.name}
                          </strong>
                          {isEnabled ? (
                            <span style={{ fontSize: '0.62rem', fontWeight: '800', padding: '1px 5px', borderRadius: '4px', background: `${activeRoleObj.color}25`, color: activeRoleObj.color }}>
                              ON
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.62rem', fontWeight: '700', padding: '1px 5px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-muted)' }}>
                              OFF
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.3 }}>
                          {item.desc}
                        </div>
                      </div>

                      {/* Tactile Toggle Switch */}
                      <div
                        style={{
                          width: '42px',
                          height: '24px',
                          borderRadius: '14px',
                          background: isEnabled ? activeRoleObj.color : 'rgba(100, 116, 139, 0.3)',
                          position: 'relative',
                          transition: 'background 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          flexShrink: 0
                        }}
                      >
                        <div
                          style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            background: '#ffffff',
                            position: 'absolute',
                            top: '3px',
                            left: isEnabled ? '21px' : '3px',
                            transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.6rem'
                          }}
                        >
                          {isEnabled ? '✓' : ''}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: POS TERMINAL SPECIFIC BUTTONS & SECURITY CONSTRAINTS */}
      {/* ========================================================================= */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {/* Card 1: POS Screen Visible Buttons */}
        <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '16px' }}>
          <h4 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            <Monitor size={18} color="var(--business-primary)" />
            <span>{lang === 'bn' ? '৩. POS কাউন্টার স্ক্রিনের বাটন প্রদর্শন' : '3. POS Visible Buttons'}</span>
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              {
                key: 'showCashDrawer',
                label: 'ক্যাশ ড্রয়ার বাটন ও রিকনসিলিয়েশন',
                desc: 'কাউন্টারে ড্রয়ারের নগদ টাকা মেলানোর বাটন',
                icon: <Banknote size={16} color="#10b981" />
              },
              {
                key: 'showCustomerMirror',
                label: 'গ্রাহক লাইভ ডিসপ্লে বাটন (মিরর)',
                desc: 'গ্রাহকের দিকে ২য় স্ক্রিনে লাইভ কার্ট দেখানোর সুইচ',
                icon: <Monitor size={16} color="#6366f1" />
              },
              {
                key: 'showHoldCart',
                label: 'কার্ট সাময়িক সংরক্ষণ (Hold & Recall)',
                desc: 'কাস্টমারের কেনাকাটা সাময়িক হোল্ড করে পরের বিল করা',
                icon: <Lock size={16} color="#f59e0b" />
              },
              {
                key: 'showSoundbox',
                label: 'ডিজিটাল সাউন্ডবক্স ভয়েস পে বাটন',
                desc: 'টাকা জমা হলে সাথে সাথে সাউন্ডবক্সে ঘোষণা',
                icon: <Volume2 size={16} color="#0ea5e9" />
              },
              {
                key: 'showVoiceBilling',
                label: 'ভয়েস বিলিং মাইক বাটন (AI Voice)',
                desc: 'মুখে বলে দ্রুত আইটেম কার্টে যোগ করার সুবিধা',
                icon: <Mic size={16} color="#ec4899" />
              },
              {
                key: 'showWakeLock',
                label: 'স্ক্রিন অলওয়েজ অন (Wake Lock)',
                desc: 'কাউন্টারে কাজ করার সময় মোবাইলের স্ক্রিন বন্ধ না হওয়া',
                icon: <Sun size={16} color="#eab308" />
              }
            ].map((item) => (
              <label
                key={item.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {item.icon}
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--text-main)' }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      {item.desc}
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={permissions[item.key]}
                  onChange={() => handleToggle(item.key)}
                  style={{ width: '18px', height: '18px', accentColor: '#10b981', cursor: 'pointer' }}
                />
              </label>
            ))}
          </div>
        </div>

        {/* Card 2: Security, Maximum Discount & Shift Cash */}
        <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '16px' }}>
          <h4 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            <Percent size={18} color="#f59e0b" />
            <span>{lang === 'bn' ? '৪. ডিসকাউন্ট সিলিং ও শিফট ক্যাশ সুরক্ষা' : '4. Discount Ceiling & Shift Safety'}</span>
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 12px',
                borderRadius: '10px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                cursor: 'pointer'
              }}
            >
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  {lang === 'bn' ? 'ক্যাশিয়ার কি ডিসকাউন্ট দিতে পারবে?' : 'Allow Cashier Discount'}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  {lang === 'bn' ? 'বন্ধ থাকলে ক্যাশিয়ার বিলে কোনো ছাড় দিতে পারবে না' : 'Block discount field for cashiers'}
                </div>
              </div>
              <input
                type="checkbox"
                checked={permissions.allowCashierDiscount}
                onChange={() => handleToggle('allowCashierDiscount')}
                style={{ width: '18px', height: '18px', accentColor: '#10b981', cursor: 'pointer' }}
              />
            </label>

            {permissions.allowCashierDiscount && (
              <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-main)' }}>
                    {lang === 'bn' ? 'ক্যাশিয়ারের সর্বোচ্চ ছাড় সীমা (Discount Cap):' : 'Max Discount %:'}
                  </span>
                  <span style={{ fontSize: '0.9rem', fontWeight: '900', color: '#f59e0b' }}>
                    {permissions.maxCashierDiscountPercent}%
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  step="1"
                  value={permissions.maxCashierDiscountPercent}
                  onChange={(e) => setPermissions(prev => ({ ...prev, maxCashierDiscountPercent: Number(e.target.value) }))}
                  style={{ width: '100%', accentColor: '#f59e0b', cursor: 'pointer' }}
                />
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {lang === 'bn' ? `ক্যাশিয়ার বিলে সর্বোচ্চ ${permissions.maxCashierDiscountPercent}% পর্যন্ত ছাড় দিতে পারবে।` : `Cashier cannot discount beyond ${permissions.maxCashierDiscountPercent}%.`}
                </div>
              </div>
            )}

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 12px',
                borderRadius: '10px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                cursor: 'pointer'
              }}
            >
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  {lang === 'bn' ? 'শিফট শুরুর ওপেনিং ক্যাশ ইনপুট বাধ্যতামূলক' : 'Require Shift Opening Cash'}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  {lang === 'bn' ? 'প্রতিদিন কাউন্টার চালুর সময় ক্যাশ বক্সে কত টাকা আছে তা দিয়ে শুরু করতে হবে' : 'Prompt cashier for starting cash balance'}
                </div>
              </div>
              <input
                type="checkbox"
                checked={permissions.requireShiftOpeningCash}
                onChange={() => handleToggle('requireShiftOpeningCash')}
                style={{ width: '18px', height: '18px', accentColor: '#10b981', cursor: 'pointer' }}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Floating Save Bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
        <button
          type="button"
          onClick={handleSave}
          className="btn btn-primary"
          style={{
            padding: '11px 28px',
            borderRadius: '12px',
            fontWeight: '800',
            fontSize: '0.95rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 18px rgba(16, 185, 129, 0.4)'
          }}
        >
          <Save size={18} />
          <span>{lang === 'bn' ? 'সংরক্ষণ ও পরিবর্তন কার্যকর করুন' : 'Save & Enforce Permissions'}</span>
        </button>
      </div>
    </div>
  );
};
