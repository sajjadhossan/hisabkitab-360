/**
 * HisabKitab 360 - Web NFC & Web OTP Credential Management Bridge
 * ----------------------------------------------------------------
 * Leverages native W3C Web NFC (NDEFReader) and Web OTP (navigator.credentials)
 * for high-speed merchant and retail interactions.
 *
 * Capabilities:
 * 1. Web NFC (NDEFReader):
 *    - Scans physical RFID / NFC cards for instant customer membership lookup.
 *    - Allows tapping staff RFID cards for rapid cashier shifts without typing passwords.
 * 2. Web OTP API (navigator.credentials.get):
 *    - Intercepts SMS 6-digit OTP codes in 1 tap without manual typing.
 *    - Perfect for debt verification, cashier auth, or customer mobile verification.
 */

/**
 * Checks if Web NFC (NDEFReader) is supported
 */
export const isNfcSupported = () => {
  return typeof window !== 'undefined' && 'NDEFReader' in window;
};

/**
 * Checks if Web OTP (SMS Receiver) is supported
 */
export const isWebOtpSupported = () => {
  return (
    typeof window !== 'undefined' &&
    'credentials' in navigator &&
    'OTPCredential' in window
  );
};

let activeNfcController = null;

/**
 * Starts continuous or single NFC card scanning
 *
 * @param {Object} options
 * @param {Function} options.onScan Callback with scanned serialNumber or NDEF message
 * @param {Function} [options.onError] Error handler
 * @returns {Promise<boolean>}
 */
export const startNfcScanner = async ({ onScan, onError } = {}) => {
  if (!isNfcSupported()) {
    if (onError) onError(new Error('এই ডিভাইসে Web NFC সমর্থিত নয়। NFC সমর্থিত অ্যান্ড্রয়েড ক্রোম ব্যবহার করুন।'));
    return false;
  }

  try {
    // Abort previous scan if active
    if (activeNfcController) {
      activeNfcController.abort();
    }

    activeNfcController = new AbortController();
    const ndef = new window.NDEFReader();
    await ndef.scan({ signal: activeNfcController.signal });

    ndef.addEventListener('reading', ({ message, serialNumber }) => {
      let recordText = '';
      if (message && message.records && message.records.length > 0) {
        for (const record of message.records) {
          if (record.recordType === 'text') {
            const textDecoder = new TextDecoder(record.encoding || 'utf-8');
            recordText = textDecoder.decode(record.data);
          }
        }
      }

      if (onScan) {
        onScan({
          serialNumber: serialNumber || 'NFC_TAG',
          payload: recordText,
          timestamp: Date.now()
        });
      }
    });

    ndef.addEventListener('readingerror', (err) => {
      if (onError) onError(err);
    });

    return true;
  } catch (err) {
    console.warn('[WebNFC] Start scan failed:', err);
    if (onError) onError(err);
    return false;
  }
};

/**
 * Stops active NFC scanner
 */
export const stopNfcScanner = () => {
  if (activeNfcController) {
    activeNfcController.abort();
    activeNfcController = null;
  }
};

/**
 * Automatically intercepts incoming SMS verification code via Web OTP API
 *
 * @param {Object} options
 * @param {number} [options.timeout=60000] Timeout in milliseconds
 * @returns {Promise<string|null>} The extracted 6-digit OTP code or null
 */
export const requestSmsOtp = async ({ timeout = 60000 } = {}) => {
  if (!isWebOtpSupported()) {
    console.log('[WebOTP] Web OTP API not available on this browser/OS');
    return null;
  }

  try {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeout);

    const credential = await navigator.credentials.get({
      otp: { transport: ['sms'] },
      signal: ac.signal
    });

    clearTimeout(timer);

    if (credential && credential.code) {
      return credential.code;
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.warn('[WebOTP] Error receiving OTP:', err);
    }
  }

  return null;
};

export const nfcLoyaltyBridge = {
  isNfcSupported,
  isWebOtpSupported,
  startNfcScanner,
  stopNfcScanner,
  requestSmsOtp
};
