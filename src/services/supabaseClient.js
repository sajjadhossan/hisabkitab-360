import { createClient } from '@supabase/supabase-js';

// ============================================================================
// PERMANENT SUPABASE CONFIGURATION (স্থায়ী কনফিগারেশন)
// আপনি আপনার Supabase Project URL এবং Anon Key এখানে প্রদান করতে পারেন,
// অথবা .env ফাইলে VITE_SUPABASE_URL ও VITE_SUPABASE_ANON_KEY হিসেবে সেট করতে পারেন।
// ============================================================================
export const PERMANENT_SUPABASE_URL = 'https://juahukfvwbwupsamqzyo.supabase.co';
export const PERMANENT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1YWh1a2Z2d2J3dXBzYW1xenlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2OTEyMDIsImV4cCI6MjEwNjI2NzIwMn0.Fl7iA3Ns6C2s87WW_CAFaxAwghn9LnoIzTvMFvTl9l4';

const STORAGE_KEY_SUPABASE = 'hk360_supabase_config';

/**
 * Retrieves the Supabase URL and Anon Key with priority:
 * 1. Permanent Code Constants
 * 2. Vite Environment Variables (.env)
 * 3. LocalStorage persistence
 */
export const getSupabaseConfig = () => {
  // 1. Permanent code constants
  if (PERMANENT_SUPABASE_URL && PERMANENT_SUPABASE_ANON_KEY) {
    return {
      url: PERMANENT_SUPABASE_URL.trim(),
      anonKey: PERMANENT_SUPABASE_ANON_KEY.trim()
    };
  }

  // 2. Fallback to Vite environment variables (.env)
  const envUrl = typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL ? import.meta.env.VITE_SUPABASE_URL : '';
  const envKey = typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY ? import.meta.env.VITE_SUPABASE_ANON_KEY : '';

  if (envUrl && envKey) {
    return {
      url: envUrl.trim(),
      anonKey: envKey.trim()
    };
  }

  // 3. Stored in localStorage
  try {
    const saved = localStorage.getItem(STORAGE_KEY_SUPABASE);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.url && parsed.anonKey) return parsed;
    }
  } catch (e) {
    console.warn('Failed to read Supabase config from storage', e);
  }

  return {
    url: '',
    anonKey: ''
  };
};

/**
 * Saves Supabase credentials to localStorage and re-initializes client
 */
export const saveSupabaseConfig = (url, anonKey) => {
  const cleanUrl = (url || '').trim();
  const cleanKey = (anonKey || '').trim();
  localStorage.setItem(STORAGE_KEY_SUPABASE, JSON.stringify({ url: cleanUrl, anonKey: cleanKey }));
  return initSupabaseClient();
};

let clientInstance = null;

/**
 * Initializes or resets the Supabase client
 */
export const initSupabaseClient = () => {
  const { url, anonKey } = getSupabaseConfig();
  if (url && anonKey && url.startsWith('http')) {
    try {
      clientInstance = createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
      return clientInstance;
    } catch (err) {
      console.warn('Error creating Supabase client:', err);
      clientInstance = null;
      return null;
    }
  }
  clientInstance = null;
  return null;
};

/**
 * Returns the active Supabase client or initializes it
 */
export const getSupabase = () => {
  if (!clientInstance) {
    initSupabaseClient();
  }
  return clientInstance;
};

/**
 * Checks if Supabase credentials are configured
 */
export const isSupabaseReady = () => {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(url && anonKey && url.startsWith('http') && anonKey.length > 20);
};

// Initialize on load
initSupabaseClient();
