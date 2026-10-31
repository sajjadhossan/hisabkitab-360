import React, { useState, useEffect } from 'react';
import {
  getTenantsList,
  saveTenantsList,
  createNewTenant,
  updateTenant,
  deleteTenant,
  toggleTenantModule,
  getActiveWorkspaceId,
  setActiveWorkspaceId,
  SAAS_MODULES
} from '../../services/tenantManagerService';
import {
  Building2,
  Users,
  Wallet,
  TrendingUp,
  Receipt,
  Send,
  MessageSquare,
  FileText,
  QrCode,
  PieChart,
  ShieldCheck,
  Plus,
  Search,
  Check,
  X,
  Sliders,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ExternalLink,
  Crown,
  Trash2,
  Edit2,
  Power,
  Calendar,
  Phone,
  Mail,
  Sparkles,
  Zap,
  Rocket
} from 'lucide-react';
import { GranularMasterSwitchboardModal } from './GranularMasterSwitchboardModal';
import { BlueGreenReleaseModal } from './BlueGreenReleaseModal';

const MODULE_ICON_MAP = {
  Wallet: Wallet,
  TrendingUp: TrendingUp,
  Users: Users,
  Receipt: Receipt,
  Building2: Building2,
  Send: Send,
  MessageSquare: MessageSquare,
  FileText: FileText,
  QrCode: QrCode,
  PieChart: PieChart,
  ShieldCheck: ShieldCheck
};

export const TenantModuleToggleManager = ({ isOpen, onClose, isLight, lang = 'bn', onWorkspaceSwitched }) => {
  const isEn = lang === 'en';
  const [tenants, setTenants] = useState(() => getTenantsList());
  const [activeWorkspace, setActiveWorkspace] = useState(() => getActiveWorkspaceId());
  const [activeTab, setActiveTab] = useState('clients'); // 'clients' | 'my_samity'
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTenantId, setExpandedTenantId] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [granularTenant, setGranularTenant] = useState(null);
  const [isOtaModalOpen, setIsOtaModalOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  // Form State for New / Edit Tenant
  const [formData, setFormData] = useState({
    name: '',
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
    plan: 'Standard Yearly',
    validUntil: '',
    address: '',
    registrationNo: '',
    initialModules: {}
  });

  useEffect(() => {
    const handleTenantsChanged = (e) => {
      if (e?.detail?.tenants) setTenants(e.detail.tenants);
      else setTenants(getTenantsList());
    };
    const handleWorkspaceChanged = (e) => {
      if (e?.detail?.tenantId) setActiveWorkspace(e.detail.tenantId);
    };

    window.addEventListener('somiti_tenants_changed', handleTenantsChanged);
    window.addEventListener('somiti_workspace_switched', handleWorkspaceChanged);

    return () => {
      window.removeEventListener('somiti_tenants_changed', handleTenantsChanged);
      window.removeEventListener('somiti_workspace_switched', handleWorkspaceChanged);
    };
  }, []);

  if (!isOpen) return null;

  const showNotice = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const mySamity = tenants.find(t => t.isOwnSamity) || tenants[0];

  const filteredTenants = tenants.filter(t => {
    if (activeTab === 'my_samity') return t.isOwnSamity;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      t.name.toLowerCase().includes(q) ||
      t.ownerName.toLowerCase().includes(q) ||
      t.ownerPhone.includes(q) ||
      (t.ownerEmail && t.ownerEmail.toLowerCase().includes(q))
    );
  });

  // Calculate high-level SaaS metrics
  const totalClientsCount = tenants.filter(t => !t.isOwnSamity).length;
  const activeClientsCount = tenants.filter(t => !t.isOwnSamity && t.status === 'active').length;
  const totalModulesEnabled = tenants.reduce((acc, t) => {
    const count = Object.values(t.modules || {}).filter(Boolean).length;
    return acc + count;
  }, 0);

  const handleOpenAddModal = () => {
    const defaultMods = {};
    SAAS_MODULES.forEach(m => {
      defaultMods[m.id] = m.defaultEnabled;
    });
    setFormData({
      name: '',
      ownerName: '',
      ownerPhone: '',
      ownerEmail: '',
      plan: 'Standard Yearly',
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      address: '',
      registrationNo: '',
      initialModules: defaultMods
    });
    setEditingTenant(null);
    setIsAddModalOpen(true);
  };

  const handleSaveTenant = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showNotice(isEn ? 'Please enter Samity name' : 'সমিতির নাম প্রদান করুন', 'error');
      return;
    }

    if (editingTenant) {
      updateTenant(editingTenant.id, {
        name: formData.name,
        ownerName: formData.ownerName,
        ownerPhone: formData.ownerPhone,
        ownerEmail: formData.ownerEmail,
        plan: formData.plan,
        validUntil: formData.validUntil,
        settings: {
          address: formData.address,
          registrationNo: formData.registrationNo
        }
      });
      showNotice(isEn ? 'Client updated successfully' : 'ক্লায়েন্টের তথ্য সফলভাবে আপডেট হয়েছে');
    } else {
      createNewTenant({
        name: formData.name,
        ownerName: formData.ownerName,
        ownerPhone: formData.ownerPhone,
        ownerEmail: formData.ownerEmail,
        plan: formData.plan,
        validUntil: formData.validUntil,
        address: formData.address,
        registrationNo: formData.registrationNo,
        modules: formData.initialModules,
        isOwnSamity: false
      });
      showNotice(isEn ? 'New client created with custom modules' : 'নতুন ক্লায়েন্ট সফলভাবে যুক্ত হয়েছে');
    }

    setIsAddModalOpen(false);
    setEditingTenant(null);
    setTenants(getTenantsList());
  };

  const handleToggleModule = (tenantId, moduleId) => {
    const nextState = toggleTenantModule(tenantId, moduleId);
    setTenants(getTenantsList());
    const mod = SAAS_MODULES.find(m => m.id === moduleId);
    const modName = isEn ? mod?.nameEn : mod?.nameBn;
    showNotice(
      nextState
        ? `${modName} ${isEn ? 'Enabled' : 'চালু করা হয়েছে'}`
        : `${modName} ${isEn ? 'Disabled' : 'বন্ধ করা হয়েছে'}`
    );
  };

  const handleSwitchWorkspace = (tenantId) => {
    setActiveWorkspaceId(tenantId);
    setActiveWorkspace(tenantId);
    const t = getTenantsList().find(item => item.id === tenantId);
    showNotice(
      isEn
        ? `Switched workspace to: ${t?.name}`
        : `সফলভাবে স্যুইচ করা হয়েছে: ${t?.name}`
    );
    if (onWorkspaceSwitched) {
      onWorkspaceSwitched(tenantId);
    }
  };

  const handleDeleteTenant = (tenantId, tenantName) => {
    if (window.confirm(isEn ? `Are you sure you want to delete ${tenantName}?` : `আপনি কি নিশ্চিতভাবে ${tenantName} মুছে ফেলতে চান?`)) {
      try {
        deleteTenant(tenantId);
        setTenants(getTenantsList());
        showNotice(isEn ? 'Client deleted' : 'ক্লায়েন্ট মুছে ফেলা হয়েছে');
      } catch (err) {
        showNotice(err.message, 'error');
      }
    }
  };

  const handleToggleStatus = (tenantId, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    updateTenant(tenantId, { status: nextStatus });
    setTenants(getTenantsList());
    showNotice(
      nextStatus === 'active'
        ? (isEn ? 'Client Activated' : 'ক্লায়েন্ট সক্রিয় করা হয়েছে')
        : (isEn ? 'Client Suspended' : 'ক্লায়েন্ট সাময়িক স্থগিত করা হয়েছে')
    );
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9999,
      background: 'rgba(5, 8, 15, 0.85)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      fontFamily: "'Inter', 'Plus Jakarta Sans', 'Hind Siliguri', sans-serif"
    }}>
      <div style={{
        width: '100%',
        maxWidth: '1100px',
        maxHeight: '92vh',
        background: isLight ? '#ffffff' : '#0c1322',
        color: isLight ? '#0f172a' : '#f8fafc',
        borderRadius: '20px',
        border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Toast Notification */}
        {notification && (
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            zIndex: 100,
            background: notification.type === 'error' ? '#ef4444' : '#10b981',
            color: '#ffffff',
            padding: '10px 18px',
            borderRadius: '12px',
            fontSize: '0.85rem',
            fontWeight: '800',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Sparkles size={16} />
            <span>{notification.msg}</span>
          </div>
        )}

        {/* Top Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
          background: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.8)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)'
            }}>
              <Crown size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '900', letterSpacing: '-0.02em' }}>
                  {isEn ? 'SaaS Control Tower' : 'সুপার এডমিন: ক্লায়েন্ট ও মডিউল ম্যানেজার'}
                </h2>
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: '800',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  background: 'rgba(245, 158, 11, 0.2)',
                  color: '#f59e0b',
                  border: '1px solid rgba(245, 158, 11, 0.35)'
                }}>
                  MULTI-TENANT SAAS
                </span>
              </div>
              <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: isLight ? '#64748b' : '#94a3b8' }}>
                {isEn
                  ? 'Sell the app, toggle modules per client request, and customize your own Samity.'
                  : 'ক্লায়েন্টদের কাছে অ্যাপ বিক্রি করুন, রিকোয়েস্ট অনুযায়ী অপশন অন-অফ করুন এবং নিজের সমিতিও চালান।'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setIsOtaModalOpen(true)}
              style={{
                background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '9px 16px',
                fontSize: '0.82rem',
                fontWeight: '800',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.35)'
              }}
            >
              <Rocket size={16} />
              <span>{isEn ? 'OTA Blue-Green Release' : '🚀 ১-ক্লিক ওটিএ রিলিজ'}</span>
            </button>

            <button
              onClick={handleOpenAddModal}
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '9px 16px',
                fontSize: '0.82rem',
                fontWeight: '800',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}
            >
              <Plus size={16} />
              <span>{isEn ? 'Add New Client' : 'নতুন ক্লায়েন্ট যোগ করুন'}</span>
            </button>

            <button
              onClick={onClose}
              style={{
                background: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)',
                color: isLight ? '#0f172a' : '#cbd5e1',
                border: 'none',
                borderRadius: '12px',
                width: '38px',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Metrics Bar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          padding: '14px 24px',
          background: isLight ? '#f1f5f9' : 'rgba(15, 23, 42, 0.4)',
          borderBottom: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <div style={{
            background: isLight ? '#ffffff' : 'rgba(30, 41, 59, 0.6)',
            padding: '10px 14px',
            borderRadius: '12px',
            border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <Building2 size={20} color="#3b82f6" />
            <div>
              <div style={{ fontSize: '0.7rem', color: isLight ? '#64748b' : '#94a3b8', fontWeight: '700' }}>
                {isEn ? 'Total Client Samities' : 'মোট ক্লায়েন্ট সমিতি'}
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: '900', color: isLight ? '#0f172a' : '#f8fafc' }}>
                {totalClientsCount}
              </div>
            </div>
          </div>

          <div style={{
            background: isLight ? '#ffffff' : 'rgba(30, 41, 59, 0.6)',
            padding: '10px 14px',
            borderRadius: '12px',
            border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <ShieldCheck size={20} color="#10b981" />
            <div>
              <div style={{ fontSize: '0.7rem', color: isLight ? '#64748b' : '#94a3b8', fontWeight: '700' }}>
                {isEn ? 'Active Subscriptions' : 'সক্রিয় সাবস্ক্রিপশন'}
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#10b981' }}>
                {activeClientsCount}
              </div>
            </div>
          </div>

          <div style={{
            background: isLight ? '#ffffff' : 'rgba(30, 41, 59, 0.6)',
            padding: '10px 14px',
            borderRadius: '12px',
            border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <Sliders size={20} color="#8b5cf6" />
            <div>
              <div style={{ fontSize: '0.7rem', color: isLight ? '#64748b' : '#94a3b8', fontWeight: '700' }}>
                {isEn ? 'Active Feature Toggles' : 'মোট সক্রিয় ফিচার'}
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#8b5cf6' }}>
                {totalModulesEnabled}
              </div>
            </div>
          </div>

          <div style={{
            background: isLight ? '#ffffff' : 'rgba(30, 41, 59, 0.6)',
            padding: '10px 14px',
            borderRadius: '12px',
            border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <Crown size={20} color="#f59e0b" />
            <div>
              <div style={{ fontSize: '0.7rem', color: isLight ? '#64748b' : '#94a3b8', fontWeight: '700' }}>
                {isEn ? 'Current Active Workspace' : 'বর্তমান ওয়ার্কস্পেস'}
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: '900', color: '#f59e0b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                {tenants.find(t => t.id === activeWorkspace)?.name || 'Default'}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation & Search */}
        <div style={{
          padding: '12px 24px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          borderBottom: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setActiveTab('clients')}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontWeight: '800',
                cursor: 'pointer',
                border: 'none',
                background: activeTab === 'clients'
                  ? (isLight ? '#0284c7' : '#0284c7')
                  : (isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.06)'),
                color: activeTab === 'clients' ? '#ffffff' : (isLight ? '#475569' : '#94a3b8'),
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Building2 size={15} />
              <span>{isEn ? 'All Client Samities' : 'সকল ক্লায়েন্ট সমিতি ও লাইসেন্স'}</span>
              <span style={{
                background: 'rgba(255, 255, 255, 0.25)',
                padding: '1px 6px',
                borderRadius: '8px',
                fontSize: '0.7rem'
              }}>
                {totalClientsCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('my_samity')}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontWeight: '800',
                cursor: 'pointer',
                border: 'none',
                background: activeTab === 'my_samity'
                  ? (isLight ? '#059669' : '#059669')
                  : (isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.06)'),
                color: activeTab === 'my_samity' ? '#ffffff' : (isLight ? '#475569' : '#94a3b8'),
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Crown size={15} />
              <span>{isEn ? 'My Own Samity (Customize)' : 'আমার নিজস্ব সমিতি (মেনু অন/অফ)'}</span>
            </button>
          </div>

          {activeTab === 'clients' && (
            <div style={{ position: 'relative', width: '260px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder={isEn ? 'Search client or phone...' : 'সমিতি, নাম বা ফোন দিয়ে খুঁজুন...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 12px 7px 32px',
                  borderRadius: '10px',
                  background: isLight ? '#f1f5f9' : 'rgba(30, 41, 59, 0.6)',
                  color: isLight ? '#0f172a' : '#f8fafc',
                  border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.1)',
                  fontSize: '0.8rem',
                  outline: 'none'
                }}
              />
            </div>
          )}
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {/* TAB 1: CLIENT TENANTS LIST & SWITCHBOARDS */}
          {activeTab === 'clients' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filteredTenants.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                  <Building2 size={40} style={{ opacity: 0.4, marginBottom: '8px' }} />
                  <p>{isEn ? 'No client samities found.' : 'কোনো ক্লায়েন্ট সমিতি পাওয়া যায়নি।'}</p>
                </div>
              ) : (
                filteredTenants.map((tenant) => {
                  const isCurrentActive = activeWorkspace === tenant.id;
                  const isExpanded = expandedTenantId === tenant.id;
                  const enabledCount = Object.values(tenant.modules || {}).filter(Boolean).length;

                  return (
                    <div
                      key={tenant.id}
                      style={{
                        background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.7)',
                        borderRadius: '16px',
                        border: isCurrentActive
                          ? '2px solid #10b981'
                          : isLight
                            ? '1px solid #e2e8f0'
                            : '1px solid rgba(255, 255, 255, 0.08)',
                        padding: '16px 20px',
                        boxShadow: isCurrentActive
                          ? '0 4px 20px rgba(16, 185, 129, 0.15)'
                          : '0 2px 8px rgba(0,0,0,0.05)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {/* Tenant Overview Header */}
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '12px',
                            background: tenant.isOwnSamity
                              ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                              : 'linear-gradient(135deg, #0284c7, #0369a1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                            fontWeight: '900',
                            fontSize: '1rem',
                            flexShrink: 0
                          }}>
                            {tenant.isOwnSamity ? '👑' : tenant.name[0]}
                          </div>

                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '900' }}>
                                {tenant.name}
                              </h3>
                              {tenant.isOwnSamity && (
                                <span style={{
                                  fontSize: '0.62rem',
                                  fontWeight: '900',
                                  background: '#f59e0b',
                                  color: '#000',
                                  padding: '1px 6px',
                                  borderRadius: '6px'
                                }}>
                                  {isEn ? 'HEAD OFFICE' : 'আপনার নিজস্ব'}
                                </span>
                              )}
                              <span style={{
                                fontSize: '0.65rem',
                                fontWeight: '800',
                                padding: '1px 8px',
                                borderRadius: '8px',
                                background: tenant.status === 'active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                color: tenant.status === 'active' ? '#10b981' : '#ef4444',
                                border: tenant.status === 'active' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)'
                              }}>
                                {tenant.status === 'active' ? (isEn ? 'ACTIVE' : 'সক্রিয়') : (isEn ? 'SUSPENDED' : 'স্থগিত')}
                              </span>
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '14px', marginTop: '4px', fontSize: '0.75rem', color: isLight ? '#64748b' : '#94a3b8' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Users size={12} /> {tenant.ownerName}
                              </span>
                              {tenant.ownerPhone && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Phone size={12} /> {tenant.ownerPhone}
                                </span>
                              )}
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Calendar size={12} /> {isEn ? 'Expires:' : 'মেয়াদ:'} {tenant.validUntil}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            onClick={() => handleSwitchWorkspace(tenant.id)}
                            title={isEn ? 'Open workspace for this samity' : 'এই সমিতির সফটওয়্যার ওপেন করুন'}
                            style={{
                              background: isCurrentActive ? '#10b981' : (isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.08)'),
                              color: isCurrentActive ? '#ffffff' : (isLight ? '#0f172a' : '#f8fafc'),
                              border: isCurrentActive ? 'none' : (isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)'),
                              borderRadius: '10px',
                              padding: '6px 12px',
                              fontSize: '0.76rem',
                              fontWeight: '800',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <ExternalLink size={13} />
                            <span>{isCurrentActive ? (isEn ? 'Active Workspace' : 'বর্তমান ওয়ার্কস্পেস') : (isEn ? 'Switch Workspace' : 'ওয়ার্কস্পেসে যান')}</span>
                          </button>

                          <button
                            onClick={() => setExpandedTenantId(isExpanded ? null : tenant.id)}
                            style={{
                              background: 'rgba(99, 102, 241, 0.15)',
                              color: '#818cf8',
                              border: '1px solid rgba(99, 102, 241, 0.3)',
                              borderRadius: '10px',
                              padding: '6px 12px',
                              fontSize: '0.76rem',
                              fontWeight: '800',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <Sliders size={13} />
                            <span>{isEn ? `Modules (${enabledCount}/${SAAS_MODULES.length})` : `মডিউল সুইচ (${enabledCount}/${SAAS_MODULES.length})`}</span>
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>

                          <button
                            onClick={() => setGranularTenant(tenant)}
                            style={{
                              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.2))',
                              color: '#f59e0b',
                              border: '1.5px solid rgba(245, 158, 11, 0.4)',
                              borderRadius: '10px',
                              padding: '6px 12px',
                              fontSize: '0.76rem',
                              fontWeight: '800',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                            title={isEn ? 'A-to-Z Master Switchboard (Field to Member - 43 Options)' : 'মাঠকর্মী থেকে সদস্য পর্যন্ত এ-টু-জেড ৪৩টি অপশন মাস্টার সুইচবোর্ড'}
                          >
                            <Zap size={13} />
                            <span>{isEn ? 'A-to-Z Options' : 'এ-টু-জেড অপশন'}</span>
                          </button>

                          {!tenant.isOwnSamity && (
                            <>
                              <button
                                onClick={() => handleToggleStatus(tenant.id, tenant.status)}
                                title={tenant.status === 'active' ? (isEn ? 'Suspend' : 'স্থগিত করুন') : (isEn ? 'Activate' : 'সক্রিয় করুন')}
                                style={{
                                  background: tenant.status === 'active' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                                  color: tenant.status === 'active' ? '#ef4444' : '#10b981',
                                  border: 'none',
                                  borderRadius: '8px',
                                  width: '32px',
                                  height: '32px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer'
                                }}
                              >
                                <Power size={14} />
                              </button>

                              <button
                                onClick={() => handleDeleteTenant(tenant.id, tenant.name)}
                                title={isEn ? 'Delete' : 'মুছে ফেলুন'}
                                style={{
                                  background: 'rgba(239, 68, 68, 0.12)',
                                  color: '#ef4444',
                                  border: 'none',
                                  borderRadius: '8px',
                                  width: '32px',
                                  height: '32px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer'
                                }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Expandable Module Switchboard Grid */}
                      {isExpanded && (
                        <div style={{
                          marginTop: '16px',
                          paddingTop: '16px',
                          borderTop: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: '800', color: isLight ? '#0f172a' : '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Sliders size={14} color="#6366f1" />
                              <span>{isEn ? 'Client Feature Toggles (Real-Time)' : 'ক্লায়েন্ট মডিউল অন/অফ সুইচবোর্ড (লাইভ ও তাৎক্ষণিক)'}</span>
                            </div>
                            <span style={{ fontSize: '0.72rem', color: isLight ? '#64748b' : '#94a3b8' }}>
                              {isEn ? 'Turn off options client did not pay for or does not need' : 'ক্লায়েন্ট যে অপশনগুলো চায়নি সেগুলো বন্ধ রাখুন'}
                            </span>
                          </div>

                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                            gap: '10px'
                          }}>
                            {SAAS_MODULES.map((mod) => {
                              const isEnabled = tenant.modules?.[mod.id] !== false;
                              const IconCmp = MODULE_ICON_MAP[mod.icon] || FileText;

                              return (
                                <div
                                  key={mod.id}
                                  onClick={() => handleToggleModule(tenant.id, mod.id)}
                                  style={{
                                    background: isEnabled
                                      ? (isLight ? '#f0fdf4' : 'rgba(16, 185, 129, 0.1)')
                                      : (isLight ? '#f8fafc' : 'rgba(30, 41, 59, 0.3)'),
                                    borderRadius: '12px',
                                    border: isEnabled
                                      ? '1.5px solid #10b981'
                                      : (isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.08)'),
                                    padding: '10px 12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, marginRight: '10px' }}>
                                    <div style={{
                                      width: '32px',
                                      height: '32px',
                                      borderRadius: '8px',
                                      background: isEnabled ? '#10b981' : (isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.1)'),
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      color: isEnabled ? '#ffffff' : '#64748b',
                                      flexShrink: 0
                                    }}>
                                      <IconCmp size={16} />
                                    </div>
                                    <div>
                                      <div style={{ fontSize: '0.8rem', fontWeight: '800', color: isEnabled ? (isLight ? '#065f46' : '#34d399') : (isLight ? '#64748b' : '#94a3b8') }}>
                                        {isEn ? mod.nameEn : mod.nameBn}
                                      </div>
                                      <div style={{ fontSize: '0.68rem', color: isLight ? '#64748b' : '#94a3b8', lineHeight: 1.2 }}>
                                        {isEn ? mod.descBn : mod.descBn}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Custom Switch Indicator */}
                                  <div style={{
                                    width: '36px',
                                    height: '20px',
                                    borderRadius: '12px',
                                    background: isEnabled ? '#10b981' : (isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.2)'),
                                    position: 'relative',
                                    flexShrink: 0,
                                    transition: 'all 0.2s ease'
                                  }}>
                                    <div style={{
                                      width: '16px',
                                      height: '16px',
                                      borderRadius: '50%',
                                      background: '#ffffff',
                                      position: 'absolute',
                                      top: '2px',
                                      left: isEnabled ? '18px' : '2px',
                                      transition: 'all 0.2s ease',
                                      boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                                    }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: MY OWN SAMITY CUSTOMIZATION */}
          {activeTab === 'my_samity' && mySamity && (
            <div style={{
              background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.7)',
              borderRadius: '16px',
              border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
              padding: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Crown size={22} color="#f59e0b" />
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '900' }}>
                      {mySamity.name}
                    </h3>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: isLight ? '#64748b' : '#94a3b8' }}>
                    {isEn
                      ? 'Select which modules you actually need in your own Samity to keep the menus clean & fast.'
                      : 'আপনার নিজের সমিতিতে যে যে অপশনগুলো ব্যবহৃত হয় না, সেগুলো বন্ধ রাখুন যাতে মেনু হালকা ও দ্রুতগতির থাকে।'}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => setGranularTenant(mySamity)}
                    style={{
                      background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.2))',
                      color: '#f59e0b',
                      border: '1.5px solid rgba(245, 158, 11, 0.4)',
                      borderRadius: '12px',
                      padding: '8px 16px',
                      fontSize: '0.82rem',
                      fontWeight: '800',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    title="আমার নিজস্ব সমিতির এ-টু-জেড সকল ৪৩টি অপশন কাস্টমাইজ করুন"
                  >
                    <Zap size={14} />
                    <span>{isEn ? 'A-to-Z Granular Options' : 'নিজস্ব সমিতির এ-টু-জেড অপশন'}</span>
                  </button>

                  <button
                    onClick={() => handleSwitchWorkspace(mySamity.id)}
                    style={{
                      background: '#10b981',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '8px 16px',
                      fontSize: '0.82rem',
                      fontWeight: '800',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <ExternalLink size={14} />
                    <span>{isEn ? 'Open My Samity' : 'আমার সমিতিতে যান'}</span>
                  </button>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '12px'
              }}>
                {SAAS_MODULES.map((mod) => {
                  const isEnabled = mySamity.modules?.[mod.id] !== false;
                  const IconCmp = MODULE_ICON_MAP[mod.icon] || FileText;

                  return (
                    <div
                      key={mod.id}
                      onClick={() => handleToggleModule(mySamity.id, mod.id)}
                      style={{
                        background: isEnabled
                          ? (isLight ? '#f0fdf4' : 'rgba(16, 185, 129, 0.1)')
                          : (isLight ? '#f8fafc' : 'rgba(30, 41, 59, 0.3)'),
                        borderRadius: '12px',
                        border: isEnabled
                          ? '1.5px solid #10b981'
                          : (isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.08)'),
                        padding: '12px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, marginRight: '10px' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          background: isEnabled ? '#10b981' : (isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.1)'),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isEnabled ? '#ffffff' : '#64748b',
                          flexShrink: 0
                        }}>
                          <IconCmp size={18} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: '800', color: isEnabled ? (isLight ? '#065f46' : '#34d399') : (isLight ? '#64748b' : '#94a3b8') }}>
                            {isEn ? mod.nameEn : mod.nameBn}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: isLight ? '#64748b' : '#94a3b8', lineHeight: 1.2 }}>
                            {isEn ? mod.descBn : mod.descBn}
                          </div>
                        </div>
                      </div>

                      <div style={{
                        width: '40px',
                        height: '22px',
                        borderRadius: '12px',
                        background: isEnabled ? '#10b981' : (isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.2)'),
                        position: 'relative',
                        flexShrink: 0,
                        transition: 'all 0.2s ease'
                      }}>
                        <div style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          background: '#ffffff',
                          position: 'absolute',
                          top: '2px',
                          left: isEnabled ? '20px' : '2px',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal: Add New Client Samity */}
        {isAddModalOpen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10000,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}>
            <div style={{
              width: '100%',
              maxWidth: '560px',
              background: isLight ? '#ffffff' : '#0f172a',
              borderRadius: '18px',
              padding: '24px',
              border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '900' }}>
                  {editingTenant ? (isEn ? 'Edit Client' : 'ক্লায়েন্ট সম্পাদনা') : (isEn ? 'Add New Client Samity' : 'নতুন ক্লায়েন্ট সমিতি তৈরি')}
                </h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveTenant} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '800', marginBottom: '4px' }}>
                    {isEn ? 'Samity Name *' : 'সমিতির নাম *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={isEn ? 'e.g. Agrani Savings & Credit Society' : 'যেমন: সূর্যমুখী সঞ্চয় ও সমবায় সমিতি'}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
                      background: isLight ? '#f8fafc' : '#1e293b',
                      color: isLight ? '#0f172a' : '#f8fafc',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '800', marginBottom: '4px' }}>
                      {isEn ? 'Owner Name' : 'পরিচালক / সভাপতির নাম'}
                    </label>
                    <input
                      type="text"
                      placeholder="মোঃ করিম মিয়া"
                      value={formData.ownerName}
                      onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '10px',
                        border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
                        background: isLight ? '#f8fafc' : '#1e293b',
                        color: isLight ? '#0f172a' : '#f8fafc',
                        fontSize: '0.85rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '800', marginBottom: '4px' }}>
                      {isEn ? 'Mobile Phone' : 'মোবাইল নম্বর'}
                    </label>
                    <input
                      type="tel"
                      placeholder="01712345678"
                      value={formData.ownerPhone}
                      onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '10px',
                        border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
                        background: isLight ? '#f8fafc' : '#1e293b',
                        color: isLight ? '#0f172a' : '#f8fafc',
                        fontSize: '0.85rem'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '800', marginBottom: '4px' }}>
                      {isEn ? 'Subscription Plan' : 'সাবস্ক্রিপশন প্ল্যান'}
                    </label>
                    <select
                      value={formData.plan}
                      onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '10px',
                        border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
                        background: isLight ? '#f8fafc' : '#1e293b',
                        color: isLight ? '#0f172a' : '#f8fafc',
                        fontSize: '0.85rem'
                      }}
                    >
                      <option value="Starter Monthly">Starter Monthly (মাসিক)</option>
                      <option value="Standard Yearly">Standard Yearly (বাৎসরিক)</option>
                      <option value="Enterprise Lifetime">Enterprise Lifetime (লাইফটাইম)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '800', marginBottom: '4px' }}>
                      {isEn ? 'Valid Until' : 'মেয়াদ শেষ হওয়ার তারিখ'}
                    </label>
                    <input
                      type="date"
                      value={formData.validUntil}
                      onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '10px',
                        border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
                        background: isLight ? '#f8fafc' : '#1e293b',
                        color: isLight ? '#0f172a' : '#f8fafc',
                        fontSize: '0.85rem'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '800', marginBottom: '4px' }}>
                    {isEn ? 'Initial Modules to Enable' : 'প্রথম অবস্থায় কোন কোন মডিউল চালু থাকবে?'}
                  </label>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '6px',
                    maxHeight: '160px',
                    overflowY: 'auto',
                    padding: '8px',
                    background: isLight ? '#f1f5f9' : '#1e293b',
                    borderRadius: '10px'
                  }}>
                    {SAAS_MODULES.map(m => (
                      <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={formData.initialModules[m.id] !== false}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              initialModules: {
                                ...formData.initialModules,
                                [m.id]: e.target.checked
                              }
                            });
                          }}
                        />
                        <span>{isEn ? m.nameEn : m.nameBn}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    style={{
                      padding: '9px 16px',
                      borderRadius: '10px',
                      background: 'none',
                      border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
                      color: isLight ? '#475569' : '#cbd5e1',
                      fontSize: '0.82rem',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    {isEn ? 'Cancel' : 'বাতিল'}
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '9px 20px',
                      borderRadius: '10px',
                      background: '#10b981',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '0.82rem',
                      fontWeight: '800',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    {isEn ? 'Create Client' : 'ক্লায়েন্ট নিশ্চিত করুন'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* A-to-Z Granular Master Switchboard Modal */}
        {granularTenant && (
          <GranularMasterSwitchboardModal
            isOpen={Boolean(granularTenant)}
            onClose={() => setGranularTenant(null)}
            tenant={granularTenant}
            isLight={isLight}
            lang={lang}
            onUpdated={() => {
              setTenants(getTenantsList());
            }}
          />
        )}

        {/* Blue-Green OTA Release & Global Push Modal */}
        {isOtaModalOpen && (
          <BlueGreenReleaseModal
            isOpen={isOtaModalOpen}
            onClose={() => setIsOtaModalOpen(false)}
            isLight={isLight}
            lang={lang}
          />
        )}
      </div>
    </div>
  );
};
