/**
 * HisabKitab 360 - PWA & Background Sync Manager
 * -----------------------------------------------
 * Handles Service Worker registration, Background Sync API requests,
 * and online/offline push notification permission.
 */

import { offlineSyncQueue } from './offlineSyncQueue';

class PWASyncManager {
  constructor() {
    this.registration = null;
    this.hasRegistered = false;
  }

  async register() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', { scope: './' });
      this.hasRegistered = true;

      // Listen for messages from SW
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'TRIGGER_BACKGROUND_SYNC') {
          console.log('[PWASyncManager] Background sync requested by Service Worker');
          offlineSyncQueue.flushQueue();
        }
      });

      return true;
    } catch (err) {
      console.warn('[PWASyncManager] Service Worker registration failed:', err);
      return false;
    }
  }

  /**
   * Request Background Sync when device is offline
   */
  async requestBackgroundSync() {
    if ('serviceWorker' in navigator && 'SyncManager' in window && this.registration) {
      try {
        await this.registration.sync.register('sync-offline-queue');
        return true;
      } catch (e) {
        console.warn('[PWASyncManager] Could not register sync tag:', e);
      }
    }
    return false;
  }

  /**
   * Request Web Push Notification Permission
   */
  async requestNotificationPermission() {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch {
      return false;
    }
  }
}

export const pwaSyncManager = new PWASyncManager();
