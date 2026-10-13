/**
 * HisabKitab 360 - Advanced Keyboard Navigation Engine (Hotkeys V2)
 * Tip 23: Pure Keyboard-First 5-Second Cashier Checkout Workflow
 * -------------------------------------------------------------
 * Provides global function key bindings (F1-F12), numpad rapid navigation,
 * and quick modal triggers so cashiers never have to touch a mouse.
 */

export const HOTKEY_DEFINITIONS = [
  { key: 'F1', action: 'HELP_MODAL', label: 'সাহায্য ও শর্টকাট গাইড (Help)' },
  { key: 'F2', action: 'NEW_SALE', label: 'নতুন ইনভয়েস কার্ট শুরু (New Cart)' },
  { key: 'F3', action: 'SEARCH_CUSTOMER', label: 'কাস্টমার সার্চ ও বাকি খতিয়ান' },
  { key: 'F4', action: 'SEARCH_PRODUCT', label: 'প্রোডাক্ট বারকোড/নাম ফোকাস' },
  { key: 'F8', action: 'APPLY_DISCOUNT', label: 'স্পেশাল ছাড় / ডিসকাউন্ট বক্স' },
  { key: 'F9', action: 'PAY_CASH', label: 'নগদ বিল পরিশোধ (Cash Checkout)' },
  { key: 'F10', action: 'PAY_MFS', label: 'bKash / Nagad / বাংলা কিউআর' },
  { key: 'F12', action: 'LOCK_TERMINAL', label: 'কাউন্টার কুইক লক (Lock Screen)' },
  { key: 'Numpad+', action: 'INCREASE_QTY', label: 'পরিমাণ বৃদ্ধি (+)' },
  { key: 'Numpad-', action: 'DECREASE_QTY', label: 'পরিমাণ হ্রাস (-)' }
];

class AdvancedKeyboardManager {
  constructor() {
    this.handlers = new Map();
    this.isListening = false;
    this.lastTriggeredKey = null;
    this.listeners = new Set();
  }

  init() {
    if (this.isListening || typeof window === 'undefined') return;
    this.isListening = true;

    window.addEventListener('keydown', this.handleKeyDown);
  }

  destroy() {
    if (typeof window === 'undefined') return;
    window.removeEventListener('keydown', this.handleKeyDown);
    this.isListening = false;
  }

  handleKeyDown = (event) => {
    // Skip if target is inside an open input/textarea unless it is F-key or Escape
    const isInput = event.target && ['INPUT', 'TEXTAREA'].includes(event.target.tagName);
    const key = event.key;

    if (key.startsWith('F') && key.length <= 3) {
      event.preventDefault(); // Block default browser F-key behavior (e.g. F1 help or F3 find)
    }

    const handler = this.handlers.get(key);
    if (handler) {
      this.lastTriggeredKey = key;
      this.notify(key);
      try {
        handler(event);
      } catch {}
    }
  };

  register(key, callback) {
    this.handlers.set(key, callback);
    return () => this.handlers.delete(key);
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(key) {
    this.listeners.forEach(fn => {
      try { fn(key); } catch {}
    });
  }

  getHotkeysList() {
    return [...HOTKEY_DEFINITIONS];
  }
}

export const advancedKeyboardManager = new AdvancedKeyboardManager();
export default advancedKeyboardManager;
