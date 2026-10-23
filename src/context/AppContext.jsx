import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCachedAuthUser, signOutUser, subscribeToAuthState } from '../services/somitiAuthService';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('somiti360_lang') || 'bn';
  });

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('somiti360_theme') || localStorage.getItem('hisabkitab_theme') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('somiti360_theme', theme);
    localStorage.setItem('hisabkitab_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'light' || theme === 'nordic_clean') {
      document.documentElement.classList.add('light-theme');
      document.documentElement.classList.remove('dark-theme');
    } else {
      document.documentElement.classList.add('dark-theme');
      document.documentElement.classList.remove('light-theme');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' || prev === 'nordic_clean') ? 'dark' : 'light');
  };

  const [toastMessage, setToastMessage] = useState(null);

  // Authentication State
  const [user, setUser] = useState(() => getCachedAuthUser());
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuthState((authUser) => {
      setUser(authUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOutUser();
    setUser(null);
  };

  const [businessSettings, setBusinessSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('somiti360_settings');
      return saved ? JSON.parse(saved) : {
        companyName: 'সমিতি ৩৬০',
        phone: '',
        address: '',
        companyLogo: ''
      };
    } catch {
      return {
        companyName: 'সমিতি ৩৬০',
        phone: '',
        address: '',
        companyLogo: ''
      };
    }
  });

  useEffect(() => {
    localStorage.setItem('somiti360_lang', lang);
  }, [lang]);

  const showToast = (message, type = 'info') => {
    setToastMessage({ message, type, id: Date.now() });
    setTimeout(() => {
      setToastMessage(prev => (prev?.id === toastMessage?.id ? null : prev));
    }, 3500);
  };

  const value = {
    lang,
    setLang,
    theme,
    setTheme,
    toggleTheme,
    showToast,
    businessSettings,
    setBusinessSettings,
    user,
    setUser,
    isAuthenticated: Boolean(user),
    authLoading,
    logout
  };

  return (
    <AppContext.Provider value={value}>
      {children}
      {toastMessage && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(45, 212, 191, 0.5)', color: '#2dd4bf', padding: '12px 18px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', fontSize: '0.86rem', fontWeight: '700' }}>
          <span>{toastMessage.message}</span>
        </div>
      )}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    return {
      lang: 'bn',
      setLang: () => {},
      theme: 'dark',
      setTheme: () => {},
      toggleTheme: () => {},
      showToast: () => {},
      businessSettings: { companyName: 'সমিতি ৩৬০', phone: '', address: '', companyLogo: '' },
      user: null,
      isAuthenticated: false,
      authLoading: false,
      logout: () => {}
    };
  }
  return context;
};

export default AppContext;
