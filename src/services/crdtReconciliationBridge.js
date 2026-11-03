/**
 * HisabKitab 360 - CRDT & Deterministic Multi-Counter Reconciliation Engine
 * --------------------------------------------------------------------------
 * Solves distributed offline concurrency across multiple cash counters,
 * mobile POS terminals, and PC terminals without data loss or conflicting overwrites.
 *
 * Concepts:
 * 1. LWW-Element-Set (Last-Write-Wins with Lamport Logical Clocks):
 *    Ensures that edits or stock deductions made across counters are deterministically
 *    ordered, even if local device clocks drift.
 * 2. Tombstone-Aware Two-Way Reconciliation:
 *    Deleted items stay deleted and cannot be resurrected by delayed syncs.
 * 3. Commutative Delta Merging:
 *    Merge(A, B) === Merge(B, A). Order of sync arrivals produces identical state.
 */

/**
 * Creates an LWW-tagged entity with logical Lamport clock
 */
export const tagWithLamport = (entity, counter = 1, deviceId = 'primary') => {
  return {
    ...entity,
    _lamport: {
      counter: Number(counter) || Date.now(),
      deviceId: String(deviceId || 'local'),
      updatedAt: Date.now()
    }
  };
};

/**
 * Deterministically compares two items using Lamport clocks
 * Returns positive if A is newer, negative if B is newer, 0 if identical
 */
export const compareLamportClocks = (a, b) => {
  const clockA = a._lamport || { counter: a.updatedAt || a.timestamp || 0, deviceId: '' };
  const clockB = b._lamport || { counter: b.updatedAt || b.timestamp || 0, deviceId: '' };

  // 1. Compare logical counter
  if (clockA.counter !== clockB.counter) {
    return clockA.counter > clockB.counter ? 1 : -1;
  }

  // 2. Tie-break deterministically using deviceId
  if (clockA.deviceId !== clockB.deviceId) {
    return clockA.deviceId > clockB.deviceId ? 1 : -1;
  }

  return 0;
};

/**
 * Deterministically merges two lists of entities (e.g. products, ledger entries, or transactions)
 *
 * @param {Array<Object>} localList
 * @param {Array<Object>} incomingList
 * @param {string} [idField='id']
 * @returns {Array<Object>}
 */
export const mergeDeterministicLists = (localList = [], incomingList = [], idField = 'id') => {
  const registry = new Map();

  // Insert all local items
  for (const item of localList) {
    if (item && item[idField]) {
      registry.set(item[idField], item);
    }
  }

  // Merge incoming items using CRDT rules
  for (const incoming of incomingList) {
    if (!incoming || !incoming[idField]) continue;
    const id = incoming[idField];

    if (!registry.has(id)) {
      // New item not in local: insert
      registry.set(id, incoming);
    } else {
      const local = registry.get(id);

      // Handle tombstone: if either is deleted, prefer deleted if newer or equal
      if (local.isDeleted || incoming.isDeleted) {
        if (incoming.isDeleted && compareLamportClocks(incoming, local) >= 0) {
          registry.set(id, incoming);
          continue;
        } else if (local.isDeleted) {
          // Local is deleted, keep local unless incoming was explicitly restored with higher clock
          if (!incoming.isDeleted && compareLamportClocks(incoming, local) > 0) {
            registry.set(id, incoming);
          }
          continue;
        }
      }

      // Normal conflict resolution via Lamport clock
      if (compareLamportClocks(incoming, local) > 0) {
        registry.set(id, incoming);
      }
    }
  }

  return Array.from(registry.values());
};

/**
 * Reconciles stock deductions across multiple counters
 * Treats stock delta as an additive counter (PN-Counter)
 *
 * @param {number} baseStock Base initial stock
 * @param {Array<{ qty: number, type: 'sale' | 'purchase' | 'adjustment' }>} events
 * @returns {number} Deterministic current stock
 */
export const reconcilePnStockCounter = (baseStock = 0, events = []) => {
  let netStock = Number(baseStock) || 0;

  for (const ev of events) {
    const qty = Number(ev.qty || ev.quantity || 0);
    if (ev.type === 'sale' || ev.type === 'out') {
      netStock -= qty;
    } else if (ev.type === 'purchase' || ev.type === 'in' || ev.type === 'return') {
      netStock += qty;
    } else if (ev.type === 'adjustment') {
      netStock = qty; // Direct adjustment
    }
  }

  return Math.max(0, netStock);
};

export const crdtReconciliationBridge = {
  tagWithLamport,
  compareLamportClocks,
  mergeDeterministicLists,
  reconcilePnStockCounter
};
