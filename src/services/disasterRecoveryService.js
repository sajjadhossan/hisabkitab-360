/**
 * HisabKitab 360 - Disaster Recovery & Backup Pipeline
 * ----------------------------------------------------
 * Point-In-Time-Recovery (PITR) emulator, automated daily snapshots,
 * and cold storage synchronization (Google Drive & Telegram).
 */

import { idbGet, idbSet } from '../utils/idbStorage';
import { googleDriveService } from './googleDriveService';
import { telegramBackupService } from './telegramBackupService';

class DisasterRecoveryService {
  constructor() {
    this.SNAPSHOT_PREFIX = 'recovery_snapshot_';
  }

  /**
   * Create an instantaneous disaster snapshot of all core tables
   */
  async createSnapshot(label = 'manual') {
    const timestamp = Date.now();
    const dateStr = new Date().toISOString();

    const snapshotData = {
      timestamp,
      dateStr,
      label,
      version: '1.0.0',
      data: {
        products: (await idbGet('products')) || [],
        invoices: (await idbGet('invoices')) || [],
        customers: (await idbGet('customers')) || [],
        debts: (await idbGet('debts')) || [],
        settings: (await idbGet('businessSettings')) || {}
      }
    };

    const snapshotKey = `${this.SNAPSHOT_PREFIX}${timestamp}`;
    await idbSet(snapshotKey, snapshotData);

    // Track index of snapshots
    const history = (await idbGet('snapshot_history')) || [];
    history.unshift({
      key: snapshotKey,
      timestamp,
      dateStr,
      label,
      itemsCount: {
        products: snapshotData.data.products.length,
        invoices: snapshotData.data.invoices.length,
        customers: snapshotData.data.customers.length
      }
    });

    // Keep only last 15 local snapshots to save quota
    if (history.length > 15) {
      history.slice(15).forEach(old => idbSet(old.key, null));
    }
    await idbSet('snapshot_history', history.slice(0, 15));

    return { success: true, snapshotKey, timestamp };
  }

  /**
   * Dispatch snapshot to Cloud Cold Storage (Google Drive or Telegram)
   */
  async dispatchToColdStorage(label = 'daily_scheduled') {
    const snapshot = await this.createSnapshot(label);
    const results = { googleDrive: false, telegram: false };

    // 1. Google Drive
    try {
      if (googleDriveService?.isConnected?.()) {
        await googleDriveService.backupNow();
        results.googleDrive = true;
      }
    } catch (e) {
      console.warn('[DisasterRecovery] Google Drive dispatch error:', e);
    }

    // 2. Telegram
    try {
      if (telegramBackupService?.isConfigured?.()) {
        await telegramBackupService.sendAutomatedBackup();
        results.telegram = true;
      }
    } catch (e) {
      console.warn('[DisasterRecovery] Telegram dispatch error:', e);
    }

    return { ...snapshot, coldStorage: results };
  }

  /**
   * List available snapshots
   */
  async listSnapshots() {
    return (await idbGet('snapshot_history')) || [];
  }

  /**
   * Restore state from a snapshot
   */
  async restoreSnapshot(snapshotKey) {
    const snapshot = await idbGet(snapshotKey);
    if (!snapshot || !snapshot.data) {
      throw new Error('স্ম্যাপশট ফাইল পাওয়া যায়নি বা করাপ্ট হয়েছে');
    }

    const { products, invoices, customers, debts, settings } = snapshot.data;
    if (products) await idbSet('products', products);
    if (invoices) await idbSet('invoices', invoices);
    if (customers) await idbSet('customers', customers);
    if (debts) await idbSet('debts', debts);
    if (settings) await idbSet('businessSettings', settings);

    return {
      success: true,
      restoredAt: Date.now(),
      label: snapshot.label
    };
  }
}

export const disasterRecoveryService = new DisasterRecoveryService();
