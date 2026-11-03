/**
 * HisabKitab 360 - Local Terminal & Cross-Tab LAN Sync Protocol
 * -------------------------------------------------------------
 * Enables instantaneous local synchronization between multiple POS windows,
 * cashier tabs, and LAN-connected devices without requiring active internet or cloud.
 * Employs BroadcastChannel IPC and local store WiFi WebSocket Mesh Relay.
 */

import { getActiveTenantKey } from '../utils/tenantHelper';
import {
  broadcastLanCounterEvent,
  subscribeLocalWsEvents,
  initLocalWebSocketSync,
  isLocalWsActive
} from './localWebSocketSyncService';

export { getActiveTenantKey, isLocalWsActive };

const LOCAL_CHANNEL_NAME = 'hk360_lan_terminal_sync';
let channel = null;
const terminalListeners = new Set();
const DEVICE_TERMINAL_ID = 'term_' + Math.random().toString(36).substring(2, 8);

/**
 * Initialize local IPC BroadcastChannel and bridge with Local Store WiFi WebSocket
 */
export const initLocalTerminalSync = () => {
  if (typeof window === 'undefined') return null;

  // 1. Initialize Local Store WiFi WebSocket Relay
  try {
    initLocalWebSocketSync();
  } catch {}

  // 2. Initialize BroadcastChannel for same-device cross-tab communication
  if (typeof BroadcastChannel !== 'undefined' && !channel) {
    try {
      channel = new BroadcastChannel(LOCAL_CHANNEL_NAME);
      channel.onmessage = (event) => {
        handleIncomingPacket(event.data);
      };
    } catch (err) {
      console.debug('[LAN Sync] BroadcastChannel initialization bypassed:', err);
    }
  }

  return channel;
};

// Unified incoming packet router for both BroadcastChannel and WiFi WebSocket
const handleIncomingPacket = (msg) => {
  if (!msg || msg.senderTerminalId === DEVICE_TERMINAL_ID) {
    return; // Ignore self broadcasts
  }

  // Multi-Tenancy Isolation
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

// Bridge incoming WiFi WebSocket events into terminal listeners
if (typeof window !== 'undefined') {
  subscribeLocalWsEvents((wsEnvelope) => {
    if (wsEnvelope && wsEnvelope.payload) {
      handleIncomingPacket({
        type: wsEnvelope.type,
        payload: wsEnvelope.payload,
        tenantKey: wsEnvelope.payload.tenantKey,
        senderTerminalId: wsEnvelope.senderId,
        timestamp: wsEnvelope.timestamp,
        source: 'wifi_ws'
      });
    }
  });
}

/**
 * Broadcast an instant business mutation to all other open tabs & LAN WiFi counters
 */
export const broadcastLocalTerminalEvent = (type, payload = {}) => {
  if (!channel) {
    initLocalTerminalSync();
  }

  const currentTenant = payload?.tenantKey || getActiveTenantKey();
  const enrichedPayload = (payload && typeof payload === 'object')
    ? { ...payload, tenantKey: currentTenant }
    : { payload, tenantKey: currentTenant };

  const packet = {
    type,
    payload: enrichedPayload,
    tenantKey: currentTenant,
    senderTerminalId: DEVICE_TERMINAL_ID,
    timestamp: Date.now()
  };

  // 1. Send via local BroadcastChannel (Same PC/Browser)
  if (channel) {
    try {
      channel.postMessage(packet);
    } catch (err) {
      console.debug('[LAN Sync] PostMessage notice:', err);
    }
  }

  // 2. Send via Local Store WiFi WebSocket (To all other counters & phones on LAN)
  try {
    broadcastLanCounterEvent(type, packet);
  } catch (err) {
    console.debug('[LAN Sync] WiFi WebSocket broadcast notice:', err);
  }

  return true;
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
