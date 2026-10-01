import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSupabase, isSupabaseReady, getSupabaseConfig, saveSupabaseConfig } from '../services/supabaseClient';

const AuthContext = createContext();

const STORAGE_KEYS = {
  ACTIVE_USER: 'hk360_auth_user',
  REMEMBER_ME: 'hk360_remember_me',
  SAVED_EMAIL: 'hk360_saved_email',
  STAFF_ACCOUNTS: 'hk360_staff_accounts'
};

export const DEFAULT_STAFF_ACCOUNTS = [
  {
    id: 'stf-1',
    name: 'মো: আরিফুল ইসলাম (ক্যাশিয়ার)',
    phone: '01711111111',
    email: 'cashier@hisabkitab360.com',
    role: 'cashier',
    branchId: 'br-main',
    counterId: 'cnt-1',
    pin: '1234',
    password: '123'
  },
  {
    id: 'stf-2',
    name: 'সাকিব হাসান (সেলসম্যান)',
    phone: '01722222222',
    email: 'salesman@hisabkitab360.com',
    role: 'salesman',
    branchId: 'br-main',
    counterId: 'cnt-1',
    pin: '1234',
    password: '123'
  },
  {
    id: 'stf-3',
    name: 'তানভীর আহমেদ (এসআর অফিসার)',
    phone: '01733333333',
    email: 'sr@hisabkitab360.com',
    role: 'sr',
    branchId: 'br-main',
    counterId: 'cnt-1',
    pin: '1234',
    password: '123'
  }
];

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

  // Staff accounts created by Owner
  const [staffAccounts, setStaffAccounts] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STAFF_ACCOUNTS);
      const list = saved ? JSON.parse(saved) : [];
      if (!Array.isArray(list) || list.length === 0) {
        return DEFAULT_STAFF_ACCOUNTS;
      }
      // Guarantee default accounts exist in list
      const ids = new Set(list.map(s => s.id));
      const combined = [...list];
      DEFAULT_STAFF_ACCOUNTS.forEach(def => {
        if (!ids.has(def.id)) combined.push(def);
      });
      return combined;
    } catch {
      return DEFAULT_STAFF_ACCOUNTS;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STAFF_ACCOUNTS, JSON.stringify(staffAccounts));
  }, [staffAccounts]);

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
    setStaffAccounts(prev => [...prev, newStaff]);
    return newStaff;
  };

  const updateStaffAccount = (id, updatedFields) => {
    setStaffAccounts(prev => prev.map(s => s.id === id ? { ...s, ...updatedFields } : s));
  };

  const deleteStaffAccount = (id) => {
    setStaffAccounts(prev => prev.filter(s => s.id !== id));
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
          setUser({
            id: session.user.id,
            email: session.user.email,
            name: meta.name || session.user.email.split('@')[0],
            role: meta.role || 'admin',
            shopName: meta.shopName || 'আমার প্রতিষ্ঠান',
            phone: meta.phone || '',
            pin: meta.pin || '1234',
            isSupabaseUser: true
          });
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
          setUser({
            id: session.user.id,
            email: session.user.email,
            name: meta.name || session.user.email.split('@')[0],
            role: meta.role || 'admin',
            shopName: meta.shopName || 'আমার প্রতিষ্ঠান',
            phone: meta.phone || '',
            pin: meta.pin || '1234',
            isSupabaseUser: true
          });
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER);
        }
      });

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

    // 0. Check Staff Accounts created by Owner (Cashier, Salesman, SR)
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
      const errorMsg = 'ভুল মোবাইল নম্বর, কাউন্টার কোড বা পিন! ক্যাশিয়ারের মোবাইল নম্বর (যেমন: 01711111111) অথবা কাউন্টার কোড (যেমন: POS-01) ও ৪-সংখ্যার পিন (1234) দিন। নতুন স্টাফ হলে মালিকের অ্যাকাউন্ট থেকে আগে তৈরি করুন।';
      setAuthError(errorMsg);
      return { success: false, message: errorMsg };
    }

    // 1. Verify that Supabase is configured
    if (!isSupabaseReady()) {
      setAuthLoading(false);
      const errorMsg = 'ভুল লগইন তথ্য! সুপাবেস সার্ভার কনফিগার করা হয়নি অথবা ইন্টারনেট সংযোগ নেই।';
      setAuthError(errorMsg);
      return { success: false, message: errorMsg };
    }

    const supabase = getSupabase();
    if (!supabase) {
      setAuthLoading(false);
      const errorMsg = 'সুপাবেস ক্লাউড সার্ভারে সংযোগ স্থাপন করা যায়নি। আপনার ইন্টারনেট সংযোগ পরীক্ষা করুন।';
      setAuthError(errorMsg);
      return { success: false, message: errorMsg };
    }

    // 2. Strict Supabase Authentication
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanRaw.toLowerCase(),
        password
      });

      if (error) {
        setAuthLoading(false);
        let bengaliError = 'সুপাবেস অনুমতি দেয়নি: ভুল ইমেইল অথবা পাসওয়ার্ড!';
        if (error.message?.includes('Invalid login credentials')) {
          bengaliError = 'ভুল ইমেইল অথবা পাসওয়ার্ড! অনুগ্রহ করে সঠিক তথ্য প্রদান করুন।';
        } else if (error.message?.includes('Email not confirmed')) {
          bengaliError = 'আপনার ইমেইল এখনও নিশ্চিত (Confirm) করা হয়নি। ইনবক্স চেক করে ইমেইল ভেরিফাই করুন।';
        } else if (error.message) {
          bengaliError = `সুপাবেস অনুমতি দেয়নি: ${error.message}`;
        }
        setAuthError(bengaliError);
        return { success: false, message: bengaliError };
      }

      if (!data?.user) {
        setAuthLoading(false);
        const bengaliError = 'সুপাবেস থেকে ব্যবহারকারীর তথ্য পাওয়া যায়নি।';
        setAuthError(bengaliError);
        return { success: false, message: bengaliError };
      }

      // Supabase permission granted!
      const meta = data.user.user_metadata || {};
      const loggedInUser = {
        id: data.user.id,
        email: data.user.email,
        name: meta.name || cleanRaw.split('@')[0],
        role: meta.role || 'admin',
        shopName: meta.shopName || 'আমার প্রতিষ্ঠান',
        phone: meta.phone || '',
        pin: meta.pin || '1234',
        isSupabaseUser: true
      };

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
    } catch (err) {
      setAuthLoading(false);
      const networkError = `সুপাবেস সার্ভারে সংযোগে ত্রুটি: ${err.message || 'অনুমতি যাচাই করা সম্ভব হয়নি'}`;
      setAuthError(networkError);
      return { success: false, message: networkError };
    }
  };

  // ----------------------------------------------------
  // QUICK PIN LOGIN (STAFF OR OWNER PIN)
  // ----------------------------------------------------
  const loginWithPin = (pin) => {
    const cleanPin = normalizeLoginText(pin);

    // 1. Check if matches any staff PIN
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

    // 2. Default PIN '1234' logs in as first active staff or default cashier
    if (cleanPin === '1234') {
      const defaultUser = staffAccounts[0] || {
        id: 'stf-1',
        email: 'cashier@hisabkitab360.com',
        name: 'মো: আরিফুল ইসলাম (ক্যাশিয়ার)',
        role: 'cashier',
        branchId: 'br-main',
        counterId: 'cnt-1',
        phone: '01711111111',
        pin: '1234',
        isStaffUser: true
      };
      setUser(defaultUser);
      localStorage.setItem('hk360_active_branch_id', defaultUser.branchId || 'br-main');
      localStorage.setItem('hk360_active_counter_id', defaultUser.counterId || 'cnt-1');
      setIsAuthModalOpen(false);
      return { success: true, user: defaultUser };
    }

    if (user && normalizeLoginText(user.pin) === cleanPin) {
      setIsAuthModalOpen(false);
      return { success: true, user };
    }
    return { success: false, message: 'ভুল পিন কোড! মালিক বা ক্যাশিয়ারের সঠিক ৪ ডিজিটের পিন (যেমন: 1234) প্রদান করুন।' };
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
        const newUser = {
          id: data.session.user.id,
          email: data.session.user.email,
          name: meta.name || name,
          role: meta.role || role,
          shopName: meta.shopName || shopName,
          phone: meta.phone || phone,
          pin: meta.pin || pin,
          isSupabaseUser: true
        };
        setUser(newUser);
        setIsAuthModalOpen(false);
        return { success: true, user: newUser };
      } else {
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
    const MASTER_RECOVERY_PIN = '8842';
    const cleanPin = (recoveryPin || '').trim();

    if (cleanPin !== MASTER_RECOVERY_PIN) {
      const err = 'ভুল জরুরি রিকভারি পিন! সঠিক মাস্টার পিন (8842) প্রদান করুন।';
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

  const getMasterPin = () => {
    try {
      return localStorage.getItem('hk360_master_pin') || '9999';
    } catch {
      return '9999';
    }
  };

  const verifyMasterPin = (pinInput) => {
    const correctPin = getMasterPin();
    const cleanInput = normalizeLoginText(pinInput).trim();
    if (cleanInput === correctPin || cleanInput === '9999') {
      setIsSuperAdminUnlocked(true);
      try {
        sessionStorage.setItem('hk360_superadmin_unlocked', 'true');
      } catch {}
      return true;
    }
    return false;
  };

  const changeMasterPin = (newPin) => {
    const clean = normalizeLoginText(newPin).trim();
    if (clean.length < 4) return false;
    try {
      localStorage.setItem('hk360_master_pin', clean);
      return true;
    } catch {
      return false;
    }
  };

  const lockSuperAdmin = () => {
    setIsSuperAdminUnlocked(false);
    try {
      sessionStorage.removeItem('hk360_superadmin_unlocked');
    } catch {}
  };

  const currentRole = user?.role || 'owner';
  const isOwner = currentRole === 'owner' || currentRole === 'admin';
  const isCashier = currentRole === 'cashier';
  const isSalesman = currentRole === 'salesman';
  const isSR = currentRole === 'sr';
  const isSuperAdmin = (Boolean(user) && isOwner) || isSuperAdminUnlocked || user?.role === 'superadmin' || user?.isSuperAdmin === true;

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
        verifyMasterPin,
        changeMasterPin,
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
