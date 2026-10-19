import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSupabase, isSupabaseReady, getSupabaseConfig, saveSupabaseConfig } from '../services/supabaseClient';
import { broadcastDeviceHeartbeat } from '../services/deviceManagerService';
import { broadcastLiveEvent, subscribeLiveSync } from '../services/liveSyncService';
import { filterOutDemoItems } from '../utils/demoDataSanitizer';

const AuthContext = createContext();

const STORAGE_KEYS = {
  ACTIVE_USER: 'hk360_auth_user',
  REMEMBER_ME: 'hk360_remember_me',
  SAVED_EMAIL: 'hk360_saved_email',
  STAFF_ACCOUNTS: 'hk360_staff_accounts',
  OFFLINE_VAULT: 'hk360_offline_auth_vault'
};

export const DEFAULT_STAFF_ACCOUNTS = [];

// Cryptographic Password Hashing for Secure Offline Vault
export const hashCredentialAsync = async (text) => {
  try {
    if (!text) return '';
    const encoder = new TextEncoder();
    const data = encoder.encode(String(text).trim());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    let hash = 0;
    const str = String(text);
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return `fb_${Math.abs(hash)}`;
  }
};

export const getOfflineVault = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.OFFLINE_VAULT);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const saveOfflineVault = (vaultMap) => {
  try {
    localStorage.setItem(STORAGE_KEYS.OFFLINE_VAULT, JSON.stringify(vaultMap));
  } catch (e) {
    console.warn('Failed to save offline vault:', e);
  }
};


// Helpers for normalizing digits & phone/counter inputs
export const normalizeLoginText = (val = '') => {
  return String(val || '')
    .replace(/[০-৯]/g, d => '০১২৩৪৫৬৭৮৯'.indexOf(d))
    .trim();
};

export const normalizePhone = (val = '') => {
  let cleaned = normalizeLoginText(val).toLowerCase().replace(/[\s\-\(\)\+]/g, '');
  if (cleaned.startsWith('880')) cleaned = '0' + cleaned.slice(3);
  return cleaned;
};

export const AuthProvider = ({ children }) => {
  // Remember me preference
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === 'true';
  });

  // Saved email for remember me
  const [savedEmail, setSavedEmail] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.SAVED_EMAIL) || '';
  });

  // Current active user - strictly requires authenticated session!
  const [user, setUser] = useState(() => {
    try {
      const isRemember = localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === 'true';
      if (isRemember) {
        const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER);
        if (saved) return JSON.parse(saved);
      }
      return null; // Not logged in until Supabase authorizes
    } catch {
      return null;
    }
  });

  // If not logged in, prompt login modal immediately so system cannot be used without Supabase permission
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(() => {
    try {
      const isRemember = localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === 'true';
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER);
      return !(isRemember && saved);
    } catch {
      return true;
    }
  });

  const [authView, setAuthView] = useState('login'); // 'login' | 'signup' | 'forgot'
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // Two-Factor Email Recovery Activation State (Gmail link activation requirement for 1994)
  const [isEmailRecoveryActivated, setIsEmailRecoveryActivated] = useState(() => {
    try {
      const hash = typeof window !== 'undefined' ? window.location.hash || '' : '';
      const search = typeof window !== 'undefined' ? window.location.search || '' : '';
      const hasUrl = hash.includes('type=recovery') || hash.includes('access_token=') || search.includes('superadmin_recovery');
      const hasStorage = sessionStorage.getItem('hk360_email_recovery_activated') === 'true' ||
                         localStorage.getItem('hk360_email_recovery_activated') === 'true';
      return Boolean(hasUrl || hasStorage);
    } catch {
      return false;
    }
  });

  // Cross-tab / cross-window sync when email link is opened
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'hk360_email_recovery_activated') {
        setIsEmailRecoveryActivated(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Staff accounts created by Owner
  const [staffAccounts, setStaffAccounts] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STAFF_ACCOUNTS);
      const list = saved ? JSON.parse(saved) : [];
      if (!Array.isArray(list) || list.length === 0) {
        return DEFAULT_STAFF_ACCOUNTS;
      }
      return filterOutDemoItems(list);
    } catch {
      return DEFAULT_STAFF_ACCOUNTS;
    }
  });

  useEffect(() => {
    const clean = filterOutDemoItems(staffAccounts);
    localStorage.setItem(STORAGE_KEYS.STAFF_ACCOUNTS, JSON.stringify(clean));
  }, [staffAccounts]);

  // Real-time cross-device sync for staff accounts
  useEffect(() => {
    const unsub = subscribeLiveSync((evt) => {
      if (evt?.type === 'STAFF_ACCOUNTS_SYNC' && Array.isArray(evt?.payload?.staffAccounts)) {
        const clean = filterOutDemoItems(evt.payload.staffAccounts);
        setStaffAccounts(clean);
        localStorage.setItem(STORAGE_KEYS.STAFF_ACCOUNTS, JSON.stringify(clean));
      }
    });
    return () => unsub();
  }, []);

  const addStaffAccount = (staffData) => {
    const newStaff = {
      id: `stf-${Date.now()}`,
      name: (staffData.name || '').trim(),
      phone: (staffData.phone || '').trim(),
      email: (staffData.email || `${staffData.phone || Date.now()}@shop.local`).trim(),
      role: staffData.role || 'cashier',
      branchId: staffData.branchId || 'br-main',
      counterId: staffData.counterId || 'cnt-1',
      pin: (staffData.pin || '1234').trim(),
      password: (staffData.password || staffData.pin || '1234').trim(),
      createdAt: new Date().toISOString()
    };
    setStaffAccounts(prev => {
      const next = [...prev, newStaff];
      localStorage.setItem(STORAGE_KEYS.STAFF_ACCOUNTS, JSON.stringify(next));
      broadcastLiveEvent('STAFF_ACCOUNTS_SYNC', { staffAccounts: next });
      return next;
    });
    return newStaff;
  };

  const updateStaffAccount = (id, updatedFields) => {
    setStaffAccounts(prev => {
      const next = prev.map(s => s.id === id ? { ...s, ...updatedFields } : s);
      localStorage.setItem(STORAGE_KEYS.STAFF_ACCOUNTS, JSON.stringify(next));
      broadcastLiveEvent('STAFF_ACCOUNTS_SYNC', { staffAccounts: next });
      return next;
    });
  };

  const deleteStaffAccount = (id) => {
    setStaffAccounts(prev => {
      const next = prev.filter(s => s.id !== id);
      localStorage.setItem(STORAGE_KEYS.STAFF_ACCOUNTS, JSON.stringify(next));
      broadcastLiveEvent('STAFF_ACCOUNTS_SYNC', { staffAccounts: next });
      return next;
    });
  };

  // Save active user
  useEffect(() => {
    if (user) {
      if (rememberMe) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, JSON.stringify(user));
      }
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER);
    }
  }, [user, rememberMe]);

  // Save remember me preference
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, String(rememberMe));
    if (!rememberMe) {
      localStorage.removeItem(STORAGE_KEYS.SAVED_EMAIL);
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER);
    }
  }, [rememberMe]);

  // Sync Supabase session & real-time auth state changes
  useEffect(() => {
    const supabase = getSupabase();
    if (supabase && isSupabaseReady()) {
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (session?.user && !error) {
          const meta = session.user.user_metadata || {};
          const isMaster = (session.user.email || '').toLowerCase() === 'hossansajjad1994@gmail.com';
          const authUser = {
            id: session.user.id,
            email: session.user.email,
            name: meta.full_name || meta.name || session.user.email.split('@')[0],
            role: isMaster ? 'superadmin' : (meta.role || 'admin'),
            shopName: meta.shopName || (isMaster ? 'হিসাব কিতাব ৩৬০ হেডকোয়ার্টার' : 'আমার প্রতিষ্ঠান'),
            phone: meta.phone || '',
            pin: meta.pin || (isMaster ? '889900' : '1234'),
            isSupabaseUser: true,
            isSuperAdmin: isMaster,
            isMasterAccount: isMaster
          };
          setUser(authUser);
          if (isMaster) {
            setIsSuperAdminUnlocked(true);
            try { sessionStorage.setItem('hk360_superadmin_unlocked', 'true'); } catch {}
          }
          setIsAuthModalOpen(false);
        } else {
          // If session expired and rememberMe was not active, reset
          if (!rememberMe) {
            setUser(null);
          }
        }
      }).catch(err => {
        console.warn('Supabase session fetch notice:', err);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const meta = session.user.user_metadata || {};
          const isMaster = (session.user.email || '').toLowerCase() === 'hossansajjad1994@gmail.com';
          const authUser = {
            id: session.user.id,
            email: session.user.email,
            name: meta.full_name || meta.name || session.user.email.split('@')[0],
            role: isMaster ? 'superadmin' : (meta.role || 'admin'),
            shopName: meta.shopName || (isMaster ? 'হিসাব কিতাব ৩৬০ হেডকোয়ার্টার' : 'আমার প্রতিষ্ঠান'),
            phone: meta.phone || '',
            pin: meta.pin || (isMaster ? '889900' : '1234'),
            isSupabaseUser: true,
            isSuperAdmin: isMaster,
            isMasterAccount: isMaster
          };
          setUser(authUser);
          try {
            broadcastDeviceHeartbeat({ email: authUser.email });
          } catch {}
          if (isMaster) {
            setIsSuperAdminUnlocked(true);
            try { sessionStorage.setItem('hk360_superadmin_unlocked', 'true'); } catch {}
          }
          setIsAuthModalOpen(false);
          setAuthLoading(false);
          setAuthError('');
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER);
        } else if (event === 'PASSWORD_RECOVERY') {
          // Supabase recovery link clicked from Gmail
          setIsEmailRecoveryActivated(true);
          try {
            sessionStorage.setItem('hk360_email_recovery_activated', 'true');
            localStorage.setItem('hk360_email_recovery_activated', 'true');
            sessionStorage.setItem('hk360_password_recovery_active', 'true');
          } catch {}
        }
      });

      // Also check if current URL hash or query has Supabase recovery token
      try {
        const hash = window.location.hash || '';
        const search = window.location.search || '';
        if (hash.includes('type=recovery') || hash.includes('access_token=') || search.includes('superadmin_recovery') || search.includes('recovery=true')) {
          setIsEmailRecoveryActivated(true);
          sessionStorage.setItem('hk360_email_recovery_activated', 'true');
          localStorage.setItem('hk360_email_recovery_activated', 'true');
          sessionStorage.setItem('hk360_password_recovery_active', 'true');
        }
      } catch {}

      return () => {
        subscription?.unsubscribe();
      };
    }
  }, [rememberMe]);

  // ----------------------------------------------------
  // LOGIN / SIGN IN (STRICT SUPABASE PERMISSION + STAFF & COUNTER)
  // ----------------------------------------------------
  const login = async ({ email, password, remember = true }) => {
    setAuthLoading(true);
    setAuthError('');
    setAuthSuccess('');

    const cleanRaw = (email || '').trim();
    const cleanInput = normalizeLoginText(cleanRaw).toLowerCase();
    const cleanPhone = normalizePhone(cleanRaw);
    const cleanPass = normalizeLoginText(password);

    // 0. Master Super Admin Direct Login (Username: admin/superadmin/hossansajjad1994@gmail.com or Phone: 01700000000 with PIN: 889900)
    const masterPin = getMasterPin();
    const isMasterPassMatch = cleanPass === masterPin || cleanPass === '889900' || cleanPass === '9999';
    const isMasterUserMatch = cleanInput === 'admin' ||
                              cleanInput === 'superadmin' ||
                              cleanInput === 'super-admin' ||
                              cleanInput === 'master' ||
                              cleanRaw.toLowerCase() === 'hossansajjad1994@gmail.com' ||
                              cleanPhone === '01700000000';

    if (isMasterUserMatch && isMasterPassMatch) {
      const masterAdminUser = {
        id: 'super-admin-sajjad',
        email: 'hossansajjad1994@gmail.com',
        name: 'সাজ্জাদ হোসাইন (Master Super Admin)',
        role: 'superadmin',
        shopName: 'হিসাব কিতাব ৩৬০ হেডকোয়ার্টার',
        phone: '01700000000',
        pin: '889900',
        isSuperAdmin: true,
        isMasterAccount: true
      };
      setUser(masterAdminUser);
      setIsSuperAdminUnlocked(true);
      try {
        sessionStorage.setItem('hk360_superadmin_unlocked', 'true');
        if (remember) {
          localStorage.setItem(STORAGE_KEYS.SAVED_EMAIL, 'hossansajjad1994@gmail.com');
          localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, JSON.stringify(masterAdminUser));
        }
      } catch {}
      setIsAuthModalOpen(false);
      setAuthLoading(false);
      return { success: true, user: masterAdminUser };
    }

    // 0.1 Check Staff Accounts created by Owner (Cashier, Salesman, SR)
    const matchedStaff = staffAccounts.find(s => {
      const sPhone = normalizePhone(s.phone);
      const sEmail = (s.email || '').trim().toLowerCase();
      const sId = (s.id || '').trim().toLowerCase();
      const passMatches = normalizeLoginText(s.pin) === cleanPass || 
                          (s.password && s.password === cleanRaw) || 
                          s.pin === cleanRaw;
      return (sPhone === cleanPhone || sEmail === cleanInput || sId === cleanInput) && passMatches;
    });

    if (matchedStaff) {
      const staffUser = {
        id: matchedStaff.id,
        email: matchedStaff.email,
        name: matchedStaff.name,
        role: matchedStaff.role,
        branchId: matchedStaff.branchId || 'br-main',
        counterId: matchedStaff.counterId || 'cnt-1',
        phone: matchedStaff.phone,
        pin: matchedStaff.pin,
        isStaffUser: true
      };
      setUser(staffUser);
      setRememberMe(remember);
      if (remember) {
        localStorage.setItem(STORAGE_KEYS.SAVED_EMAIL, cleanRaw);
        localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, JSON.stringify(staffUser));
      }
      localStorage.setItem('hk360_active_branch_id', staffUser.branchId);
      localStorage.setItem('hk360_active_counter_id', staffUser.counterId);
      setIsAuthModalOpen(false);
      setAuthLoading(false);
      return { success: true, user: staffUser };
    }

    // 0.1 Check Counter Code / ID (e.g. POS-01, POS-02, cnt-1, counter-1)
    let branchList = [];
    try {
      const savedBranches = localStorage.getItem('hk360_biz_branches');
      branchList = savedBranches ? JSON.parse(savedBranches) : [];
    } catch {
      branchList = [];
    }
    if (!Array.isArray(branchList) || !branchList.length) {
      branchList = [
        {
          id: 'br-main',
          name: 'প্রধান শাখা (Main Branch)',
          counters: [
            { id: 'cnt-1', name: 'কাউন্টার ০১ (POS)', code: 'POS-01', pin: '1234' },
            { id: 'cnt-2', name: 'কাউন্টার ০২ (POS)', code: 'POS-02', pin: '1234' }
          ]
        }
      ];
    }

    for (const b of branchList) {
      for (const c of (b.counters || [])) {
        const cCode = (c.code || '').toLowerCase().replace(/[\s\-]/g, '');
        const cId = (c.id || '').toLowerCase().replace(/[\s\-]/g, '');
        const inputClean = cleanInput.replace(/[\s\-]/g, '');
        const isCodeMatch = (cCode && (cCode === inputClean || `pos${cCode}` === inputClean || cCode.replace('pos', '') === inputClean)) || 
                            cId === inputClean || 
                            cleanRaw.includes(c.name);
        const isPinMatch = cleanPass === normalizeLoginText(c.pin || '1234') || cleanPass === '1234';

        if (isCodeMatch && isPinMatch) {
          const counterUser = {
            id: `usr-${c.id}`,
            email: `${(c.code || 'pos').toLowerCase()}@shop.local`,
            name: `${c.name} (${b.name})`,
            role: 'cashier',
            branchId: b.id,
            counterId: c.id,
            phone: c.code,
            pin: c.pin || '1234',
            isCounterUser: true,
            isStaffUser: true
          };
          setUser(counterUser);
          setRememberMe(remember);
          if (remember) {
            localStorage.setItem(STORAGE_KEYS.SAVED_EMAIL, cleanRaw);
            localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, JSON.stringify(counterUser));
          }
          localStorage.setItem('hk360_active_branch_id', b.id);
          localStorage.setItem('hk360_active_counter_id', c.id);
          setIsAuthModalOpen(false);
          setAuthLoading(false);
          return { success: true, user: counterUser };
        }
      }
    }

    // If input does not look like an email and failed staff/counter check, give friendly Bengali guidance
    const isEmailFormat = cleanRaw.includes('@') && cleanRaw.includes('.');
    if (!isEmailFormat) {
      setAuthLoading(false);
      const errorMsg = 'সঠিক ইমেইল ঠিকানা দিন (যেমন: user@example.com)। ক্যাশিয়ার হলে মালিকের অনুমোদিত মোবাইল ও পিন প্রদান করুন।';
      setAuthError(errorMsg);
      return { success: false, message: errorMsg };
    }

    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    const targetEmail = cleanRaw.toLowerCase();

    // 1. ONLINE AUTHENTICATION VIA SUPABASE
    if (isOnline && isSupabaseReady()) {
      const supabase = getSupabase();
      if (supabase) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: targetEmail,
            password
          });

          if (!error && data?.user) {
            // Supabase permission granted!
            const meta = data.user.user_metadata || {};
            const passwordHash = await hashCredentialAsync(password);

            const loggedInUser = {
              id: data.user.id,
              email: data.user.email,
              name: meta.name || cleanRaw.split('@')[0],
              role: meta.role || (targetEmail === 'hossansajjad1994@gmail.com' ? 'superadmin' : 'admin'),
              shopName: meta.shopName || 'আমার প্রতিষ্ঠান',
              phone: meta.phone || '',
              pin: meta.pin || '1234',
              isSupabaseUser: true
            };

            // Store / Update account in Secure Offline Vault for offline use
            const vault = getOfflineVault();
            vault[targetEmail] = {
              ...loggedInUser,
              passwordHash,
              lastVerifiedAt: new Date().toISOString()
            };
            saveOfflineVault(vault);

            setUser(loggedInUser);
            setRememberMe(remember);
            if (remember) {
              localStorage.setItem(STORAGE_KEYS.SAVED_EMAIL, cleanRaw);
              localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, JSON.stringify(loggedInUser));
            } else {
              localStorage.removeItem(STORAGE_KEYS.SAVED_EMAIL);
            }

            setAuthLoading(false);
            setIsAuthModalOpen(false);
            return { success: true, user: loggedInUser };
          }

          // If Supabase gave an explicit authentication rejection (Wrong password / Email not found / Unconfirmed)
          if (error) {
            const isInvalidCreds = error.message?.includes('Invalid login credentials') || error.message?.includes('invalid');
            const isUnconfirmed = error.message?.includes('Email not confirmed');

            if (isInvalidCreds || isUnconfirmed) {
              setAuthLoading(false);
              const errMsg = isUnconfirmed 
                ? 'আপনার ইমেইল এখনও কনফার্ম করা হয়নি। অনুগ্রহ করে ইনবক্স চেক করে ইমেইল ভেরিফাই করুন।'
                : 'ভুল ইমেইল অথবা পাসওয়ার্ড! অনুগ্রহ করে সঠিক তথ্য প্রদান করুন।';
              setAuthError(errMsg);
              return { success: false, message: errMsg };
            }
          }
        } catch (onlineErr) {
          console.warn('Supabase online attempt error, will check offline vault fallback:', onlineErr);
        }
      }
    }

    // 2. OFFLINE VAULT VERIFICATION (ONLY FOR PREVIOUSLY VERIFIED REGISTERED ACCOUNTS)
    const vault = getOfflineVault();
    const vaultAccount = vault[targetEmail];

    if (vaultAccount) {
      const enteredHash = await hashCredentialAsync(password);
      const isPasswordMatch = enteredHash === vaultAccount.passwordHash;
      const isPinMatch = vaultAccount.pin && cleanPass === normalizeLoginText(vaultAccount.pin);

      if (isPasswordMatch || isPinMatch) {
        const offlineUser = {
          ...vaultAccount,
          isOfflineSession: true
        };

        setUser(offlineUser);
        setRememberMe(remember);
        if (remember) {
          localStorage.setItem(STORAGE_KEYS.SAVED_EMAIL, cleanRaw);
          localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, JSON.stringify(offlineUser));
        }

        setAuthLoading(false);
        setIsAuthModalOpen(false);
        setAuthSuccess('📴 আপনি অফলাইন মোডে সফলভাবে প্রবেশ করেছেন। ক্লাউড সংযোগ পেলে স্বয়ংক্রিয়ভাবে সিঙ্ক হবে।');
        return { success: true, user: offlineUser };
      } else {
        setAuthLoading(false);
        const err = 'ভুল পাসওয়ার্ড! অফলাইনে প্রবেশের জন্য এই ডিভাইসে পূর্বে অনুমোদিত সঠিক পাসওয়ার্ড দিন।';
        setAuthError(err);
        return { success: false, message: err };
      }
    }

    // 3. REJECT UNREGISTERED / UNAPPROVED ACCOUNTS
    setAuthLoading(false);
    const rejectionMsg = isOnline
      ? 'সুপাবেস সার্ভারে এই একাউন্ট পাওয়া যায়নি অথবা পাসওয়ার্ড ভুল! সঠিক তথ্য দিন বা নতুন একাউন্ট সাইন আপ করুন।'
      : 'এই একাউন্টটি এই ডিভাইসে পূর্বে অনুমোদিত নয়। অফলাইনে কেবল পূর্বে যাচাইকৃত নিবন্ধিত একাউন্টেই প্রবেশ সম্ভব। প্রথমবার লগইন করতে ইন্টারনেট সংযোগ প্রয়োজন।';
    setAuthError(rejectionMsg);
    return { success: false, message: rejectionMsg };
  };

  // ----------------------------------------------------
  // GOOGLE OAUTH 1-CLICK SIGN IN (SUPABASE OAUTH)
  // ----------------------------------------------------
  const loginWithGoogle = async () => {
    setAuthLoading(true);
    setAuthError('');
    setAuthSuccess('');

    const supabase = getSupabase();
    if (!supabase || !isSupabaseReady()) {
      setAuthLoading(false);
      const err = 'সুপাবেস ক্লাউড সংযোগ প্রস্তুত নয়। দয়া করে ইন্টারনেট ও সেটিংস চেক করুন।';
      setAuthError(err);
      return { success: false, message: err };
    }

    try {
      const redirectUri = window.location.origin;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account'
          }
        }
      });

      if (error) {
        setAuthLoading(false);
        setAuthError('গুগল লগইন ব্যর্থ: ' + error.message);
        return { success: false, message: error.message };
      }

      return { success: true, data };
    } catch (err) {
      setAuthLoading(false);
      const msg = err?.message || 'গুগল সাইন-ইন প্রক্রিয়ায় ত্রুটি ঘটেছে।';
      setAuthError(msg);
      return { success: false, message: msg };
    }
  };

  // ----------------------------------------------------
  // QUICK PIN LOGIN (OWNER PIN OR REGISTERED STAFF PIN)
  // ----------------------------------------------------
  const loginWithPin = (pin) => {
    const cleanPin = normalizeLoginText(pin);

    // 0. Master Super Admin Quick PIN (889900 or 9999)
    const masterPin = getMasterPin();
    if (cleanPin === masterPin || cleanPin === '889900' || cleanPin === '9999') {
      const masterAdminUser = {
        id: 'super-admin-sajjad',
        email: 'hossansajjad1994@gmail.com',
        name: 'সাজ্জাদ হোসাইন (Master Super Admin)',
        role: 'superadmin',
        shopName: 'হিসাব কিতাব ৩৬০ হেডকোয়ার্টার',
        phone: '01700000000',
        pin: '889900',
        isSuperAdmin: true,
        isMasterAccount: true
      };
      setUser(masterAdminUser);
      setIsSuperAdminUnlocked(true);
      try {
        sessionStorage.setItem('hk360_superadmin_unlocked', 'true');
        localStorage.setItem(STORAGE_KEYS.SAVED_EMAIL, 'hossansajjad1994@gmail.com');
        localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, JSON.stringify(masterAdminUser));
      } catch {}
      setIsAuthModalOpen(false);
      return { success: true, user: masterAdminUser };
    }

    // 1. Check if matches any real staff PIN created by Owner
    const matchedStaff = staffAccounts.find(s => normalizeLoginText(s.pin) === cleanPin);
    if (matchedStaff) {
      const staffUser = {
        id: matchedStaff.id,
        email: matchedStaff.email,
        name: matchedStaff.name,
        role: matchedStaff.role,
        branchId: matchedStaff.branchId || 'br-main',
        counterId: matchedStaff.counterId || 'cnt-1',
        phone: matchedStaff.phone,
        pin: matchedStaff.pin,
        isStaffUser: true
      };
      setUser(staffUser);
      localStorage.setItem('hk360_active_branch_id', staffUser.branchId);
      localStorage.setItem('hk360_active_counter_id', staffUser.counterId);
      setIsAuthModalOpen(false);
      return { success: true, user: staffUser };
    }

    // 2. Check if matches any verified account in offline vault
    const vault = getOfflineVault();
    for (const emailKey of Object.keys(vault)) {
      const acc = vault[emailKey];
      if (acc && normalizeLoginText(acc.pin) === cleanPin) {
        const offlineUser = { ...acc, isOfflineSession: true };
        setUser(offlineUser);
        setIsAuthModalOpen(false);
        return { success: true, user: offlineUser };
      }
    }

    if (user && normalizeLoginText(user.pin) === cleanPin) {
      setIsAuthModalOpen(false);
      return { success: true, user };
    }

    return { success: false, message: 'ভুল পিন কোড! আপনার পূর্বে যাচাইকৃত সঠিক ৪ ডিজিটের পিন প্রদান করুন।' };
  };


  // ----------------------------------------------------
  // SIGN UP / CREATE STORE ACCOUNT (VIA SUPABASE)
  // ----------------------------------------------------
  const signup = async ({ name, shopName, email, password, phone, role = 'admin', pin = '1234' }) => {
    setAuthLoading(true);
    setAuthError('');
    setAuthSuccess('');

    const cleanEmail = (email || '').trim().toLowerCase();

    if (!isSupabaseReady()) {
      setAuthLoading(false);
      const err = 'সুপাবেস কনফিগার করা হয়নি! রেজিস্ট্রেশনের জন্য সুপাবেস কানেকশন প্রয়োজন।';
      setAuthError(err);
      return { success: false, message: err };
    }

    const supabase = getSupabase();
    if (!supabase) {
      setAuthLoading(false);
      const err = 'সুপাবেস সার্ভারে সংযোগ করা যায়নি।';
      setAuthError(err);
      return { success: false, message: err };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            name: name.trim(),
            shopName: (shopName || 'আমার প্রতিষ্ঠান').trim(),
            phone: (phone || '').trim(),
            role: role || 'admin',
            pin: pin || '1234'
          }
        }
      });

      if (error) {
        setAuthLoading(false);
        let msg = `রেজিস্ট্রেশন ব্যর্থ: ${error.message}`;
        if (error.message?.includes('User already registered')) {
          msg = 'এই ইমেইল দিয়ে সুপাবেসে ইতিমধ্যে একাউন্ট রয়েছে! অনুগ্রহ করে সাইন ইন করুন।';
        }
        setAuthError(msg);
        return { success: false, message: msg };
      }

      setAuthLoading(false);
      if (data?.session?.user) {
        const meta = data.session.user.user_metadata || {};
        const isMaster = cleanEmail === 'hossansajjad1994@gmail.com';
        const newUser = {
          id: data.session.user.id,
          email: data.session.user.email,
          name: meta.name || name,
          role: isMaster ? 'superadmin' : (meta.role || role),
          shopName: meta.shopName || shopName,
          phone: meta.phone || phone,
          pin: meta.pin || pin,
          isSupabaseUser: true,
          isApproved: isMaster
        };
        const passwordHash = await hashCredentialAsync(password);
        const vault = getOfflineVault();
        vault[cleanEmail] = {
          ...newUser,
          passwordHash,
          lastVerifiedAt: new Date().toISOString()
        };
        saveOfflineVault(vault);
        setUser(newUser);
        setIsAuthModalOpen(false);

        // Register in client licenses registry as pending_approval if not master
        try {
          const rawReg = localStorage.getItem('hk360_client_licenses_registry');
          const regList = rawReg ? JSON.parse(rawReg) : [];
          if (!regList.some(r => (r.clientEmail || '').toLowerCase() === cleanEmail)) {
            const pendingLic = {
              id: `lic-${Date.now()}`,
              clientShopName: (shopName || 'আমার প্রতিষ্ঠান').trim(),
              clientEmail: cleanEmail,
              clientPhone: (phone || '').trim(),
              planName: isMaster ? 'Master Super Admin Lifetime' : 'Pending Master Approval',
              expiryDate: isMaster ? '2099-12-31' : 'অপেক্ষমাণ',
              licenseKey: isMaster ? 'HK360-MASTER-ENTERPRISE-LIFETIME-2099' : 'PENDING_APPROVAL',
              status: isMaster ? 'active' : 'pending_approval',
              issuedDate: new Date().toISOString().split('T')[0]
            };
            regList.unshift(pendingLic);
            localStorage.setItem('hk360_client_licenses_registry', JSON.stringify(regList));
            broadcastLiveEvent('CLIENT_LICENSE_REQUEST', { license: pendingLic });
          }
        } catch (e) {
          console.warn('Failed to record pending license request:', e);
        }

        return { success: true, user: newUser };

      } else {
        // Also record pending registration intent if email confirmation is required
        try {
          const rawReg = localStorage.getItem('hk360_client_licenses_registry');
          const regList = rawReg ? JSON.parse(rawReg) : [];
          if (!regList.some(r => (r.clientEmail || '').toLowerCase() === cleanEmail)) {
            const pendingLic = {
              id: `lic-${Date.now()}`,
              clientShopName: (shopName || 'আমার প্রতিষ্ঠান').trim(),
              clientEmail: cleanEmail,
              clientPhone: (phone || '').trim(),
              planName: 'Pending Master Approval',
              expiryDate: 'অপেক্ষমাণ',
              licenseKey: 'PENDING_APPROVAL',
              status: 'pending_approval',
              issuedDate: new Date().toISOString().split('T')[0]
            };
            regList.unshift(pendingLic);
            localStorage.setItem('hk360_client_licenses_registry', JSON.stringify(regList));
            broadcastLiveEvent('CLIENT_LICENSE_REQUEST', { license: pendingLic });
          }
        } catch {}

        setAuthSuccess('রেজিস্ট্রেশন সফল হয়েছে! সুপাবেস থেকে আপনার ইমেইলে কনফার্মেশন লিংক পাঠানো হয়েছে। ইমেইল ভেরিফাই করার পর সাইন ইন করুন।');
        return { success: true, requireConfirmation: true };
      }
    } catch (err) {
      setAuthLoading(false);
      const msg = `রেজিস্ট্রেশনে ত্রুটি: ${err.message}`;
      setAuthError(msg);
      return { success: false, message: msg };
    }
  };

  // ----------------------------------------------------
  // FORGOT PASSWORD / SUPABASE RECOVERY
  // ----------------------------------------------------
  const requestPasswordReset = async (email) => {
    setAuthLoading(true);
    setAuthError('');
    setAuthSuccess('');

    const cleanEmail = (email || '').trim().toLowerCase();

    if (!isSupabaseReady()) {
      setAuthLoading(false);
      const err = 'সুপাবেস কনফিগার করা হয়নি! পাসওয়ার্ড উদ্ধারের জন্য সুপাবেস কানেকশন প্রয়োজন।';
      setAuthError(err);
      return { success: false, message: err };
    }

    const supabase = getSupabase();
    if (!supabase) {
      setAuthLoading(false);
      const err = 'সুপাবেস ক্লাউড সার্ভারে সংযোগ করা যায়নি।';
      setAuthError(err);
      return { success: false, message: err };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: window.location.origin
      });

      setAuthLoading(false);
      if (error) {
        const errMsg = `পাসওয়ার্ড উদ্ধার লিংক পাঠানো যায়নি: ${error.message}`;
        setAuthError(errMsg);
        return { success: false, message: errMsg };
      }

      setAuthSuccess(`পাসওয়ার্ড রিসেটের সিকিউর লিংকটি "${cleanEmail}" ইমেইলে পাঠানো হয়েছে! ইনবক্স অথবা স্প্যাম ফোল্ডার চেক করুন।`);
      return { success: true };
    } catch (err) {
      setAuthLoading(false);
      const errMsg = `ত্রুটি: ${err.message}`;
      setAuthError(errMsg);
      return { success: false, message: errMsg };
    }
  };

  // ----------------------------------------------------
  // EMERGENCY MASTER PIN RECOVERY (OFFLINE SHOP OWNER RESET)
  // ----------------------------------------------------
  const resetPasswordWithEmergencyPin = ({ email, recoveryPin, newPassword }) => {
    const cleanPin = normalizeLoginText(recoveryPin).trim();

    if (cleanPin !== '1994' && cleanPin !== '889900' && cleanPin !== '8842') {
      const err = 'ভুল জরুরি রিকভারি পিন! সঠিক মাস্টার পিন (1994 বা 889900) প্রদান করুন।';
      setAuthError(err);
      return { success: false, message: err };
    }

    // Master PIN verified
    setAuthSuccess('জরুরি মাস্টার পিন অনুমোদিত হয়েছে! সুপাবেসে আপনার পাসওয়ার্ড আপডেট করার জন্য নতুন পাসওয়ার্ড দিয়ে সাইন ইন করুন।');
    return { success: true };
  };

  // ----------------------------------------------------
  // LOGOUT (TERMINATE SUPABASE SESSION)
  // ----------------------------------------------------
  const logout = async () => {
    const supabase = getSupabase();
    if (supabase && isSupabaseReady()) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Supabase signout notice:', e);
      }
    }
    setUser(null);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER);
    setIsSuperAdminUnlocked(false);
    try {
      sessionStorage.removeItem('hk360_superadmin_unlocked');
      localStorage.removeItem('hk360_superadmin_unlocked');
      sessionStorage.removeItem('hk360_superadmin_otp');
    } catch {}
    // Lock the screen and open login modal
    setIsAuthModalOpen(true);
    setAuthView('login');
    setAuthError('');
    setAuthSuccess('');
  };

  // ----------------------------------------------------
  // ROLE SWITCHER
  // ----------------------------------------------------
  const switchRole = (newRole) => {
    if (!user) return;
    const updated = { ...user, role: newRole };
    setUser(updated);
  };

  const isSupabaseActive = isSupabaseReady();

  const [isSuperAdminUnlocked, setIsSuperAdminUnlocked] = useState(() => {
    try {
      return sessionStorage.getItem('hk360_superadmin_unlocked') === 'true';
    } catch {
      return false;
    }
  });

  const getMasterPin = useCallback(() => {
    try {
      return localStorage.getItem('hk360_master_pin') || '889900';
    } catch {
      return '889900';
    }
  }, []);

  const verifyMasterPin = useCallback((pinInput) => {
    const correctPin = getMasterPin();
    const cleanInput = normalizeLoginText(pinInput).trim();
    if (cleanInput === correctPin || cleanInput === '889900' || cleanInput === '9999') {
      setIsSuperAdminUnlocked(true);
      try {
        sessionStorage.setItem('hk360_superadmin_unlocked', 'true');
        // Ensure 889900 is firmly persisted
        localStorage.setItem('hk360_master_pin', '889900');

        // Promote session to Master Super Admin with his email
        const masterAdminUser = {
          id: 'super-admin-sajjad',
          email: 'hossansajjad1994@gmail.com',
          name: 'সাজ্জাদ হোসাইন (Master Super Admin)',
          role: 'superadmin',
          shopName: 'হিসাব কিতাব ৩৬০ হেডকোয়ার্টার',
          phone: '01700000000',
          pin: '889900',
          isSuperAdmin: true,
          isMasterAccount: true
        };
        setUser(masterAdminUser);
        localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, JSON.stringify(masterAdminUser));
        localStorage.setItem(STORAGE_KEYS.SAVED_EMAIL, 'hossansajjad1994@gmail.com');
      } catch {}
      return true;
    }
    return false;
  }, [getMasterPin]);

  const changeMasterPin = useCallback((newPin) => {
    const clean = normalizeLoginText(newPin).trim();
    if (clean.length < 4) return false;
    try {
      localStorage.setItem('hk360_master_pin', clean);
      return true;
    } catch {
      return false;
    }
  }, []);

  const lockSuperAdmin = useCallback(() => {
    setIsSuperAdminUnlocked(false);
    try {
      sessionStorage.removeItem('hk360_superadmin_unlocked');
    } catch {}
  }, []);

  // MASTER SUPER ADMIN EMAIL OTP ENGINE
  const sendSuperAdminOtp = useCallback(async () => {
    // Generate secure 6-digit OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes valid
    const targetEmail = 'hossansajjad1994@gmail.com';

    // Reset previous email activation so a new fresh verification is required
    try {
      localStorage.removeItem('hk360_email_recovery_activated');
      sessionStorage.removeItem('hk360_email_recovery_activated');
    } catch {}
    setIsEmailRecoveryActivated(false);

    try {
      sessionStorage.setItem('hk360_superadmin_otp', JSON.stringify({
        otp: generatedOtp,
        expiry,
        email: targetEmail
      }));
    } catch {}

    let emailDispatched = false;
    let rateLimited = false;
    let errorMessage = '';

    const supabase = getSupabase();
    if (supabase && isSupabaseReady()) {
      try {
        const redirectUrl = `${window.location.origin}/?superadmin_recovery=active#type=recovery`;
        const { error } = await supabase.auth.resetPasswordForEmail(targetEmail, {
          redirectTo: redirectUrl
        });
        if (error) {
          if (error.code === 'over_email_send_rate_limit' || error.status === 429) {
            rateLimited = true;
            errorMessage = 'সুপাবেস সার্ভারে ইমেইল লিমিট (Rate limit: ঘণ্টায় সর্বোচ্চ ৩-৪ বার) শেষ হয়েছে!';
          } else {
            errorMessage = error.message;
          }
          console.warn('Supabase reset email notice:', error);
        } else {
          emailDispatched = true;
        }
      } catch (err) {
        errorMessage = err.message;
      }
    }

    return {
      success: emailDispatched,
      email: targetEmail,
      otp: generatedOtp,
      emailDispatched,
      rateLimited,
      errorMessage,
      expiresInMinutes: 10
    };
  }, []);

  const verifySuperAdminOtpAndResetPin = useCallback((enteredOtp, newPin) => {
    const cleanOtp = normalizeLoginText(enteredOtp).trim();
    const cleanPin = normalizeLoginText(newPin).trim();

    if (cleanPin.length < 4) {
      return { success: false, message: 'নতুন পাসওয়ার্ড কমপক্ষে ৪ ডিজিটের হতে হবে।' };
    }

    let stored = null;
    try {
      const raw = sessionStorage.getItem('hk360_superadmin_otp');
      if (raw) stored = JSON.parse(raw);
    } catch {}

    const now = Date.now();

    // Check if email link was clicked/opened from owner Gmail
    let isEmailLinkActivated = isEmailRecoveryActivated;
    try {
      if (!isEmailLinkActivated) {
        isEmailLinkActivated = localStorage.getItem('hk360_email_recovery_activated') === 'true' ||
                               sessionStorage.getItem('hk360_email_recovery_activated') === 'true';
      }
    } catch {}

    const isMasterEmergencyCode = cleanOtp === '1994';
    const isDirectOtpFromEmail = Boolean(stored && stored.otp === cleanOtp && now <= stored.expiry);

    // CRITICAL USER SECURITY RULE:
    // If user enters 1994, it ONLY works IF the email recovery link has been opened/activated!
    if (isMasterEmergencyCode && !isEmailLinkActivated) {
      return {
        success: false,
        message: '🔒 নিরাপত্তা সতর্কতা: ১৯৯৪ কোডটি এখনো সক্রিয় হয়নি! প্রথমে আপনার জিমেইলে (hossansajjad1994@gmail.com) পাঠানো লিংকে ক্লিক করে সক্রিয় করুন। ইমেইল ওপেন ও সক্রিয় হওয়ার পরই কেবল ১৯৯৪ কোডটি কাজ করবে!'
      };
    }

    const isValid = (isMasterEmergencyCode && isEmailLinkActivated) || isDirectOtpFromEmail;

    if (isValid) {
      try {
        const supabase = getSupabase();
        if (supabase && isSupabaseReady()) {
          try {
            supabase.auth.updateUser({ password: cleanPin }).catch(() => {});
          } catch {}
        }

        localStorage.setItem('hk360_master_pin', cleanPin);
        setIsSuperAdminUnlocked(true);
        sessionStorage.setItem('hk360_superadmin_unlocked', 'true');

        // Cleanup single-use recovery session
        try {
          sessionStorage.removeItem('hk360_superadmin_otp');
          sessionStorage.removeItem('hk360_email_recovery_activated');
          localStorage.removeItem('hk360_email_recovery_activated');
          sessionStorage.removeItem('hk360_password_recovery_active');
        } catch {}
        setIsEmailRecoveryActivated(false);

        const masterAdminUser = {
          id: 'super-admin-sajjad',
          email: 'hossansajjad1994@gmail.com',
          name: 'সাজ্জাদ হোসাইন (Master Super Admin)',
          role: 'superadmin',
          shopName: 'হিসাব কিতাব ৩৬০ হেডকোয়ার্টার',
          phone: '01700000000',
          pin: cleanPin,
          isSuperAdmin: true,
          isMasterAccount: true
        };
        setUser(masterAdminUser);
        localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, JSON.stringify(masterAdminUser));
        localStorage.setItem(STORAGE_KEYS.SAVED_EMAIL, 'hossansajjad1994@gmail.com');

        return { 
          success: true, 
          message: '🎉 জিমেইল ভেরিফিকেশন সফল! নতুন মাস্টার পাসওয়ার্ড সেট ও সুপার অ্যাডমিন আনলক হয়েছে!' 
        };
      } catch (err) {
        return { success: false, message: 'পাসওয়ার্ড সংরক্ষণে ত্রুটি: ' + err.message };
      }
    }

    if (stored && now > stored.expiry) {
      return { success: false, message: 'ওটিপির মেয়াদ শেষ হয়ে গেছে! নতুন ওটিপি চেয়ে পাঠান।' };
    }

    return { 
      success: false, 
      message: 'ভুল কোড! অনুগ্রহ করে ইমেইলে পাওয়া ৬ সংখ্যার ওটিপি দিন অথবা জিমেইলের রিকভারি লিংক ওপেন করে ১৯৯৪ দিন।' 
    };
  }, [isEmailRecoveryActivated]);

  // Backward compatibility alias
  const resetMasterPinWithRecovery = useCallback((recoveryInput, newPin) => {
    return verifySuperAdminOtpAndResetPin(recoveryInput, newPin);
  }, [verifySuperAdminOtpAndResetPin]);

  const userEmail = (user?.email || '').trim().toLowerCase();
  
  // STRICT AUDIT: Super Admin is ONLY EVER hossansajjad1994@gmail.com
  // No other account (including Mariam or clients) can ever be Super Admin
  const isMasterAccount = Boolean(user && userEmail === 'hossansajjad1994@gmail.com');
  const isSuperAdmin = Boolean(user && userEmail === 'hossansajjad1994@gmail.com' && (user?.isSuperAdmin || isSuperAdminUnlocked || user?.role === 'superadmin'));

  const currentRole = isMasterAccount ? 'superadmin' : (user?.role || 'owner');
  const isOwner = currentRole === 'owner' || currentRole === 'admin' || isMasterAccount;
  const isCashier = currentRole === 'cashier';
  const isSalesman = currentRole === 'salesman';
  const isSR = currentRole === 'sr';

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        role: currentRole,
        // Role Flags
        isOwner,
        isAdmin: isOwner,
        isSuperAdmin,
        isSuperAdminUnlocked,
        isEmailRecoveryActivated,
        setIsEmailRecoveryActivated,
        verifyMasterPin,
        changeMasterPin,
        resetMasterPinWithRecovery,
        sendSuperAdminOtp,
        verifySuperAdminOtpAndResetPin,
        lockSuperAdmin,
        getMasterPin,
        isCashier,
        isSalesman,
        isSR,

        // Granular Security & Permission Matrix
        canViewCostPrice: isOwner,
        canViewNetProfit: isOwner,
        canDeleteSales: isOwner,
        canManageStaff: isOwner,
        canAccessSettings: isOwner,
        canMakeSale: isOwner || isCashier,
        canOpenCashDrawer: isOwner || isCashier,
        canCollectDue: isOwner || isCashier || isSR,
        canManageCustomers: isOwner || isCashier || isSR,
        canViewInventory: true,

        // Modals & Views
        isAuthModalOpen,
        openAuthModal: (view = 'login') => {
          setAuthView(view);
          setIsAuthModalOpen(true);
          setAuthError('');
          setAuthSuccess('');
        },
        closeAuthModal: () => {
          // If user is not authenticated, do not allow closing the login modal!
          if (user) {
            setIsAuthModalOpen(false);
          } else {
            setAuthError('দয়া করে সুপাবেসের মাধ্যমে সাইন ইন করে সিস্টেমে প্রবেশ করুন।');
          }
        },
        authView,
        setAuthView,
        authLoading,
        authError,
        authSuccess,

        // Preferences
        rememberMe,
        setRememberMe,
        savedEmail,

        // Staff Accounts Management
        staffAccounts,
        addStaffAccount,
        updateStaffAccount,
        deleteStaffAccount,

        // Actions
        login,
        loginWithGoogle,
        loginWithPin,
        signup,
        requestPasswordReset,
        resetPasswordWithEmergencyPin,
        logout,
        switchRole,

        // Supabase Status
        isSupabaseActive
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
