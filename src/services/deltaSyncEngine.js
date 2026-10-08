/**
 * HisabKitab 360 - High-Efficiency Delta Syncing Engine
 * ------------------------------------------------------
 * Minimizes bandwidth and processing overhead by transmitting and processing
 * only changed records (deltas) since the last sync watermark rather than
 * repeatedly uploading or downloading multi-megabyte database dumps.
 */

import { getEntityTimestamp, reconcileEntitiesLWW } from './conflictResolver';

const DELTA_WATERMARK_KEY = 'hk360_delta_sync_watermark';

/**
 * Get timestamp of the last successful synchronization
 */
export const getLastSyncWatermark = () => {
  if (typeof window === 'undefined') return 0;
  try {
    const val = localStorage.getItem(DELTA_WATERMARK_KEY);
    return val ? Number(val) : 0;
  } catch {
    return 0;
  }
};

/**
 * Update the sync watermark timestamp
 */
export const updateSyncWatermark = (timestamp = Date.now()) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DELTA_WATERMARK_KEY, String(timestamp));
  } catch (err) {
    console.debug('[DeltaSync] Failed to store watermark:', err);
  }
};

/**
 * Filter an array to only include records modified after the specified watermark
 * @param {Array} list - Full array of entities
 * @param {number} watermark - Cutoff epoch timestamp
 */
export const extractDeltasSince = (list = [], watermark = 0) => {
  if (!Array.isArray(list)) return [];
  if (watermark <= 0) return list; // If never synced, return all

  return list.filter((item) => {
    const ts = getEntityTimestamp(item);
    return ts > watermark;
  });
};

/**
 * Extract changed deltas across all app entity collections
 */
export const computeAppDeltas = (appData, watermark = getLastSyncWatermark()) => {
  const result = {
    watermark,
    extractedAt: Date.now(),
    deltas: {
      products: extractDeltasSince(appData?.business?.products, watermark),
      salesHistory: extractDeltasSince(appData?.business?.salesHistory, watermark),
      customers: extractDeltasSince(appData?.business?.customers, watermark),
      invoices: extractDeltasSince(appData?.business?.invoices, watermark),
      businessDebts: extractDeltasSince(appData?.business?.businessDebts, watermark),
      personalExpenses: extractDeltasSince(appData?.personal?.personalExpenses, watermark),
      personalIncomes: extractDeltasSince(appData?.personal?.personalIncomes, watermark)
    }
  };

  const totalDeltas = Object.values(result.deltas).reduce((sum, arr) => sum + arr.length, 0);
  result.totalChangedRecords = totalDeltas;
  return result;
};

/**
 * Apply incoming remote deltas to current client state safely with LWW conflict resolution
 */
export const applyIncomingDeltas = (currentState, incomingDeltas) => {
  if (!incomingDeltas || typeof incomingDeltas !== 'object') return currentState;

  const nextState = { ...currentState };

  if (incomingDeltas.products) {
    nextState.products = reconcileEntitiesLWW(nextState.products || [], incomingDeltas.products);
  }
  if (incomingDeltas.customers) {
    nextState.customers = reconcileEntitiesLWW(nextState.customers || [], incomingDeltas.customers);
  }
  if (incomingDeltas.salesHistory) {
    nextState.salesHistory = reconcileEntitiesLWW(nextState.salesHistory || [], incomingDeltas.salesHistory);
  }
  if (incomingDeltas.invoices) {
    nextState.invoices = reconcileEntitiesLWW(nextState.invoices || [], incomingDeltas.invoices);
  }
  if (incomingDeltas.businessDebts) {
    nextState.businessDebts = reconcileEntitiesLWW(nextState.businessDebts || [], incomingDeltas.businessDebts);
  }

  return nextState;
};
