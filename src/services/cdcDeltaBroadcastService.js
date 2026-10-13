/**
 * HisabKitab 360 - Change Data Capture (CDC) Delta Broadcast Service
 * Tip 17: Filtered Mutation Broadcasting & Ultra-Compact JSON Diff Stream
 * -----------------------------------------------------------------------
 * Replaces bulky full-row sync broadcasts with lightweight JSON patches
 * (e.g. { id: 'p1', patch: { stock: 4 } }), saving up to 90% mobile data
 * and avoiding expensive re-renders on remote cash registers and tablets.
 */

class CdcDeltaBroadcastService {
  constructor() {
    this.subscribers = new Map(); // topic -> Set of callbacks
    this.patchHistory = [];
    this.totalBytesSaved = 0;
    this.totalPatchesEmitted = 0;
  }

  calculateDiff(previousObj = {}, currentObj = {}) {
    const patch = {};
    let hasChanges = false;

    // Keys in current
    for (const key of Object.keys(currentObj)) {
      if (previousObj[key] !== currentObj[key]) {
        patch[key] = currentObj[key];
        hasChanges = true;
      }
    }

    return hasChanges ? patch : null;
  }

  broadcastDelta(entityType, entityId, previousObj, currentObj, authorTerminal = 'Local-Terminal') {
    const patch = this.calculateDiff(previousObj, currentObj);
    if (!patch) return null; // No mutation detected

    const deltaPacket = {
      id: `cdc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      entityType,
      entityId,
      patch,
      version: (previousObj?.version || 0) + 1,
      authorTerminal,
      timestamp: new Date().toISOString()
    };

    // Calculate simulated bytes saved vs full payload
    const fullSize = JSON.stringify(currentObj || {}).length;
    const patchSize = JSON.stringify(deltaPacket).length;
    const saved = Math.max(0, fullSize - patchSize);
    this.totalBytesSaved += saved;
    this.totalPatchesEmitted++;

    this.patchHistory.unshift({
      ...deltaPacket,
      bytesSaved: saved
    });
    if (this.patchHistory.length > 50) this.patchHistory.pop();

    // Dispatch to subscribers
    const topic = `${entityType}:${entityId}`;
    this.dispatch(topic, deltaPacket);
    this.dispatch(entityType, deltaPacket);
    this.dispatch('*', deltaPacket);

    return deltaPacket;
  }

  applyDelta(targetObj = {}, deltaPacket) {
    if (!deltaPacket || !deltaPacket.patch) return targetObj;
    return {
      ...targetObj,
      ...deltaPacket.patch,
      version: deltaPacket.version || (targetObj.version || 0) + 1,
      _lastModifiedBy: deltaPacket.authorTerminal,
      _lastModifiedAt: deltaPacket.timestamp
    };
  }

  subscribe(topic = '*', callback) {
    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, new Set());
    }
    this.subscribers.get(topic).add(callback);

    return () => {
      const set = this.subscribers.get(topic);
      if (set) set.delete(callback);
    };
  }

  dispatch(topic, packet) {
    const set = this.subscribers.get(topic);
    if (set) {
      set.forEach(cb => {
        try { cb(packet); } catch {}
      });
    }
  }

  getMetrics() {
    return {
      totalPatchesEmitted: this.totalPatchesEmitted,
      totalBytesSavedKb: (this.totalBytesSaved / 1024).toFixed(2),
      recentPatches: [...this.patchHistory]
    };
  }
}

export const cdcDeltaBroadcastService = new CdcDeltaBroadcastService();
export default cdcDeltaBroadcastService;
