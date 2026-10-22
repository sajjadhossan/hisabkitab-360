import { getSupabase, isSupabaseReady } from './supabaseClient';

const AUTH_STORAGE_KEY = 'somiti360_auth_user';
const REMEMBER_KEY = 'somiti360_remember_me';

/**
 * Retrieves the currently saved local user session
 */
export const getCachedAuthUser = () => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn('Failed to parse cached auth user:', e);
    return null;
  }
};

/**
 * Persists the user in local storage
 */
export const setCachedAuthUser = (user) => {
  try {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch (e) {
    console.warn('Failed to write cached auth user:', e);
  }
};

/**
 * Normalizes Supabase User Object into a consistent profile format
 */
export const normalizeAuthUser = (supabaseUser) => {
  if (!supabaseUser) return null;
  const meta = supabaseUser.user_metadata || {};
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || meta.email || '',
    name: meta.full_name || meta.name || supabaseUser.email?.split('@')[0] || 'ব্যবহারকারী',
    samityName: meta.samity_name || 'সমিতি ৩৬০',
    phone: meta.phone || '',
    avatar: meta.avatar_url || meta.picture || '',
    role: meta.role || 'admin',
    provider: supabaseUser.app_metadata?.provider || 'supabase',
    lastSignIn: supabaseUser.last_sign_in_at || new Date().toISOString()
  };
};

/**
 * Sign In with Email & Password via Supabase
 */
export const signInWithEmail = async (email, password, remember = true) => {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Supabase সংযোগ উপলব্ধ নেই। ইন্টারনেট সংযোগ পরীক্ষা করুন।');
  }

  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanPassword = String(password || '').trim();

  if (!cleanEmail || !cleanPassword) {
    throw new Error('ইমেইল ও পাসওয়ার্ড প্রদান করা বাধ্যতামূলক।');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password: cleanPassword
  });

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      throw new Error('ভুল ইমেইল বা পাসওয়ার্ড। দয়া করে সঠিক তথ্য দিন।');
    }
    if (error.message.includes('Email not confirmed')) {
      throw new Error('আপনার ইমেইলটি ভেরিফাই করা হয়নি। ইনবক্স চেক করুন অথবা লগইন করুন।');
    }
    throw new Error(error.message || 'লগইন করতে ব্যর্থ হয়েছে।');
  }

  const normalized = normalizeAuthUser(data.user);
  if (remember) {
    localStorage.setItem(REMEMBER_KEY, 'true');
    setCachedAuthUser(normalized);
  } else {
    localStorage.removeItem(REMEMBER_KEY);
    setCachedAuthUser(normalized);
  }

  return normalized;
};

/**
 * Sign Up with Email & Password via Supabase
 */
export const signUpWithEmail = async ({ email, password, fullName, samityName, phone }) => {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Supabase সংযোগ উপলব্ধ নেই। ইন্টারনেট সংযোগ পরীক্ষা করুন।');
  }

  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanPassword = String(password || '').trim();

  if (!cleanEmail || !cleanPassword) {
    throw new Error('ইমেইল ও পাসওয়ার্ড প্রদান করা বাধ্যতামূলক।');
  }

  if (cleanPassword.length < 6) {
    throw new Error('নিরাপত্তার স্বার্থে পাসওয়ার্ড ন্যূনতম ৬ অক্ষরের হতে হবে।');
  }

  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password: cleanPassword,
    options: {
      data: {
        full_name: fullName?.trim() || cleanEmail.split('@')[0],
        samity_name: samityName?.trim() || 'সমিতি ৩৬০',
        phone: phone?.trim() || '',
        role: 'admin'
      }
    }
  });

  if (error) {
    if (error.message.includes('User already registered')) {
      throw new Error('এই ইমেইল দিয়ে ইতোমধ্যে একটি অ্যাকাউন্ট খোলা রয়েছে। সরাসরি সাইন ইন করুন।');
    }
    throw new Error(error.message || 'নিবন্ধন সম্পন্ন করা যায়নি।');
  }

  const normalized = normalizeAuthUser(data.user);
  if (normalized) {
    setCachedAuthUser(normalized);
  }
  return {
    user: normalized,
    session: data.session,
    requiresConfirmation: !data.session
  };
};

/**
 * Direct 1-Click Sign In with Google OAuth via Supabase
 */
export const signInWithGoogle = async () => {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Supabase সংযোগ পাওয়া যায়নি।');
  }

  const redirectUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : undefined;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent'
      }
    }
  });

  if (error) {
    throw new Error(error.message || 'Google লগইন সম্পন্ন করতে সমস্যা হয়েছে।');
  }

  return data;
};

/**
 * Sign Out active user
 */
export const signOutUser = async () => {
  const supabase = getSupabase();
  try {
    if (supabase) {
      await supabase.auth.signOut();
    }
  } catch (e) {
    console.warn('Supabase signout notice:', e);
  } finally {
    setCachedAuthUser(null);
    localStorage.removeItem(REMEMBER_KEY);
  }
};

/**
 * Send Password Reset Link to Email
 */
export const sendPasswordResetEmail = async (email) => {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Supabase সংযোগ উপলব্ধ নেই।');
  }

  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!cleanEmail) {
    throw new Error('দয়া করে আপনার নিবন্ধিত ইমেইল প্রদান করুন।');
  }

  const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
    redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined
  });

  if (error) {
    throw new Error(error.message || 'পাসওয়ার্ড রিসেট ইমেইল পাঠানো সম্ভব হয়নি।');
  }

  return true;
};

/**
 * Subscribes to Supabase Auth State changes
 */
export const subscribeToAuthState = (onUserChanged) => {
  const supabase = getSupabase();
  if (!supabase) {
    return () => {};
  }

  // 1. Initial check
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.user) {
      const normalized = normalizeAuthUser(session.user);
      setCachedAuthUser(normalized);
      onUserChanged(normalized);
    } else {
      const cached = getCachedAuthUser();
      const remember = localStorage.getItem(REMEMBER_KEY) === 'true';
      if (remember && cached) {
        onUserChanged(cached);
      } else {
        onUserChanged(null);
      }
    }
  }).catch(err => {
    console.warn('Error reading auth session:', err);
    onUserChanged(getCachedAuthUser());
  });

  // 2. Auth listener
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      const normalized = normalizeAuthUser(session.user);
      setCachedAuthUser(normalized);
      onUserChanged(normalized);
    } else if (event === 'SIGNED_OUT') {
      setCachedAuthUser(null);
      onUserChanged(null);
    }
  });

  return () => {
    subscription?.unsubscribe();
  };
};
