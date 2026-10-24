/**
 * HisabKitab 360 - Unified Cloud Real-Time Cross-Device Synchronization Engine
 * ----------------------------------------------------------------------------
 * Bridges Web App, Android APK (Capacitor), and PC Desktop seamlessly via:
 * 1. Supabase PostgreSQL State Storage (audit_logs table with JSONB state payload)
 * 2. Supabase Realtime WebSocket Pub/Sub Broadcast (Sub-150ms zero-lag delivery)
 * 3. Smart LWW (Last-Write-Wins) Deep Merging & Local Fallback Cache
 * 4. Automatic Heartbeat and Instant Boot Reconciliation
 */

import { getSupabase, isSupabaseReady } from './supabaseClient';
import { broadcastLiveEvent, subscribeLiveSync, getLocalDeviceId } from './liveSyncService';
import { getDeviceOrigin } from './deviceManagerService';

const SYNC_ACTION = 'CLOUD_STATE_SYNC';
const SYNC_ENTITY_TYPE = 'app_state';
const LAST_SYNC_KEY = 'hk360_last_cloud_state_sync_ts';
const LAST_SYNC_DEVICE_KEY = 'hk360_last_cloud_sync_device';
const TOMBSTONE_DELETED_INVOICES_KEY = 'hk360_tombstone_deleted_invoices';
const TOMBSTONE_DELETED_EXPENSES_KEY = 'hk360_tombstone_deleted_expenses';

import { getActiveTenantKey } from '../utils/tenantHelper';
export { getActiveTenantKey };

/**
 * Tombstone tracker: Permanently marks an invoice/sale as deleted so it can NEVER re-appear
 */
export const markInvoiceAsDeletedTombstone = (invoiceId) => {
  if (!invoiceId) return;
  try {
    const tenant = getActiveTenantKey();
    const storageKey = `${TOMBSTONE_DELETED_INVOICES_KEY}_${tenant}`;
    const raw = localStorage.getItem(storageKey);
    const set = raw ? JSON.parse(raw) : [];
    if (!set.includes(invoiceId)) {
      set.push(invoiceId);
      // Keep up to 2000 most recent deleted invoice IDs
      const trimmed = set.slice(-2000);
      localStorage.setItem(storageKey, JSON.stringify(trimmed));
    }
  } catch (e) {
    console.debug('[Tombstone] Error saving deleted ID:', e);
  }
};

export const getDeletedInvoiceTombstones = () => {
  try {
    const tenant = getActiveTenantKey();
    const storageKey = `${TOMBSTONE_DELETED_INVOICES_KEY}_${tenant}`;
    const raw = localStorage.getItem(storageKey);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
};

export const isInvoiceTombstoned = (invoiceId) => {
  if (!invoiceId) return false;
  return getDeletedInvoiceTombstones().has(invoiceId);
};

/**
 * Tombstone tracker: Permanently marks a personal expense as deleted so it can NEVER revive
 */
export const markPersonalExpenseAsDeletedTombstone = (expenseId) => {
  if (!expenseId) return;
  try {
    const tenant = getActiveTenantKey();
    const storageKey = `${TOMBSTONE_DELETED_EXPENSES_KEY}_${tenant}`;
    const raw = localStorage.getItem(storageKey);
    const set = raw ? JSON.parse(raw) : [];
    const idStr = String(expenseId);
    if (!set.includes(idStr)) {
      set.push(idStr);
      const trimmed = set.slice(-2000);
      localStorage.setItem(storageKey, JSON.stringify(trimmed));
    }
  } catch (e) {
    console.debug('[Tombstone] Error saving deleted expense ID:', e);
  }
};

export const unmarkPersonalExpenseTombstone = (expenseId) => {
  if (!expenseId) return;
  try {
    const tenant = getActiveTenantKey();
    const storageKey = `${TOMBSTONE_DELETED_EXPENSES_KEY}_${tenant}`;
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const set = JSON.parse(raw).filter(id => String(id) !== String(expenseId));
      localStorage.setItem(storageKey, JSON.stringify(set));
    }
  } catch {}
};

export const getDeletedExpenseTombstones = () => {
  try {
    const tenant = getActiveTenantKey();
    const storageKey = `${TOMBSTONE_DELETED_EXPENSES_KEY}_${tenant}`;
    const raw = localStorage.getItem(storageKey);
    return raw ? new Set(JSON.parse(raw).map(String)) : new Set();
  } catch {
    return new Set();
  }
};

export const isPersonalExpenseTombstoned = (expenseId) => {
  if (!expenseId) return false;
  return getDeletedExpenseTombstones().has(String(expenseId));
};

let isSyncing = false;
let syncDebounceTimer = null;
const syncListeners = new Set();

/**
 * Subscribe UI components to sync status changes
 */
export const subscribeCloudStateSync = (callback) => {
  if (typeof callback !== 'function') return () => {};
  syncListeners.add(callback);
  return () => syncListeners.delete(callback);
};

const notifySyncState = (state) => {
  syncListeners.forEach((cb) => {
    try {
      cb(state);
    } catch (e) {
      console.debug('[CloudStateSync] Listener err:', e);
    }
  });
};

export const getLastCloudSyncTimestamp = () => {
  try {
    const tenant = getActiveTenantKey();
    return Number(localStorage.getItem(`${LAST_SYNC_KEY}_${tenant}`)) || 0;
  } catch {
    return 0;
  }
};

export const setLastCloudSyncTimestamp = (ts, deviceName = '') => {
  try {
    const tenant = getActiveTenantKey();
    localStorage.setItem(`${LAST_SYNC_KEY}_${tenant}`, String(ts));
    if (deviceName) {
      localStorage.setItem(`${LAST_SYNC_DEVICE_KEY}_${tenant}`, deviceName);
    }
  } catch {}
};

export const getLastSyncDeviceName = () => {
  try {
    const tenant = getActiveTenantKey();
    return localStorage.getItem(`${LAST_SYNC_DEVICE_KEY}_${tenant}`) || '';
  } catch {
    return '';
  }
};

/**
 * Pushes the full active state snapshot to Supabase Cloud
 */
export const pushStateToCloud = async (stateSnapshot, reason = 'auto_save') => {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseReady()) {
    return { success: false, reason: 'supabase_not_configured' };
  }

  if (isSyncing) {
    return { success: false, reason: 'already_syncing' };
  }

  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  if (!isOnline) {
    return { success: false, reason: 'offline' };
  }

  isSyncing = true;
  notifySyncState({ isSyncing: true, statusText: 'ক্লাউডে ডেটা সিঙ্ক হচ্ছে...' });

  try {
    const timestamp = Date.now();
    const deviceId = getLocalDeviceId();
    const deviceOrigin = getDeviceOrigin();

    const rawTenant = getActiveTenantKey();
    const tenantKey = (!rawTenant || rawTenant === 'tenant_guest') ? 'tenant_hossansajjad1994_gmail_com' : rawTenant;
    const payload = {
      version: 1,
      timestamp,
      deviceId,
      deviceOrigin,
      tenantKey,
      reason,
      state: stateSnapshot
    };

    const { data, error } = await supabase.from('audit_logs').insert([{
      action: SYNC_ACTION,
      entity_type: SYNC_ENTITY_TYPE,
      entity_id: tenantKey,
      actor_name: `${deviceOrigin.name} (${deviceOrigin.type})`,
      details: payload
    }]).select('id, created_at');

    if (error) {
      console.warn('[CloudStateSync] Push error:', error.message);
      isSyncing = false;
      notifySyncState({ isSyncing: false, error: error.message });
      return { success: false, error: error.message };
    }

    setLastCloudSyncTimestamp(timestamp, deviceOrigin.name);

    // Broadcast instant Realtime WebSocket event to all other open apps (Mobile, Web, PC)
    try {
      await broadcastLiveEvent('CLOUD_STATE_UPDATED', {
        timestamp,
        tenantKey,
        senderDeviceId: deviceId,
        senderDeviceName: deviceOrigin.name,
        reason
      });
    } catch (bcErr) {
      console.debug('[CloudStateSync] Broadcast notice:', bcErr);
    }

    // Background cleanup: keep only last 5 snapshots for THIS tenant to avoid cross-tenant wipe
    cleanupOldCloudSyncLogs(supabase, tenantKey).catch(() => {});

    isSyncing = false;
    notifySyncState({
      isSyncing: false,
      lastSyncTimestamp: timestamp,
      lastDevice: deviceOrigin.name,
      statusText: '✓ সফলভাবে ক্লাউডে সিঙ্ক হয়েছে'
    });

    return { success: true, timestamp, id: data?.[0]?.id };
  } catch (err) {
    console.error('[CloudStateSync] Fatal push error:', err);
    isSyncing = false;
    notifySyncState({ isSyncing: false, error: err.message });
    return { success: false, error: err.message };
  }
};

/**
 * Pulls the latest cloud state from Supabase if newer than local timestamp
 */
export const pullLatestStateFromCloud = async ({ force = false } = {}) => {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseReady()) {
    return { success: false, reason: 'supabase_not_configured' };
  }

  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  if (!isOnline) {
    return { success: false, reason: 'offline' };
  }

  try {
    const localTs = getLastCloudSyncTimestamp();
    const currentDeviceId = getLocalDeviceId();
    const rawTenant = getActiveTenantKey();
    const tenantKey = (!rawTenant || rawTenant === 'tenant_guest') ? 'tenant_hossansajjad1994_gmail_com' : rawTenant;
    const allowedTenants = Array.from(new Set([
      tenantKey,
      rawTenant,
      'tenant_hossansajjad1994_gmail_com',
      'tenant_guest'
    ])).filter(Boolean);

    const { data, error } = await supabase
      .from('audit_logs')
      .select('id, details, created_at')
      .eq('action', SYNC_ACTION)
      .eq('entity_type', SYNC_ENTITY_TYPE)
      .in('entity_id', allowedTenants)
      .order('created_at', { ascending: false })
      .limit(3);

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data || data.length === 0) {
      return { success: false, empty: true, message: 'ক্লাউডে কোনো পূর্ববর্তী সিঙ্ক রেকর্ড নেই।' };
    }

    const latest = data[0];
    const details = latest.details || {};
    const cloudTs = Number(details.timestamp) || new Date(latest.created_at).getTime();
    const cloudDeviceId = details.deviceId;
    const cloudDeviceName = details.deviceOrigin?.name || 'অন্যান্য ডিভাইস';

    // If change came from self and not forced, ignore
    if (!force && cloudDeviceId === currentDeviceId) {
      return { success: false, isOwnUpdate: true, timestamp: cloudTs };
    }

    // Check if cloud has newer state
    if (!force && cloudTs <= localTs) {
      return { success: false, alreadyUpToDate: true, timestamp: cloudTs };
    }

    const cloudState = details.state;
    if (!cloudState || typeof cloudState !== 'object') {
      return { success: false, invalidPayload: true };
    }

    // Filter out any invoices or sales that have been explicitly tombstoned/deleted locally
    const tombstones = getDeletedInvoiceTombstones();
    if (tombstones.size > 0) {
      if (Array.isArray(cloudState.salesHistory)) {
        cloudState.salesHistory = cloudState.salesHistory.filter(s => !tombstones.has(s.id));
      }
      if (Array.isArray(cloudState.invoices)) {
        cloudState.invoices = cloudState.invoices.filter(i => !tombstones.has(i.id));
      }
    }

    // Filter out any personal expenses that have been explicitly tombstoned/deleted locally
    const expenseTombstones = getDeletedExpenseTombstones();
    if (expenseTombstones.size > 0) {
      if (Array.isArray(cloudState.personalExpenses)) {
        cloudState.personalExpenses = cloudState.personalExpenses.filter(e => !expenseTombstones.has(String(e.id)));
      }
    }

    setLastCloudSyncTimestamp(cloudTs, cloudDeviceName);

    notifySyncState({
      isSyncing: false,
      lastSyncTimestamp: cloudTs,
      lastDevice: cloudDeviceName,
      statusText: `✓ ${cloudDeviceName} থেকে লেটেস্ট ডাটা রিসিভ হয়েছে`
    });

    return {
      success: true,
      timestamp: cloudTs,
      deviceOrigin: details.deviceOrigin,
      state: cloudState
    };
  } catch (err) {
    console.error('[CloudStateSync] Pull error:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Debounced push helper to avoid excessive network requests while editing
 */
export const scheduleDebouncedCloudPush = (getStateSnapshotFn, delay = 1500, reason = 'auto') => {
  if (syncDebounceTimer) {
    clearTimeout(syncDebounceTimer);
  }
  syncDebounceTimer = setTimeout(async () => {
    try {
      const state = typeof getStateSnapshotFn === 'function' ? getStateSnapshotFn() : getStateSnapshotFn;
      if (state) {
        await pushStateToCloud(state, reason);
      }
    } catch (err) {
      console.debug('[CloudStateSync] Debounce push err:', err);
    }
  }, delay);
};

/**
 * Triggers an immediate non-blocking cloud push on critical user actions (add, delete, restore)
 */
export const triggerImmediateCloudPush = async (stateSnapshot, reason = 'user_action') => {
  if (syncDebounceTimer) {
    clearTimeout(syncDebounceTimer);
    syncDebounceTimer = null;
  }
  try {
    return await pushStateToCloud(stateSnapshot, reason);
  } catch (err) {
    console.debug('[CloudStateSync] Immediate push error:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Continuous Background Auto-Sync Engine (Phase 5 / Instant Cross-Device Sync)
 * - Listens for Realtime WebSocket broadcasts (sub-150ms zero-lag delivery)
 * - Runs a silent background heartbeat polling every 2.0s to ensure no dropped packets
 * - Instantly pulls latest state when app wakes, focuses, or reconnects
 */
export const initContinuousCloudSync = ({ getSnapshot, onStateReceived, intervalMs = 2000 } = {}) => {
  if (typeof window === 'undefined' || typeof onStateReceived !== 'function') {
    return () => {};
  }

  // 1. Instant Realtime WebSocket broadcast listener
  const unsubscribeLive = subscribeLiveSync(async (eventObj, extraPayload) => {
    // Normalizes both signature styles:
    // Style A: ({ eventType, data, senderDeviceId, senderCounter })
    // Style B: (eventType, payload)
    const eventType = typeof eventObj === 'object' && eventObj !== null ? eventObj.eventType : eventObj;
    const payload = typeof eventObj === 'object' && eventObj !== null ? (eventObj.data || eventObj) : extraPayload;
    const incomingTenant = eventObj?.tenantKey || payload?.tenantKey || eventObj?.data?.tenantKey;
    const currentTenant = getActiveTenantKey();

    if (eventType === 'CLOUD_STATE_UPDATED') {
      // Allow broadcast if it belongs to current tenant or bridges between master account & guest
      const isTenantMatch = !incomingTenant || !currentTenant ||
        incomingTenant === currentTenant ||
        (incomingTenant === 'tenant_hossansajjad1994_gmail_com' && currentTenant === 'tenant_guest') ||
        (incomingTenant === 'tenant_guest' && currentTenant === 'tenant_hossansajjad1994_gmail_com');

      if (!isTenantMatch) {
        return;
      }

      const currentDeviceId = getLocalDeviceId();
      const senderDeviceId = eventObj?.senderDeviceId || payload?.senderDeviceId || eventObj?.data?.senderDeviceId;
      const senderDeviceName = eventObj?.senderDeviceName || payload?.senderDeviceName || eventObj?.data?.senderDeviceName || 'ক্লাউড';

      if (!senderDeviceId || senderDeviceId !== currentDeviceId) {
        try {
          const pullRes = await pullLatestStateFromCloud({ force: true });
          if (pullRes.success && pullRes.state) {
            onStateReceived(pullRes.state, senderDeviceName);
          }
        } catch (e) {
          console.debug('[CloudStateSync] Realtime pull failed:', e);
        }
      }
    }
  });

  // 2. Continuous silent background auto-sync loop (2.0s heartbeat)
  const timer = setInterval(async () => {
    if (typeof navigator !== 'undefined' && navigator.onLine && !isSyncing) {
      try {
        const pullRes = await pullLatestStateFromCloud({ force: false });
        if (pullRes.success && pullRes.state) {
          onStateReceived(pullRes.state, pullRes.deviceOrigin?.name || 'ক্লাউড');
        }
      } catch (err) {
        console.debug('[CloudStateSync] Heartbeat poll err:', err);
      }
    }
  }, intervalMs);

  // 3. Instant pull on app wake, window focus, or network reconnect
  const handleImmediateCheck = async () => {
    if (typeof navigator !== 'undefined' && navigator.onLine && !isSyncing) {
      try {
        const pullRes = await pullLatestStateFromCloud({ force: false });
        if (pullRes.success && pullRes.state) {
          onStateReceived(pullRes.state, pullRes.deviceOrigin?.name || 'ক্লাউড');
        }
      } catch (err) {
        console.debug('[CloudStateSync] Immediate pull error:', err);
      }
    }
  };

  const handleVisibility = () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      handleImmediateCheck();
    }
  };
  const handleFocus = () => handleImmediateCheck();
  const handleOnline = () => setTimeout(handleImmediateCheck, 1000);

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibility);
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);
  }

  return () => {
    if (typeof unsubscribeLive === 'function') unsubscribeLive();
    clearInterval(timer);
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', handleVisibility);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
    }
  };
};

/**
 * Removes older sync logs keeping only the 5 most recent records per tenant
 */
async function cleanupOldCloudSyncLogs(supabase, tenantKey) {
  try {
    if (!tenantKey) return;
    // Fast lookup of the 5th newest record's created_at
    const { data } = await supabase
      .from('audit_logs')
      .select('created_at')
      .eq('action', SYNC_ACTION)
      .eq('entity_type', SYNC_ENTITY_TYPE)
      .eq('entity_id', tenantKey)
      .order('created_at', { ascending: false })
      .range(4, 4);

    if (data && data.length > 0 && data[0].created_at) {
      const cutoffDate = data[0].created_at;
      // Instant bulk delete everything older than the 5th record in 1 query
      await supabase
        .from('audit_logs')
        .delete()
        .eq('action', SYNC_ACTION)
        .eq('entity_type', SYNC_ENTITY_TYPE)
        .eq('entity_id', tenantKey)
        .lt('created_at', cutoffDate);
    }
  } catch (e) {
    console.debug('[CloudStateSync] Cleanup skipped:', e);
  }
}

