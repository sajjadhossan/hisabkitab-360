/**
 * HisabKitab 360 - Conflict Resolution Service (Local-First CRDT)
 * --------------------------------------------------------------
 * Handles concurrent updates across multi-counters and offline clients.
 * Combines Vector Clock comparisons with Field-Level 3-Way Merge
 * and Last-Write-Wins (LWW) tie breaking.
 */

import { compareVectorClocks } from '../utils/vectorClock';

export const ConflictStrategy = {
  LWW: 'LAST_WRITE_WINS',
  MERGE: 'THREE_WAY_MERGE',
  CLIENT_WINS: 'CLIENT_WINS',
  SERVER_WINS: 'SERVER_WINS'
};

class ConflictResolutionService {
  constructor() {
    this.conflictLog = [];
  }

  /**
   * Resolve conflict between local and remote records
   * @param {Object} localRecord - Record on the current device
   * @param {Object} remoteRecord - Record incoming from server or another branch
   * @param {string} strategy - ConflictStrategy
   */
  resolve(localRecord, remoteRecord, strategy = ConflictStrategy.MERGE) {
    if (!localRecord) return remoteRecord;
    if (!remoteRecord) return localRecord;

    const clockComp = compareVectorClocks(
      localRecord._clock || {},
      remoteRecord._clock || {}
    );

    // If strictly newer, take the newer one
    if (clockComp === 1) return localRecord;
    if (clockComp === -1) return remoteRecord;

    // Concurrent conflict detected!
    const conflictRecord = {
      id: localRecord.id || remoteRecord.id,
      timestamp: Date.now(),
      localVersion: localRecord.version || 1,
      remoteVersion: remoteRecord.version || 1,
      strategy
    };
    this.conflictLog.unshift(conflictRecord);
    if (this.conflictLog.length > 100) this.conflictLog.pop();

    if (strategy === ConflictStrategy.CLIENT_WINS) {
      return localRecord;
    }
    if (strategy === ConflictStrategy.SERVER_WINS) {
      return remoteRecord;
    }

    if (strategy === ConflictStrategy.MERGE) {
      // Field level merge: take updated fields, combine quantities where sensible
      const merged = { ...remoteRecord, ...localRecord };

      // For stock or numeric counts, don't blindly overwrite if both changed
      if (typeof localRecord.stock === 'number' && typeof remoteRecord.stock === 'number') {
        const localDelta = (localRecord.stock || 0) - (localRecord._baseStock || localRecord.stock);
        merged.stock = (remoteRecord.stock || 0) + localDelta;
      }

      merged._resolvedAt = Date.now();
      merged.version = Math.max(localRecord.version || 1, remoteRecord.version || 1) + 1;
      return merged;
    }

    // Default: Last-Write-Wins based on updated_at timestamp
    const localTime = new Date(localRecord.updated_at || localRecord.updatedAt || 0).getTime();
    const remoteTime = new Date(remoteRecord.updated_at || remoteRecord.updatedAt || 0).getTime();

    return localTime >= remoteTime ? localRecord : remoteRecord;
  }

  getConflictHistory() {
    return [...this.conflictLog];
  }
}

export const conflictResolutionService = new ConflictResolutionService();
