/**
 * HisabKitab 360 - Unified Modern Dialog Service
 * Replaces raw browser window.confirm and window.prompt with glassmorphic, animated modals.
 */

import { hapticFeedback } from './nativeAppService';

const listeners = new Set();

export const subscribeDialog = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const notify = (dialogState) => {
  listeners.forEach((fn) => {
    try {
      fn(dialogState);
    } catch {}
  });
};

/**
 * Promise-based confirmation dialog.
 * @param {Object} options
 * @param {string} options.title - Header title
 * @param {string} options.message - Main bold question
 * @param {string} [options.subMessage] - Explanatory warning
 * @param {string} [options.confirmText] - Button text (e.g. 'হ্যাঁ, মুছে ফেলুন')
 * @param {string} [options.cancelText] - Cancel text (e.g. 'না, বাতিল')
 * @param {'danger' | 'warning' | 'info' | 'success'} [options.type='danger']
 * @returns {Promise<boolean>}
 */
export const showConfirmDialog = ({
  title,
  message,
  subMessage,
  confirmText,
  cancelText,
  type = 'danger'
}) => {
  try {
    hapticFeedback.warning();
  } catch {}

  return new Promise((resolve) => {
    notify({
      isOpen: true,
      isPrompt: false,
      title: title || (type === 'danger' ? 'নিশ্চিতকরণ' : 'সতর্কবার্তা'),
      message: message || 'আপনি কি নিশ্চিত?',
      subMessage: subMessage || '',
      confirmText: confirmText || (type === 'danger' ? 'মুছে ফেলুন' : 'নিশ্চিত করুন'),
      cancelText: cancelText || 'বাতিল',
      type,
      resolve: (val) => {
        notify({ isOpen: false });
        resolve(val);
      }
    });
  });
};

/**
 * Promise-based prompt dialog for renaming or text inputs.
 * @param {Object} options
 * @param {string} options.title
 * @param {string} options.message
 * @param {string} [options.defaultValue]
 * @param {string} [options.placeholder]
 * @param {string} [options.confirmText]
 * @param {string} [options.cancelText]
 * @returns {Promise<string | null>}
 */
export const showPromptDialog = ({
  title,
  message,
  defaultValue = '',
  placeholder = '',
  confirmText,
  cancelText
}) => {
  try {
    hapticFeedback.light();
  } catch {}

  return new Promise((resolve) => {
    notify({
      isOpen: true,
      isPrompt: true,
      title: title || 'তথ্য লিখুন',
      message: message || '',
      defaultValue,
      placeholder,
      confirmText: confirmText || 'সংরক্ষণ',
      cancelText: cancelText || 'বাতিল',
      type: 'info',
      resolve: (val) => {
        notify({ isOpen: false });
        resolve(val);
      }
    });
  });
};

if (typeof window !== 'undefined') {
  window.__showConfirmDialog = showConfirmDialog;
  window.__showPromptDialog = showPromptDialog;
}
