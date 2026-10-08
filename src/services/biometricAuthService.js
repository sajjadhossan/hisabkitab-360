/**
 * Biometric & Quick PIN Authentication Bridge
 * --------------------------------------------
 * Supports device fingerprint/face unlock via WebAuthn or master PIN protection
 * for cash drawer and financial ledger.
 */

export const isBiometricSupported = async () => {
  if (typeof window === 'undefined') return false;
  if (window.PublicKeyCredential && PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
    try {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch {
      return false;
    }
  }
  return false;
};

export const hasBiometricLockEnabled = () => {
  return localStorage.getItem('hk360_biometric_lock_enabled') === 'true';
};

export const setBiometricLockEnabled = (enabled) => {
  localStorage.setItem('hk360_biometric_lock_enabled', String(enabled));
};

export const authenticateWithDeviceBiometrics = async () => {
  try {
    const isAvailable = await isBiometricSupported();
    if (!isAvailable) {
      return { success: false, reason: 'unsupported' };
    }

    // WebAuthn dummy challenge to trigger native Android biometric prompt
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: 'HisabKitab 360' },
        user: {
          id: new Uint8Array([1, 2, 3, 4]),
          name: 'shopkeeper@hisabkitab360',
          displayName: 'দোকানদার / ক্যাশিয়ার'
        },
        pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required'
        },
        timeout: 60000
      }
    });

    return { success: Boolean(credential) };
  } catch (err) {
    console.debug('Biometric prompt cancelled or unsupported:', err);
    return { success: false, reason: err.message };
  }
};
