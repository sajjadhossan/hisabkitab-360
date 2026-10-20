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
import { Share } from '@capacitor/share';

export const isNativePlatform = () => Capacitor.isNativePlatform();

// ==========================================
// 1. HAPTIC FEEDBACK (Vibration Engine)
// ==========================================
const triggerNativeHaptic = async (style = 'light') => {
  try {
    if (isNativePlatform()) {
      if (style === 'medium') await Haptics.impact({ style: ImpactStyle.Medium });
      else if (style === 'heavy') await Haptics.impact({ style: ImpactStyle.Heavy });
      else await Haptics.impact({ style: ImpactStyle.Light });
    } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(style === 'medium' ? 25 : (style === 'heavy' ? 40 : 12));
    }
  } catch {}
};

export const hapticFeedback = Object.assign(
  function(style = 'light') {
    triggerNativeHaptic(style);
  },
  {
    light: async () => triggerNativeHaptic('light'),
    medium: async () => triggerNativeHaptic('medium'),
    heavy: async () => triggerNativeHaptic('heavy'),
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
        } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(8);
        }
      } catch {}
    }
  }
);

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
let lastBackPressTriggerTime = 0;
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

export const initNativeBackHandling = ({ onHomeExitNotice, onNavigateHome, onNavigateBack }) => {
  if (isBackListenerInitialized) return;
  isBackListenerInitialized = true;

  const handleBackPress = () => {
    const now = Date.now();
    // 320ms Debounce guard to prevent hardware double-firing
    if (now - lastBackPressTriggerTime < 320) {
      return true;
    }
    lastBackPressTriggerTime = now;

    // 0. ABSOLUTE TOP PRIORITY: Active Barcode Scanner Force Dismissal Guard
    if (typeof window !== 'undefined' && typeof window.__closeScannerModal === 'function') {
      try {
        window.__closeScannerModal();
        hapticFeedback.light();
        return true;
      } catch (err) {
        console.warn('Direct scanner close error:', err);
      }
    }

    // 1. Query registered modal, sheet, or sub-view handlers (top-down)
    for (let i = backActionStack.length - 1; i >= 0; i--) {
      const handler = backActionStack[i];
      try {
        const handled = handler();
        if (handled === true) {
          // Handled successfully: remove from stack and consume event
          backActionStack.splice(i, 1);
          hapticFeedback.light();
          return true;
        }
      } catch (e) {
        console.error('[Native] Back handler error:', e);
      }
    }

    // 1.5. Fallback: Automatically close topmost DOM modal overlay if active
    if (typeof document !== 'undefined') {
      const openOverlays = document.querySelectorAll('.modal-overlay, .modal-backdrop, [role="dialog"]');
      if (openOverlays.length > 0) {
        const topOverlay = openOverlays[openOverlays.length - 1];
        // Look for close button or trigger click
        const closeBtn = topOverlay.querySelector('button[aria-label="close" i], button.btn-close, button.modal-close, button:has(svg.lucide-x)');
        if (closeBtn && typeof closeBtn.click === 'function') {
          closeBtn.click();
          hapticFeedback.light();
          return true;
        }
      }
    }

    // 2. Sequential step-by-step back navigation (tab-by-tab / sub-view back)
    if (onNavigateBack) {
      try {
        const handled = onNavigateBack();
        if (handled) {
          hapticFeedback.light();
          return true;
        }
      } catch (e) {
        console.error('[Native] onNavigateBack error:', e);
      }
    }

    // 3. Fallback to Home Dashboard if not on dashboard
    if (onNavigateHome) {
      try {
        const handledByHomeNav = onNavigateHome();
        if (handledByHomeNav) {
          hapticFeedback.light();
          return true;
        }
      } catch (e) {
        console.error('[Native] onNavigateHome error:', e);
      }
    }

    // 4. At Root Home Dashboard: Double-tap back button to exit
    if (now - lastBackPressTime < 2200) {
      if (isNativePlatform()) {
        App.exitApp();
      }
      return false;
    } else {
      lastBackPressTime = now;
      hapticFeedback.warning();
      if (onHomeExitNotice) {
        onHomeExitNotice();
      }
      return true;
    }
  };

  if (typeof window !== 'undefined') {
    window.__hkNativeBackDispatcher = handleBackPress;
    if (onHomeExitNotice) {
      window.__showHKToast = onHomeExitNotice;
    }
  }

  // Capacitor Native Android Hardware/Gesture Back Button
  if (isNativePlatform()) {
    try {
      App.addListener('backButton', () => {
        handleBackPress();
      });
    } catch (err) {
      console.warn('[Native] Capacitor App.addListener failed:', err);
    }
  } else if (typeof window !== 'undefined') {
    // Web Browser / PWA popstate back navigation protection
    try {
      window.history.pushState({ hkRoot: true }, '');
      window.addEventListener('popstate', () => {
        const consumed = handleBackPress();
        if (consumed) {
          window.history.pushState({ hkRoot: true }, '');
        }
      });
    } catch {}
  }
};

/**
 * 4.1. ANDROID HOME SCREEN SHORTCUTS & DEEP-LINKING
 * Handles launching directly into POS, Debts, Stock, or Branch Control
 * via Android launcher long-press shortcuts and custom URL schemes.
 */
export const initDeepLinkHandler = (onNavigateTab) => {
  if (typeof window !== 'undefined') {
    // 1. Cold start query parameter check (?tab=pos etc.)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      if (tabParam && onNavigateTab) {
        onNavigateTab(tabParam);
        const cleanUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, '', cleanUrl);
      }
    } catch (e) {
      console.debug('[Native] Deep link parse error:', e);
    }
  }

  // 2. Capacitor native App Url Open event (when app is already warm/backgrounded)
  if (isNativePlatform()) {
    try {
      App.addListener('appUrlOpen', (event) => {
        if (event && event.url) {
          try {
            const urlObj = new URL(event.url);
            const tab = urlObj.searchParams.get('tab');
            if (tab && onNavigateTab) {
              onNavigateTab(tab);
            }
          } catch {
            const match = event.url.match(/[?&]tab=([^&#]+)/);
            if (match && match[1] && onNavigateTab) {
              onNavigateTab(match[1]);
            }
          }
        }
      });
    } catch (err) {
      console.warn('[Native] appUrlOpen listener error:', err);
    }
  }
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

  // Auto-attach inputMode="decimal" to all number inputs for instant numeric keypad
  if (typeof document !== 'undefined') {
    document.addEventListener('focusin', (e) => {
      const target = e.target;
      if (target && target.tagName === 'INPUT') {
        const type = target.getAttribute('type');
        const name = (target.getAttribute('name') || '').toLowerCase();
        const placeholder = (target.getAttribute('placeholder') || '').toLowerCase();
        const isNumeric = type === 'number' || name.includes('amount') || name.includes('price') || name.includes('qty') || placeholder.includes('৳') || placeholder.includes('টাকা');
        if (isNumeric && !target.hasAttribute('inputmode')) {
          target.setAttribute('inputmode', 'decimal');
        }
      }
    }, { passive: true });
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('focusout', () => {
      setTimeout(() => {
        const active = document.activeElement;
        if (!active || (active.tagName !== 'INPUT' && active.tagName !== 'TEXTAREA' && !active.isContentEditable)) {
          document.body.classList.remove('keyboard-is-open');
          document.documentElement.style.removeProperty('--keyboard-height');
        }
      }, 150);
    }, { passive: true });
  }

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

export const triggerInstantWhatsAppSelfBackup = triggerWhatsAppSelfBackup;

// ==========================================
// 9. LOW RAM & BATTERY SAVER MODE ENGINE
// ==========================================
const POWER_SAVER_KEY = 'hk360_power_saver_mode';

export const isPowerSaverActive = () => {
  try {
    const saved = localStorage.getItem(POWER_SAVER_KEY);
    if (saved !== null) return saved === 'true';
    // Auto-detect 2GB-3GB RAM or low-core mobile devices
    if (typeof navigator !== 'undefined') {
      const memory = navigator.deviceMemory;
      const cores = navigator.hardwareConcurrency;
      if ((memory && memory <= 3) || (cores && cores <= 4)) return true;
    }
    return false;
  } catch {
    return false;
  }
};

export const setPowerSaverMode = (enabled) => {
  try {
    localStorage.setItem(POWER_SAVER_KEY, String(enabled));
    if (typeof document !== 'undefined') {
      if (enabled) {
        document.body.classList.add('low-ram-power-saver');
      } else {
        document.body.classList.remove('low-ram-power-saver');
      }
    }
  } catch {}
};

// Initialize class on load
if (typeof document !== 'undefined') {
  if (isPowerSaverActive()) {
    document.body.classList.add('low-ram-power-saver');
  }
}

// ==========================================
// 10. WEBP & AI SMART IMAGE AUTO-COMPRESSION ENGINE
// ==========================================
export const optimizeProductImageAI = (fileOrBlob, maxDimension = 520, quality = 0.76) => {
  return new Promise((resolve, reject) => {
    if (!fileOrBlob) return resolve(null);
    const originalBytes = fileOrBlob.size || 0;
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Auto square/balanced aspect ratio scaling
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Apply smart visual enhancement filter (sharpness, contrast, vibrancy)
        try {
          ctx.filter = 'contrast(1.06) brightness(1.02) saturate(1.08)';
        } catch {}

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to lightweight WebP (with high quality JPEG fallback)
        let dataUrl = canvas.toDataURL('image/webp', quality);
        if (!dataUrl.startsWith('data:image/webp')) {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        // Calculate size in KB
        const approxBytes = Math.round((dataUrl.length - 22) * 3 / 4);
        const compressedKb = Math.max(1, Math.round(approxBytes / 1024));
        const originalKb = originalBytes > 0 ? Math.round(originalBytes / 1024) : compressedKb;
        const savedPct = originalKb > compressedKb ? Math.round(((originalKb - compressedKb) / originalKb) * 100) : 0;

        resolve({
          dataUrl,
          compressedKb,
          originalKb,
          savedPct,
          width,
          height
        });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(fileOrBlob);
  });
};

export const compressImageToWebP = async (fileOrBlob, maxDimension = 900, quality = 0.78) => {
  const result = await optimizeProductImageAI(fileOrBlob, maxDimension, quality);
  return result ? result.dataUrl : null;
};

// ==========================================
// 11. HARDWARE KEY TRIGGER FOR BARCODE SCANNER
// ==========================================
export const initHardwareVolumeKeyScanner = (onScanTrigger) => {
  if (typeof window === 'undefined') return () => {};

  const handleKeyDown = (e) => {
    // Listen for VolumeDown or specific scanner key
    if (e.key === 'AudioVolumeDown' || e.code === 'AudioVolumeDown') {
      const active = document.activeElement;
      const isInput = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA');
      if (!isInput && onScanTrigger) {
        e.preventDefault();
        hapticFeedback.medium();
        onScanTrigger();
      }
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
};

// ==========================================
// 12. INACTIVITY AUTO-LOCK WATCHER
// ==========================================
let autoLockTimer = null;
let lastResetTimestamp = 0;

export const initInactivityAutoLock = (onLock, timeoutMinutes = 5) => {
  if (typeof window === 'undefined' || typeof onLock !== 'function' || timeoutMinutes <= 0) return () => {};

  const ms = timeoutMinutes * 60 * 1000;

  const resetTimer = (e) => {
    const now = Date.now();
    // Throttle: don't churn timers more than once every 15 seconds during continuous interaction
    if (e && (e.type === 'scroll' || e.type === 'touchstart' || e.type === 'mousedown')) {
      if (now - lastResetTimestamp < 15000) return;
    }
    lastResetTimestamp = now;

    if (autoLockTimer) clearTimeout(autoLockTimer);
    autoLockTimer = setTimeout(() => {
      onLock();
    }, ms);
  };

  const events = ['touchstart', 'mousedown', 'keydown', 'scroll'];
  events.forEach(ev => window.addEventListener(ev, resetTimer, { passive: true }));
  resetTimer();

  return () => {
    if (autoLockTimer) clearTimeout(autoLockTimer);
    events.forEach(ev => window.removeEventListener(ev, resetTimer));
  };
};

// ==========================================
// 13. NIGHTLY END-OF-DAY BACKUP PROMPT
// ==========================================
export const checkNightlyBackupDue = () => {
  try {
    const now = new Date();
    const currentHour = now.getHours();
    // After 9:00 PM (21:00)
    if (currentHour >= 21) {
      const todayStr = now.toISOString().split('T')[0];
      const lastPromptDate = localStorage.getItem('hk360_last_nightly_backup_prompt');
      if (lastPromptDate !== todayStr) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
};

export const markNightlyBackupPromptDone = () => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    localStorage.setItem('hk360_last_nightly_backup_prompt', todayStr);
  } catch {}
};

// ==========================================
// 14. NATIVE ANDROID SYSTEM SHARE SHEET
// ==========================================
/**
 * Opens native Android Chooser / Share Sheet for WhatsApp, IMO, Messenger, SMS, Drive, Bluetooth, etc.
 * Uses @capacitor/share natively on Android APK with web navigator.share fallback.
 */
export const shareNativeSheet = async ({ title, text, url, dialogTitle = 'শেয়ার করুন' }) => {
  try {
    hapticFeedback.light();
    if (isNativePlatform()) {
      await Share.share({
        title,
        text,
        url,
        dialogTitle
      });
      return true;
    } else if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share({
        title,
        text,
        url
      });
      return true;
    }
  } catch (err) {
    if (err && err.name !== 'AbortError') {
      console.warn('[Native Share] Share sheet closed or unsupported:', err);
    }
  }
  return false;
};

// ==========================================
// 8. ANDROID NATIVE PRINT & FILE DOWNLOAD BRIDGES
// ==========================================
if (typeof window !== 'undefined') {
  const origPrint = window.print;
  window.print = function() {
    if (window.AndroidPrintBridge && typeof window.AndroidPrintBridge.print === 'function') {
      try {
        window.AndroidPrintBridge.print();
        return;
      } catch (err) {
        console.warn('[NativeAppService] AndroidPrintBridge print failed:', err);
      }
    }
    if (typeof origPrint === 'function') {
      origPrint.call(window);
    }
  };
}

export const downloadNativeFile = async (blobOrData, filename, mimeType = 'application/octet-stream') => {
  if (typeof window === 'undefined') return false;

  // 1. Android APK Native MediaStore Bridge
  if (window.AndroidFileBridge && typeof window.AndroidFileBridge.downloadBase64File === 'function') {
    try {
      let base64 = '';
      if (blobOrData instanceof Blob) {
        base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const res = reader.result;
            const commaIdx = res.indexOf(',');
            resolve(commaIdx !== -1 ? res.slice(commaIdx + 1) : res);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blobOrData);
        });
      } else if (typeof blobOrData === 'string') {
        if (blobOrData.startsWith('data:')) {
          const commaIdx = blobOrData.indexOf(',');
          base64 = commaIdx !== -1 ? blobOrData.slice(commaIdx + 1) : blobOrData;
        } else {
          base64 = btoa(unescape(encodeURIComponent(blobOrData)));
        }
      }

      if (base64) {
        window.AndroidFileBridge.downloadBase64File(base64, mimeType, filename);
        return true;
      }
    } catch (e) {
      console.warn('[NativeAppService] AndroidFileBridge error:', e);
    }
  }

  // 2. Standard Web fallback: <a download>
  try {
    const blob = blobOrData instanceof Blob ? blobOrData : new Blob([blobOrData], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    return true;
  } catch (err) {
    console.error('[NativeAppService] File download fallback error:', err);
    return false;
  }
};



