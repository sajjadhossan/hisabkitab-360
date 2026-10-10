/**
 * HisabKitab 360 - Biometric & Quick PIN Authentication Bridge
 * -------------------------------------------------------------
 * Supports native Android hardware fingerprint / face unlock via WebAuthn Platform Authenticator
 * with persistent passkey credential caching for sub-second cashier verification.
 */

const CRED_ID_KEY = 'hk360_biometric_cred_id';
const BIOMETRIC_LOCK_KEY = 'hk360_biometric_lock_enabled';

// Convert ArrayBuffer to Base64
const bufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

// Convert Base64 to Uint8Array
const base64ToUint8Array = (base64) => {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

/**
 * Checks if the hardware platform authenticator (Fingerprint/Face) is available on this Android/PC device
 */
export const isBiometricSupported = async () => {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) return false;
  if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
    try {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch {
      return false;
    }
  }
  return false;
};

export const hasBiometricLockEnabled = () => {
  return localStorage.getItem(BIOMETRIC_LOCK_KEY) === 'true';
};

export const setBiometricLockEnabled = (enabled) => {
  localStorage.setItem(BIOMETRIC_LOCK_KEY, String(enabled));
};

/**
 * Registers / Enrolls device biometric credential explicitly
 */
export const registerDeviceBiometrics = async () => {
  try {
    const isAvailable = await isBiometricSupported();
    if (!isAvailable) {
      return { success: false, reason: 'unsupported' };
    }

    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: 'HisabKitab 360', id: window.location.hostname },
        user: {
          id: new Uint8Array([19, 84, 36, 0]),
          name: 'cashier@hisabkitab360',
          displayName: 'দোকানদার / ক্যাশিয়ার'
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },  // ES256
          { alg: -257, type: 'public-key' } // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          requireResidentKey: false
        },
        timeout: 60000
      }
    });

    if (credential && credential.rawId) {
      const b64 = bufferToBase64(credential.rawId);
      localStorage.setItem(CRED_ID_KEY, b64);
      setBiometricLockEnabled(true);
      return { success: true };
    }

    return { success: false, reason: 'cancelled' };
  } catch (err) {
    console.debug('Biometric registration error:', err);
    return { success: false, reason: err.message };
  }
};

/**
 * Direct Biometric Prompt (Fingerprint / Face Unlock)
 * Uses high-speed navigator.credentials.get assertion if credential exists,
 * else falls back to navigator.credentials.create.
 */
export const authenticateWithDeviceBiometrics = async () => {
  try {
    const isAvailable = await isBiometricSupported();
    if (!isAvailable) {
      return { success: false, reason: 'unsupported' };
    }

    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const savedCredId = localStorage.getItem(CRED_ID_KEY);

    // 1. Try fast assertion if credential already registered
    if (savedCredId) {
      try {
        const allowId = base64ToUint8Array(savedCredId);
        const assertion = await navigator.credentials.get({
          publicKey: {
            challenge,
            allowCredentials: [{
              id: allowId,
              type: 'public-key',
              transports: ['internal']
            }],
            userVerification: 'required',
            timeout: 60000
          }
        });

        if (assertion) {
          return { success: true };
        }
      } catch (getErr) {
        console.debug('Existing credential verification failed, recreating...', getErr);
        // Fall through to create
      }
    }

    // 2. Initial Registration & Instant Unlock
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: 'HisabKitab 360', id: window.location.hostname },
        user: {
          id: new Uint8Array([19, 84, 36, 0]),
          name: 'cashier@hisabkitab360',
          displayName: 'দোকানদার / ক্যাশিয়ার'
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },
          { alg: -257, type: 'public-key' }
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          requireResidentKey: false
        },
        timeout: 60000
      }
    });

    if (credential && credential.rawId) {
      const b64 = bufferToBase64(credential.rawId);
      localStorage.setItem(CRED_ID_KEY, b64);
      setBiometricLockEnabled(true);
      return { success: true };
    }

    return { success: false, reason: 'cancelled' };
  } catch (err) {
    console.debug('Biometric prompt cancelled or unsupported:', err);
    return { success: false, reason: err.message };
  }
};
