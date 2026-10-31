import React, { useState, useEffect } from 'react';
import {
  Crown,
  Building2,
  Sliders,
  ChevronDown,
  Check,
  Eye,
  ShieldAlert,
  ArrowRightLeft
} from 'lucide-react';
import {
  getTenantsList,
  getActiveWorkspaceId,
  setActiveWorkspaceId,
  getTenantById
} from '../../services/tenantManagerService';

export const SuperAdminDualModeBar = ({
  isLight = false,
  lang = 'bn',
  onOpenSaaSManager,
  user
}) => {
  const isEn = lang === 'en';
  const [tenants, setTenants] = useState(() => getTenantsList());
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState(() => getActiveWorkspaceId());
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const handleTenantsChanged = (e) => {
      if (e?.detail?.tenants) setTenants(e.detail.tenants);
      else setTenants(getTenantsList());
    };
    const handleWorkspaceChanged = (e) => {
      if (e?.detail?.tenantId) setActiveWorkspaceIdState(e.detail.tenantId);
    };

    window.addEventListener('somiti_tenants_changed', handleTenantsChanged);
    window.addEventListener('somiti_workspace_switched', handleWorkspaceChanged);

    return () => {
      window.removeEventListener('somiti_tenants_changed', handleTenantsChanged);
      window.removeEventListener('somiti_workspace_switched', handleWorkspaceChanged);
    };
  }, []);

  const activeTenant = getTenantById(activeWorkspaceId) || tenants[0];
  const mySamity = tenants.find(t => t.isOwnSamity) || tenants[0];
  const clientTenants = tenants.filter(t => !t.isOwnSamity);

  const handleSwitch = (tenantId) => {
    setActiveWorkspaceId(tenantId);
    setActiveWorkspaceIdState(tenantId);
    setIsDropdownOpen(false);
  };

  const isOperatingOwnSamity = activeTenant?.isOwnSamity;

  return (
    <div style={{
      background: isLight ? '#fef3c7' : 'linear-gradient(90deg, #1e1b4b 0%, #0f172a 50%, #064e3b 100%)',
      borderBottom: isLight ? '1.5px solid #fde68a' : '1px solid rgba(245, 158, 11, 0.3)',
      padding: '6px 16px',
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '8px',
      fontSize: '0.74rem',
      fontWeight: '800',
      color: isLight ? '#92400e' : '#f8fafc',
      zIndex: 60,
      position: 'relative',
      fontFamily: "'Inter', 'Plus Jakarta Sans', 'Hind Siliguri', sans-serif"
    }}>
      {/* Left: Mode Badge & Quick Mode Toggles */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          background: 'rgba(245, 158, 11, 0.2)',
          color: '#f59e0b',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          borderRadius: '8px',
          padding: '2px 8px',
          fontSize: '0.68rem',
          fontWeight: '900',
          letterSpacing: '0.3px'
        }}>
          <span>👑</span>
          <span>{isEn ? 'SUPER ADMIN DUAL-MODE' : 'সুপার এডমিন ডুয়াল মোড'}</span>
        </div>

        {/* Button 1: Platform SaaS Control */}
        <button
          onClick={onOpenSaaSManager}
          style={{
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: '#000000',
            border: 'none',
            borderRadius: '6px',
            padding: '3px 10px',
            fontSize: '0.72rem',
            fontWeight: '900',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            boxShadow: '0 2px 6px rgba(245, 158, 11, 0.3)'
          }}
        >
          <Sliders size={12} />
          <span>{isEn ? 'SaaS Control Tower' : 'প্ল্যাটফর্ম ও মডিউল লাইসেন্স'}</span>
        </button>

        {/* Button 2: Switch to My Own Samity */}
        <button
          onClick={() => handleSwitch(mySamity.id)}
          style={{
            background: isOperatingOwnSamity
              ? '#10b981'
              : (isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.08)'),
            color: isOperatingOwnSamity ? '#ffffff' : (isLight ? '#0f172a' : '#cbd5e1'),
            border: isOperatingOwnSamity
              ? 'none'
              : (isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)'),
            borderRadius: '6px',
            padding: '3px 10px',
            fontSize: '0.72rem',
            fontWeight: '800',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          <span>🏦</span>
          <span>{isEn ? 'My Own Samity' : 'আমার নিজস্ব সমিতি'}</span>
          {isOperatingOwnSamity && <Check size={12} />}
        </button>
      </div>

      {/* Right: Active Workspace Selector Dropdown */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
        <span style={{ fontSize: '0.68rem', color: isLight ? '#78350f' : '#94a3b8' }}>
          {isEn ? 'Active Workspace:' : 'বর্তমান ওয়ার্কস্পেস:'}
        </span>

        <button
          onClick={() => setIsDropdownOpen(prev => !prev)}
          style={{
            background: isLight ? '#ffffff' : 'rgba(30, 41, 59, 0.9)',
            color: isLight ? '#0f172a' : '#f8fafc',
            border: isLight ? '1.5px solid #f59e0b' : '1px solid rgba(245, 158, 11, 0.5)',
            borderRadius: '8px',
            padding: '4px 10px',
            fontSize: '0.74rem',
            fontWeight: '900',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>{activeTenant?.isOwnSamity ? '👑' : '🏢'}</span>
          <span style={{ maxWidth: '170px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {activeTenant?.name}
          </span>
          <ChevronDown size={13} color="#f59e0b" />
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            zIndex: 100,
            width: '280px',
            background: isLight ? '#ffffff' : '#0f172a',
            border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '12px',
            boxShadow: '0 12px 30px rgba(0,0,0,0.4)',
            padding: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            <div style={{ padding: '6px 8px', fontSize: '0.68rem', fontWeight: '800', color: isLight ? '#64748b' : '#94a3b8', textTransform: 'uppercase' }}>
              {isEn ? 'Switch Organization Workspace' : 'সমিতি পরিবর্তন করুন'}
            </div>

            {/* My Own Samity Option */}
            <div
              onClick={() => handleSwitch(mySamity.id)}
              style={{
                padding: '8px 10px',
                borderRadius: '8px',
                cursor: 'pointer',
                background: activeWorkspaceId === mySamity.id
                  ? (isLight ? '#f0fdf4' : 'rgba(16, 185, 129, 0.15)')
                  : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>👑</span>
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: '900', color: isLight ? '#0f172a' : '#f8fafc' }}>
                    {mySamity.name}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#10b981' }}>
                    {isEn ? 'Headquarters (Your Own)' : 'প্রধান কার্যালয় (আপনার নিজস্ব)'}
                  </div>
                </div>
              </div>
              {activeWorkspaceId === mySamity.id && <Check size={14} color="#10b981" />}
            </div>

            {/* Client Tenants List */}
            {clientTenants.length > 0 && (
              <div style={{ borderTop: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)', margin: '4px 0' }} />
            )}

            {clientTenants.map(client => (
              <div
                key={client.id}
                onClick={() => handleSwitch(client.id)}
                style={{
                  padding: '8px 10px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: activeWorkspaceId === client.id
                    ? (isLight ? '#e0f2fe' : 'rgba(2, 132, 199, 0.15)')
                    : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🏢</span>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: '800', color: isLight ? '#0f172a' : '#f8fafc' }}>
                      {client.name}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: isLight ? '#64748b' : '#94a3b8' }}>
                      {client.ownerName} • {client.plan}
                    </div>
                  </div>
                </div>
                {activeWorkspaceId === client.id && <Check size={14} color="#0284c7" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
