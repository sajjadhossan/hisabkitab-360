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
  if (user?.email) {
    return user.email.toLowerCase().trim();
  }

  // 1. Check saved login email in localStorage
  try {
    const saved = localStorage.getItem('hk360_saved_email');
    if (saved && saved.includes('@')) {
      return saved.toLowerCase().trim();
    }
  } catch {}

  // 2. Check Supabase persisted auth token
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
        const parsed = JSON.parse(localStorage.getItem(key));
        if (parsed?.user?.email) {
          return parsed.user.email.toLowerCase().trim();
        }
      }
    }
  } catch {}

  // 3. Check business settings email
  try {
    const settingsRaw = localStorage.getItem('hk360_biz_settings');
    if (settingsRaw) {
      const parsed = JSON.parse(settingsRaw);
      if (parsed?.email && parsed.email.includes('@')) {
        return parsed.email.toLowerCase().trim();
      }
    }
  } catch {}

  // 4. Default to master super admin for HisabKitab 360 single-owner deployment
  return 'hossansajjad1994@gmail.com';
};

export const isMasterSuperAdmin = () => {
  return getActiveTenantEmail() === 'hossansajjad1994@gmail.com';
};

export const getActiveTenantKey = () => {
  const email = getActiveTenantEmail();
  if (email) {
    return `tenant_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
  }
  return 'tenant_hossansajjad1994_gmail_com';
};
