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
import { getActiveTenantKey } from '../utils/tenantHelper';

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
    // STEP 1: DOWNSTREAM PULL FIRST (Fetch-Before-Push Pre-Check)
    // -------------------------------------------------------------
    notifyDeltaSyncState({ isSyncing: true, progress: 20, step: 'ক্লাউড থেকে সর্বশেষ আপডেট যাচাই ও আনা হচ্ছে...' });
    const sinceTimestamp = forceFull ? null : getLastDeltaSyncTime();
    const currentTenant = getActiveTenantKey();
    const isMasterTenant = currentTenant === 'tenant_hossansajjad1994_gmail_com';
    const deltaRes = await fetchDeltaChangesFromCloud(sinceTimestamp, currentTenant);

    if (deltaRes && deltaRes.success) {
      const { deltaProducts = [], deltaCustomers = [], deltaInvoices = [], timestamp: newSyncTimestamp } = deltaRes;
      pulledProductsCount = deltaProducts.length;
      pulledCustomersCount = deltaCustomers.length;
      pulledInvoicesCount = deltaInvoices.length;

      // -------------------------------------------------------------
      // STEP 2: CONFLICT RESOLUTION & RECONCILIATION
      // -------------------------------------------------------------
      notifyDeltaSyncState({ isSyncing: true, progress: 45, step: 'কনফ্লিক্ট রেজোলিউশন ও লোকাল মার্জ...' });

      // 2a. Reconcile Products
      if (deltaProducts.length > 0 && appContextHooks?.getProducts && appContextHooks?.setProducts) {
        const currentProducts = appContextHooks.getProducts() || [];
        const reconciled = reconcileEntitiesLWW(currentProducts, deltaProducts, 'id');

        for (const p of reconciled) {
          if (p._conflictResolved) {
            conflictsResolvedCount++;
            recordConflictEvent('product', p.name, p._winner || 'LWW', `Updated stock: ${p.stock}`);
          }
        }

        appContextHooks.setProducts(reconciled);
        if (isMasterTenant) {
          await idbBulkSet({ 'products_data': reconciled });
        }
        await idbBulkSet({ [`products_data_${currentTenant}`]: reconciled });
      }

      // 2b. Reconcile Customers
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
        if (isMasterTenant) {
          await idbBulkSet({ 'customers_data': reconciled });
        }
        await idbBulkSet({ [`customers_data_${currentTenant}`]: reconciled });
      }

      // 2c. Append New Invoices
      if (deltaInvoices.length > 0 && appContextHooks?.getSalesHistory && appContextHooks?.setSalesHistory) {
        const currentSales = appContextHooks.getSalesHistory() || [];
        const existingIds = new Set(currentSales.map((s) => s.id || s.invoice_number));

        const newSales = [];
        for (const inv of deltaInvoices) {
          // Strict multi-tenant verification
          let invTenant = null;
          try {
            if (inv.notes && inv.notes.startsWith('{')) {
              const meta = JSON.parse(inv.notes);
              invTenant = meta?.tenantKey;
            }
          } catch {}

          if (invTenant && invTenant !== currentTenant) {
            continue;
          }
          if (!invTenant && !isMasterTenant) {
            continue;
          }

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
          if (isMasterTenant) {
            await idbBulkSet({ 'sales_history': mergedSales });
          }
          await idbBulkSet({ [`sales_history_${currentTenant}`]: mergedSales });
        }
      }
    }

    // -------------------------------------------------------------
    // STEP 3: UPSTREAM PUSH (Flush verified offline mutations to Supabase)
    // -------------------------------------------------------------
    notifyDeltaSyncState({ isSyncing: true, progress: 70, step: 'অফলাইন ট্রানজেকশন ক্লাউডে সুরক্ষিতভাবে পুশ হচ্ছে...' });
    const flushRes = await flushOfflineQueue();
    pushedCount = flushRes?.syncedCount || 0;


    // -------------------------------------------------------------
    // STEP 3.5: UNIFIED CLOUD STATE SYNC (Expenses, Incomes, Debts, Trash)
    // -------------------------------------------------------------
    if (typeof appContextHooks?.syncNowWithCloud === 'function') {
      try {
        await appContextHooks.syncNowWithCloud();
      } catch (cloudSyncErr) {
        console.debug('[DeltaSyncEngine] Unified cloud state sync skipped:', cloudSyncErr);
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

    notifyDeltaSyncState({
      type: 'SYNC_COMPLETE',
      isSyncing: false,
      progress: 100,
      result,
      timestamp: newSyncTimestamp || new Date().toISOString()
    });

    try {
      hapticFeedback.success();
    } catch {}

    return result;
  } catch (err) {
    console.warn('[DeltaSyncEngine] Execution failed:', err);
    isDeltaSyncing = false;
    notifyDeltaSyncState({ type: 'SYNC_ERROR', isSyncing: false, error: err.message });
    return {
      success: false,
      error: err.message
    };
  }
};

let isSchedulerInitialized = false;

/**
 * Initialize background interval and multi-lifecycle listeners for Android APK, Web, and Desktop
 */
export const initAutoDeltaSyncScheduler = () => {
  if (typeof window === 'undefined' || isSchedulerInitialized) return;
  isSchedulerInitialized = true;

  // 1. Auto sync on network reconnect
  window.addEventListener('online', () => {
    setTimeout(() => {
      executeBiDirectionalSync({ forceFull: false });
    }, 1200);
  });

  // 2. Android APK / Mobile foreground resume listener (fixes stationary badge)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      setTimeout(() => {
        executeBiDirectionalSync({ forceFull: false });
      }, 500);
    }
  });

  window.addEventListener('focus', () => {
    setTimeout(() => {
      executeBiDirectionalSync({ forceFull: false });
    }, 500);
  });

  // Capacitor native appStateChange listener for Android APK
  if (typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.()) {
    try {
      import('@capacitor/app').then(({ App }) => {
        App.addListener('appStateChange', (state) => {
          if (state?.isActive) {
            executeBiDirectionalSync({ forceFull: false });
          }
        });
      }).catch(() => {});
    } catch {}
  }

  // 3. Periodic continuous background delta sync every 15 seconds when online
  const INTERVAL_MS = 15 * 1000;
  setInterval(() => {
    if (typeof navigator !== 'undefined' && navigator.onLine && !isDeltaSyncing) {
      executeBiDirectionalSync({ forceFull: false });
    }
  }, INTERVAL_MS);
};
