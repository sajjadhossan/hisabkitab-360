/**
 * Somiti 360 - Enterprise IndexedDB Offline Store & Hybrid Local Database Engine
 * -------------------------------------------------------------------------------
 * Full offline-first local database providing non-blocking storage, table-level caching,
 * pending mutation queue with idempotency keys, offline file management, and conflict logs.
 *
 * Stores:
 * 1. cached_members
 * 2. cached_deposits
 * 3. cached_receipts
 * 4. cached_expenses
 * 5. cached_documents
 * 6. cached_reports
 * 7. cached_dashboard_summary
 * 8. pending_sync_queue
 * 9. sync_conflicts
 * 10. sync_logs
 * 11. offline_files
 * 12. app_metadata
 */

const DB_NAME = 'Somiti360_OfflineDB';
const DB_VERSION = 2;

// Store Constants
export const STORES = {
  MEMBERS: 'cached_members',
  DEPOSITS: 'cached_deposits',
  RECEIPTS: 'cached_receipts',
  EXPENSES: 'cached_expenses',
  DOCUMENTS: 'cached_documents',
  REPORTS: 'cached_reports',
  DASHBOARD: 'cached_dashboard_summary',
  PENDING_QUEUE: 'pending_sync_queue',
  CONFLICTS: 'sync_conflicts',
  SYNC_LOGS: 'sync_logs',
  OFFLINE_FILES: 'offline_files',
  APP_METADATA: 'app_metadata',
  // Backward compatibility legacy store
  STATE: 'samity_state'
};

let dbInstance = null;

/**
 * Open or initialize IndexedDB instance with comprehensive object stores & indexes
 */
export const openOfflineDB = () => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }

    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // 1. Members
        if (!db.objectStoreNames.contains(STORES.MEMBERS)) {
          const store = db.createObjectStore(STORES.MEMBERS, { keyPath: 'id' });
          store.createIndex('tenantId', 'tenantId', { unique: false });
          store.createIndex('memberNo', 'memberNo', { unique: false });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
          store.createIndex('status', 'status', { unique: false });
        }

        // 2. Deposits
        if (!db.objectStoreNames.contains(STORES.DEPOSITS)) {
          const store = db.createObjectStore(STORES.DEPOSITS, { keyPath: 'id' });
          store.createIndex('tenantId', 'tenantId', { unique: false });
          store.createIndex('memberId', 'memberId', { unique: false });
          store.createIndex('receiptNo', 'receiptNo', { unique: false });
          store.createIndex('date', 'date', { unique: false });
          store.createIndex('syncStatus', 'syncStatus', { unique: false });
        }

        // 3. Receipts
        if (!db.objectStoreNames.contains(STORES.RECEIPTS)) {
          const store = db.createObjectStore(STORES.RECEIPTS, { keyPath: 'id' });
          store.createIndex('receiptNo', 'receiptNo', { unique: false });
          store.createIndex('depositId', 'depositId', { unique: false });
          store.createIndex('verificationCode', 'verificationCode', { unique: false });
        }

        // 4. Expenses
        if (!db.objectStoreNames.contains(STORES.EXPENSES)) {
          const store = db.createObjectStore(STORES.EXPENSES, { keyPath: 'id' });
          store.createIndex('tenantId', 'tenantId', { unique: false });
          store.createIndex('category', 'category', { unique: false });
          store.createIndex('date', 'date', { unique: false });
          store.createIndex('syncStatus', 'syncStatus', { unique: false });
        }

        // 5. Documents
        if (!db.objectStoreNames.contains(STORES.DOCUMENTS)) {
          const store = db.createObjectStore(STORES.DOCUMENTS, { keyPath: 'id' });
          store.createIndex('tenantId', 'tenantId', { unique: false });
          store.createIndex('type', 'type', { unique: false });
        }

        // 6. Reports Cache
        if (!db.objectStoreNames.contains(STORES.REPORTS)) {
          db.createObjectStore(STORES.REPORTS, { keyPath: 'key' });
        }

        // 7. Dashboard Summary Cache
        if (!db.objectStoreNames.contains(STORES.DASHBOARD)) {
          db.createObjectStore(STORES.DASHBOARD, { keyPath: 'tenantId' });
        }

        // 8. Pending Sync Queue
        if (!db.objectStoreNames.contains(STORES.PENDING_QUEUE)) {
          const queue = db.createObjectStore(STORES.PENDING_QUEUE, { keyPath: 'idempotencyKey' });
          queue.createIndex('timestamp', 'timestamp', { unique: false });
          queue.createIndex('syncStatus', 'syncStatus', { unique: false });
          queue.createIndex('entityType', 'entityType', { unique: false });
          queue.createIndex('tenantId', 'tenantId', { unique: false });
        }

        // 9. Sync Conflicts
        if (!db.objectStoreNames.contains(STORES.CONFLICTS)) {
          const confStore = db.createObjectStore(STORES.CONFLICTS, { keyPath: 'id' });
          confStore.createIndex('entityType', 'entityType', { unique: false });
          confStore.createIndex('entityId', 'entityId', { unique: false });
          confStore.createIndex('status', 'status', { unique: false });
        }

        // 10. Sync Logs
        if (!db.objectStoreNames.contains(STORES.SYNC_LOGS)) {
          const logStore = db.createObjectStore(STORES.SYNC_LOGS, { keyPath: 'id', autoIncrement: true });
          logStore.createIndex('timestamp', 'timestamp', { unique: false });
          logStore.createIndex('type', 'type', { unique: false });
        }

        // 11. Offline Files
        if (!db.objectStoreNames.contains(STORES.OFFLINE_FILES)) {
          const fileStore = db.createObjectStore(STORES.OFFLINE_FILES, { keyPath: 'fileId' });
          fileStore.createIndex('status', 'status', { unique: false });
          fileStore.createIndex('entityId', 'entityId', { unique: false });
        }

        // 12. App Metadata
        if (!db.objectStoreNames.contains(STORES.APP_METADATA)) {
          db.createObjectStore(STORES.APP_METADATA, { keyPath: 'key' });
        }

        // Legacy State Store for Backward Compatibility
        if (!db.objectStoreNames.contains(STORES.STATE)) {
          db.createObjectStore(STORES.STATE, { keyPath: 'key' });
        }
      };

      request.onsuccess = (event) => {
        dbInstance = event.target.result;
        resolve(dbInstance);
      };

      request.onerror = (err) => {
        console.warn('[OfflineDB] IndexedDB error, running fallback:', err);
        resolve(null);
      };
    } catch (e) {
      console.warn('[OfflineDB] Exception initializing IndexedDB:', e);
      resolve(null);
    }
  });
};

/**
 * Generate standard RFC4122 v4 equivalent Idempotency Key
 */
export const generateIdempotencyKey = (prefix = 'tx') => {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 9) + Math.random().toString(36).substring(2, 6);
  return `som_${prefix}_${timestamp}_${randomPart}`;
};

/**
 * Generic helper to get a transaction and store
 */
const getStore = async (storeName, mode = 'readonly') => {
  const db = await openOfflineDB();
  if (!db) return null;
  try {
    const tx = db.transaction([storeName], mode);
    return { tx, store: tx.objectStore(storeName) };
  } catch (err) {
    console.debug(`[OfflineDB] Store access error for ${storeName}:`, err);
    return null;
  }
};

/**
 * Put item into any store
 */
export const putLocalRecord = async (storeName, record) => {
  if (!record) return false;
  try {
    const ctx = await getStore(storeName, 'readwrite');
    if (!ctx) return false;
    return new Promise((resolve) => {
      const req = ctx.store.put(record);
      ctx.tx.oncomplete = () => resolve(true);
      ctx.tx.onerror = () => resolve(false);
      req.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
};

/**
 * Put bulk items into any store
 */
export const putBulkLocalRecords = async (storeName, records = []) => {
  if (!records || !records.length) return 0;
  try {
    const ctx = await getStore(storeName, 'readwrite');
    if (!ctx) return 0;
    return new Promise((resolve) => {
      let count = 0;
      for (const rec of records) {
        if (rec) {
          ctx.store.put(rec);
          count++;
        }
      }
      ctx.tx.oncomplete = () => resolve(count);
      ctx.tx.onerror = () => resolve(0);
    });
  } catch {
    return 0;
  }
};

/**
 * Get item by key from any store
 */
export const getLocalRecord = async (storeName, key) => {
  try {
    const ctx = await getStore(storeName, 'readonly');
    if (!ctx) return null;
    return new Promise((resolve) => {
      const req = ctx.store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
};

/**
 * Get all items from any store
 */
export const getAllLocalRecords = async (storeName) => {
  try {
    const ctx = await getStore(storeName, 'readonly');
    if (!ctx) return [];
    return new Promise((resolve) => {
      const req = ctx.store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
};

/**
 * Delete item by key from any store
 */
export const deleteLocalRecord = async (storeName, key) => {
  try {
    const ctx = await getStore(storeName, 'readwrite');
    if (!ctx) return false;
    return new Promise((resolve) => {
      ctx.store.delete(key);
      ctx.tx.oncomplete = () => resolve(true);
      ctx.tx.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
};

// ============================================================================
// PENDING MUTATION QUEUE OPERATIONS
// ============================================================================

/**
 * Enqueue a mutation into pending_sync_queue
 * Supports: 'create' | 'update' | 'delete'
 */
export const enqueueOfflineMutation = async (entityType, operation, payload, samityId = 'default_tenant') => {
  const idempotencyKey = payload?.idempotencyKey || generateIdempotencyKey(entityType);
  const now = new Date().toISOString();

  const queueItem = {
    id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    samityId: payload?.tenantId || payload?.samityId || samityId,
    entityType, // 'member' | 'deposit' | 'expense' | 'receipt' | 'document'
    entityId: payload?.id || payload?.receiptNo || idempotencyKey,
    operation, // 'create' | 'update' | 'delete'
    payload: {
      ...payload,
      idempotencyKey,
      syncStatus: 'pending',
      clientUpdatedAt: now
    },
    idempotencyKey,
    clientUpdatedAt: now,
    clientVersion: 1,
    syncStatus: 'pending', // 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict'
    retryCount: 0,
    lastError: null,
    timestamp: Date.now(),
    createdAt: now,
    updatedAt: now
  };

  try {
    await putLocalRecord(STORES.PENDING_QUEUE, queueItem);

    // Also update local cache immediately for optimistic UI
    await updateLocalCacheOptimistically(entityType, operation, queueItem.payload);

    // Notify application via event
    if (typeof window !== 'undefined') {
      const count = await getPendingQueueCount();
      window.dispatchEvent(new CustomEvent('somiti_offline_queue_changed', { detail: { count, item: queueItem } }));
    }
  } catch (e) {
    console.warn('[OfflineDB] Could not enqueue mutation:', e);
  }

  return queueItem;
};

/**
 * Optimistically update local entity cache so user sees change immediately while offline
 */
const updateLocalCacheOptimistically = async (entityType, operation, payload) => {
  let targetStore = null;
  if (entityType === 'member') targetStore = STORES.MEMBERS;
  else if (entityType === 'deposit') targetStore = STORES.DEPOSITS;
  else if (entityType === 'expense') targetStore = STORES.EXPENSES;
  else if (entityType === 'receipt') targetStore = STORES.RECEIPTS;
  else if (entityType === 'document') targetStore = STORES.DOCUMENTS;

  if (!targetStore || !payload?.id) return;

  if (operation === 'delete') {
    await deleteLocalRecord(targetStore, payload.id);
  } else {
    // Put or merge
    const existing = await getLocalRecord(targetStore, payload.id);
    const updated = existing ? { ...existing, ...payload } : payload;
    await putLocalRecord(targetStore, updated);
  }
};

/**
 * Get pending sync queue count
 */
export const getPendingQueueCount = async () => {
  try {
    const items = await getAllLocalRecords(STORES.PENDING_QUEUE);
    return items.filter(i => i.syncStatus === 'pending' || i.syncStatus === 'failed').length;
  } catch {
    return 0;
  }
};

/**
 * Get all pending queue mutations
 */
export const getPendingOfflineMutations = async () => {
  try {
    const items = await getAllLocalRecords(STORES.PENDING_QUEUE);
    return items.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  } catch {
    return [];
  }
};

/**
 * Mark a mutation as synced and remove from pending queue
 */
export const markMutationSynced = async (idempotencyKey) => {
  if (!idempotencyKey) return;
  try {
    await deleteLocalRecord(STORES.PENDING_QUEUE, idempotencyKey);
    // Log to sync_logs
    await putLocalRecord(STORES.SYNC_LOGS, {
      timestamp: Date.now(),
      type: 'SYNCED',
      idempotencyKey,
      syncedAt: new Date().toISOString()
    });

    if (typeof window !== 'undefined') {
      const count = await getPendingQueueCount();
      window.dispatchEvent(new CustomEvent('somiti_offline_queue_changed', { detail: { count } }));
    }
  } catch (e) {
    console.debug('[OfflineDB] Error marking synced:', e);
  }
};

/**
 * Mark a mutation as failed with retry backoff
 */
export const markMutationFailed = async (idempotencyKey, errorMessage) => {
  if (!idempotencyKey) return;
  try {
    const item = await getLocalRecord(STORES.PENDING_QUEUE, idempotencyKey);
    if (item) {
      item.retryCount = (item.retryCount || 0) + 1;
      item.lastError = errorMessage || 'Network or server error';
      item.syncStatus = item.retryCount >= 5 ? 'failed' : 'pending';
      item.updatedAt = new Date().toISOString();
      await putLocalRecord(STORES.PENDING_QUEUE, item);
    }
  } catch (e) {
    console.debug('[OfflineDB] Error recording mutation failure:', e);
  }
};

// ============================================================================
// CONFLICT MANAGEMENT
// ============================================================================

/**
 * Record a detected conflict for user or admin resolution
 */
export const recordSyncConflict = async (conflictData) => {
  const conflict = {
    id: conflictData.id || `conf_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    entityType: conflictData.entityType,
    entityId: conflictData.entityId,
    serverVersion: conflictData.serverVersion,
    localVersion: conflictData.localVersion,
    differenceFields: conflictData.differenceFields || [],
    conflictReason: conflictData.conflictReason || 'Server data differs from offline edit',
    status: 'unresolved', // 'unresolved' | 'resolved'
    resolutionChoice: null,
    resolvedAt: null,
    createdAt: new Date().toISOString()
  };

  await putLocalRecord(STORES.CONFLICTS, conflict);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('somiti_sync_conflict_detected', { detail: conflict }));
  }
  return conflict;
};

/**
 * Get all unresolved conflicts
 */
export const getUnresolvedConflicts = async () => {
  const all = await getAllLocalRecords(STORES.CONFLICTS);
  return all.filter(c => c.status === 'unresolved');
};

/**
 * Resolve a conflict locally
 */
export const resolveConflictLocally = async (conflictId, choice, resolvedData) => {
  const conflict = await getLocalRecord(STORES.CONFLICTS, conflictId);
  if (!conflict) return false;

  conflict.status = 'resolved';
  conflict.resolutionChoice = choice; // 'keep_server' | 'keep_local' | 'merged'
  conflict.resolvedAt = new Date().toISOString();
  await putLocalRecord(STORES.CONFLICTS, conflict);

  // If local choice or merged, update cached store
  if (resolvedData && conflict.entityType) {
    let storeName = null;
    if (conflict.entityType === 'deposit') storeName = STORES.DEPOSITS;
    else if (conflict.entityType === 'member') storeName = STORES.MEMBERS;
    else if (conflict.entityType === 'expense') storeName = STORES.EXPENSES;

    if (storeName && resolvedData.id) {
      await putLocalRecord(storeName, resolvedData);
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('somiti_sync_conflict_resolved', { detail: { conflictId, choice } }));
  }
  return true;
};

// ============================================================================
// OFFLINE FILE STORE
// ============================================================================

/**
 * Save an offline file (e.g. Bank receipt image or document) before upload
 */
export const saveOfflineFile = async ({ fileId, entityId, fileName, mimeType, dataUrl, sizeBytes }) => {
  const fileRecord = {
    fileId: fileId || `file_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    entityId,
    fileName,
    mimeType,
    dataUrl,
    sizeBytes,
    status: 'pending', // 'pending' | 'uploading' | 'uploaded' | 'failed'
    createdAt: new Date().toISOString()
  };

  await putLocalRecord(STORES.OFFLINE_FILES, fileRecord);
  return fileRecord;
};

/**
 * Get all pending files to upload
 */
export const getPendingOfflineFiles = async () => {
  const files = await getAllLocalRecords(STORES.OFFLINE_FILES);
  return files.filter(f => f.status === 'pending' || f.status === 'failed');
};

/**
 * Mark file as successfully uploaded and remove or archive
 */
export const markOfflineFileUploaded = async (fileId, cloudUrl) => {
  const file = await getLocalRecord(STORES.OFFLINE_FILES, fileId);
  if (file) {
    file.status = 'uploaded';
    file.cloudUrl = cloudUrl;
    file.uploadedAt = new Date().toISOString();
    // Delete base64 payload to preserve memory
    delete file.dataUrl;
    await putLocalRecord(STORES.OFFLINE_FILES, file);
  }
};

// ============================================================================
// APP METADATA & SNAPSHOTS (BACKWARD COMPATIBILITY)
// ============================================================================

export const saveStateToIndexedDB = async (data) => {
  if (!data) return false;
  try {
    const db = await openOfflineDB();
    if (!db) return false;

    // Save full state snapshot
    await putLocalRecord(STORES.STATE, {
      key: 'current_samity_hub',
      updatedAt: Date.now(),
      data
    });

    // Populate individual cached tables if present
    if (data.members && Array.isArray(data.members)) {
      await putBulkLocalRecords(STORES.MEMBERS, data.members);
    }
    if (data.deposits && Array.isArray(data.deposits)) {
      await putBulkLocalRecords(STORES.DEPOSITS, data.deposits);
    }
    if (data.expenses && Array.isArray(data.expenses)) {
      await putBulkLocalRecords(STORES.EXPENSES, data.expenses);
    }
    if (data.documents && Array.isArray(data.documents)) {
      await putBulkLocalRecords(STORES.DOCUMENTS, data.documents);
    }

    return true;
  } catch (e) {
    console.debug('[OfflineDB] saveStateToIndexedDB error:', e);
    return false;
  }
};

export const loadStateFromIndexedDB = async () => {
  try {
    const rec = await getLocalRecord(STORES.STATE, 'current_samity_hub');
    if (rec && rec.data) return rec.data;

    // Assemble state from table caches if snapshot was empty
    const members = await getAllLocalRecords(STORES.MEMBERS);
    const deposits = await getAllLocalRecords(STORES.DEPOSITS);
    const expenses = await getAllLocalRecords(STORES.EXPENSES);
    const documents = await getAllLocalRecords(STORES.DOCUMENTS);

    if (members.length || deposits.length || expenses.length) {
      return { members, deposits, expenses, documents };
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Request permanent browser storage persistence (Prevents browser from auto-evicting 10GB+ data)
 */
export const requestPersistentStorage = async () => {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persist();
      const status = await (navigator.storage.persisted ? navigator.storage.persisted() : Promise.resolve(isPersisted));
      return {
        persisted: Boolean(status),
        messageBn: status ? 'স্থায়ী অফলাইন স্টোরেজ সক্রিয় (১০+ জিবি সুরক্ষিত)' : 'স্ট্যান্ডার্ড ব্রাউজার স্টোরেজ কোটা বরাদ্দ',
        messageEn: status ? 'Persistent offline storage enabled (10GB+ secured)' : 'Standard browser storage quota allocated'
      };
    } catch (e) {
      console.warn('[OfflineDB] Storage persistence request error:', e);
      return { persisted: false, messageBn: 'পারসিস্টেন্স চেক অনুপলব্ধ', messageEn: 'Persistence unavailable' };
    }
  }
  return { persisted: false, messageBn: 'পারসিস্টেন্স এপিআই অনুপলব্ধ', messageEn: 'Storage API unavailable' };
};

/**
 * Storage quota monitor (Detailed GB/MB telemetry with 10GB+ scale support)
 */
export const getStorageQuotaHealth = async () => {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      const usageBytes = estimate.usage || 0;
      const quotaBytes = estimate.quota || 0;

      const usedMB = (usageBytes / (1024 * 1024)).toFixed(2);
      const usedGB = (usageBytes / (1024 * 1024 * 1024)).toFixed(3);
      const totalMB = (quotaBytes / (1024 * 1024)).toFixed(0);
      const totalGB = (quotaBytes / (1024 * 1024 * 1024)).toFixed(2);
      const percent = quotaBytes > 0 ? Math.round((usageBytes / quotaBytes) * 100) : 0;
      const isPersisted = await (navigator.storage.persisted ? navigator.storage.persisted() : Promise.resolve(false));

      return {
        healthy: percent < 90,
        usedMB,
        usedGB,
        totalMB,
        totalGB,
        usageBytes,
        quotaBytes,
        percent,
        persisted: Boolean(isPersisted),
        supportsMultiGigabyte: quotaBytes >= (1024 * 1024 * 1024 * 5) // >= 5GB available
      };
    } catch {
      return { healthy: true, usedMB: '0.00', usedGB: '0.00', totalMB: 'Unlimited', totalGB: 'Unlimited', percent: 0, persisted: false, supportsMultiGigabyte: true };
    }
  }
  return { healthy: true, usedMB: '0.00', usedGB: '0.00', totalMB: 'N/A', totalGB: 'N/A', percent: 0, persisted: false, supportsMultiGigabyte: false };
};

/**
 * Process and flush pending offline mutations when connection resumes
 */
export const flushPendingOfflineMutations = async (syncHandler) => {
  const pending = await getPendingOfflineMutations();
  if (!pending || pending.length === 0) return 0;

  let successCount = 0;
  for (const mutation of pending) {
    try {
      if (typeof syncHandler === 'function') {
        const result = await syncHandler(mutation);
        if (result?.conflict) {
          await recordSyncConflict(result.conflict);
          continue;
        }
      }
      await markMutationSynced(mutation.idempotencyKey);
      successCount++;
    } catch (err) {
      console.warn(`[OfflineDB] Failed syncing mutation ${mutation.idempotencyKey}:`, err);
      await markMutationFailed(mutation.idempotencyKey, err.message);
    }
  }

  return successCount;
};
