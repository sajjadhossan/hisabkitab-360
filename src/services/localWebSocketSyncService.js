/**
 * HisabKitab 360 - Zero-Cost Open Source Multi-Counter LAN WebSocket Engine
 * ------------------------------------------------------------------------
 * Enables instantaneous (<10ms) zero-internet synchronization between
 * multiple POS counters, cashiers, and mobile devices over local store WiFi.
 * Works seamlessly alongside Supabase Realtime (Dual-Track Hybrid).
 */

const LOCAL_WS_LISTENERS = new Set();
const CONNECTION_STATE_LISTENERS = new Set();

let socket = null;
let isConnected = false;
let reconnectTimer = null;
let reconnectAttempts = 0;
const outgoingQueue = [];
let localDeviceId = null;

export const getLocalDeviceId = () => {
  if (typeof window === 'undefined') return 'server';
  if (!localDeviceId) {
    try {
      localDeviceId = localStorage.getItem('hk360_terminal_id');
      if (!localDeviceId) {
        localDeviceId = 'counter_' + Math.random().toString(36).substring(2, 8);
        localStorage.setItem('hk360_terminal_id', localDeviceId);
      }
    } catch {
      localDeviceId = 'counter_' + Math.random().toString(36).substring(2, 8);
    }
  }
  return localDeviceId;
};

/**
 * Connect to Local Store WebSocket Relay (Host PC / Preview Server)
 */
export const initLocalWebSocketSync = () => {
  if (typeof window === 'undefined' || typeof WebSocket === 'undefined') return null;
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return socket;
  }

  try {
    const isHttps = window.location.protocol === 'https:';
    const wsProtocol = isHttps ? 'wss:' : 'ws:';
    const host = window.location.hostname || 'localhost';
    const port = window.location.port || (isHttps ? '5183' : '5173');
    const wsUrl = `${wsProtocol}//${host}:${port}/hk360-mesh-sync`;

    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      isConnected = true;
      reconnectAttempts = 0;
      notifyConnectionState(true);

      // Announce this counter's presence on local LAN
      const announcePayload = {
        type: 'COUNTER_LAN_PRESENCE',
        senderId: getLocalDeviceId(),
        timestamp: Date.now(),
        origin: window.location.origin
      };
      socket.send(JSON.stringify(announcePayload));

      // Flush any queued mutations
      while (outgoingQueue.length > 0 && socket.readyState === WebSocket.OPEN) {
        const item = outgoingQueue.shift();
        socket.send(JSON.stringify(item));
      }
    };

    socket.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        // Ignore self broadcasts
        if (parsed.senderId === getLocalDeviceId()) return;

        LOCAL_WS_LISTENERS.forEach((listener) => {
          try {
            listener(parsed);
          } catch (e) {
            console.debug('[LocalWS] Listener error:', e);
          }
        });
      } catch (err) {
        console.debug('[LocalWS] Parse error:', err);
      }
    };

    socket.onclose = () => {
      isConnected = false;
      notifyConnectionState(false);
      scheduleReconnect();
    };

    socket.onerror = () => {
      isConnected = false;
      notifyConnectionState(false);
      if (socket) socket.close();
    };

    return socket;
  } catch (err) {
    console.debug('[LocalWS] Init error:', err);
    scheduleReconnect();
    return null;
  }
};

const scheduleReconnect = () => {
  if (reconnectTimer) return;
  const delay = Math.min(10000, 1500 * Math.pow(1.5, reconnectAttempts));
  reconnectAttempts++;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    initLocalWebSocketSync();
  }, delay);
};

const notifyConnectionState = (state) => {
  CONNECTION_STATE_LISTENERS.forEach((cb) => {
    try {
      cb(state);
    } catch {}
  });
};

/**
 * Broadcast an instant mutation (Sale, Stock deduction, Cash collection) to LAN counters
 */
export const broadcastLanCounterEvent = (type, payload = {}) => {
  const envelope = {
    type,
    payload,
    senderId: getLocalDeviceId(),
    timestamp: Date.now()
  };

  if (socket && socket.readyState === WebSocket.OPEN) {
    try {
      socket.send(JSON.stringify(envelope));
      return true;
    } catch {
      outgoingQueue.push(envelope);
      return false;
    }
  } else {
    // Queue for instant delivery upon reconnection
    if (outgoingQueue.length > 50) outgoingQueue.shift(); // Bound memory
    outgoingQueue.push(envelope);
    return false;
  }
};

/**
 * Subscribe to LAN counter real-time events
 */
export const subscribeLocalWsEvents = (callback) => {
  LOCAL_WS_LISTENERS.add(callback);
  return () => LOCAL_WS_LISTENERS.delete(callback);
};

/**
 * Subscribe to connection status changes
 */
export const subscribeLocalWsStatus = (callback) => {
  CONNECTION_STATE_LISTENERS.add(callback);
  callback(isConnected);
  return () => CONNECTION_STATE_LISTENERS.delete(callback);
};

export const isLocalWsActive = () => isConnected;

// Auto-initialize when window loads
if (typeof window !== 'undefined') {
  setTimeout(() => {
    initLocalWebSocketSync();
  }, 1000);
}
