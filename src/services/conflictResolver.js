/**
/**
 * HisabKitab 360 - Commercial Conflict Resolution & Delta Stock Engine
 * ---------------------------------------------------------------------
 * Deterministically resolves data conflicts between offline mutation queues,
 * multi-counter LAN terminals, and remote cloud databases.
 * Employs timestamps, monotonic revision counters, soft-delete preservation,
 * and CRDT-style Delta Stock Merging to prevent inventory loss across offline sales.
 */

/**
 * Extracts normalized epoch millisecond timestamp from diverse entity schema shapes
 */
export const getEntityTimestamp = (item) => {
  if (!item || typeof item !== 'object') return 0;

  const candidate =
    item.updatedAt ||
    item.updated_at ||
    item.timestamp ||
    item.createdAt ||
    item.created_at ||
    item.date;

  if (typeof candidate === 'number') return candidate;
  if (typeof candidate === 'string') {
    const parsed = Date.parse(candidate);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

/**
 * Reconciles inventory stock changes using delta math rather than naive overwrites.
 * Prevents race condition where Device A selling 2 units and Device B selling 3 units
 * would otherwise wipe out one of the deductions when syncing offline.
 */
export const resolveInventoryStockDelta = (localItem, incomingItem) => {
  const isLocalProduct = typeof localItem.stock === 'number' || typeof localItem.currentStock === 'number';
  const isIncomingProduct = typeof incomingItem.stock === 'number' || typeof incomingItem.currentStock === 'number';

  if (!isLocalProduct && !isIncomingProduct) return null;

  const localStock = Number(localItem.stock ?? localItem.currentStock ?? 0);
  const incomingStock = Number(incomingItem.stock ?? incomingItem.currentStock ?? 0);

  // If one of the payloads carries explicit incremental _stockDelta
  if (typeof incomingItem._stockDelta === 'number') {
    const finalStock = Math.max(0, localStock + incomingItem._stockDelta);
    return {
      ...localItem,
      ...incomingItem,
      stock: finalStock,
      currentStock: finalStock,
      _conflictType: 'stock_delta_applied',
      _stockResolvedAt: Date.now()
    };
  }

  if (typeof localItem._stockDelta === 'number') {
    const finalStock = Math.max(0, incomingStock + localItem._stockDelta);
    return {
      ...incomingItem,
      ...localItem,
      stock: finalStock,
      currentStock: finalStock,
      _conflictType: 'stock_delta_applied',
      _stockResolvedAt: Date.now()
    };
  }

  // If both have different stocks and both were modified concurrently offline
  const localBase = localItem._baseStock ?? localItem.lastSyncedStock;
  const incomingBase = incomingItem._baseStock ?? incomingItem.lastSyncedStock;
  const baseStock = Number(localBase ?? incomingBase ?? Math.max(localStock, incomingStock));

  if (baseStock > 0 && (localStock !== incomingStock)) {
    const deltaLocal = localStock - baseStock;
    const deltaIncoming = incomingStock - baseStock;
    // Combine both sales deductions
    const combinedStock = Math.max(0, baseStock + deltaLocal + deltaIncoming);
    return {
      ...incomingItem,
      ...localItem,
      stock: combinedStock,
      currentStock: combinedStock,
      _conflictType: 'crdt_delta_stock_reconciled',
      _stockResolvedAt: Date.now()
    };
  }

  return null;
};

/**
 * Resolves conflict between two versions of an entity using LWW with Delta Stock Protection
 * @param {Object} localItem - Entity existing in local client state
 * @param {Object} incomingItem - Entity received from remote sync, LAN terminal, or queue
 * @returns {Object} Deterministically resolved entity
 */
export const resolveConflictLWW = (localItem, incomingItem) => {
  if (!localItem) return incomingItem;
  if (!incomingItem) return localItem;

  // 1. Check for product stock delta merge first (Prevents inventory loss)
  const stockMerged = resolveInventoryStockDelta(localItem, incomingItem);
  if (stockMerged) {
    return stockMerged;
  }

  const localTime = getEntityTimestamp(localItem);
  const incomingTime = getEntityTimestamp(incomingItem);

  // Soft-delete awareness: If either is explicitly marked deleted, preserve deletion flag with latest timestamp
  const isIncomingDeleted = Boolean(incomingItem.isDeleted || incomingItem.deleted_at || incomingItem._deleted);
  const isLocalDeleted = Boolean(localItem.isDeleted || localItem.deleted_at || localItem._deleted);

  // If incoming record is strictly newer, it wins
  if (incomingTime > localTime) {
    return {
      ...localItem,
      ...incomingItem,
      isDeleted: isIncomingDeleted,
      _conflictResolved: true,
      _winner: 'incoming',
      _resolvedAt: Date.now()
    };
  }

  // If local record is strictly newer, local wins
  if (localTime > incomingTime) {
    return {
      ...incomingItem,
      ...localItem,
      isDeleted: isLocalDeleted,
      _conflictResolved: true,
      _winner: 'local',
      _resolvedAt: Date.now()
    };
  }

  // Equal timestamps: Tie-breaker using revision / version or deterministic property merge
  const localVer = Number(localItem.version || localItem._v || 0);
  const incomingVer = Number(incomingItem.version || incomingItem._v || 0);

  if (incomingVer > localVer) {
    return { ...localItem, ...incomingItem, isDeleted: isIncomingDeleted || isLocalDeleted, _conflictResolved: true };
  }

  return { ...incomingItem, ...localItem, isDeleted: isLocalDeleted || isIncomingDeleted, _conflictResolved: true };
};

/**
 * Reconciles an entire array of entities against an incoming sync batch using LWW & Delta Stock
 */
export const reconcileEntitiesLWW = (currentList = [], incomingList = [], idKey = 'id') => {
  const map = new Map();

  // Index existing items
  for (const item of currentList) {
    if (item && item[idKey]) {
      map.set(String(item[idKey]), item);
    }
  }

  // Merge or append incoming items with LWW
  for (const incoming of incomingList) {
    if (!incoming || !incoming[idKey]) continue;
    const id = String(incoming[idKey]);
    if (map.has(id)) {
      const resolved = resolveConflictLWW(map.get(id), incoming);
      map.set(id, resolved);
    } else {
      map.set(id, incoming);
    }
  }

  return Array.from(map.values());
};
