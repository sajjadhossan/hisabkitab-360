/**
 * HisabKitab 360 - Military Grade AES-256-GCM Cryptographic Service
 * ------------------------------------------------------------------
 * Built using native Web Crypto API (SubtleCrypto) with PBKDF2 key derivation.
 * Works 100% offline in modern browsers, Android WebView, and Windows WebView.
 * Provides End-to-End Encryption (E2EE) for cloud/local backups (.hk360enc).
 */

const PBKDF2_ITERATIONS = 100000;
const HASH_ALGO = 'SHA-256';
const CIPHER_ALGO = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits recommended for AES-GCM
const SALT_LENGTH = 16; // 128 bits

// ArrayBuffer <-> Hex / Base64 conversions
const bufferToHex = (buffer) => {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

const hexToBuffer = (hex) => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes.buffer;
};

const bufferToBase64 = (buffer) => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

const base64ToBuffer = (base64) => {
  const binary = window.atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

/**
 * Derives an AES-GCM CryptoKey from a user password and salt using PBKDF2
 */
async function deriveKey(passphrase, saltBuffer) {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(passphrase);

  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: HASH_ALGO
    },
    baseKey,
    { name: CIPHER_ALGO, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts arbitrary JS object or string using AES-256-GCM
 * @param {any} data - Plain data object or JSON string to encrypt
 * @param {string} passphrase - User encryption secret/master password
 * @returns {Promise<object>} Armored encrypted bundle (.hk360enc format)
 */
export async function encryptData(data, passphrase) {
  if (!passphrase || passphrase.length < 4) {
    throw new Error('পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।');
  }

  if (!window.crypto || !window.crypto.subtle) {
    throw new Error('আপনার ব্রাউজার বা ডিভাইসে ওয়েব ক্রিপ্টো ইঞ্জিন সক্রিয় নেই।');
  }

  const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
  const encoder = new TextEncoder();
  const plaintextBuffer = encoder.encode(jsonString);

  // Generate cryptographically secure random Salt & IV
  const salt = window.crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  // Derive AES-256 Key
  const key = await deriveKey(passphrase, salt);

  // Encrypt with AES-GCM (includes authentication tag)
  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    {
      name: CIPHER_ALGO,
      iv: iv
    },
    key,
    plaintextBuffer
  );

  return {
    _app: 'HisabKitab-360',
    _version: '2.8.4',
    _type: 'AES-256-GCM-ENCRYPTED-BACKUP',
    _createdAt: new Date().toISOString(),
    saltHex: bufferToHex(salt),
    ivHex: bufferToHex(iv),
    iterations: PBKDF2_ITERATIONS,
    hashAlgo: HASH_ALGO,
    payload: bufferToBase64(ciphertextBuffer)
  };
}

/**
 * Decrypts armored AES-256-GCM bundle back to JS object
 * @param {object|string} encryptedBundle - Encrypted package (.hk360enc)
 * @param {string} passphrase - User secret password
 * @returns {Promise<any>} Decrypted original data object
 */
export async function decryptData(encryptedBundle, passphrase) {
  if (!passphrase) {
    throw new Error('ডিক্রিপ্ট করতে পাসওয়ার্ড প্রদান করুন।');
  }

  let bundle = encryptedBundle;
  if (typeof encryptedBundle === 'string') {
    try {
      bundle = JSON.parse(encryptedBundle);
    } catch {
      throw new Error('অকার্যকর এনক্রিপ্টেড ব্যাকআপ ফাইল ফরম্যাট।');
    }
  }

  if (!bundle.saltHex || !bundle.ivHex || !bundle.payload) {
    throw new Error('এনক্রিপ্টেড ফাইলের প্রয়োজনীয় ক্রিপ্টো মেটাডেটা অনুপস্থিত।');
  }

  const saltBuffer = hexToBuffer(bundle.saltHex);
  const ivBuffer = hexToBuffer(bundle.ivHex);
  const ciphertextBuffer = base64ToBuffer(bundle.payload);

  try {
    const key = await deriveKey(passphrase, saltBuffer);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: CIPHER_ALGO,
        iv: ivBuffer
      },
      key,
      ciphertextBuffer
    );

    const decoder = new TextDecoder();
    const jsonString = decoder.decode(decryptedBuffer);
    return JSON.parse(jsonString);
  } catch (err) {
    console.error('Decryption failed:', err);
    throw new Error('ভুল পাসওয়ার্ড অথবা ফাইলটি ক্ষতিগ্রস্ত হয়েছে!');
  }
}

/**
 * Triggers browser download of encrypted backup file (.hk360enc)
 */
export const downloadEncryptedBackupFile = (encryptedBundle, filename = null) => {
  const dateStr = new Date().toISOString().split('T')[0];
  const finalFilename = filename || `HisabKitab360_Backup_Encrypted_${dateStr}.hk360enc`;
  const blob = new Blob([JSON.stringify(encryptedBundle, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = finalFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
