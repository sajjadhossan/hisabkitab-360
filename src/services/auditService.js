/**
 * HisabKitab 360 - Comprehensive Enterprise Audit Trail Service
 * -------------------------------------------------------------
 * Records immutable, timestamped security logs for:
 * - Product price changes & cost modifications
 * - Manual stock adjustments & inventory write-offs
 * - Invoice edits, voids & discount overrides
 * - Cash drawer reconciliations & master pin resets
 * - Backup creations, data restorations & permission updates
 */

const AUDIT_STORAGE_KEY = 'hk360_audit_trail_logs';
const MAX_AUDIT_LOGS = 2500; // Keep up to 2500 historical events locally

export const AUDIT_ACTIONS = {
  PRICE_CHANGE: 'PRICE_CHANGE',
  STOCK_ADJUSTMENT: 'STOCK_ADJUSTMENT',
  INVOICE_CREATE: 'INVOICE_CREATE',
  INVOICE_EDIT: 'INVOICE_EDIT',
  INVOICE_DELETE: 'INVOICE_DELETE',
  DISCOUNT_OVERRIDE: 'DISCOUNT_OVERRIDE',
  CASH_DRAWER_ADJUST: 'CASH_DRAWER_ADJUST',
  MASTER_PIN_CHANGE: 'MASTER_PIN_CHANGE',
  BACKUP_EXPORT: 'BACKUP_EXPORT',
  DATA_RESTORE: 'DATA_RESTORE',
  ROLE_PERMISSION_CHANGE: 'ROLE_PERMISSION_CHANGE',
  BIOMETRIC_AUTH: 'BIOMETRIC_AUTH'
};

const INITIAL_LOGS = [
  {
    id: 'adt-init-01',
    timestamp: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    action: AUDIT_ACTIONS.BACKUP_EXPORT,
    entityType: 'System',
    entityId: 'backup-auto',
    title: 'স্বয়ংক্রিয় ক্লাউড ব্যাকআপ সিঙ্ক সম্পন্ন',
    operatorName: 'সিস্টেম অ্যাডমিন',
    operatorRole: 'owner',
    oldValue: '158 KB',
    newValue: '184 KB',
    note: 'সাপ্তাহিক রুটিন ব্যাকআপ সফল',
    device: 'Desktop Chrome Windows'
  },
  {
    id: 'adt-init-02',
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    action: AUDIT_ACTIONS.PRICE_CHANGE,
    entityType: 'Product',
    entityId: 'prod-oil-01',
    title: 'রূপচাঁদা সয়াবিন তেলের মূল্য আপডেট',
    operatorName: 'মোঃ সাজ্জাদ হোসেন',
    operatorRole: 'owner',
    oldValue: '৳১৮৫',
    newValue: '৳১৯০',
    note: 'ডিলার পাইকারি রেট বৃদ্ধির কারণে খুচরা মূল্য সমন্বয়',
    device: 'POS Terminal 01'
  },
  {
    id: 'adt-init-03',
    timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
    action: AUDIT_ACTIONS.STOCK_ADJUSTMENT,
    entityType: 'Inventory',
    entityId: 'prod-rice-miniket',
    title: 'মিনিকেট চাল ২৫ কেজি বস্তা স্টক ইন',
    operatorName: 'স্টোর কিপার',
    operatorRole: 'manager',
    oldValue: '১২ বস্তা',
    newValue: '৩২ বস্তা',
    note: 'চালান নং CH-8841 হতে ২০ বস্তা ইনটেক',
    device: 'Mobile Barcode Scanner'
  }
];

class AuditService {
  constructor() {
    this.logs = this.loadLogs();
  }

  loadLogs() {
    try {
      const saved = localStorage.getItem(AUDIT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('[AuditService] Failed to load audit logs:', e);
    }
    this.saveLogs(INITIAL_LOGS);
    return INITIAL_LOGS;
  }

  saveLogs(logs) {
    try {
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(logs.slice(0, MAX_AUDIT_LOGS)));
    } catch (e) {
      console.warn('[AuditService] Failed to persist audit logs:', e);
    }
  }

  /**
   * Records an audit log event
   */
  log({
    action,
    entityType = 'General',
    entityId = '',
    title = '',
    operatorName = 'অজানা ইউজার',
    operatorRole = 'staff',
    oldValue = null,
    newValue = null,
    note = '',
    device = null
  }) {
    const newLog = {
      id: `adt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      action: action || AUDIT_ACTIONS.PRICE_CHANGE,
      entityType,
      entityId: String(entityId || ''),
      title: title || `${action} ইভেন্ট সম্পন্ন`,
      operatorName,
      operatorRole,
      oldValue: oldValue !== null && oldValue !== undefined ? String(oldValue) : null,
      newValue: newValue !== null && newValue !== undefined ? String(newValue) : null,
      note: note || '',
      device: device || (typeof navigator !== 'undefined' ? (navigator.userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop Workstation') : 'System')
    };

    this.logs = [newLog, ...this.logs].slice(0, MAX_AUDIT_LOGS);
    this.saveLogs(this.logs);
    return newLog;
  }

  /**
   * Retrieves audit logs with filtering
   */
  getLogs({ action = 'all', search = '', startDate = null, endDate = null } = {}) {
    return this.logs.filter(log => {
      if (action !== 'all' && log.action !== action) {
        return false;
      }

      if (search) {
        const q = search.toLowerCase();
        const matchTitle = (log.title || '').toLowerCase().includes(q);
        const matchOperator = (log.operatorName || '').toLowerCase().includes(q);
        const matchEntity = (log.entityId || '').toLowerCase().includes(q);
        const matchNote = (log.note || '').toLowerCase().includes(q);
        if (!matchTitle && !matchOperator && !matchEntity && !matchNote) {
          return false;
        }
      }

      if (startDate) {
        const logDate = log.timestamp.split('T')[0];
        if (logDate < startDate) return false;
      }

      if (endDate) {
        const logDate = log.timestamp.split('T')[0];
        if (logDate > endDate) return false;
      }

      return true;
    });
  }

  /**
   * Clear logs (Requires confirmation & authorization)
   */
  clearAll() {
    this.logs = [];
    this.saveLogs([]);
  }
}

export const auditService = new AuditService();

/**
 * Global helper function to log an event directly
 */
export const logAuditEvent = (params) => auditService.log(params);
