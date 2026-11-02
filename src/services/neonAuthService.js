/**
 * HisabKitab 360 - Neon Auth Client Service
 * -----------------------------------------
 * Connects directly to Neon Auth (Better Auth compatible engine)
 * Supports email/password, social logins, and secure session management.
 */

const getAuthBaseUrl = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return (
      import.meta.env.VITE_NEON_AUTH_BASE_URL ||
      import.meta.env.NEON_AUTH_BASE_URL ||
      'https://ep-sparkling-bonus-ao9ij6z4.neonauth.c-2.ap-southeast-1.aws.neon.tech/neondb/auth'
    );
  }
  return process.env.NEON_AUTH_BASE_URL || '';
};

/**
 * Sign In with Email & Password via Neon Auth
 */
export const signInWithNeon = async (email, password) => {
  try {
    const baseUrl = getAuthBaseUrl();
    const res = await fetch(`${baseUrl}/sign-in/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Neon লগইন ব্যর্থ হয়েছে');
    }

    if (data.token) {
      localStorage.setItem('hk360_neon_auth_token', data.token);
      localStorage.setItem('hk360_neon_user', JSON.stringify(data.user || { email }));
    }

    return { success: true, user: data.user, token: data.token };
  } catch (err) {
    console.error('Neon Sign In Error:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Sign Up with Email & Password via Neon Auth
 */
export const signUpWithNeon = async (email, password, name) => {
  try {
    const baseUrl = getAuthBaseUrl();
    const res = await fetch(`${baseUrl}/sign-up/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Neon রেজিস্ট্রেশন ব্যর্থ হয়েছে');
    }

    return { success: true, user: data.user, token: data.token };
  } catch (err) {
    console.error('Neon Sign Up Error:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Check Active Neon Auth Session
 */
export const getNeonSession = async () => {
  try {
    const baseUrl = getAuthBaseUrl();
    const token = localStorage.getItem('hk360_neon_auth_token');
    if (!token) return null;

    const res = await fetch(`${baseUrl}/session`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      localStorage.removeItem('hk360_neon_auth_token');
      return null;
    }

    const session = await res.json();
    return session;
  } catch {
    return null;
  }
};

/**
 * Sign Out from Neon Auth
 */
export const signOutNeon = async () => {
  try {
    const baseUrl = getAuthBaseUrl();
    const token = localStorage.getItem('hk360_neon_auth_token');
    if (token) {
      await fetch(`${baseUrl}/sign-out`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => {});
    }
  } finally {
    localStorage.removeItem('hk360_neon_auth_token');
    localStorage.removeItem('hk360_neon_user');
  }
};
