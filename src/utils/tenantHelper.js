/**
 * HisabKitab 360 - Multi-Tenant Isolation Helper
 * Strictly ensures each user (Master Super Admin vs Client Stores) operates in their own isolated sandbox.
 */

export const getActiveTenantUser = () => {
  try {
    const raw = localStorage.getItem('hk360_active_session_user') ||
                sessionStorage.getItem('hk360_auth_user') ||
                localStorage.getItem('hk360_auth_user');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch {}
  return null;
};

export const getActiveTenantEmail = () => {
  const user = getActiveTenantUser();
  return (user?.email || '').toLowerCase().trim();
};

export const isMasterSuperAdmin = () => {
  return getActiveTenantEmail() === 'hossansajjad1994@gmail.com';
};

export const getActiveTenantKey = () => {
  const email = getActiveTenantEmail();
  if (email) {
    return `tenant_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
  }
  return 'tenant_guest';
};
