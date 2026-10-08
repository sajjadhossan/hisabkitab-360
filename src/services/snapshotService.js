/**
 * HisabKitab 360 - 7-Day Rolling Snapshot & Auto-Rotation Service
 * ---------------------------------------------------------------
 * Moves heavy database snapshots out of localStorage into IndexedDB to prevent
 * storage quota crashes. Maintains a rolling 7-day retention policy and provides
 * instant 1-click snapshot restore.
 */

import { idbSet, idbGet } from '../utils/idbStorage';

const SNAPSHOT_META_KEY = 'hk360_snapshots_meta';
const MAX_DAYS_RETENTION = 7;
const MAX_MANUAL_SNAPSHOTS = 10;

/**
 * Retrieve snapshot metadata list (fast, without parsing large JSON payloads)
 */
export const getSnapshotMetaList = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SNAPSHOT_META_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

/**
 * Persist snapshot metadata list
 */
const saveSnapshotMetaList = (list) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SNAPSHOT_META_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn('[SnapshotService] Failed to save metadata list:', err);
  }
};

/**
 * Create and persist a new snapshot.
 * Payload is safely stored in IndexedDB; metadata is kept in local list.
 */
export const createSystemSnapshot = async (fullData, label = 'Auto Snapshot') => {
  try {
    const now = new Date();
    const isoDate = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const snapId = `snap_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const serialized = JSON.stringify(fullData);
    const sizeKb = (serialized.length / 1024).toFixed(1);

    const meta = {
      id: snapId,
      date: isoDate,
      time: timeStr,
      timestamp: now.getTime(),
      label,
      size: `${sizeKb} KB`,
      invoicesCount: fullData?.business?.invoices?.length || 0,
      customersCount: fullData?.business?.customers?.length || 0,
      productsCount: fullData?.business?.products?.length || 0
    };

    // Store big payload in IndexedDB
    await idbSet(`snapshot_data_${snapId}`, fullData);

    // Update metadata list & apply 7-day rolling retention
    const currentList = getSnapshotMetaList();
    const updatedList = [meta, ...currentList];

    const prunedList = await enforceRollingRetention(updatedList);
    saveSnapshotMetaList(prunedList);

    return { success: true, meta };
  } catch (err) {
    console.error('[SnapshotService] Create snapshot error:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Load full snapshot data from IndexedDB by ID
 */
export const loadSnapshotData = async (snapId) => {
  try {
    const data = await idbGet(`snapshot_data_${snapId}`);
    return data;
  } catch (err) {
    console.error('[SnapshotService] Load snapshot error:', err);
    return null;
  }
};

/**
 * Delete a snapshot by ID
 */
export const deleteSnapshotById = async (snapId) => {
  try {
    const currentList = getSnapshotMetaList();
    const filtered = currentList.filter((s) => s.id !== snapId);
    saveSnapshotMetaList(filtered);

    // Clean up IndexedDB payload
    await idbSet(`snapshot_data_${snapId}`, null);
    return true;
  } catch (err) {
    console.warn('[SnapshotService] Delete failed:', err);
    return false;
  }
};

/**
 * Enforces 7-day rolling snapshot policy:
 * Retains 1 auto-snapshot per day for the last 7 calendar days,
 * and up to MAX_MANUAL_SNAPSHOTS user snapshots.
 */
export const enforceRollingRetention = async (metaList) => {
  const cutoffTime = Date.now() - (MAX_DAYS_RETENTION * 24 * 60 * 60 * 1000);
  const retained = [];
  const toDelete = [];

  const seenDates = new Set();

  for (const snap of metaList) {
    const isRecent = snap.timestamp ? snap.timestamp >= cutoffTime : true;
    const isAuto = snap.label.toLowerCase().includes('auto') || snap.label.includes('অটো') || snap.label.includes('স্বয়ংক্রিয়');

    if (isAuto) {
      if (isRecent && !seenDates.has(snap.date)) {
        seenDates.add(snap.date);
        retained.push(snap);
      } else {
        toDelete.push(snap.id);
      }
    } else {
      // Manual snapshot
      if (retained.length < MAX_MANUAL_SNAPSHOTS) {
        retained.push(snap);
      } else {
        toDelete.push(snap.id);
      }
    }
  }

  // Asynchronously clean up purged records from IndexedDB
  for (const id of toDelete) {
    idbSet(`snapshot_data_${id}`, null).catch(() => {});
  }

  return retained;
};
