/**
 * HisabKitab 360 - Supabase Scheduled Auto-Backup Engine
 * --------------------------------------------------------
 * Manages autonomous, scheduled cloud backups to Supabase PostgreSQL & Telegram.
 * Features:
 * - User toggle: ON / OFF
 * - Modes: 'daily' (fixed time like 23:00) or 'interval' (every 1h, 6h, 12h, 24h)
 * - Persistent configuration in localStorage
 * - Real-time background runner with minute-precision heartbeat
 * - Next run calculation with humanized countdown
 * - Instant manual test trigger
 */

import { pushStateToCloud } from './cloudStateSyncService';
import { getTelegramBackupConfig, sendBackupToTelegram } from './telegramBackupService';

const STORAGE_KEY = 'hk360_supabase_scheduled_backup_config_v1';
const EVENT_CONFIG_CHANGED = 'hk360_supabase_scheduled_backup_config_changed';
const EVENT_BACKUP_EXECUTED = 'hk360_supabase_scheduled_backup_executed';

export const DEFAULT_SCHEDULED_BACKUP_CONFIG = {
  enabled: true,
  scheduleMode: 'daily', // 'daily' | 'interval'
  dailyTime: '23:00', // 24h format HH:mm (default 11:00 PM closing time)
  intervalHours: 6, // 1, 3, 6, 12, 24
  backupTelegramAlso: true,
  lastRunTimestamp: null,
  lastRunDateString: null,
  lastStatus: 'idle', // 'idle' | 'running' | 'success' | 'failed'
  lastMessage: '',
  totalBackupsRun: 0
};

/**
 * Retrieve current scheduled backup configuration
 */
export const getScheduledBackupConfig = () => {
  if (typeof window === 'undefined') return { ...DEFAULT_SCHEDULED_BACKUP_CONFIG };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SCHEDULED_BACKUP_CONFIG };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SCHEDULED_BACKUP_CONFIG,
      ...parsed
    };
  } catch (e) {
    console.error('[ScheduledBackup] Parse error:', e);
    return { ...DEFAULT_SCHEDULED_BACKUP_CONFIG };
  }
};

/**
 * Save updated configuration and notify subscribers
 */
export const saveScheduledBackupConfig = (updates = {}) => {
  try {
    const current = getScheduledBackupConfig();
    const updated = {
      ...current,
      ...updates
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(EVENT_CONFIG_CHANGED, { detail: updated }));
    }
    return updated;
  } catch (e) {
    console.error('[ScheduledBackup] Save error:', e);
    return null;
  }
};

/**
 * Calculate the next scheduled backup Date
 */
export const getNextScheduledBackupDate = (config = getScheduledBackupConfig()) => {
  if (!config.enabled) return null;

  const now = new Date();

  if (config.scheduleMode === 'interval') {
    const hours = Number(config.intervalHours) || 6;
    const intervalMs = hours * 60 * 60 * 1000;
    const lastRun = config.lastRunTimestamp ? Number(config.lastRunTimestamp) : 0;
    if (!lastRun) {
      // First run in 1 hour if never run before
      return new Date(now.getTime() + 60 * 60 * 1000);
    }
    let nextTime = lastRun + intervalMs;
    if (nextTime <= now.getTime()) {
      nextTime = now.getTime() + 60 * 1000; // Next minute if due
    }
    return new Date(nextTime);
  }

  // Daily Mode: fixed time (e.g. 23:00)
  const [hoursStr, minutesStr] = (config.dailyTime || '23:00').split(':');
  const targetHour = parseInt(hoursStr, 10) || 23;
  const targetMin = parseInt(minutesStr, 10) || 0;

  const targetDate = new Date(now);
  targetDate.setHours(targetHour, targetMin, 0, 0);

  // Check if today's scheduled time has already passed
  if (now.getTime() >= targetDate.getTime()) {
    // If lastRun was today after or at target time, schedule for tomorrow
    const todayDateStr = now.toISOString().split('T')[0];
    if (config.lastRunDateString === todayDateStr) {
      targetDate.setDate(targetDate.getDate() + 1);
    } else {
      // It was scheduled for today and hasn't run yet!
      return targetDate;
    }
  }

  return targetDate;
};

/**
 * Human-readable next run string in Bengali or English
 */
export const getFormattedNextRun = (lang = 'bn') => {
  const config = getScheduledBackupConfig();
  if (!config.enabled) {
    return lang === 'bn' ? 'অটো-ব্যাকআপ বন্ধ আছে (OFF)' : 'Auto-backup is OFF';
  }

  const nextDate = getNextScheduledBackupDate(config);
  if (!nextDate) {
    return lang === 'bn' ? 'শিডিউল সক্রিয় নয়' : 'Not scheduled';
  }

  const now = new Date();
  const diffMs = nextDate.getTime() - now.getTime();

  if (diffMs <= 0) {
    return lang === 'bn' ? 'এখনই স্বয়ংক্রিয় ব্যাকআপ হবে...' : 'Running now...';
  }

  const diffMinutes = Math.floor(diffMs / (60 * 1000));
  const diffHours = Math.floor(diffMinutes / 60);
  const remMinutes = diffMinutes % 60;

  let countdownText = '';
  if (diffHours > 0) {
    countdownText = lang === 'bn'
      ? `(আর ${diffHours} ঘণ্টা ${remMinutes} মিনিট বাকি)`
      : `(in ${diffHours}h ${remMinutes}m)`;
  } else {
    countdownText = lang === 'bn'
      ? `(আর ${diffMinutes} মিনিট বাকি)`
      : `(in ${diffMinutes}m)`;
  }

  const isToday = nextDate.toDateString() === now.toDateString();
  const isTomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString() === nextDate.toDateString();

  const timeStr = nextDate.toLocaleTimeString(lang === 'bn' ? 'bn-BD' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  let prefix = '';
  if (isToday) {
    prefix = lang === 'bn' ? 'আজ' : 'Today';
  } else if (isTomorrow) {
    prefix = lang === 'bn' ? 'আগামীকাল' : 'Tomorrow';
  } else {
    prefix = nextDate.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US');
  }

  return `${prefix} ${timeStr} ${countdownText}`;
};

let isScheduledBackupRunning = false;

/**
 * Execute the scheduled backup right now
 */
export const executeScheduledBackupNow = async ({
  getStateSnapshot,
  force = false,
  triggerReason = 'scheduled'
} = {}) => {
  const config = getScheduledBackupConfig();
  if (!force && !config.enabled) {
    return { success: false, reason: 'disabled' };
  }

  if (isScheduledBackupRunning) {
    return { success: false, reason: 'already_running' };
  }

  isScheduledBackupRunning = true;
  saveScheduledBackupConfig({ lastStatus: 'running' });

  const now = new Date();
  const todayDateStr = now.toISOString().split('T')[0];
  const timeFormatted = now.toLocaleTimeString('bn-BD', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  try {
    const snapshot = typeof getStateSnapshot === 'function' ? getStateSnapshot() : null;
    if (!snapshot) {
      throw new Error('State snapshot not available');
    }

    // 1. Push to Supabase Cloud
    const cloudRes = await pushStateToCloud(snapshot, `scheduled_auto_backup_${triggerReason}`);
    if (!cloudRes?.success) {
      throw new Error(cloudRes?.error || cloudRes?.message || 'Supabase upload failed');
    }

    // 2. Also send to Telegram if configured
    let telegramSuccess = false;
    if (config.backupTelegramAlso) {
      try {
        const tgConfig = getTelegramBackupConfig();
        if (tgConfig?.enabled && tgConfig?.botToken && tgConfig?.chatId) {
          const payload = {
            version: '2.0.0',
            backupDate: now.toISOString(),
            companyName: snapshot?.businessSettings?.companyName || 'HisabKitab 360 Store',
            summary: {
              totalInvoices: snapshot?.invoices?.length || 0,
              totalCustomers: snapshot?.customers?.length || 0,
              totalProducts: snapshot?.products?.length || 0,
              totalSales: snapshot?.salesHistory?.length || 0
            },
            data: snapshot
          };
          const tgRes = await sendBackupToTelegram(payload, tgConfig);
          telegramSuccess = !!tgRes?.success;
        }
      } catch (tgErr) {
        console.debug('[ScheduledBackup] Telegram optional error:', tgErr);
      }
    }

    // 3. Mark success
    const updated = saveScheduledBackupConfig({
      lastRunTimestamp: now.getTime(),
      lastRunDateString: todayDateStr,
      lastStatus: 'success',
      lastMessage: `সুপারবেসে শিডিউল ব্যাকআপ সফল (${timeFormatted})${telegramSuccess ? ' + টেলিগ্রাম বট সেন্ড' : ''}`,
      totalBackupsRun: (config.totalBackupsRun || 0) + 1
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(EVENT_BACKUP_EXECUTED, {
        detail: {
          success: true,
          timestamp: now.getTime(),
          timeFormatted,
          config: updated
        }
      }));
    }

    return {
      success: true,
      timestamp: now.getTime(),
      timeFormatted,
      telegramSuccess
    };
  } catch (err) {
    console.error('[ScheduledBackup] Execution failed:', err);
    saveScheduledBackupConfig({
      lastStatus: 'failed',
      lastMessage: `ব্যর্থতা: ${err.message || 'অজানা ত্রুটি'}`
    });
    return {
      success: false,
      error: err.message
    };
  } finally {
    isScheduledBackupRunning = false;
  }
};

/**
 * Starts the autonomous background worker with minute-precision
 */
export const startScheduledBackupWorker = (getStateSnapshot) => {
  if (typeof window === 'undefined') return () => {};

  // Check once immediately on boot
  const checkAndRun = () => {
    const config = getScheduledBackupConfig();
    if (!config.enabled) return;

    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    if (!isOnline) return;

    const now = new Date();
    const todayDateStr = now.toISOString().split('T')[0];

    if (config.scheduleMode === 'interval') {
      const hours = Number(config.intervalHours) || 6;
      const intervalMs = hours * 60 * 60 * 1000;
      const lastRun = config.lastRunTimestamp ? Number(config.lastRunTimestamp) : 0;
      if (!lastRun || (now.getTime() - lastRun) >= intervalMs) {
        executeScheduledBackupNow({ getStateSnapshot, triggerReason: 'interval_timer' });
      }
      return;
    }

    // Daily Mode: check if current time is at or past target time
    const [hoursStr, minutesStr] = (config.dailyTime || '23:00').split(':');
    const targetHour = parseInt(hoursStr, 10) || 23;
    const targetMin = parseInt(minutesStr, 10) || 0;

    const currentHour = now.getHours();
    const currentMin = now.getMinutes();

    // Is it past target time today?
    const isPastTargetToday = (currentHour > targetHour) || (currentHour === targetHour && currentMin >= targetMin);

    if (isPastTargetToday && config.lastRunDateString !== todayDateStr) {
      executeScheduledBackupNow({ getStateSnapshot, triggerReason: 'daily_scheduled_time' });
    }
  };

  // Run on startup after 5 seconds to let context load
  const bootTimer = setTimeout(checkAndRun, 5000);

  // Heartbeat runs every 40 seconds to catch exact minute
  const intervalId = setInterval(checkAndRun, 40000);

  return () => {
    clearTimeout(bootTimer);
    clearInterval(intervalId);
  };
};
