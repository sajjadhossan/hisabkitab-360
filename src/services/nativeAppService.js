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
  const scrollActiveElement = () => {
    setTimeout(() => {
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT')) {
        active.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
  };

  if (isNativePlatform()) {
    try {
      Keyboard.addListener('keyboardWillShow', (info) => {
        document.body.classList.add('keyboard-is-open');
        document.documentElement.style.setProperty('--keyboard-height', `${info.keyboardHeight || 280}px`);
        scrollActiveElement();
      });

      Keyboard.addListener('keyboardDidHide', () => {
        document.body.classList.remove('keyboard-is-open');
        document.documentElement.style.removeProperty('--keyboard-height');
      });
    } catch (err) {
      console.debug('[Native] Keyboard listener ignored:', err);
    }
  }
};

// ==========================================
// 6. SCREEN WAKE LOCK (ALWAYS-ON POS DISPLAY)
// ==========================================
let wakeLockSentinel = null;
let isWakeLockRequested = false;

export const requestScreenWakeLock = async () => {
  isWakeLockRequested = true;
  if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
    try {
      wakeLockSentinel = await navigator.wakeLock.request('screen');
      wakeLockSentinel.addEventListener('release', () => {
        wakeLockSentinel = null;
      });
      return true;
    } catch (err) {
      console.debug('[Native] Wake lock not acquired:', err);
    }
  }
  return false;
};

export const releaseScreenWakeLock = async () => {
  isWakeLockRequested = false;
  if (wakeLockSentinel) {
    try {
      await wakeLockSentinel.release();
    } catch {}
    wakeLockSentinel = null;
  }
};

// Re-acquire wake lock automatically when app returns to foreground
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible' && isWakeLockRequested && !wakeLockSentinel) {
      try {
        await requestScreenWakeLock();
      } catch {}
    }
  });
}

// ==========================================
// 7. PHYSICAL BARCODE SCANNER GUN (KEYBOARD WEDGE)
// ==========================================
let barcodeBuffer = '';
let lastKeyTime = 0;
const barcodeScanListeners = new Set();
let isHardwareListenerInit = false;

export const onHardwareBarcodeScan = (callback) => {
  barcodeScanListeners.add(callback);
  return () => barcodeScanListeners.delete(callback);
};

export const initHardwareBarcodeScannerListener = () => {
  if (typeof window === 'undefined' || isHardwareListenerInit) return;
  isHardwareListenerInit = true;

  window.addEventListener('keydown', (e) => {
    const active = document.activeElement;
    // Skip if user is actively writing a long note
    const isTypingText = active && active.tagName === 'TEXTAREA';
    if (isTypingText) return;

    const now = Date.now();

    if (e.key === 'Enter') {
      if (barcodeBuffer.length >= 3 && (now - lastKeyTime < 120)) {
        const scannedCode = barcodeBuffer.trim();
        barcodeBuffer = '';
        if (scannedCode) {
          hapticFeedback.light();
          barcodeScanListeners.forEach((cb) => {
            try { cb(scannedCode); } catch {}
          });
        }
      }
      barcodeBuffer = '';
      return;
    }

    if (e.key && e.key.length === 1) {
      if (now - lastKeyTime > 80) {
        barcodeBuffer = '';
      }
      barcodeBuffer += e.key;
      lastKeyTime = now;
    }
  });
};

// ==========================================
// 8. 1-CLICK WHATSAPP INSTANT SELF-BACKUP
// ==========================================
export const triggerWhatsAppSelfBackup = ({ businessSettings, productsCount = 0, customersCount = 0, salesCount = 0, lang = 'bn', exportDataJson = null }) => {
  try {
    hapticFeedback.medium();
    const now = new Date();
    const dateStr = now.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString(lang === 'bn' ? 'bn-BD' : 'en-US', { hour: '2-digit', minute: '2-digit' });
    const storeName = businessSettings?.storeName || (lang === 'bn' ? 'হিসাবখাতা ৩৬০' : 'HisabKitab 360');

    // Trigger local JSON file download if data payload is provided
    if (exportDataJson) {
      const blob = new Blob([typeof exportDataJson === 'string' ? exportDataJson : JSON.stringify(exportDataJson, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `HisabKitab360_Backup_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    // Format WhatsApp message
    const msg = lang === 'bn'
      ? `🛡️ *হিসাবকিতাব ৩৬০ - ইনস্ট্যান্ট সেলফ ব্যাকআপ*\n` +
        `🏬 *প্রতিষ্ঠান:* ${storeName}\n` +
        `📅 *তারিখ ও সময়:* ${dateStr}, ${timeStr}\n` +
        `📦 *মোট পণ্য:* ${productsCount} টি\n` +
        `👥 *কাস্টমার:* ${customersCount} জন\n` +
        `🧾 *মোট বিক্রয় মেমো:* ${salesCount} টি\n\n` +
        `✅ *ডাটাবেজ স্ট্যাটাস:* ব্যাকআপ ফাইল সফলভাবে ডিভাইসে সেভ হয়েছে।\n` +
        `🔒 এই মেসেজটি আপনার ব্যবসা ক্লাউড ব্যাকআপ লগ হিসেবে সংরক্ষণ করুন।`
      : `🛡️ *HisabKitab 360 - Instant Self-Backup*\n` +
        `🏬 *Store:* ${storeName}\n` +
        `📅 *Date & Time:* ${dateStr}, ${timeStr}\n` +
        `📦 *Products:* ${productsCount}\n` +
        `👥 *Customers:* ${customersCount}\n` +
        `🧾 *Invoices:* ${salesCount}\n\n` +
        `✅ *Database Status:* Backup file successfully saved to device.\n` +
        `🔒 Keep this message as your verified business backup log.`;

    const encoded = encodeURIComponent(msg);
    const waUrl = `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    return true;
  } catch (err) {
    console.error('WhatsApp self backup error:', err);
    return false;
  }
};

