/**
 * HisabKitab 360 - Native Android & Cross-Platform Hardware Bridge
 * Powered by Capacitor 8: Status Bar, Hardware Back Button, Haptics, Keyboard & Splash
 */

import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard } from '@capacitor/keyboard';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export const isNativePlatform = () => Capacitor.isNativePlatform();

// ==========================================
// 1. HAPTIC FEEDBACK (Vibration Engine)
// ==========================================
export const hapticFeedback = {
  light: async () => {
    try {
      if (isNativePlatform()) {
        await Haptics.impact({ style: ImpactStyle.Light });
      } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(12);
      }
    } catch {}
  },
  medium: async () => {
    try {
      if (isNativePlatform()) {
        await Haptics.impact({ style: ImpactStyle.Medium });
      } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(25);
      }
    } catch {}
  },
  heavy: async () => {
    try {
      if (isNativePlatform()) {
        await Haptics.impact({ style: ImpactStyle.Heavy });
      } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(40);
      }
    } catch {}
  },
  success: async () => {
    try {
      if (isNativePlatform()) {
        await Haptics.notification({ type: NotificationType.Success });
      } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([20, 40, 25]);
      }
    } catch {}
  },
  warning: async () => {
    try {
      if (isNativePlatform()) {
        await Haptics.notification({ type: NotificationType.Warning });
      } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([30, 50, 30]);
      }
    } catch {}
  },
  error: async () => {
    try {
      if (isNativePlatform()) {
        await Haptics.notification({ type: NotificationType.Error });
      } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([50, 60, 50, 60, 50]);
      }
    } catch {}
  },
  selection: async () => {
    try {
      if (isNativePlatform()) {
        await Haptics.selectionStart();
      }
    } catch {}
  }
};

// ==========================================
// 2. STATUS BAR & THEME INTEGRATION
// ==========================================
export const syncNativeStatusBar = async (theme = 'dark') => {
  if (!isNativePlatform()) return;
  try {
    const isLight = theme === 'light';
    const bgColor = isLight ? '#ffffff' : '#0f172a';

    await StatusBar.setOverlaysWebView({ overlay: false });
    await StatusBar.setStyle({ style: isLight ? Style.Light : Style.Dark });
    await StatusBar.setBackgroundColor({ color: bgColor });
  } catch (err) {
    console.debug('[Native] StatusBar sync ignored:', err);
  }
};

// ==========================================
// 3. SPLASH SCREEN TRANSITION
// ==========================================
export const hideNativeSplashScreen = async (duration = 350) => {
  if (!isNativePlatform()) return;
  try {
    await SplashScreen.hide({ fadeOutDuration: duration });
  } catch (err) {
    console.debug('[Native] SplashScreen hide ignored:', err);
  }
};

// ==========================================
// 4. BACK BUTTON STACK & ROUTER
// ==========================================
const backActionStack = [];
let lastBackPressTime = 0;
let isBackListenerInitialized = false;

export const registerBackAction = (handler) => {
  if (typeof handler !== 'function') return () => {};
  backActionStack.push(handler);
  return () => {
    const idx = backActionStack.lastIndexOf(handler);
    if (idx !== -1) {
      backActionStack.splice(idx, 1);
    }
  };
};

export const initNativeBackHandling = ({ onHomeExitNotice, onNavigateHome }) => {
  if (!isNativePlatform() || isBackListenerInitialized) return;
  isBackListenerInitialized = true;

  App.addListener('backButton', ({ canGoBack }) => {
    // 1. If any modal, drawer, or custom sheet registered a handler, run it first
    if (backActionStack.length > 0) {
      const topHandler = backActionStack.pop();
      try {
        const handled = topHandler();
        if (handled !== false) {
          hapticFeedback.light();
          return;
        }
      } catch (e) {
        console.error('[Native] Back handler error:', e);
      }
    }

    // 2. If no modal is open, check if we need to navigate back to Home Dashboard
    const handledByHomeNav = onNavigateHome && onNavigateHome();
    if (handledByHomeNav) {
      hapticFeedback.light();
      return;
    }

    // 3. At Root Home: Double-tap back button to exit
    const now = Date.now();
    if (now - lastBackPressTime < 2200) {
      App.exitApp();
    } else {
      lastBackPressTime = now;
      hapticFeedback.warning();
      if (onHomeExitNotice) {
        onHomeExitNotice();
      }
    }
  });
};

// ==========================================
// 5. KEYBOARD ADAPTABILITY & INSET FIX
// ==========================================
export const initNativeKeyboardListeners = () => {
  if (!isNativePlatform()) return;

  try {
    Keyboard.addListener('keyboardWillShow', (info) => {
      document.body.classList.add('keyboard-is-open');
      document.documentElement.style.setProperty('--keyboard-height', `${info.keyboardHeight || 280}px`);
    });

    Keyboard.addListener('keyboardDidHide', () => {
      document.body.classList.remove('keyboard-is-open');
      document.documentElement.style.removeProperty('--keyboard-height');
    });
  } catch (err) {
    console.debug('[Native] Keyboard listener ignored:', err);
  }
};
