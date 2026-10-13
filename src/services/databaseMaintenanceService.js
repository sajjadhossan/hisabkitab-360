/**
 * HisabKitab 360 - Database Maintenance & Auto-Vacuum Scheduler
 * Tip 19: Dead Tuple Cleaner, Index Defragmentation & Local Cache Pruner
 * ---------------------------------------------------------------------
 * Monitors database bloat, defragments local storage & IndexedDB caches,
 * cleans expired draft invoices, and generates scheduled pg_cron vacuum scripts.
 */

const STORAGE_MAINTENANCE_LOG_KEY = 'hk360_db_maintenance_log';

export const runLocalDatabaseMaintenance = () => {
  const result = {
    executedAt: new Date().toISOString(),
    cleanedDrafts: 0,
    freedBytes: 0,
    orphanedKeysRemoved: 0,
    storageUsageKb: 0,
    status: 'completed'
  };

  try {
    let totalBytes = 0;
    const keysToRemove = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      const val = localStorage.getItem(key) || '';
      totalBytes += key.length + val.length;

      // Clean old draft keys older than 7 days
      if (key.startsWith('hk360_draft_pos_') || key.startsWith('hk360_temp_scanner_')) {
        try {
          const parsed = JSON.parse(val);
          if (parsed.timestamp && Date.now() - new Date(parsed.timestamp).getTime() > 7 * 86400000) {
            keysToRemove.push(key);
            result.cleanedDrafts++;
            result.freedBytes += val.length;
          }
        } catch {}
      }

      // Clean transient telemetry logs
      if (key.startsWith('hk360_telemetry_batch_')) {
        keysToRemove.push(key);
        result.orphanedKeysRemoved++;
        result.freedBytes += val.length;
      }
    }

    keysToRemove.forEach(k => localStorage.removeItem(k));
    result.storageUsageKb = (totalBytes / 1024).toFixed(2);

    // Save maintenance history
    const history = getMaintenanceHistory();
    history.unshift(result);
    localStorage.setItem(STORAGE_MAINTENANCE_LOG_KEY, JSON.stringify(history.slice(0, 10)));
  } catch (err) {
    result.status = 'error';
    result.error = err.message;
  }

  return result;
};

export const getMaintenanceHistory = () => {
  try {
    const raw = localStorage.getItem(STORAGE_MAINTENANCE_LOG_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
};

export const generatePostgresMaintenanceSql = () => {
  return `-- =========================================================================
-- HISABKITAB 360 - POSTGRESQL AUTOMATED VACUUM & REINDEX (pg_cron)
-- =========================================================================

-- ১. pg_cron এক্সটেনশন সক্রিয় করা
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ২. প্রতি রবিবার রাত ৩টায় ডেড-টুপল ভ্যাকুয়াম ও অ্যানালাইজ সিডিউল
SELECT cron.schedule(
    'weekly-vacuum-analyze',
    '0 3 * * 0',
    $$VACUUM (VERBOSE, ANALYZE) invoices, ledger_entries, products;$$
);

-- ৩. প্রতি মাসের ১ তারিখ রাত ৪টায় কনকারেন্ট ইনডেক্স রি-বিল্ড (জিরো ডাউনটাইম)
SELECT cron.schedule(
    'monthly-reindex-concurrently',
    '0 4 1 * *',
    $$REINDEX TABLE CONCURRENTLY invoices;$$
);

-- ৪. ডেটাবেস ব্লট ও ডেড-টুপল মনিটরিং ভিউ
CREATE OR REPLACE VIEW view_database_bloat_summary AS
SELECT
    schemaname,
    relname AS table_name,
    n_live_tup AS live_rows,
    n_dead_tup AS dead_rows,
    ROUND(100.0 * n_dead_tup / GREATEST(n_live_tup + n_dead_tup, 1), 2) AS dead_tuple_pct,
    last_vacuum,
    last_autovacuum
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC;
`;
};

export const databaseMaintenanceService = {
  runMaintenance: runLocalDatabaseMaintenance,
  getHistory: getMaintenanceHistory,
  generateSql: generatePostgresMaintenanceSql
};

export default databaseMaintenanceService;
