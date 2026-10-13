/**
 * Supabase Realtime WebSocket Live Sync Engine for HisabKitab 360 (Phase 3)
 * -------------------------------------------------------------------------
 * Zero-refresh live synchronization across all active devices:
 * - Multi-counter simultaneous billing
 * - Real-time stock deductions (<150ms latency)
 * - Multi-device presence tracking (shows which counters are online)
 * - Postgres CDC (Change Data Capture) table change listeners
 */

import { getSupabase, isSupabaseReady } from './supabaseClient';
import { hapticFeedback } from './nativeAppService';

const LIVE_CHANNEL_NAME = 'hk360_live_realtime_hub';
let activeChannel = null;
const eventListeners = new Set();
const presenceListeners = new Set();
const statusListeners = new Set();

let isConnected = false;
let presenceState = {};
let localDeviceMeta = null;

/**
 * Get or create unique persistent device identifier
 */
export const getLocalDeviceId = () => {
  try {
    let id = localStorage.getItem('hk360_device_id');
    if (!id) {
      id = 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
      localStorage.setItem('hk360_device_id', id);
    }
    return id;
  } catch {
    return 'dev_fallback_' + Math.random().toString(36).substring(2, 7);
  }
};

/**
 * Initialize and subscribe to the Realtime WebSocket Channel
 */
export const initLiveSyncChannel = (terminalMeta = {}) => {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseReady()) {
    console.debug('[LiveSync] Supabase client not ready, live sync deferred.');
    return null;
  }

  if (activeChannel) {
    return activeChannel;
  }

  const deviceId = getLocalDeviceId();
  localDeviceMeta = {
    deviceId,
    branchId: terminalMeta.branchId || 'br-main',
    counterName: terminalMeta.counterName || 'কাউন্টার ০১',
    operatorName: terminalMeta.operatorName || 'অপারেটর',
    platform: typeof window !== 'undefined' && window.Capacitor ? 'android' : (typeof window !== 'undefined' && window.electron ? 'desktop' : 'web'),
    joinedAt: Date.now()
  };

  try {
    activeChannel = supabase.channel(LIVE_CHANNEL_NAME, {
      config: {
        broadcast: { ack: false, self: false },
        presence: { key: deviceId }
      }
    });

    // 1. Operational Broadcast Event Listener (Instant Counter-to-Counter messaging)
    activeChannel.on('broadcast', { event: 'business_event' }, (payload) => {
      const { eventType, data, senderDeviceId, senderCounter } = payload.payload || {};
      
      // Ignore echoes from self
      if (senderDeviceId === deviceId) return;

      try {
        hapticFeedback.light();
      } catch {}

      eventListeners.forEach((cb) => {
        try {
          cb({
            eventType,
            data,
            senderDeviceId,
            senderCounter,
            timestamp: Date.now()
          });
        } catch (e) {
          console.error('[LiveSync] Event callback error:', e);
        }
      });
    });

    // 2. Presence Tracking (See who is online)
    activeChannel
      .on('presence', { event: 'sync' }, () => {
        presenceState = activeChannel.presenceState();
        notifyPresenceChange();
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.debug('[LiveSync] New terminal connected:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.debug('[LiveSync] Terminal disconnected:', leftPresences);
      });

    // 3. PostgreSQL Database CDC Listeners (Real-time DB table rows)
    try {
      activeChannel
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
          console.debug('[LiveSync CDC] Product changed in DB:', payload.eventType);
          eventListeners.forEach((cb) => {
            try {
              cb({
                eventType: 'CDC_PRODUCT_CHANGE',
                changeType: payload.eventType,
                record: payload.new || payload.old,
                timestamp: Date.now()
              });
            } catch {}
          });
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'invoices' }, (payload) => {
          console.debug('[LiveSync CDC] New Invoice recorded in DB:', payload.new?.invoice_number);
          eventListeners.forEach((cb) => {
            try {
              cb({
                eventType: 'CDC_INVOICE_INSERT',
                record: payload.new,
                timestamp: Date.now()
              });
            } catch {}
          });
        });
    } catch (cdcErr) {
      console.debug('[LiveSync] Postgres CDC subscription optional:', cdcErr);
    }

    // Subscribe Channel & Track Presence
    activeChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        isConnected = true;
        console.debug('[LiveSync] ✓ Realtime WebSocket Hub Connected.');
        notifyStatusChange(true);

        try {
          await activeChannel.track(localDeviceMeta);
        } catch (trackErr) {
          console.debug('[LiveSync] Presence track notice:', trackErr);
        }
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        isConnected = false;
        notifyStatusChange(false);
      }
    });

    return activeChannel;
  } catch (err) {
    console.warn('[LiveSync] Realtime channel setup failed:', err);
    isConnected = false;
    notifyStatusChange(false);
    return null;
  }
};

/**
 * Broadcast an instant live event to all other connected terminals
 */
export const broadcastLiveEvent = async (eventType, data = {}) => {
  if (!activeChannel || !isConnected) {
    initLiveSyncChannel();
  }

  if (!activeChannel || !isConnected) {
    return false;
  }

  const deviceId = getLocalDeviceId();

  try {
    await activeChannel.send({
      type: 'broadcast',
      event: 'business_event',
      payload: {
        eventType,
        data,
        senderDeviceId: deviceId,
        senderCounter: localDeviceMeta?.counterName || 'কাউন্টার',
        timestamp: Date.now()
      }
    });
    return true;
  } catch (err) {
    console.debug('[LiveSync] Broadcast send failed:', err);
    return false;
  }
};

/**
 * Subscribe a component or context to live sync events
 */
export const subscribeLiveSync = (callback) => {
  if (typeof callback !== 'function') return () => {};
  eventListeners.add(callback);

  if (!activeChannel) {
    initLiveSyncChannel();
  }

  return () => {
    eventListeners.delete(callback);
  };
};

/**
 * Subscribe to presence changes (Active online terminals list)
 */
export const subscribePresence = (callback) => {
  if (typeof callback !== 'function') return () => {};
  presenceListeners.add(callback);
  callback(getOnlineTerminalsList());

  return () => {
    presenceListeners.delete(callback);
  };
};

/**
 * Subscribe to WebSocket connection status changes
 */
export const subscribeConnectionStatus = (callback) => {
  if (typeof callback !== 'function') return () => {};
  statusListeners.add(callback);
  callback(isConnected);

  return () => {
    statusListeners.delete(callback);
  };
};

const notifyPresenceChange = () => {
  const list = getOnlineTerminalsList();
  presenceListeners.forEach((cb) => {
    try {
      cb(list);
    } catch {}
  });
};

const notifyStatusChange = (status) => {
  statusListeners.forEach((cb) => {
    try {
      cb(status);
    } catch {}
  });
};

/**
 * Get formatted list of all currently active terminals on the Realtime network
 */
export const getOnlineTerminalsList = () => {
  const terminals = [];
  for (const [key, presences] of Object.entries(presenceState || {})) {
    if (Array.isArray(presences) && presences.length > 0) {
      terminals.push({
        id: key,
        ...presences[0],
        isSelf: key === getLocalDeviceId()
      });
    }
  }
  return terminals;
};

export const isLiveSyncConnected = () => isConnected;

export const getLocalDeviceMeta = () => localDeviceMeta;

/**
 * Reconnect to the Realtime WebSocket Hub (manual or on network resume)
 */
export const reconnectLiveSyncChannel = (terminalMeta = {}) => {
  if (activeChannel) {
    try {
      const supabase = getSupabase();
      if (supabase) {
        supabase.removeChannel(activeChannel);
      }
    } catch (e) {
      console.debug('[LiveSync] Error closing channel during reconnect:', e);
    }
    activeChannel = null;
  }
  return initLiveSyncChannel(terminalMeta);
};

export const liveSyncService = {
  broadcastMutation: broadcastLiveEvent,
  broadcastEvent: broadcastLiveEvent,
  subscribe: subscribeLiveSync,
  isConnected: isLiveSyncConnected,
  getTerminals: getActiveTerminals
};

