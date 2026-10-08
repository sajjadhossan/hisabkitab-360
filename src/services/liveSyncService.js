/**
 * Supabase Realtime WebSocket Live Sync Engine for HisabKitab 360
 * ----------------------------------------------------------------
 * Broadcasts and listens for live business & personal updates across all
 * active devices (Android phones, POS counters, Windows PC terminals).
 * Zero-refresh live synchronization over WebSockets.
 */

import { getSupabase, isSupabaseReady } from './supabaseClient';
import { hapticFeedback } from './nativeAppService';

const LIVE_CHANNEL_NAME = 'hk360_live_realtime_hub';
let activeChannel = null;
const listeners = new Set();
let isConnected = false;

export const initLiveSyncChannel = (onEventReceived = null) => {
  if (onEventReceived) {
    listeners.add(onEventReceived);
  }

  if (activeChannel) {
    return activeChannel;
  }

  const supabase = getSupabase();
  if (!supabase || !isSupabaseReady()) {
    console.debug('[LiveSync] Supabase client not ready, live sync deferred.');
    return null;
  }

  try {
    activeChannel = supabase.channel(LIVE_CHANNEL_NAME, {
      config: {
        broadcast: { ack: false, self: false },
        presence: { key: 'device_' + Math.random().toString(36).substring(2, 8) }
      }
    });

    activeChannel
      .on('broadcast', { event: 'business_event' }, (payload) => {
        const { eventType, data, senderDeviceId } = payload.payload || {};
        hapticFeedback.light();
        listeners.forEach((cb) => {
          try {
            cb({ eventType, data, senderDeviceId, timestamp: Date.now() });
          } catch (e) {
            console.error('[LiveSync] Callback error:', e);
          }
        });
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          isConnected = true;
          console.debug('[LiveSync] Realtime WebSocket connected.');
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          isConnected = false;
        }
      });

    return activeChannel;
  } catch (err) {
    console.warn('[LiveSync] Failed to initialize realtime channel:', err);
    return null;
  }
};

/**
 * Broadcast an instant live event to all other connected devices
 */
export const broadcastLiveEvent = async (eventType, data = {}) => {
  if (!activeChannel) {
    initLiveSyncChannel();
  }

  if (!activeChannel || !isConnected) {
    return false;
  }

  try {
    await activeChannel.send({
      type: 'broadcast',
      event: 'business_event',
      payload: {
        eventType,
        data,
        timestamp: Date.now()
      }
    });
    return true;
  } catch (err) {
    console.debug('[LiveSync] Broadcast error:', err);
    return false;
  }
};

/**
 * Subscribe a component or context to live events
 */
export const subscribeLiveSync = (callback) => {
  if (typeof callback !== 'function') return () => {};
  listeners.add(callback);

  if (!activeChannel) {
    initLiveSyncChannel();
  }

  return () => {
    listeners.delete(callback);
  };
};

export const isLiveSyncConnected = () => isConnected;
