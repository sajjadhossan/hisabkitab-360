/**
 * HisabKitab 360 - Last-Write-Wins (LWW) Conflict Resolution Engine
 * -----------------------------------------------------------------
 * Deterministically resolves data conflicts between offline mutation queues,
 * multi-counter LAN terminals, and remote cloud databases.
 * Employs timestamps, monotonic revision counters, and non-destructive merges.
 */

/**
 * Resolves conflict between two versions of an entity using Last-Write-Wins (LWW)
 * @param {Object} localItem - Entity existing in local client state
 * @param {Object} incomingItem - Entity received from remote sync, LAN terminal, or queue
 * @returns {Object} Deterministically resolved entity
 */
export const resolveConflictLWW = (localItem, incomingItem) => {
  if (!localItem) return incomingItem;
  if (!incomingItem) return localItem;

  const localTime = getEntityTimestamp(localItem);
  const incomingTime = getEntityTimestamp(incomingItem);

  // If incoming record is strictly newer, it wins
  if (incomingTime > localTime) {
    return {
      ...localItem,
      ...incomingItem,
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
      _conflictResolved: true,
      _winner: 'local',
      _resolvedAt: Date.now()
    };
  }

  // Equal timestamps: Tie-breaker using revision / version or deterministic property merge
  const localVer = Number(localItem.version || localItem._v || 0);
  const incomingVer = Number(incomingItem.version || incomingItem._v || 0);

  if (incomingVer > localVer) {
    return { ...localItem, ...incomingItem, _conflictResolved: true };
  }

  return { ...incomingItem, ...localItem, _conflictResolved: true };
};

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
 * Reconciles an entire array of entities against an incoming sync batch using LWW
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
