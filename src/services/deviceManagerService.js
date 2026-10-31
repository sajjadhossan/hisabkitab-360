/**
 * HisabKitab 360 - Unified Cross-Platform Device Manager Service
 * -------------------------------------------------------------
 * Manages identity, presence, synchronization, and transaction tagging
 * across all 3 platforms:
 * 1. Mobile Android App (Mobile APK / Capacitor)
 * 2. PC Local Desktop (PC Host / Localhost)
 * 3. Vercel Live Cloud Web App (Web Production)
 */

import { Capacitor } from '@capacitor/core';
import { getLocalDeviceId, broadcastLiveEvent, subscribeLiveSync } from './liveSyncService';

export const DEVICE_TYPES = {
  MOBILE: 'mobile',
  PC: 'pc',
  WEB: 'web'
};

const STORAGE_KEYS = {
  CUSTOM_NAME: 'hk360_device_custom_name_',
  CURRENT_TYPE: 'hk360_device_current_type',
  DEVICE_REGISTRY: 'hk360_cross_platform_device_registry',
  CONNECTED_DRIVE_ACCOUNT: 'hk360_connected_drive_account',
  CONNECTED_USER_ACCOUNT: 'hk360_connected_user_account'
};

/**
 * Detect current platform accurately
 */
export const detectDeviceType = () => {
  // 1. Capacitor Native Android Mobile
  if (typeof window !== 'undefined') {
    if (Capacitor.isNativePlatform()) {
      return DEVICE_TYPES.MOBILE;
    }

    const ua = (navigator.userAgent || '').toLowerCase();
    const hostname = window.location.hostname || '';
    const port = window.location.port || '';

    // If running in Android webview / mobile wrapper
    if (ua.includes('wv') || (ua.includes('android') && !hostname.includes('vercel.app') && !hostname.includes('netlify.app') && !hostname.includes('localhost'))) {
      return DEVICE_TYPES.MOBILE;
    }

    // 2. PC Local Desktop Host (e.g. localhost, 127.0.0.1, local LAN IP from start_host_preview.bat)
    if (hostname === 'localhost' || hostname === '127.0.0.1' || port === '5173' || hostname.startsWith('192.168.')) {
      // If mobile user agent accessed local LAN IP, still categorize as mobile if on phone
      if (/android|iphone|ipad|ipod|mobile/i.test(ua) && !port) {
        return DEVICE_TYPES.MOBILE;
      }
      return DEVICE_TYPES.PC;
    }

    // 3. Cloud Live Web App (Netlify & Vercel)
    if (hostname.includes('vercel.app') || hostname.includes('netlify.app') || window.location.protocol === 'https:') {
      if (/android|iphone|ipad|ipod|mobile/i.test(ua)) {
        return DEVICE_TYPES.MOBILE;
      }
      return DEVICE_TYPES.WEB;
    }
  }

  return DEVICE_TYPES.PC;
};

/**
 * Default human-friendly names
 */
export const DEFAULT_DEVICE_NAMES = {
  [DEVICE_TYPES.PC]: 'পিসি ডেস্কটপ (ক্যাশ কাউন্টার)',
  [DEVICE_TYPES.MOBILE]: 'মোবাইল অ্যাপ (অ্যান্ড্রয়েড)',
  [DEVICE_TYPES.WEB]: 'ভার্সেল ওয়েব অ্যাপ (অনলাইন শাখা)'
};

/**
 * Device metadata & icons
 */
export const DEVICE_METADATA = {
  [DEVICE_TYPES.PC]: {
    id: DEVICE_TYPES.PC,
    label: 'পিসি ডেস্কটপ / কাউন্টার',
    icon: '💻',
    color: '#3b82f6',
    badgeClass: 'badge-pc'
  },
  [DEVICE_TYPES.MOBILE]: {
    id: DEVICE_TYPES.MOBILE,
    label: 'মোবাইল অ্যাপ',
    icon: '📱',
    color: '#10b981',
    badgeClass: 'badge-mobile'
  },
  [DEVICE_TYPES.WEB]: {
    id: DEVICE_TYPES.WEB,
    label: 'ভার্সেল লাইভ ওয়েব',
    icon: '🌐',
    color: '#8b5cf6',
    badgeClass: 'badge-web'
  }
};

/**
 * Get customized or default device name for a specific type
 */
export const getDeviceName = (type = detectDeviceType()) => {
  try {
    const saved = localStorage.getItem(`${STORAGE_KEYS.CUSTOM_NAME}${type}`);
    if (saved && saved.trim()) return saved.trim();
  } catch {}
  return DEFAULT_DEVICE_NAMES[type] || DEFAULT_DEVICE_NAMES[DEVICE_TYPES.PC];
};

/**
 * Set custom name for a device type (e.g. "কাউন্টার-১ (PC)", "মালিকের মোবাইল")
 */
export const setDeviceName = (type, customName) => {
  if (!type || !customName) return;
  try {
    localStorage.setItem(`${STORAGE_KEYS.CUSTOM_NAME}${type}`, customName.trim());
    
    // Broadcast device name update across platforms
    broadcastDeviceHeartbeat();
  } catch {}
};

/**
 * Get current device origin metadata for transaction and invoice tagging
 */
export const getDeviceOrigin = () => {
  const type = detectDeviceType();
  const name = getDeviceName(type);
  const meta = DEVICE_METADATA[type];
  const deviceId = getLocalDeviceId();

  return {
    deviceId,
    type,
    name,
    icon: meta.icon,
    label: meta.label,
    color: meta.color,
    badgeText: `${meta.icon} ${name}`,
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'localhost',
    timestamp: new Date().toISOString()
  };
};

/**
 * Cross-Platform Device Registry (stores status of PC, Mobile, Web)
 */
export const getDeviceRegistry = () => {
  const currentType = detectDeviceType();
  const defaultRegistry = {
    [DEVICE_TYPES.PC]: {
      type: DEVICE_TYPES.PC,
      name: getDeviceName(DEVICE_TYPES.PC),
      icon: '💻',
      color: '#3b82f6',
      isCurrent: currentType === DEVICE_TYPES.PC,
      isOnline: currentType === DEVICE_TYPES.PC,
      lastActive: currentType === DEVICE_TYPES.PC ? new Date().toISOString() : null,
      userEmail: '',
      driveAccount: ''
    },
    [DEVICE_TYPES.MOBILE]: {
      type: DEVICE_TYPES.MOBILE,
      name: getDeviceName(DEVICE_TYPES.MOBILE),
      icon: '📱',
      color: '#10b981',
      isCurrent: currentType === DEVICE_TYPES.MOBILE,
      isOnline: currentType === DEVICE_TYPES.MOBILE,
      lastActive: currentType === DEVICE_TYPES.MOBILE ? new Date().toISOString() : null,
      userEmail: '',
      driveAccount: ''
    },
    [DEVICE_TYPES.WEB]: {
      type: DEVICE_TYPES.WEB,
      name: getDeviceName(DEVICE_TYPES.WEB),
      icon: '🌐',
      color: '#8b5cf6',
      isCurrent: currentType === DEVICE_TYPES.WEB,
      isOnline: currentType === DEVICE_TYPES.WEB,
      lastActive: currentType === DEVICE_TYPES.WEB ? new Date().toISOString() : null,
      userEmail: '',
      driveAccount: ''
    }
  };

  try {
    const saved = localStorage.getItem(STORAGE_KEYS.DEVICE_REGISTRY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge with current device states
      Object.keys(defaultRegistry).forEach(k => {
        if (parsed[k]) {
          defaultRegistry[k] = {
            ...defaultRegistry[k],
            ...parsed[k],
            name: getDeviceName(k), // always respect custom name
            isCurrent: currentType === k
          };
          if (currentType === k) {
            defaultRegistry[k].isOnline = true;
            defaultRegistry[k].lastActive = new Date().toISOString();
          } else if (defaultRegistry[k].lastActive) {
            // Check if active in the last 15 minutes
            const diff = Date.now() - new Date(defaultRegistry[k].lastActive).getTime();
            defaultRegistry[k].isOnline = diff < 15 * 60 * 1000;
          }
        }
      });
    }
  } catch {}

  return defaultRegistry;
};

/**
 * Save and broadcast heartbeat of current device
 */
export const broadcastDeviceHeartbeat = (userInfo = {}) => {
  const currentType = detectDeviceType();
  const currentName = getDeviceName(currentType);
  const deviceId = getLocalDeviceId();

  const userEmail = userInfo.email || localStorage.getItem(STORAGE_KEYS.CONNECTED_USER_ACCOUNT) || '';
  const driveAccount = userInfo.driveAccount || localStorage.getItem(STORAGE_KEYS.CONNECTED_DRIVE_ACCOUNT) || '';

  if (userInfo.email) {
    try { localStorage.setItem(STORAGE_KEYS.CONNECTED_USER_ACCOUNT, userInfo.email); } catch {}
  }
  if (userInfo.driveAccount) {
    try { localStorage.setItem(STORAGE_KEYS.CONNECTED_DRIVE_ACCOUNT, userInfo.driveAccount); } catch {}
  }

  const registry = getDeviceRegistry();
  registry[currentType] = {
    ...registry[currentType],
    deviceId,
    name: currentName,
    isCurrent: true,
    isOnline: true,
    lastActive: new Date().toISOString(),
    userEmail: userEmail || registry[currentType].userEmail,
    driveAccount: driveAccount || registry[currentType].driveAccount
  };

  // If user is logged in, ensure all 3 devices show the master account
  if (userEmail) {
    [DEVICE_TYPES.PC, DEVICE_TYPES.MOBILE, DEVICE_TYPES.WEB].forEach(k => {
      registry[k].userEmail = userEmail;
    });
  }
  if (driveAccount) {
    [DEVICE_TYPES.PC, DEVICE_TYPES.MOBILE, DEVICE_TYPES.WEB].forEach(k => {
      registry[k].driveAccount = driveAccount;
    });
  }

  try {
    localStorage.setItem(STORAGE_KEYS.DEVICE_REGISTRY, JSON.stringify(registry));
  } catch {}

  // Broadcast to all other devices/windows via Realtime WebSocket & BroadcastChannel
  try {
    broadcastLiveEvent('DEVICE_HEARTBEAT', {
      deviceType: currentType,
      deviceId,
      name: currentName,
      userEmail,
      driveAccount,
      timestamp: Date.now()
    });
  } catch {}

  return registry;
};

/**
 * Listen for cross-device heartbeat & updates
 */
export const subscribeToDeviceSync = (callback) => {
  // Listen via BroadcastChannel if available
  let bc = null;
  try {
    if (typeof window !== 'undefined' && window.BroadcastChannel) {
      bc = new BroadcastChannel('hk360_device_sync_channel');
      bc.onmessage = (event) => {
        if (event.data?.type === 'HEARTBEAT') {
          callback(getDeviceRegistry());
        }
      };
    }
  } catch {}

  // Listen via Supabase WebSocket live sync
  const unsubscribe = subscribeLiveSync((event) => {
    if (event.eventType === 'DEVICE_HEARTBEAT') {
      const { deviceType, name, userEmail, driveAccount, timestamp } = event.data || {};
      if (deviceType) {
        const reg = getDeviceRegistry();
        reg[deviceType] = {
          ...reg[deviceType],
          name: name || reg[deviceType].name,
          userEmail: userEmail || reg[deviceType].userEmail,
          driveAccount: driveAccount || reg[deviceType].driveAccount,
          isOnline: true,
          lastActive: new Date(timestamp || Date.now()).toISOString()
        };
        try {
          localStorage.setItem(STORAGE_KEYS.DEVICE_REGISTRY, JSON.stringify(reg));
        } catch {}
        callback(reg);
      }
    }
  });

  return () => {
    if (bc) bc.close();
    if (typeof unsubscribe === 'function') unsubscribe();
  };
};
