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

  // 1. If staff/cashier is logged in, use their store owner's email
  if (user?.ownerEmail && user.ownerEmail.includes('@')) {
    return user.ownerEmail.toLowerCase().trim();
  }

  // 2. If regular business owner/admin is logged in
  if (user?.email && user.email.includes('@') && !user.email.endsWith('@shop.local')) {
    return user.email.toLowerCase().trim();
  }

  // 3. Check explicitly saved store owner email
  try {
    const ownerEmail = localStorage.getItem('hk360_active_owner_email');
    if (ownerEmail && ownerEmail.includes('@')) {
      return ownerEmail.toLowerCase().trim();
    }
  } catch {}

  // 4. Check saved login email in localStorage
  try {
    const saved = localStorage.getItem('hk360_saved_email');
    if (saved && saved.includes('@') && !saved.endsWith('@shop.local')) {
      return saved.toLowerCase().trim();
    }
  } catch {}

  // 5. Check Supabase persisted auth token
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
        const parsed = JSON.parse(localStorage.getItem(key));
        if (parsed?.user?.email && parsed.user.email.includes('@')) {
          return parsed.user.email.toLowerCase().trim();
        }
      }
    }
  } catch {}

  // 6. Check business settings email
  try {
    const settingsRaw = localStorage.getItem('hk360_biz_settings');
    if (settingsRaw) {
      const parsed = JSON.parse(settingsRaw);
      if (parsed?.email && parsed.email.includes('@')) {
        return parsed.email.toLowerCase().trim();
      }
    }
  } catch {}

  // 7. If staff user without explicit ownerEmail, check fallback staff list in localStorage
  try {
    if (user?.isStaffUser || user?.role === 'cashier') {
      const staffListRaw = localStorage.getItem('hk360_staff_accounts');
      if (staffListRaw) {
        const list = JSON.parse(staffListRaw);
        const match = Array.isArray(list) && list.find(s => s.id === user.id || s.phone === user.phone);
        if (match?.ownerEmail && match.ownerEmail.includes('@')) {
          return match.ownerEmail.toLowerCase().trim();
        }
      }
    }
  } catch {}

  // 8. If user object has any email (even custom), return it
  if (user?.email && user.email.includes('@')) {
    return user.email.toLowerCase().trim();
  }

  // 9. Default fallback: only use master admin if no other session or guest context
  return 'hossansajjad1994@gmail.com';
};

export const isMasterSuperAdmin = () => {
  const user = getActiveTenantUser();
  // Staff/cashier is never super admin
  if (user?.isStaffUser || user?.role === 'cashier' || user?.ownerEmail) {
    return false;
  }
  return (user?.email || '').toLowerCase().trim() === 'hossansajjad1994@gmail.com' && user?.isSuperAdmin === true;
};

export const getActiveTenantKey = () => {
  const user = getActiveTenantUser();
  if (user?.ownerTenantKey) {
    return user.ownerTenantKey;
  }
  if (user?.tenantKey && !user.isStaffUser) {
    return user.tenantKey;
  }
  const email = getActiveTenantEmail();
  if (email) {
    return `tenant_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
  }
  return 'tenant_guest';
};
