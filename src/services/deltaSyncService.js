/**
 * HisabKitab 360 - Bi-Directional Delta Sync & Conflict Resolution Engine (Phase 4)
 * ---------------------------------------------------------------------------------
 * 1. Delta-based sync (only transfers changed records since last_sync_time).
 * 2. Flushes offline mutation queue reliably to Supabase cloud.
 * 3. Applies Last-Write-Wins (LWW) conflict resolution for concurrent edits.
 * 4. Dual-layer persistence across React State, IndexedDB, and Cloud.
 */

import { fetchDeltaChangesFromCloud } from './supabaseBackendService';
import { flushOfflineQueue, getSyncStatus } from './offlineSyncQueue';
import { reconcileEntitiesLWW } from './conflictResolver';
import { idbBulkSet, idbGet, idbSet } from '../utils/idbStorage';
import { hapticFeedback } from './nativeAppService';

const SYNC_TIMESTAMP_KEY = 'hk360_last_delta_sync_time';
const CONFLICT_LOG_KEY = 'hk360_conflict_resolution_history';

let isDeltaSyncing = false;
const deltaSyncListeners = new Set();
let appContextHooks = null;

/**
 * Register AppContext handlers so delta sync can update in-memory React state
 */
export const registerDeltaSyncContextHooks = (hooks) => {
  appContextHooks = hooks;
};

/**
 * Get timestamp of the last successful cloud delta sync
 */
export const getLastDeltaSyncTime = () => {
  try {
    return localStorage.getItem(SYNC_TIMESTAMP_KEY) || null;
  } catch {
    return null;
  }
};

export const setLastDeltaSyncTime = (isoTime) => {
  try {
    localStorage.setItem(SYNC_TIMESTAMP_KEY, isoTime);
  } catch {}
};

/**
 * Get recent conflict resolution audit log
 */
export const getConflictHistory = () => {
  try {
    const raw = localStorage.getItem(CONFLICT_LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const recordConflictEvent = (entityType, entityName, winner, details) => {
  try {
    const history = getConflictHistory();
    const entry = {
      id: 'conf_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      entityType,
      entityName,
      winner,
      details,
      timestamp: Date.now()
    };
    const updated = [entry, ...history].slice(0, 50); // Keep last 50
    localStorage.setItem(CONFLICT_LOG_KEY, JSON.stringify(updated));
  } catch {}
};

/**
 * Subscribe UI components to delta sync progress & events
 */
export const subscribeDeltaSync = (callback) => {
  if (typeof callback !== 'function') return () => {};
  deltaSyncListeners.add(callback);
  return () => deltaSyncListeners.delete(callback);
};

const notifyDeltaSyncState = (state) => {
  deltaSyncListeners.forEach((cb) => {
    try {
      cb(state);
    } catch {}
  });
};

/**
 * Executes a full Bi-Directional Delta Synchronization cycle
 */
export const executeBiDirectionalSync = async ({ forceFull = false } = {}) => {
  if (isDeltaSyncing) {
    return { skipped: true, message: 'সিঙ্ক ইতিমধ্যে চলমান রয়েছে...' };
  }

  const startTime = Date.now();
  isDeltaSyncing = true;
  notifyDeltaSyncState({ isSyncing: true, progress: 10, step: 'পেন্ডিং অফলাইন ডাটা পুশ হচ্ছে...' });

  let pushedCount = 0;
  let conflictsResolvedCount = 0;
  let pulledProductsCount = 0;
  let pulledCustomersCount = 0;
  let pulledInvoicesCount = 0;

  try {
    // -------------------------------------------------------------
    // STEP 1: UPSTREAM PUSH (Flush offline mutations to Supabase)
    // -------------------------------------------------------------
    notifyDeltaSyncState({ isSyncing: true, progress: 25, step: 'অফলাইন ট্রানজেকশন ক্লাউডে সিঙ্ক হচ্ছে...' });
    const flushRes = await flushOfflineQueue();
    pushedCount = flushRes?.syncedCount || 0;

    // -------------------------------------------------------------
    // STEP 2: DOWNSTREAM PULL (Fetch modified delta rows from Cloud)
    // -------------------------------------------------------------
    notifyDeltaSyncState({ isSyncing: true, progress: 50, step: 'ক্লাউড থেকে সাম্প্রতিক আপডেট আনা হচ্ছে...' });
    const sinceTimestamp = forceFull ? null : getLastDeltaSyncTime();
    const deltaRes = await fetchDeltaChangesFromCloud(sinceTimestamp);

    if (!deltaRes.success) {
      isDeltaSyncing = false;
      notifyDeltaSyncState({ isSyncing: false, error: deltaRes.message || deltaRes.error });
      return {
        success: false,
        pushedCount,
        error: deltaRes.message || deltaRes.error
      };
    }

    const { deltaProducts = [], deltaCustomers = [], deltaInvoices = [], timestamp: newSyncTimestamp } = deltaRes;
    pulledProductsCount = deltaProducts.length;
    pulledCustomersCount = deltaCustomers.length;
    pulledInvoicesCount = deltaInvoices.length;

    // -------------------------------------------------------------
    // STEP 3: LWW CONFLICT RESOLUTION & RECONCILIATION
    // -------------------------------------------------------------
    notifyDeltaSyncState({ isSyncing: true, progress: 75, step: 'কনফ্লিক্ট রেজোলিউশন ও লোকাল মার্জ...' });

    // 3a. Reconcile Products
    if (deltaProducts.length > 0 && appContextHooks?.getProducts && appContextHooks?.setProducts) {
      const currentProducts = appContextHooks.getProducts() || [];
      const reconciled = reconcileEntitiesLWW(currentProducts, deltaProducts, 'id');

      // Check conflict count
      for (const p of reconciled) {
        if (p._conflictResolved) {
          conflictsResolvedCount++;
          recordConflictEvent('product', p.name, p._winner || 'LWW', `Updated stock: ${p.stock}`);
        }
      }

      appContextHooks.setProducts(reconciled);
      await idbBulkSet({ 'products_data': reconciled });
    }

    // 3b. Reconcile Customers
    if (deltaCustomers.length > 0 && appContextHooks?.getCustomers && appContextHooks?.setCustomers) {
      const currentCustomers = appContextHooks.getCustomers() || [];
      const reconciled = reconcileEntitiesLWW(currentCustomers, deltaCustomers, 'id');

      for (const c of reconciled) {
        if (c._conflictResolved) {
          conflictsResolvedCount++;
          recordConflictEvent('customer', c.name, c._winner || 'LWW', `Due balance: ${c.due_balance}`);
        }
      }

      appContextHooks.setCustomers(reconciled);
      await idbBulkSet({ 'customers_data': reconciled });
    }

    // 3c. Append New Invoices
    if (deltaInvoices.length > 0 && appContextHooks?.getSalesHistory && appContextHooks?.setSalesHistory) {
      const currentSales = appContextHooks.getSalesHistory() || [];
      const existingIds = new Set(currentSales.map((s) => s.id || s.invoice_number));

      const newSales = [];
      for (const inv of deltaInvoices) {
        if (!existingIds.has(inv.id) && !existingIds.has(inv.invoice_number) && !existingIds.has(inv.client_uuid)) {
          newSales.push({
            id: inv.client_uuid || inv.id,
            cloud_id: inv.id,
            invoiceNumber: inv.invoice_number,
            customerName: inv.customer_name,
            customerPhone: inv.customer_phone,
            total: Number(inv.grand_total || 0),
            subtotal: Number(inv.subtotal || 0),
            paidAmount: Number(inv.paid_amount || 0),
            paymentMethod: inv.payment_method || 'cash',
            items: inv.invoice_items || [],
            date: inv.created_at,
            synced: true
          });
        }
      }

      if (newSales.length > 0) {
        const mergedSales = [...newSales, ...currentSales];
        appContextHooks.setSalesHistory(mergedSales);
        await idbBulkSet({ 'sales_history': mergedSales });
      }
    }

    // -------------------------------------------------------------
    // STEP 4: UPDATE SYNC TIMESTAMPS
    // -------------------------------------------------------------
    setLastDeltaSyncTime(newSyncTimestamp || new Date().toISOString());

    const durationMs = Date.now() - startTime;
    isDeltaSyncing = false;

    const result = {
      success: true,
      pushedCount,
      pulledProductsCount,
      pulledCustomersCount,
      pulledInvoicesCount,
      conflictsResolvedCount,
      durationMs,
      timestamp: newSyncTimestamp
    };

    notifyDeltaSyncState({ isSyncing: false, progress: 100, result });

    try {
      hapticFeedback.success();
    } catch {}

    return result;
  } catch (err) {
    console.warn('[DeltaSyncEngine] Execution failed:', err);
    isDeltaSyncing = false;
    notifyDeltaSyncState({ isSyncing: false, error: err.message });
    return {
      success: false,
      error: err.message
    };
  }
};

/**
 * Initialize background interval and online listener
 */
export const initAutoDeltaSyncScheduler = () => {
  if (typeof window === 'undefined') return;

  // 1. Auto sync on network reconnect
  window.addEventListener('online', () => {
    setTimeout(() => {
      executeBiDirectionalSync({ forceFull: false });
    }, 2000);
  });

  // 2. Periodic idle background sync every 3 minutes
  const INTERVAL_MS = 3 * 60 * 1000;
  setInterval(() => {
    if (typeof navigator !== 'undefined' && navigator.onLine && !isDeltaSyncing) {
      executeBiDirectionalSync({ forceFull: false });
    }
  }, INTERVAL_MS);
};
