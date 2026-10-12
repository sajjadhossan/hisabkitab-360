/**
 * Universal Global Keyboard Shortcuts Service
 * -------------------------------------------
 * Provides hotkeys for desktop POS cashiers and power users:
 * - F1: Global Quick Search / Scratchpad
 * - F2: New Sale / POS Terminal
 * - F3: Debt Khata (বাকির খাতা)
 * - F4: Expenses Ledger
 * - Escape: Close active modals or clear search
 * - Ctrl+Shift+L: Lock Counter Screen
 */

import { playButtonClick } from './soundFeedback';
import { hapticFeedback } from './nativeAppService';

export function initGlobalShortcuts({
  onNavigate,
  onOpenQuickPad,
  onToggleLock,
  onCloseModals,
  lang = 'bn',
  showToast
}) {
  if (typeof window === 'undefined') return () => {};

  const handleKeyDown = (e) => {
    // Ignore hotkeys when typing inside rich textareas or contenteditables, unless it's Escape or F-keys
    const target = e.target;
    const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

    // F1: Quick Scratchpad / Focus
    if (e.key === 'F1') {
      e.preventDefault();
      playButtonClick();
      hapticFeedback.light();
      if (typeof onOpenQuickPad === 'function') onOpenQuickPad();
      return;
    }

    // F2: Switch to POS Terminal
    if (e.key === 'F2') {
      e.preventDefault();
      playButtonClick();
      hapticFeedback.light();
      if (typeof onNavigate === 'function') onNavigate('pos');
      return;
    }

    // F3: Switch to Debt Khata (বাকির খাতা)
    if (e.key === 'F3') {
      e.preventDefault();
      playButtonClick();
      hapticFeedback.light();
      if (typeof onNavigate === 'function') onNavigate('debts');
      return;
    }

    // F4: Switch to Expenses (দৈনিক খরচ)
    if (e.key === 'F4') {
      e.preventDefault();
      playButtonClick();
      hapticFeedback.light();
      if (typeof onNavigate === 'function') onNavigate('daily');
      return;
    }

    // F7: Switch to Inventory Manager (স্টক ও ইনভেন্টরি)
    if (e.key === 'F7') {
      e.preventDefault();
      playButtonClick();
      hapticFeedback.light();
      if (typeof onNavigate === 'function') onNavigate('inventory');
      return;
    }

    // F8: Switch to Invoices Manager (বিক্রি ও মেমো তালিকা)
    if (e.key === 'F8') {
      e.preventDefault();
      playButtonClick();
      hapticFeedback.light();
      if (typeof onNavigate === 'function') onNavigate('invoices');
      return;
    }

    // Ctrl+Shift+L: Quick Counter Screen Lock
    if (e.ctrlKey && e.shiftKey && (e.key === 'L' || e.key === 'l')) {
      e.preventDefault();
      playButtonClick();
      if (typeof onToggleLock === 'function') onToggleLock();
      return;
    }

    // Shift + ? or ?: Show Keyboard Shortcuts Guide
    if (e.key === '?' || (e.shiftKey && e.key === '/')) {
      if (!isInput && typeof onOpenShortcutsGuide === 'function') {
        e.preventDefault();
        playButtonClick();
        hapticFeedback.light();
        onOpenShortcutsGuide();
        return;
      }
    }

    // Escape: Close open modals
    if (e.key === 'Escape') {
      if (!isInput && typeof onCloseModals === 'function') {
        onCloseModals();
      }
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => {
    window.removeEventListener('keydown', handleKeyDown);
  };
}
