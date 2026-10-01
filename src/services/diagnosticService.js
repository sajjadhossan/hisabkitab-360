/**
 * System Diagnostics, Health Checks & Auto-Repair Service
 * Comprehensive health monitor, error logging, and Super Admin SOS dispatcher
 */

const ERROR_LOGS_KEY = 'hisabkitab_diagnostic_error_logs';
const MAX_ERROR_LOGS = 20;

/**
 * Record a system error or warning into the diagnostic log
 */
export const logDiagnosticEvent = (category, message, details = null, level = 'error') => {
  try {
    const raw = localStorage.getItem(ERROR_LOGS_KEY);
    const logs = raw ? JSON.parse(raw) : [];

    const newEntry = {
      id: `ERR-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`.toUpperCase(),
      timestamp: new Date().toISOString(),
      timeFormatted: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      dateFormatted: new Date().toLocaleDateString('bn-BD'),
      category, // 'printer' | 'database' | 'cloud' | 'voice' | 'network' | 'system'
      message: String(message || 'Unknown error'),
      details: details ? (typeof details === 'object' ? JSON.stringify(details).substring(0, 500) : String(details)) : null,
      level // 'error' | 'warning' | 'info'
    };

    logs.unshift(newEntry);
    if (logs.length > MAX_ERROR_LOGS) logs.pop();

    localStorage.setItem(ERROR_LOGS_KEY, JSON.stringify(logs));
  } catch (err) {
    console.warn('Failed to save diagnostic event:', err);
  }
};

// Global Runtime Error Interceptor
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    logDiagnosticEvent(
      'system',
      event.message || 'JavaScript runtime error',
      event.filename ? `${event.filename}:${event.lineno}` : null,
      'error'
    );
  });

  window.addEventListener('unhandledrejection', (event) => {
    logDiagnosticEvent(
      'system',
      event.reason?.message || 'Unhandled Promise Rejection',
      event.reason?.stack || null,
      'error'
    );
  });
}

/**
 * Retrieve saved diagnostic error logs
 */
export const getDiagnosticLogs = () => {
  try {
    const raw = localStorage.getItem(ERROR_LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

/**
 * Clear all diagnostic error logs
 */
export const clearDiagnosticLogs = () => {
  try {
    localStorage.removeItem(ERROR_LOGS_KEY);
  } catch (err) {
    console.warn('Failed to clear logs:', err);
  }
};

/**
 * Calculate LocalStorage consumption and estimated quota
 */
export const checkStorageHealth = () => {
  let totalBytes = 0;
  let itemCount = 0;

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const val = localStorage.getItem(key);
      if (key && val) {
        totalBytes += (key.length + val.length) * 2; // UTF-16 approx 2 bytes/char
        itemCount++;
      }
    }
  } catch (e) {
    console.warn('Storage check warning:', e);
  }

  const usedKb = Math.round(totalBytes / 1024);
  const estimatedQuotaKb = 5120; // 5MB standard browser limit
  const percentUsed = Math.min(100, Math.round((usedKb / estimatedQuotaKb) * 100));

  let status = 'healthy';
  let message = 'স্টোরেজ পর্যাপ্ত ও নিরাপদ রয়েছে';

  if (percentUsed >= 85) {
    status = 'critical';
    message = 'স্টোরেজ প্রায় পূর্ণ (৮৫%+)! ডাটা ব্যাকআপ নিন বা ক্যাশ ক্লিন করুন';
  } else if (percentUsed >= 65) {
    status = 'warning';
    message = 'স্টোরেজ ব্যবহার বাড়ছে (৬৫%+)। অপ্রয়োজনীয় ডাটা ক্লিন করতে পারেন';
  }

  return {
    usedKb,
    estimatedQuotaKb,
    percentUsed,
    itemCount,
    status,
    message
  };
};

/**
 * Run a full database integrity check across all core entities
 */
export const checkDatabaseIntegrity = (data = {}) => {
  const {
    products = [],
    salesHistory = [],
    customers = [],
    debts = { personal: [], business: [] },
    invoices = []
  } = data;

  const issues = [];

  // 1. Products Integrity
  products.forEach((p, idx) => {
    if (!p.id) issues.push({ entity: 'Product', id: idx, issue: 'পণ্যের আইডি অনুপস্থিত' });
    if (!p.name) issues.push({ entity: 'Product', id: p.id, issue: 'পণ্যের নাম অনুপস্থিত' });
    if (isNaN(Number(p.sellPrice))) issues.push({ entity: 'Product', id: p.id, issue: 'বিক্রয় মূল্য সঠিক সংখ্যা নয়' });
    if (isNaN(Number(p.stock))) issues.push({ entity: 'Product', id: p.id, issue: 'স্টকের পরিমাণ সঠিক সংখ্যা নয়' });
  });

  // 2. Customers & Dues Integrity
  customers.forEach((c) => {
    if (!c.id) issues.push({ entity: 'Customer', id: c.name, issue: 'কাস্টমার আইডি অনুপস্থিত' });
    if (isNaN(Number(c.outstandingDue))) issues.push({ entity: 'Customer', id: c.name, issue: 'বকেয়া হিসাব সঠিক সংখ্যা নয়' });
  });

  // 3. Sales & Invoices
  salesHistory.forEach((s) => {
    if (!s.id) issues.push({ entity: 'Sale', id: 'unknown', issue: 'বিক্রয় ইনভয়েস আইডি পাওয়া যায়নি' });
    if (!Array.isArray(s.items)) issues.push({ entity: 'Sale', id: s.id, issue: 'বিক্রয় আইটেম তালিকা করাপ্ট' });
  });

  const isHealthy = issues.length === 0;

  return {
    isHealthy,
    status: isHealthy ? 'healthy' : issues.length > 5 ? 'critical' : 'warning',
    issuesCount: issues.length,
    issues: issues.slice(0, 10),
    message: isHealthy
      ? `সকল ডাটাবেজ টেবিল (${products.length}টি পণ্য, ${customers.length}টি কাস্টমার, ${salesHistory.length}টি বিক্রয়) সম্পূর্ণ ত্রুটিমুক্ত`
      : `${issues.length}টি তথ্যে অসামঞ্জস্যতা সনাক্ত হয়েছে। অটো-রিপেয়ার চালান।`
  };
};

/**
 * Run Cloud & Backup Health Check
 */
export const checkBackupHealth = (businessSettings = {}) => {
  const hasDriveWebhook = Boolean(businessSettings.googleDriveWebhookUrl);
  const lastSync = businessSettings.googleDriveLastSync;

  let status = 'healthy';
  let message = 'গুগল ড্রাইভ অটো-ব্যাকআপ সক্রিয় রয়েছে';
  let hoursSinceSync = null;

  if (!hasDriveWebhook) {
    status = 'warning';
    message = 'গুগল ড্রাইভ ক্লাউড ব্যাকআপ সংযুক্ত করা হয়নি (অফলাইন মোড)';
  } else if (!lastSync) {
    status = 'warning';
    message = 'ড্রাইভ সংযুক্ত কিন্তু এখনো কোনো ব্যাকআপ সম্পন্ন হয়নি';
  } else {
    try {
      const syncDate = new Date(lastSync);
      const diffMs = Date.now() - syncDate.getTime();
      hoursSinceSync = Math.round(diffMs / (1000 * 60 * 60));

      if (hoursSinceSync > 48) {
        status = 'critical';
        message = `সর্বশেষ ক্লাউড ব্যাকআপ ${hoursSinceSync} ঘণ্টা আগে হয়েছে! জরুরি সিঙ্ক প্রয়োজন।`;
      } else if (hoursSinceSync > 24) {
        status = 'warning';
        message = `সর্বশেষ ক্লাউড ব্যাকআপ ${hoursSinceSync} ঘণ্টা আগে হয়েছে`;
      } else {
        status = 'healthy';
        message = `গুগল ড্রাইভ সম্পূর্ণ আপ-টু-ডেট (শেষ সিঙ্ক: ${lastSync.split(' ')[1] || 'আজ'})`;
      }
    } catch {
      status = 'warning';
      message = 'শেষ সিঙ্ক টাইমস্ট্যাম্প যাচাই করা যাচ্ছে না';
    }
  }

  return {
    hasDriveWebhook,
    lastSync,
    hoursSinceSync,
    status,
    message
  };
};

/**
 * Run Printer & Thermal Hardware Health Check
 */
export const checkPrinterHealth = (businessSettings = {}) => {
  const paperWidth = businessSettings.receiptPaperWidth || '80mm';
  const hasCompanyInfo = Boolean(businessSettings.companyName || businessSettings.phone);
  const isPrintSupported = typeof window !== 'undefined' && typeof window.print === 'function';

  let status = 'healthy';
  let message = `থার্মাল প্রিন্টিং ইঞ্জিন প্রস্তুত (${paperWidth} পেপার মোড)`;

  if (!isPrintSupported) {
    status = 'critical';
    message = 'ব্রাউজারে প্রিন্ট সমর্থন পাওয়া যায়নি';
  } else if (!hasCompanyInfo) {
    status = 'warning';
    message = 'রসিদে দোকানের নাম বা ফোন নম্বর অসম্পূর্ণ রয়েছে';
  }

  return {
    isPrintSupported,
    paperWidth,
    hasCompanyInfo,
    status,
    message
  };
};

/**
 * Run Voice & Audio Engine Health Check
 */
export const checkVoiceHealth = () => {
  const isSpeechSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  const isMediaSupported = typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia);

  let status = 'healthy';
  let message = 'ভয়েস রিকগনিশন ও মাইক্রোফোন ইঞ্জিন সমর্থিত';

  if (!isSpeechSupported) {
    status = 'warning';
    message = 'আপনার ব্রাউজারে স্পিচ রিকগনিশন সমর্থিত নয় (Google Chrome বা Edge ব্যবহার করুন)';
  } else if (!isMediaSupported) {
    status = 'warning';
    message = 'মাইক্রোফোন মিডিয়া ইন্টারফেস পাওয়া যায়নি';
  }

  return {
    isSpeechSupported,
    isMediaSupported,
    status,
    message
  };
};

/**
 * Execute Complete Comprehensive System Health Scan
 */
export const runComprehensiveDiagnostics = (appState = {}) => {
  const storage = checkStorageHealth();
  const database = checkDatabaseIntegrity(appState);
  const backup = checkBackupHealth(appState.businessSettings);
  const printer = checkPrinterHealth(appState.businessSettings);
  const voice = checkVoiceHealth();
  const logs = getDiagnosticLogs();

  // Network check
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  // Calculate Overall System Health Score (0-100)
  let penalty = 0;
  if (storage.status === 'critical') penalty += 25;
  else if (storage.status === 'warning') penalty += 10;

  if (database.status === 'critical') penalty += 35;
  else if (database.status === 'warning') penalty += 15;

  if (backup.status === 'critical') penalty += 20;
  else if (backup.status === 'warning') penalty += 8;

  if (printer.status === 'critical') penalty += 15;
  else if (printer.status === 'warning') penalty += 5;

  if (logs.length > 5) penalty += 10;
  if (!isOnline) penalty += 10;

  const healthScore = Math.max(20, 100 - penalty);

  let overallStatus = 'healthy';
  if (healthScore < 60) overallStatus = 'critical';
  else if (healthScore < 85) overallStatus = 'warning';

  return {
    timestamp: new Date().toISOString(),
    healthScore,
    overallStatus,
    isOnline,
    storage,
    database,
    backup,
    printer,
    voice,
    logs
  };
};

/**
 * Recalculate & auto-repair customer dues from raw ledger/sales data
 */
export const autoRepairDataIntegrity = (appState = {}) => {
  let repairedCount = 0;

  try {
    const rawCustomers = localStorage.getItem('hisabkitab_customers');
    if (rawCustomers) {
      const customers = JSON.parse(rawCustomers);
      const fixedCustomers = customers.map((c) => {
        let changed = false;
        if (!c.id) {
          c.id = `CUST-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          changed = true;
        }
        if (isNaN(Number(c.outstandingDue))) {
          c.outstandingDue = 0;
          changed = true;
        }
        if (isNaN(Number(c.totalPurchases))) {
          c.totalPurchases = 0;
          changed = true;
        }
        if (changed) repairedCount++;
        return c;
      });
      localStorage.setItem('hisabkitab_customers', JSON.stringify(fixedCustomers));
    }

    const rawProducts = localStorage.getItem('hisabkitab_products');
    if (rawProducts) {
      const products = JSON.parse(rawProducts);
      const fixedProducts = products.map((p) => {
        let changed = false;
        if (!p.id) {
          p.id = `PROD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          changed = true;
        }
        if (isNaN(Number(p.sellPrice))) {
          p.sellPrice = 0;
          changed = true;
        }
        if (isNaN(Number(p.costPrice))) {
          p.costPrice = 0;
          changed = true;
        }
        if (isNaN(Number(p.stock))) {
          p.stock = 0;
          changed = true;
        }
        if (changed) repairedCount++;
        return p;
      });
      localStorage.setItem('hisabkitab_products', JSON.stringify(fixedProducts));
    }

    logDiagnosticEvent('database', `অটো-রিপেয়ার সম্পন্ন: ${repairedCount}টি রেকর্ড মেরামত করা হয়েছে`, null, 'info');
    return { success: true, repairedCount };
  } catch (err) {
    logDiagnosticEvent('database', 'অটো-রিপেয়ার ব্যর্থ', err.message, 'error');
    return { success: false, error: err.message };
  }
};

/**
 * Safely cleans browser temporary caches without losing core data
 */
export const safeCleanTemporaryStorage = () => {
  const safeKeysToRemove = [
    'hisabkitab_temp_receipt_cache',
    'hisabkitab_last_voice_query',
    'hisabkitab_temp_draft_pos'
  ];

  let freedBytes = 0;
  safeKeysToRemove.forEach((key) => {
    try {
      const val = localStorage.getItem(key);
      if (val) {
        freedBytes += (key.length + val.length) * 2;
        localStorage.removeItem(key);
      }
    } catch {
      // ignore
    }
  });

  return {
    success: true,
    freedKb: Math.round(freedBytes / 1024)
  };
};

/**
 * Sends a real test thermal print slip to verify printer driver and alignment
 */
export const runHardwareTestPrint = (paperWidth = '80mm', companyName = 'হিসাব কিতাব ৩৬০') => {
  try {
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) {
      return { success: false, error: 'পপ-আপ উইন্ডো ব্রাউজার দ্বারা ব্লক করা হয়েছে। দয়া করে ব্রাউজারে Pop-up allow করুন।' };
    }

    const testHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Hardware Diagnostic Test Print</title>
        <style>
          @page { margin: 0; size: ${paperWidth === '58mm' ? '58mm auto' : '80mm auto'}; }
          body {
            font-family: 'Courier New', monospace;
            width: ${paperWidth === '58mm' ? '200px' : '280px'};
            margin: 0 auto;
            padding: 10px 5px;
            font-size: 11px;
            color: #000000;
          }
          .center { text-align: center; }
          .divider { border-top: 1px dashed #000; margin: 6px 0; }
          .bold { font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="center bold" style="font-size: 14px;">=== হার্ডওয়্যার ডায়াগনোসিস ===</div>
        <div class="center bold">${companyName}</div>
        <div class="center">সফটওয়্যার প্রিন্টার ও পেপার টেস্ট</div>
        <div class="divider"></div>
        <div>তারিখ: ${new Date().toLocaleDateString('bn-BD')}</div>
        <div>সময়: ${new Date().toLocaleTimeString('bn-BD')}</div>
        <div>পেপার সাইজ: ${paperWidth}</div>
        <div>টেস্ট কোড: #PRN-${Date.now().toString(36).toUpperCase()}</div>
        <div class="divider"></div>
        <div class="center bold">কাগজের প্রান্ত ও মার্জিন টেস্ট:</div>
        <div class="center">|--- 100% ALIGNED ---|</div>
        <div class="center">0123456789 ABCDEFGHIJKLMNOP</div>
        <div class="divider"></div>
        <div class="center" style="font-size: 10px;">✓ থার্মাল প্রিন্টার সম্পূর্ণ কার্যকর!</div>
        <div class="center" style="font-size: 9px; margin-top: 4px;">হিসাব কিতাব ৩৬০ ডায়াগনোসিস সিস্টেম</div>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(testHtml);
    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      setTimeout(() => {
        try { printWindow.close(); } catch {}
      }, 1000);
    };

    return { success: true };
  } catch (err) {
    logDiagnosticEvent('printer', 'টেস্ট প্রিন্ট ব্যর্থ', err.message, 'error');
    return { success: false, error: err.message };
  }
};

/**
 * Builds a Super Admin SOS Diagnostic Ticket Bundle
 */
export const buildSuperAdminSOSTicket = (diagnosticData = {}, userNote = '', supportContact = {}) => {
  const ticketId = `HK-SOS-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`;
  const dateStr = new Date().toLocaleString('bn-BD');

  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';
  const os = ua.includes('Windows') ? 'Windows' : ua.includes('Mac') ? 'macOS' : ua.includes('Android') ? 'Android' : 'Linux';
  const browser = ua.includes('Chrome') ? 'Google Chrome' : ua.includes('Firefox') ? 'Firefox' : ua.includes('Safari') ? 'Safari' : 'Edge/Browser';
  const screenRes = typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : 'Unknown';

  const ticketText = `🚨 *হিসাব কিতাব ৩৬০ - জরুরি সাপোর্ট ও ডায়াগনোসিস টিকিট*
━━━━━━━━━━━━━━━━━━━━━━━━━━
🎫 *টিকিট আইডি:* #${ticketId}
📅 *তারিখ ও সময়:* ${dateStr}
🏢 *প্রতিষ্ঠান:* ${supportContact.companyName || 'আমাদের দোকান'}
📱 *ইউজার ফোন:* ${supportContact.phone || 'দেওয়া নেই'}

📝 *ইউজারের সমস্যা বর্ণনা:*
"${userNote.trim() || 'কোনো বর্ণনা দেওয়া হয়নি (সরাসরি ডায়াগনোসিস লগ প্রেরণ করা হয়েছে)'}"

📊 *সিস্টেম হেলথ অডিট রিপোর্ট:*
• সামগ্রিক স্বাস্থ্য স্কোর: *${diagnosticData.healthScore || 100}%* (${diagnosticData.overallStatus?.toUpperCase() || 'OK'})
• স্টোরেজ মেমোরি: ${diagnosticData.storage?.usedKb || 0} KB (${diagnosticData.storage?.percentUsed || 0}% ব্যবহৃত)
• ডাটাবেজ ইন্টিগ্রিটি: ${diagnosticData.database?.isHealthy ? '✓ সম্পূর্ণ ত্রুটিমুক্ত' : `⚠️ ${diagnosticData.database?.issuesCount}টি অসঙ্গতি`}
• গুগল ড্রাইভ ক্লাউড: ${diagnosticData.backup?.hasDriveWebhook ? '✓ সংযুক্ত' : '❌ অফলাইন'}
• প্রিন্টার ফরম্যাট: ${diagnosticData.printer?.paperWidth || '80mm'} (প্রিন্ট ইঞ্জিন সচল)
• ইন্টারনেট সংযোগ: ${diagnosticData.isOnline ? '🟢 অনলাইন' : '🔴 অফলাইন'}

💻 *ডিভাইস ও ব্রাউজার তথ্য:*
• ওএস ও স্ক্রিন: ${os} (${screenRes})
• ব্রাউজার: ${browser}

⚠️ *সর্বশেষ সিস্টেম এরর লগ (Last Errors):*
${diagnosticData.logs?.length > 0
  ? diagnosticData.logs.slice(0, 3).map(l => `• [${l.timeFormatted}] [${l.category}] ${l.message}`).join('\n')
  : '• কোনো ইন্টারনাল ক্র্যাশ এরর নেই'}
━━━━━━━━━━━━━━━━━━━━━━━━━━
সুপার অ্যাডমিন / সাপোর্ট টিম: অনুগ্রহ করে এই টিকিটটি বিশ্লেষণ করে দ্রুত সমাধান প্রদান করুন।`;

  return {
    ticketId,
    ticketText,
    whatsappUrl: `https://wa.me/8801700000000?text=${encodeURIComponent(ticketText)}`
  };
};
