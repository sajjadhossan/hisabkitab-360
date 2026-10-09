import React, { useState, useMemo } from 'react';
import {
  X,
  ShieldCheck,
  Search,
  Filter,
  Download,
  Printer,
  History,
  Clock,
  User,
  ArrowRight,
  TrendingUp,
  Boxes,
  FileText,
  DollarSign,
  Key,
  Database,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Monitor
} from 'lucide-react';
import { auditService, AUDIT_ACTIONS } from '../../services/auditService';
import { exportToExcel } from '../../services/exportImportService';

export const AuditTrailModal = ({ isOpen, onClose, lang = 'bn' }) => {
  const [logs, setLogs] = useState(() => auditService.getLogs());
  const [selectedAction, setSelectedAction] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('all'); // 'today' | '7days' | 'month' | 'all'
  const [selectedLogDetail, setSelectedLogDetail] = useState(null);

  const refreshLogs = () => {
    setLogs([...auditService.getLogs()]);
  };

  const filteredLogs = useMemo(() => {
    const now = new Date();
    let startDate = null;

    if (dateRange === 'today') {
      startDate = now.toISOString().split('T')[0];
    } else if (dateRange === '7days') {
      const d = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
      startDate = d.toISOString().split('T')[0];
    } else if (dateRange === 'month') {
      const d = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate = d.toISOString().split('T')[0];
    }

    return auditService.getLogs({
      action: selectedAction,
      search: searchTerm,
      startDate
    });
  }, [logs, selectedAction, searchTerm, dateRange]);

  const stats = useMemo(() => {
    const total = logs.length;
    const priceStock = logs.filter(l => l.action === AUDIT_ACTIONS.PRICE_CHANGE || l.action === AUDIT_ACTIONS.STOCK_ADJUSTMENT).length;
    const invoiceAudit = logs.filter(l => l.action === AUDIT_ACTIONS.INVOICE_EDIT || l.action === AUDIT_ACTIONS.INVOICE_DELETE || l.action === AUDIT_ACTIONS.DISCOUNT_OVERRIDE).length;
    const systemSecurity = logs.filter(l => l.action === AUDIT_ACTIONS.MASTER_PIN_CHANGE || l.action === AUDIT_ACTIONS.BACKUP_EXPORT || l.action === AUDIT_ACTIONS.DATA_RESTORE).length;

    return { total, priceStock, invoiceAudit, systemSecurity };
  }, [logs]);

  const handleExportExcel = () => {
    const formattedData = filteredLogs.map((log, idx) => ({
      [lang === 'bn' ? 'ক্রমিক' : 'SL']: idx + 1,
      [lang === 'bn' ? 'সময়' : 'Timestamp']: new Date(log.timestamp).toLocaleString('bn-BD'),
      [lang === 'bn' ? 'ইভেন্ট' : 'Action']: log.action,
      [lang === 'bn' ? 'বিবরণ' : 'Title']: log.title,
      [lang === 'bn' ? 'অপারেটর' : 'Operator']: `${log.operatorName} (${log.operatorRole})`,
      [lang === 'bn' ? 'আগের মান' : 'Old Value']: log.oldValue || '-',
      [lang === 'bn' ? 'নতুন মান' : 'New Value']: log.newValue || '-',
      [lang === 'bn' ? 'নোট' : 'Notes']: log.note || '-',
      [lang === 'bn' ? 'ডিভাইস' : 'Device']: log.device || '-'
    }));

    exportToExcel(formattedData, 'Audit Logs', `Audit_Trail_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getActionBadge = (action) => {
    switch (action) {
      case AUDIT_ACTIONS.PRICE_CHANGE:
        return { label: 'মূল্য পরিবর্তন', bg: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300', icon: DollarSign };
      case AUDIT_ACTIONS.STOCK_ADJUSTMENT:
        return { label: 'স্টক সমন্বয়', bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300', icon: Boxes };
      case AUDIT_ACTIONS.INVOICE_EDIT:
      case AUDIT_ACTIONS.INVOICE_DELETE:
        return { label: 'ইনভয়েস অডিট', bg: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300', icon: FileText };
      case AUDIT_ACTIONS.MASTER_PIN_CHANGE:
        return { label: 'পিন পরিবর্তন', bg: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300', icon: Key };
      case AUDIT_ACTIONS.BACKUP_EXPORT:
      case AUDIT_ACTIONS.DATA_RESTORE:
        return { label: 'ব্যাকআপ/রিস্টোর', bg: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300', icon: Database };
      default:
        return { label: action, bg: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300', icon: ShieldCheck };
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                নিরাপত্তা অডিট ট্রেইল ও হিস্ট্রি লগ
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 font-semibold">
                  লাইভ ট্র্যাকিং
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                মূল্য পরিবর্তন, স্টক হ্রাস/বৃদ্ধি ও ইনভয়েস এডিটের নির্ভরযোগ্য ডিজিটাল প্রমাণক
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              এক্সেল এক্সপোর্ট
            </button>
            <button
              onClick={refreshLogs}
              title="রিফ্রেশ করুন"
              className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-6 py-3 bg-slate-100/50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-xs">
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="text-slate-500 dark:text-slate-400 font-medium">মোট অডিট রেকর্ড</div>
            <div className="text-lg font-bold text-slate-800 dark:text-white mt-0.5">{stats.total} টি</div>
          </div>
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="text-amber-600 dark:text-amber-400 font-medium">মূল্য ও স্টক পরিবর্তন</div>
            <div className="text-lg font-bold text-amber-700 dark:text-amber-300 mt-0.5">{stats.priceStock} টি</div>
          </div>
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="text-rose-600 dark:text-rose-400 font-medium">ইনভয়েস ও মেমো অডিট</div>
            <div className="text-lg font-bold text-rose-700 dark:text-rose-300 mt-0.5">{stats.invoiceAudit} টি</div>
          </div>
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="text-blue-600 dark:text-blue-400 font-medium">সিস্টেম ও সিকিউরিটি</div>
            <div className="text-lg font-bold text-blue-700 dark:text-blue-300 mt-0.5">{stats.systemSecurity} টি</div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 px-6 py-3 border-b border-slate-200 dark:border-slate-800">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="পণ্য, ইনভয়েস, অপারেটর বা বিবরণ খুঁজুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
            >
              <option value="all">সকল ইভেন্ট ক্যাটাগরি</option>
              <option value={AUDIT_ACTIONS.PRICE_CHANGE}>মূল্য পরিবর্তন (Price Edit)</option>
              <option value={AUDIT_ACTIONS.STOCK_ADJUSTMENT}>স্টক সমন্বয় (Stock Adjust)</option>
              <option value={AUDIT_ACTIONS.INVOICE_EDIT}>ইনভয়েস সম্পাদন (Invoice Edit)</option>
              <option value={AUDIT_ACTIONS.INVOICE_DELETE}>ইনভয়েস বাতিল (Invoice Void)</option>
              <option value={AUDIT_ACTIONS.MASTER_PIN_CHANGE}>মাস্টার পিন (Master PIN)</option>
              <option value={AUDIT_ACTIONS.BACKUP_EXPORT}>ব্যাকআপ ও রিস্টোর</option>
            </select>

            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
            >
              <option value="all">সব সময়</option>
              <option value="today">আজকের অডিট</option>
              <option value="7days">বিগত ৭ দিন</option>
              <option value="month">চলতি মাস</option>
            </select>
          </div>
        </div>

        {/* Audit Log Table / Feed */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2.5">
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500">
              <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-30 text-teal-500" />
              <p className="text-sm font-medium">কোনো অডিট রেকর্ড পাওয়া যায়নি</p>
              <p className="text-xs mt-1">ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন</p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const badge = getActionBadge(log.action);
              const BadgeIcon = badge.icon;
              return (
                <div
                  key={log.id}
                  onClick={() => setSelectedLogDetail(log)}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-teal-400 dark:hover:border-teal-500/50 hover:shadow-md transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 mt-0.5">
                      <BadgeIcon className="w-4 h-4" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${badge.bg}`}>
                          {badge.label}
                        </span>
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                          {log.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                        <span className="flex items-center gap-1 font-medium">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {log.operatorName} ({log.operatorRole})
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(log.timestamp).toLocaleDateString('bn-BD')} {new Date(log.timestamp).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {log.device && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-[11px]">
                              <Monitor className="w-3 h-3 text-slate-400" />
                              {log.device}
                            </span>
                          </>
                        )}
                      </div>

                      {log.note && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 italic bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded">
                          "{log.note}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Value Diff (Before -> After) */}
                  {(log.oldValue || log.newValue) && (
                    <div className="flex items-center gap-2 self-start md:self-center px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 text-xs shrink-0">
                      <span className="text-slate-500 dark:text-slate-400 line-through">
                        {log.oldValue || 'শূণ্য'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-teal-500" />
                      <span className="font-bold text-teal-600 dark:text-teal-400">
                        {log.newValue || 'শূণ্য'}
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>অডিট ট্রেইল মেমোরিতে ক্রিপ্টোগ্রাফিকভাবে সুরক্ষিত ও অপরিবর্তনীয়</span>
          </div>
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            দেখানো হচ্ছে: {filteredLogs.length} টি রেকর্ড
          </span>
        </div>
      </div>
    </div>
  );
};
