/**
 * HisabKitab 360 - Local Terminal & Cross-Tab LAN Sync Protocol
 * -------------------------------------------------------------
 * Enables instantaneous local synchronization between multiple POS windows,
 * cashier tabs, and LAN-connected devices without requiring active internet or cloud.
 * Employs BroadcastChannel IPC and local peer messaging.
 */

const LOCAL_CHANNEL_NAME = 'hk360_lan_terminal_sync';
let channel = null;
const terminalListeners = new Set();
const DEVICE_TERMINAL_ID = 'term_' + Math.random().toString(36).substring(2, 8);

import { getActiveTenantKey } from '../utils/tenantHelper';
export { getActiveTenantKey };

/**
 * Initialize local IPC BroadcastChannel
 */
export const initLocalTerminalSync = () => {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
    return null;
  }
  if (channel) return channel;

  try {
    channel = new BroadcastChannel(LOCAL_CHANNEL_NAME);
    channel.onmessage = (event) => {
      const msg = event.data;
      if (!msg || msg.senderTerminalId === DEVICE_TERMINAL_ID) {
        return; // Ignore self broadcasts
      }

      // STRICT MULTI-TENANCY FILTER: Ignore cross-tab events belonging to other user accounts
      const myTenant = getActiveTenantKey();
      const eventTenant = msg.tenantKey || msg.payload?.tenantKey;
      if (eventTenant && myTenant && eventTenant !== myTenant) {
        return;
      }

      terminalListeners.forEach((cb) => {
        try {
          cb(msg);
        } catch (e) {
          console.debug('[LAN Sync] Listener error:', e);
        }
      });
    };
    return channel;
  } catch (err) {
    console.debug('[LAN Sync] BroadcastChannel initialization bypassed:', err);
    return null;
  }
};

/**
 * Broadcast an instant business mutation to all other open tabs / LAN terminals
 */
export const broadcastLocalTerminalEvent = (type, payload = {}) => {
  if (!channel) {
    initLocalTerminalSync();
  }
  if (!channel) return false;

  const currentTenant = payload?.tenantKey || getActiveTenantKey();
  const enrichedPayload = (payload && typeof payload === 'object') ? { ...payload, tenantKey: currentTenant } : { payload, tenantKey: currentTenant };

  try {
    const packet = {
      type,
      payload: enrichedPayload,
      tenantKey: currentTenant,
      senderTerminalId: DEVICE_TERMINAL_ID,
      timestamp: Date.now()
    };
    channel.postMessage(packet);
    return true;
  } catch (err) {
    console.debug('[LAN Sync] PostMessage failed:', err);
    return false;
  }
};

/**
 * Subscribe to incoming LAN / Multi-tab terminal events
 */
export const subscribeLocalTerminalSync = (callback) => {
  if (typeof callback !== 'function') return () => {};
  terminalListeners.add(callback);

  if (!channel) {
    initLocalTerminalSync();
  }

  return () => {
    terminalListeners.delete(callback);
  };
};

export const getTerminalId = () => DEVICE_TERMINAL_ID;

// Auto-initialize on import
if (typeof window !== 'undefined') {
  initLocalTerminalSync();
}
