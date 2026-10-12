import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Download,
  Upload,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  Calendar,
  Sparkles,
  Home,
  ShoppingCart,
  Boxes,
  TrendingDown,
  RefreshCw,
  Trash2,
  Layers,
  Filter,
  Lock,
  Key,
  ShieldCheck,
  Database,
  Archive,
  History,
  CheckCheck,
  Tag
} from 'lucide-react';
import {
  exportFamilyExpensesExcel,
  exportDailyExpensesExcel,
  exportBusinessProductsExcel,
  exportBusinessSalesExcel,
  exportDebtsExcel,
  exportFullBusinessExcel,
  generateStockReportHtml,
  generateDebtReportHtml,
  generateFullBusinessReportHtml,
  generateFamilyExpenseReportHtml,
  buildModernDocumentHtml,
  parseExcelFile,
  parsePdfFile,
  normalizeDate,
  parseAmountSafely,
  guessFolderFromText
} from '../../services/exportImportService';
import { printHtmlContent } from '../../services/printService';
import { encryptData, decryptData, downloadEncryptedBackupFile } from '../../services/cryptoService';
import { logAuditEvent, AUDIT_ACTIONS } from '../../services/auditService';

export const DataExportImportModal = ({
  isOpen,
  onClose,
  defaultTab = 'import',
  initialTarget = 'business_inventory'
}) => {
  const {
    personalExpenses = [],
    personalEvents = [],
    products = [],
    salesHistory = [],
    businessExpenses = [],
    personalDebts = [],
    businessDebts = [],
    customers = [],
    addPersonalExpense,
    addProduct,
    addBusinessExpense,
    categories = {},
    showToast,
    lang
  } = useApp();

  const [activeTab, setActiveTab] = useState(defaultTab); // 'import' | 'encrypted_backup' | 'export' | 'history'

  // EXPORT STATE
  const [exportTarget, setExportTarget] = useState(initialTarget);
  const [exportFormat, setExportFormat] = useState('pdf'); // 'excel' | 'pdf'
  const [exportDateRange, setExportDateRange] = useState('all'); // 'all' | 'this_month' | 'last_month'

  // IN-APP DOCUMENT PREVIEW STATE (Android Freeze-Proof)
  const [previewDoc, setPreviewDoc] = useState(null); // { title, subtitle, html, exportTarget }

  // Combined Debts
  const allDebts = useMemo(() => {
    const list = [...(businessDebts || []), ...(personalDebts || [])];
    const seen = new Set();
    return list.filter(d => {
      if (!d || seen.has(d.id || d.name)) return false;
      seen.add(d.id || d.name);
      return true;
    });
  }, [businessDebts, personalDebts]);

  // Handle Android Hardware Back Button & Escape Key
  React.useEffect(() => {
    if (!previewDoc) return;
    try {
      window.history.pushState({ modal: 'pdf_preview' }, '');
    } catch {}

    const handlePopState = () => {
      setPreviewDoc(null);
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setPreviewDoc(null);
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [previewDoc]);

  // IMPORT STATE
  const [importFile, setImportFile] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState({ percent: 0, stage: '' });
  const [dateRangeSummary, setDateRangeSummary] = useState({ min: '', max: '' });
  const [importDestination, setImportDestination] = useState('family'); // 'family' | 'daily' | 'biz_expense' | 'event' | 'biz_product'
  const [targetEventId, setTargetEventId] = useState(personalEvents[0]?.id || '');
  const [defaultFolder, setDefaultFolder] = useState('বিদ্যুৎ, গ্যাস ও ইউটিলিটি');

  // Excel parsing state
  const [excelData, setExcelData] = useState(null); // { headers, rawRows, detectedMapping }
  const [columnMapping, setColumnMapping] = useState({
    date: -1,
    item: -1,
    member: -1,
    amount: -1,
    quantity: -1,
    unit: -1,
    folder: -1,
    note: -1
  });

  // PDF parsing state
  const [_pdfData, setPdfData] = useState(null); // { rawLinesCount, parsedRecords }

  // Candidate rows to import (with checked status)
  const [candidateRows, setCandidateRows] = useState([]);
  const [selectAll, setSelectAll] = useState(true);

  // Backup Snapshots History State
  const [importHistory, setImportHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('hk360_smart_import_backups') || '[]');
    } catch {
      return [];
    }
  });

  const availableFolders = useMemo(() => {
    if (importDestination === 'biz_expense') {
      return [
        'ইউটিলিটি ও বিল',
        'দোকান ও গোডাউন ভাড়া',
        'দোকান ও টিফিন খরচ',
        'কর্মচারী বেতন ও মজুরি',
        'যাতায়াত ও পরিবহন খরচ',
        'অফিস সাপ্লাই ও স্টেশনারি',
        'জরুরি চিকিৎসা ও ফার্স্ট এইড',
        'অন্যান্য ব্যবসায়িক খরচ'
      ];
    }
    return categories.familyExpenseFolders || [
      'বিদ্যুৎ, গ্যাস ও ইউটিলিটি',
      'গৃহস্থালি ও নিত্য কেনাকাটা',
      'বাসা ও ফ্ল্যাট খরচ',
      'সন্তানের পড়াশোনা ও স্কুল',
      'পারিবারিক চিকিৎসা ও ওষুধ',
      'ইন্টারনেট ও মোবাইল রিচার্জ',
      'যাতায়াত ও পরিবহন',
      'অন্যান্য পারিবারিক খরচ'
    ];
  }, [importDestination, categories.familyExpenseFolders]);

  // AES-256 Encrypted Backup State
  const [encryptPassphrase, setEncryptPassphrase] = useState('');
  const [confirmEncryptPassphrase, setConfirmEncryptPassphrase] = useState('');
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [decryptPassphrase, setDecryptPassphrase] = useState('');
  const [encryptedFileToRestore, setEncryptedFileToRestore] = useState(null);
  const [isDecrypting, setIsDecrypting] = useState(false);

  const handleExecuteEncryptedExport = async () => {
    if (!encryptPassphrase || encryptPassphrase.length < 4) {
      showToast(lang === 'bn' ? 'পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।' : 'Password must be at least 4 characters.', 'warning');
      return;
    }
    if (encryptPassphrase !== confirmEncryptPassphrase) {
      showToast(lang === 'bn' ? 'দুটি পাসওয়ার্ডের মিল নেই!' : 'Passwords do not match!', 'danger');
      return;
    }

    try {
      setIsEncrypting(true);
      const backupPayload = {
        meta: {
          app: 'HisabKitab-360',
          exportedAt: new Date().toISOString(),
          version: '2.8.4'
        },
        data: {
          products,
          salesHistory,
          customers,
          businessExpenses,
          personalExpenses,
          personalEvents,
          categories
        }
      };

      const encrypted = await encryptData(backupPayload, encryptPassphrase);
      downloadEncryptedBackupFile(encrypted);
      logAuditEvent({
        action: AUDIT_ACTIONS.BACKUP_EXPORT,
        title: 'AES-256 এনক্রিপ্টেড ব্যাকআপ এক্সপোর্ট করা হয়েছে',
        entityType: 'SecurityBackup',
        note: `রপ্তানি সাইজ: ${Math.round(JSON.stringify(encrypted).length / 1024)} KB`
      });
      showToast(lang === 'bn' ? '🔒 মিলিটারী-গ্রেড AES-256 এনক্রিপ্টেড ব্যাকআপ ফাইল ডাউনলোড সম্পন্ন!' : 'Encrypted backup downloaded successfully!', 'success');
      setEncryptPassphrase('');
      setConfirmEncryptPassphrase('');
    } catch (err) {
      console.error('Encrypted export error:', err);
      showToast(err.message || 'এনক্রিপশন ব্যর্থ হয়েছে', 'danger');
    } finally {
      setIsEncrypting(false);
    }
  };

  const handleExecuteEncryptedImport = async () => {
    if (!encryptedFileToRestore) {
      showToast(lang === 'bn' ? 'অনুগ্রহ করে .hk360enc বা ব্যাকআপ ফাইল নির্বাচন করুন' : 'Please select backup file', 'warning');
      return;
    }
    if (!decryptPassphrase) {
      showToast(lang === 'bn' ? 'ফাইলটি ডিক্রিপ্ট করতে পাসওয়ার্ড প্রদান করুন' : 'Please provide password', 'warning');
      return;
    }

    try {
      setIsDecrypting(true);
      const text = await encryptedFileToRestore.text();
      const bundle = JSON.parse(text);
      const decrypted = await decryptData(bundle, decryptPassphrase);

      if (!decrypted || !decrypted.data) {
        throw new Error('অবৈধ ব্যাকআপ ফাইল কাঠামো!');
      }

      if (decrypted.data.products && Array.isArray(decrypted.data.products)) {
        localStorage.setItem('hk360_biz_products', JSON.stringify(decrypted.data.products));
      }
      if (decrypted.data.salesHistory && Array.isArray(decrypted.data.salesHistory)) {
        localStorage.setItem('hk360_biz_sales', JSON.stringify(decrypted.data.salesHistory));
      }
      if (decrypted.data.customers && Array.isArray(decrypted.data.customers)) {
        localStorage.setItem('hk360_biz_customers', JSON.stringify(decrypted.data.customers));
      }
      if (decrypted.data.personalExpenses && Array.isArray(decrypted.data.personalExpenses)) {
        localStorage.setItem('hk360_personal_expenses', JSON.stringify(decrypted.data.personalExpenses));
      }

      logAuditEvent({
        action: AUDIT_ACTIONS.DATA_RESTORE,
        title: 'AES-256 এনক্রিপ্টেড ব্যাকআপ থেকে ডেটা রিস্টোর সম্পন্ন',
        entityType: 'SecurityRestore',
        note: `ফাইলের নাম: ${encryptedFileToRestore.name}`
      });

      showToast(lang === 'bn' ? '🎉 ডেটা সফলভাবে রিস্টোর হয়েছে! সিস্টেম রিফ্রেশ হচ্ছে...' : 'Data restored successfully! Refreshing...', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err) {
      console.error('Encrypted restore error:', err);
      showToast(err.message || 'ডিক্রিপশন ব্যর্থ হয়েছে! ভুল পাসওয়ার্ড।', 'danger');
    } finally {
      setIsDecrypting(false);
    }
  };

  // ----------------------------------------------------
  // ----------------------------------------------------
  // EXPORT EXECUTION
  // ----------------------------------------------------
  const handleExecuteExport = () => {
    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      // Filter by date range
      const filterByDate = (dateStr) => {
        if (!dateStr || exportDateRange === 'all') return true;
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return true;

        if (exportDateRange === 'this_month') {
          return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
        } else if (exportDateRange === 'last_month') {
          const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
          return d.getFullYear() === lastMonthYear && d.getMonth() === lastMonth;
        }
        return true;
      };

      if (exportFormat === 'excel') {
        if (exportTarget === 'business_inventory') {
          exportBusinessProductsExcel(products, lang);
          showToast(lang === 'bn' ? 'দোকানের ইনভেন্টরি ও ড্যামেজ স্টক এক্সেল ডাউনলোড সম্পন্ন!' : 'Inventory & Damage exported');
        } else if (exportTarget === 'debts') {
          exportDebtsExcel(allDebts, lang);
          showToast(lang === 'bn' ? 'দেনা-পাওনা খাতার এক্সেল ফাইল ডাউনলোড সম্পন্ন!' : 'Debts ledger exported');
        } else if (exportTarget === 'full_business') {
          exportFullBusinessExcel({ products, debts: allDebts, salesHistory, lang });
          showToast(lang === 'bn' ? 'সম্পূর্ণ ব্যবসায়িক আর্থিক ব্যাকআপ এক্সেল ডাউনলোড সম্পন্ন!' : 'Full business backup exported');
        } else if (exportTarget === 'family') {
          const filtered = personalExpenses.filter(e => e.type === 'family' && filterByDate(e.date));
          exportFamilyExpensesExcel(filtered, lang);
          showToast(lang === 'bn' ? 'পারিবারিক বিস্তারিত খরচের এক্সেল ফাইল ডাউনলোড সম্পন্ন!' : 'Family expenses exported');
        } else if (exportTarget === 'daily') {
          const filtered = personalExpenses.filter(e => e.type === 'daily' && filterByDate(e.date));
          exportDailyExpensesExcel(filtered, lang);
          showToast(lang === 'bn' ? 'দৈনিক খরচের এক্সেল ফাইল ডাউনলোড সম্পন্ন!' : 'Daily expenses exported');
        } else if (exportTarget === 'events') {
          const filtered = personalExpenses.filter(e => e.eventId && filterByDate(e.date));
          exportFamilyExpensesExcel(filtered, lang);
          showToast(lang === 'bn' ? 'ইভেন্ট খরচের এক্সেল ফাইল ডাউনলোড সম্পন্ন!' : 'Event expenses exported');
        } else if (exportTarget === 'business_sales') {
          const filtered = salesHistory.filter(s => filterByDate(s.date));
          exportBusinessSalesExcel(filtered, lang);
          showToast(lang === 'bn' ? 'বিক্রয় খাতা এক্সেল ডাউনলোড সম্পন্ন!' : 'Sales history exported');
        }
      } else {
        // PDF Export via Modern In-App Preview Engine (Freeze-Proof on Android)
        let title = '';
        const subtitle = lang === 'bn' ? `হিসাবের সময়কাল: ${exportDateRange === 'all' ? 'সকল লেনদেন' : exportDateRange === 'this_month' ? 'চলতি মাস' : 'গত মাস'}` : `Period: ${exportDateRange}`;
        let generatedHtml = '';

        if (exportTarget === 'business_inventory') {
          title = lang === 'bn' ? 'দোকানের বর্তমান পণ্য স্টক ও ড্যামেজ রিপোর্ট' : 'Business Inventory & Damage Report';
          generatedHtml = generateStockReportHtml({ products, lang });
        } else if (exportTarget === 'debts') {
          title = lang === 'bn' ? 'দেনা-পাওনা ও বাকির খাতার পূর্ণাঙ্গ বিবরণী' : 'Debt & Credit Ledger Statement';
          generatedHtml = generateDebtReportHtml({ debts: allDebts, lang });
        } else if (exportTarget === 'full_business') {
          title = lang === 'bn' ? 'সম্পূর্ণ ব্যবসায়িক আর্থিক হিসাব ব্যাকআপ' : 'Full Business Financial Backup Report';
          generatedHtml = generateFullBusinessReportHtml({ products, debts: allDebts, salesHistory, lang });
        } else if (exportTarget === 'family') {
          title = lang === 'bn' ? 'পারিবারিক খরচের বিস্তারিত লাইন-বাই-লাইন হিসাব' : 'Detailed Family Household Expense Report';
          const filtered = personalExpenses.filter(e => e.type === 'family' && filterByDate(e.date));
          generatedHtml = generateFamilyExpenseReportHtml({ expenses: filtered, lang });
        } else if (exportTarget === 'daily') {
          title = lang === 'bn' ? 'দৈনন্দিন খরচের বিবরণী' : 'Daily Expense Statement';
          const filtered = personalExpenses.filter(e => e.type === 'daily' && filterByDate(e.date));
          const total = filtered.reduce((s, e) => s + (Number(e.amount) || 0), 0);
          const cols = [
            { header: 'তারিখ', key: 'date' },
            { header: 'ক্যাটাগরি', key: 'cat' },
            { header: 'আইটেম', key: 'item' },
            { header: 'টাকা (৳)', key: 'amount', align: 'right' }
          ];
          const rows = filtered.map(item => ({
            date: item.date,
            cat: item.category || 'সাধারণ',
            item: item.item || item.title,
            amount: `৳${(Number(item.amount) || 0).toLocaleString('en-IN')}`
          }));
          generatedHtml = buildModernDocumentHtml({
            title,
            subtitle,
            tables: [{ columns: cols, rows }],
            summaryRows: [{ label: 'মোট দৈনিক খরচ:', value: `৳${total.toLocaleString('en-IN')}` }],
            lang
          });
        } else if (exportTarget === 'business_sales') {
          title = lang === 'bn' ? 'বিক্রয় খাতা রিপোর্ট' : 'Sales History Report';
          const filtered = salesHistory.filter(s => filterByDate(s.date));
          const total = filtered.reduce((s, e) => s + (Number(e.grandTotal) || 0), 0);
          const cols = [
            { header: 'ইনভয়েস নং', key: 'inv' },
            { header: 'তারিখ', key: 'date' },
            { header: 'কাস্টমার', key: 'cust' },
            { header: 'পেমেন্ট মেথড', key: 'method' },
            { header: 'মোট মূল্য (৳)', key: 'total', align: 'right' }
          ];
          const rows = filtered.map(s => ({
            inv: s.invoiceNo || `INV-${s.id}`,
            date: (s.date || '').split('T')[0],
            cust: s.customerName || 'খুচরা ক্রেতা',
            method: s.paymentMethod || 'cash',
            total: `৳${(Number(s.grandTotal) || 0).toLocaleString('en-IN')}`
          }));
          generatedHtml = buildModernDocumentHtml({
            title,
            subtitle,
            tables: [{ columns: cols, rows }],
            summaryRows: [{ label: 'মোট বিক্রয়:', value: `৳${total.toLocaleString('en-IN')}` }],
            lang
          });
        } else {
          // Default fallback
          title = lang === 'bn' ? 'হিসাব রিপোর্ট' : 'General Report';
          generatedHtml = buildModernDocumentHtml({ title, subtitle, tables: [], lang });
        }

        // Open in-app freeze-proof preview sheet
        setPreviewDoc({
          title,
          subtitle,
          html: generatedHtml,
          exportTarget
        });
      }
    } catch (err) {
      console.error(err);
      showToast(lang === 'bn' ? 'এক্সপোর্টে সমস্যা হয়েছে' : 'Export failed', 'danger');
    }
  };

  // ----------------------------------------------------
  // IMPORT: FILE UPLOAD & PARSE
  // ----------------------------------------------------
  // ----------------------------------------------------
  // IMPORT: FILE SELECT & START ANALYSIS
  // ----------------------------------------------------
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setCandidateRows([]);
    setExcelData(null);
    setPdfData(null);
    setParseProgress({ percent: 0, stage: '' });
    setDateRangeSummary({ min: '', max: '' });
    showToast(lang === 'bn' ? `✓ "${file.name}" নির্বাচিত হয়েছে। অ্যানালাইসিস শুরু করতে নিচের বাটনে চাপুন।` : `File "${file.name}" selected. Click Start Analysis.`, 'success');
  };

  const handleStartAnalysis = async () => {
    if (!importFile) {
      showToast(lang === 'bn' ? 'দয়া করে প্রথমে একটি Excel বা PDF ফাইল নির্বাচন করুন।' : 'Please select a file first.', 'warning');
      return;
    }

    setIsParsing(true);
    setCandidateRows([]);
    setExcelData(null);
    setPdfData(null);
    setParseProgress({ percent: 10, stage: 'ফাইল রিড শুরু হচ্ছে...' });

    const isExcel = /\.(xlsx|xls|csv)$/i.test(importFile.name);
    const isPdf = /\.pdf$/i.test(importFile.name);

    try {
      if (isExcel) {
        setParseProgress({ percent: 35, stage: 'এক্সেল স্প্রেডশীট প্রসেস হচ্ছে...' });
        const parsed = await parseExcelFile(importFile);
        setExcelData(parsed);
        setColumnMapping(parsed.detectedMapping);

        // Generate candidate rows from detected mapping
        buildCandidateRowsFromExcel(parsed.rawRows, parsed.detectedMapping);
        setParseProgress({ percent: 100, stage: 'এক্সেল প্রসেসিং সম্পন্ন!' });
      } else if (isPdf) {
        const parsed = await parsePdfFile(importFile, (prog) => {
          setParseProgress(prog);
        });
        setPdfData(parsed);

        // Convert parsed records into candidate rows with accurate date and amount
        const rows = parsed.parsedRecords.map((rec, i) => {
          const finalDate = normalizeDate(rec.date);
          const finalAmount = parseAmountSafely(rec.amount);
          const finalFolder = rec.folder || guessFolderFromText(rec.item, importDestination);
          return {
            id: `cand-pdf-${i}-${Date.now()}`,
            serial: rec.serial || (i + 1),
            selected: true,
            date: finalDate,
            item: rec.item || 'অজ্ঞাত খরচ',
            amount: finalAmount,
            quantity: rec.quantity || null,
            unit: rec.unit || '',
            folder: finalFolder,
            note: rec.note || 'PDF থেকে ইমপোর্টকৃত'
          };
        });

        setCandidateRows(rows);

        if (rows.length > 0) {
          const dates = rows.map(r => r.date).filter(Boolean).sort();
          if (dates.length > 0) {
            setDateRangeSummary({ min: dates[0], max: dates[dates.length - 1] });
          }
          const totalSum = rows.reduce((s, r) => s + r.amount, 0);
          showToast(lang === 'bn' ? `🎉 মোট ${rows.length}টি লেনদেন (সর্বমোট ৳${totalSum.toLocaleString('en-IN')}) সফলভাবে লোড হয়েছে!` : `Extracted ${rows.length} transactions (Total ৳${totalSum.toLocaleString('en-IN')})!`, 'success');
        } else {
          showToast(lang === 'bn' ? '⚠️ PDF ফাইলে কোনো লেনদেন চিহ্নিত করা যায়নি। ফাইলটি চেক করুন।' : 'No transactions found in PDF.', 'warning');
        }
      } else {
        showToast(lang === 'bn' ? 'শুধুমাত্র Excel (.xlsx, .csv) বা PDF ফাইল আপলোড করুন' : 'Please upload .xlsx, .csv or .pdf', 'warning');
      }
    } catch (err) {
      console.error('File parsing error:', err);
      showToast(err.message || (lang === 'bn' ? 'ফাইল পড়তে সমস্যা হয়েছে' : 'Could not read file'), 'danger');
    } finally {
      setIsParsing(false);
    }
  };

  // Build candidate rows when mapping changes or Excel parsed
  const buildCandidateRowsFromExcel = (rawRows, mapping) => {
    const candidates = [];
    rawRows.forEach((row, i) => {
      const itemVal = mapping.item !== -1 ? String(row[mapping.item] || '').trim() : '';
      const rawAmt = mapping.amount !== -1 ? row[mapping.amount] : 0;
      const amountVal = parseAmountSafely(rawAmt);

      if (itemVal && amountVal > 0) {
        const rawDate = mapping.date !== -1 && row[mapping.date] ? row[mapping.date] : null;
        const dateVal = normalizeDate(rawDate);
        const memberVal = mapping.member !== -1 && row[mapping.member] ? String(row[mapping.member]).trim() : '';
        const qtyVal = mapping.quantity !== -1 && row[mapping.quantity] ? parseAmountSafely(row[mapping.quantity]) : null;
        const unitVal = mapping.unit !== -1 && row[mapping.unit] ? String(row[mapping.unit]).trim() : '';
        const folderVal = mapping.folder !== -1 && row[mapping.folder]
          ? String(row[mapping.folder]).trim()
          : guessFolderFromText(itemVal, importDestination);
        const noteVal = mapping.note !== -1 && row[mapping.note] ? String(row[mapping.note]).trim() : '';

        candidates.push({
          id: `cand-xls-${i}-${Date.now()}`,
          serial: i + 1,
          selected: true,
          date: dateVal,
          item: itemVal,
          member: memberVal,
          amount: amountVal,
          quantity: qtyVal,
          unit: unitVal,
          folder: folderVal,
          note: noteVal || 'Excel থেকে ইমপোর্টকৃত'
        });
      }
    });

    setCandidateRows(candidates);
    if (candidates.length > 0) {
      const dates = candidates.map(r => r.date).filter(Boolean).sort();
      if (dates.length > 0) {
        setDateRangeSummary({ min: dates[0], max: dates[dates.length - 1] });
      }
    }
  };

  // Inline Row Updates (Allow user to correct date, title, folder, amount before importing)
  const updateCandidateRow = (id, field, value) => {
    setCandidateRows(prev => prev.map(r => {
      if (r.id !== id) return r;
      if (field === 'amount') {
        return { ...r, amount: parseAmountSafely(value) };
      }
      return { ...r, [field]: value };
    }));
  };

  const deleteCandidateRow = (id) => {
    setCandidateRows(prev => prev.filter(r => r.id !== id));
  };

  // Toggle single row
  const toggleRow = (id) => {
    setCandidateRows(prev => prev.map(r => r.id === id ? { ...r, selected: !r.selected } : r));
  };

  // Toggle all rows
  const toggleSelectAll = () => {
    const nextVal = !selectAll;
    setSelectAll(nextVal);
    setCandidateRows(prev => prev.map(r => ({ ...r, selected: nextVal })));
  };

  // Live Comprehensive Reconciliation & Audit Metrics
  const candidateMetrics = useMemo(() => {
    const totalFoundCount = candidateRows.length;
    const totalFoundAmount = candidateRows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    const selectedRows = candidateRows.filter(r => r.selected);
    const selectedCount = selectedRows.length;
    const selectedAmount = selectedRows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

    const categoryBreakdown = {};
    selectedRows.forEach(r => {
      const cat = r.folder || (importDestination === 'biz_expense' ? 'অন্যান্য ব্যবসায়িক খরচ' : 'গৃহস্থালি ও নিত্য কেনাকাটা');
      if (!categoryBreakdown[cat]) {
        categoryBreakdown[cat] = { count: 0, amount: 0 };
      }
      categoryBreakdown[cat].count += 1;
      categoryBreakdown[cat].amount += (Number(r.amount) || 0);
    });

    return {
      totalFoundCount,
      totalFoundAmount,
      selectedCount,
      selectedAmount,
      categoryBreakdown
    };
  }, [candidateRows, importDestination]);

  // Execute Import & Auto Snapshot Backup
  const handleExecuteImport = () => {
    const selectedRows = candidateRows.filter(r => r.selected);
    if (selectedRows.length === 0) {
      showToast(lang === 'bn' ? 'কোনো সারি নির্বাচন করা হয়নি' : 'No rows selected', 'warning');
      return;
    }

    const linkedEvent = personalEvents.find(e => e.id === targetEventId);

    let count = 0;
    selectedRows.forEach(row => {
      if (importDestination === 'family') {
        addPersonalExpense({
          title: row.item,
          item: row.item,
          amount: Number(row.amount),
          quantity: row.quantity,
          unit: row.unit,
          folder: row.folder || defaultFolder,
          category: row.folder || defaultFolder,
          member: row.member || row.person || '',
          type: 'family',
          date: row.date,
          note: row.note ? `${row.note} (স্মার্ট ব্যাকআপ)` : 'স্মার্ট ব্যাকআপ'
        });
        count++;
      } else if (importDestination === 'daily') {
        addPersonalExpense({
          title: row.item,
          item: row.item,
          amount: Number(row.amount),
          quantity: row.quantity,
          unit: row.unit,
          member: row.member || row.person || '',
          category: 'bazaar',
          type: 'daily',
          date: row.date,
          note: row.note ? `${row.note} (স্মার্ট ব্যাকআপ)` : 'স্মার্ট ব্যাকআপ'
        });
        count++;
      } else if (importDestination === 'event') {
        addPersonalExpense({
          title: row.item,
          item: row.item,
          amount: Number(row.amount),
          quantity: row.quantity,
          unit: row.unit,
          folder: row.folder || defaultFolder,
          category: row.folder || defaultFolder,
          type: 'family',
          eventId: targetEventId,
          eventName: linkedEvent ? linkedEvent.title : '',
          date: row.date,
          note: row.note ? `${row.note} (স্মার্ট ব্যাকআপ)` : 'স্মার্ট ব্যাকআপ'
        });
        count++;
      } else if (importDestination === 'biz_expense') {
        addBusinessExpense({
          title: row.item,
          amount: Number(row.amount),
          category: row.folder || 'other',
          date: row.date,
          note: row.note ? `${row.note} (স্মার্ট ব্যাকআপ)` : 'স্মার্ট ব্যাকআপ'
        });
        count++;
      } else if (importDestination === 'biz_product') {
        addProduct({
          name: row.item,
          barcode: `IMP-${Date.now().toString().slice(-6)}`,
          sku: `SKU-${Date.now().toString().slice(-4)}`,
          category: 'General',
          stock: row.quantity || 10,
          costPrice: Math.round(row.amount * 0.8),
          sellingPrice: row.amount
        });
        count++;
      }
    });

    // Automatically Create Persistent Backup Snapshot
    const backupSnapshot = {
      id: `bk-${Date.now()}`,
      fileName: importFile ? importFile.name : 'Data_Import.xlsx',
      fileSize: importFile ? importFile.size : 0,
      importedAt: new Date().toISOString(),
      destination: importDestination,
      itemCount: selectedRows.length,
      totalAmount: candidateMetrics.selectedAmount,
      dateRange: dateRangeSummary,
      categoryBreakdown: Object.entries(candidateMetrics.categoryBreakdown).map(([cat, info]) => ({
        name: cat,
        count: info.count,
        amount: info.amount
      })),
      items: selectedRows
    };

    try {
      const existingHist = JSON.parse(localStorage.getItem('hk360_smart_import_backups') || '[]');
      const updatedHist = [backupSnapshot, ...existingHist].slice(0, 30);
      localStorage.setItem('hk360_smart_import_backups', JSON.stringify(updatedHist));
      setImportHistory(updatedHist);
    } catch (e) {
      console.warn('Backup history storage warning:', e);
    }

    logAuditEvent({
      action: AUDIT_ACTIONS.DATA_IMPORT,
      title: 'স্মার্ট এক্সপেন্স ইমপোর্ট ও অটো-ব্যাকআপ সম্পন্ন',
      entityType: 'SmartExpenseImport',
      note: `ফাইল: ${backupSnapshot.fileName} | রেকর্ড: ${count}টি | মোট ৳${candidateMetrics.selectedAmount.toLocaleString('en-IN')}`
    });

    showToast(
      lang === 'bn'
        ? `🎉 সফলভাবে ${count}টি রেকর্ড (সর্বমোট ৳${candidateMetrics.selectedAmount.toLocaleString('en-IN')}) রানিং খরচে যুক্ত ও ব্যাকআপ সংরক্ষণ সম্পন্ন হয়েছে!`
        : `Successfully imported ${count} records (Total ৳${candidateMetrics.selectedAmount.toLocaleString('en-IN')})!`
    );

    // Reset and close
    setImportFile(null);
    setCandidateRows([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay modal-backdrop modal-top-align"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1300,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: 'max(12px, env(safe-area-inset-top, 12px)) 10px max(16px, env(safe-area-inset-bottom, 16px))',
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-content animate-scale-up android-scroll-view"
        style={{
          maxWidth: '740px',
          width: '95%',
          marginTop: '4px',
          background: 'var(--bg-card)',
          borderRadius: '18px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
          padding: '1.25rem',
          maxHeight: 'calc(100dvh - 24px)',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain'
        }}
      >
        {/* Modal Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0f766e, #0d9488)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(15, 118, 110, 0.3)'
              }}
            >
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>💾 স্মার্ট ব্যাকআপ ও ডেটা সেন্টার</span>
                <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '12px', background: 'rgba(14, 165, 233, 0.15)', color: '#0ea5e9', fontWeight: '800' }}>
                  PRO HUB
                </span>
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {lang === 'bn' 
                  ? 'Excel/PDF ফাইল দিন—স্বয়ংক্রিয়ভাবে তারিখ, টাকা ও ক্যাটাগরি যাচাই করে রানিং খরচে যুক্ত ও ব্যাকআপ সংরক্ষণ হবে।' 
                  : 'Import Excel/PDF into running expenses with reconciliation & secure full backup.'}
              </p>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Unified 4-Tab Switcher */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '6px', marginBottom: '1.25rem', background: 'var(--bg-main)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <button
            type="button"
            onClick={() => setActiveTab('import')}
            style={{
              padding: '8px 10px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'import' ? 'var(--bg-card)' : 'transparent',
              color: activeTab === 'import' ? '#0ea5e9' : 'var(--text-muted)',
              fontWeight: '800',
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: activeTab === 'import' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Upload size={15} style={{ color: '#0ea5e9' }} />
            <span>{lang === 'bn' ? '📥 খরচ ইমপোর্ট ও ব্যাকআপ' : 'Smart Ingest'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('encrypted_backup')}
            style={{
              padding: '8px 10px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'encrypted_backup' ? 'var(--bg-card)' : 'transparent',
              color: activeTab === 'encrypted_backup' ? '#10b981' : 'var(--text-muted)',
              fontWeight: '800',
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: activeTab === 'encrypted_backup' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <ShieldCheck size={15} style={{ color: '#10b981' }} />
            <span>{lang === 'bn' ? '🔐 ফুল সিস্টেম ব্যাকআপ' : 'Full Backup'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('export')}
            style={{
              padding: '8px 10px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'export' ? 'var(--bg-card)' : 'transparent',
              color: activeTab === 'export' ? '#f59e0b' : 'var(--text-muted)',
              fontWeight: '800',
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: activeTab === 'export' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Download size={15} style={{ color: '#f59e0b' }} />
            <span>{lang === 'bn' ? '📤 রিপোর্ট এক্সপোর্ট' : 'Export Reports'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            style={{
              padding: '8px 10px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'history' ? 'var(--bg-card)' : 'transparent',
              color: activeTab === 'history' ? '#8b5cf6' : 'var(--text-muted)',
              fontWeight: '800',
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: activeTab === 'history' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <History size={15} style={{ color: '#8b5cf6' }} />
            <span>{lang === 'bn' ? `📜 ব্যাকআপ হিস্ট্রি (${importHistory.length})` : `History (${importHistory.length})`}</span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: EXPORT SECTION                                    */}
        {/* ======================================================== */}
        {activeTab === 'export' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Step 1: Select Target Data */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text-main)' }}>
                {lang === 'bn' ? '১. কোন খাতার হিসাব এক্সপোর্ট করতে চান?' : '1. Which dataset to export?'}
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                {[
                  { id: 'business_inventory', label: lang === 'bn' ? '📦 শুধু স্টক ও ক্ষতি ব্যাকআপ' : 'Stock & Damage', sub: lang === 'bn' ? 'স্টক ভ্যালু, ড্যামেজ ক্ষতি ও রিস্টক সতর্কতা' : 'Stock value, damage loss & restock', icon: Boxes, color: '#6366f1' },
                  { id: 'debts', label: lang === 'bn' ? '🤝 শুধু দেনা-পাওনা ব্যাকআপ' : 'Debts & Receivables', sub: lang === 'bn' ? 'কার কাছে কত পাবো/দেবো ও তাগাদার তারিখ' : 'Receivables, payables & due dates', icon: Layers, color: '#0f766e' },
                  { id: 'full_business', label: lang === 'bn' ? '💎 সম্পূর্ণ ব্যাকআপ (All-in-One)' : 'Full Business Backup', sub: lang === 'bn' ? 'স্টক, ড্যামেজ, দেনা-পাওনা ও সার্বিক স্থিতি' : 'Consolidated business financial summary', icon: Database, color: '#3b82f6' },
                  { id: 'family', label: lang === 'bn' ? '🏠 পারিবারিক খরচ (আইটেম বাই আইটেম)' : 'Family Expenses', sub: lang === 'bn' ? 'তেল, চাল, ডালসহ সদস্যভিত্তিক বিস্তারিত ব্যয়' : 'Itemized household expenses', icon: Home, color: '#f97316' },
                  { id: 'daily', label: lang === 'bn' ? '🛒 দৈনন্দিন খরচ' : 'Daily Expenses', sub: lang === 'bn' ? 'দৈনিক পকেট ও সাধারণ খরচ' : 'General daily expenses', icon: ShoppingCart, color: '#10b981' },
                  { id: 'business_sales', label: lang === 'bn' ? '📈 বিক্রয় খাতা (Sales)' : 'Sales History', sub: lang === 'bn' ? 'ইনভয়েস ও মোট বিক্রির হিসাব' : 'Invoice history', icon: TrendingDown, color: '#06b6d4' }
                ].map((item) => {
                  const isSelected = exportTarget === item.id;
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setExportTarget(item.id)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '12px',
                        border: isSelected ? `2px solid ${item.color}` : '1px solid var(--border-color)',
                        background: isSelected ? 'rgba(15, 118, 110, 0.08)' : 'var(--bg-main)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={18} style={{ color: item.color }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.86rem', fontWeight: isSelected ? '800' : '700', color: 'var(--text-main)' }}>
                          {item.label}
                        </span>
                        {item.sub && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {item.sub}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Format & Date Range */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-main)' }}>
                  {lang === 'bn' ? '২. এক্সপোর্ট ফরম্যাট' : '2. Export Format'}
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setExportFormat('excel')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      border: exportFormat === 'excel' ? '2px solid #10b981' : '1px solid var(--border-color)',
                      background: exportFormat === 'excel' ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-main)',
                      color: exportFormat === 'excel' ? '#059669' : 'var(--text-main)',
                      fontWeight: '700',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <FileSpreadsheet size={16} />
                    <span>Excel (.xlsx)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportFormat('pdf')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      border: exportFormat === 'pdf' ? '2px solid #ef4444' : '1px solid var(--border-color)',
                      background: exportFormat === 'pdf' ? 'rgba(239, 68, 68, 0.12)' : 'var(--bg-main)',
                      color: exportFormat === 'pdf' ? '#dc2626' : 'var(--text-main)',
                      fontWeight: '700',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <FileText size={16} />
                    <span>PDF রিপোর্ট</span>
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-main)' }}>
                  {lang === 'bn' ? '৩. সময়কাল (তারিখ সীমা)' : '3. Date Range'}
                </label>
                <select
                  value={exportDateRange}
                  onChange={(e) => setExportDateRange(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', fontSize: '0.88rem' }}
                >
                  <option value="all">{lang === 'bn' ? 'সব সময়ের সকল লেনদেন' : 'All Time Records'}</option>
                  <option value="this_month">{lang === 'bn' ? 'চলতি মাস' : 'Current Month'}</option>
                  <option value="last_month">{lang === 'bn' ? 'গত মাস' : 'Previous Month'}</option>
                </select>
              </div>
            </div>

            {/* Download Button */}
            <button
              onClick={handleExecuteExport}
              style={{
                marginTop: '0.5rem',
                padding: '12px 24px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0f766e, #0d9488)',
                color: '#ffffff',
                border: 'none',
                fontSize: '0.95rem',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 16px rgba(15, 118, 110, 0.35)'
              }}
            >
              <Download size={18} />
              <span>
                {exportFormat === 'excel'
                  ? (lang === 'bn' ? 'Microsoft Excel ফাইল ডাউনলোড করুন' : 'Download Excel File')
                  : (lang === 'bn' ? 'PDF স্টেটমেন্ট ভিউ / প্রিন্ট করুন' : 'Print / Save as PDF')}
              </span>
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: INTELLIGENT IMPORT SECTION                        */}
        {/* ======================================================== */}
        {activeTab === 'import' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Step 1: Destination Selection (User's key concern: Shop vs Family separation) */}
            <div
              style={{
                background: 'var(--bg-main)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ fontSize: '0.84rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={16} style={{ color: '#10b981' }} />
                <span>{lang === 'bn' ? '১. এই ফাইলের ডেটাগুলো কোথায় জমা করবেন?' : '1. Where to import this data?'}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '8px' }}>
                {[
                  { id: 'family', label: lang === 'bn' ? '🏠 পারিবারিক খরচ' : 'Family Expense' },
                  { id: 'daily', label: lang === 'bn' ? '🛒 দৈনন্দিন খরচ' : 'Daily Expense' },
                  { id: 'event', label: lang === 'bn' ? '🎯 নির্দিষ্ট কোনো ইভেন্ট' : 'Specific Event' },
                  { id: 'biz_expense', label: lang === 'bn' ? '🏢 দোকানের নিজস্ব খরচ' : 'Business Expense' },
                  { id: 'biz_product', label: lang === 'bn' ? '🏢 দোকানের বিক্রির পণ্য' : 'Business Products' }
                ].map((dest) => (
                  <label
                    key={dest.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: importDestination === dest.id ? '2px solid #0f766e' : '1px solid var(--border-color)',
                      background: importDestination === dest.id ? 'rgba(15, 118, 110, 0.08)' : 'var(--bg-card)',
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      fontWeight: importDestination === dest.id ? '800' : '600'
                    }}
                  >
                    <input
                      type="radio"
                      name="importDest"
                      checked={importDestination === dest.id}
                      onChange={() => setImportDestination(dest.id)}
                    />
                    <span>{dest.label}</span>
                  </label>
                ))}
              </div>

              {/* Sub-selectors */}
              {importDestination === 'family' && (
                <div style={{ marginTop: '4px' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                    {lang === 'bn' ? 'ডিফল্ট পারিবারিক ফোল্ডার:' : 'Default Family Folder:'}
                  </label>
                  <select
                    value={defaultFolder}
                    onChange={(e) => setDefaultFolder(e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', fontSize: '0.84rem' }}
                  >
                    {availableFolders.map(f => (
                      <option key={f} value={f}>📁 {f}</option>
                    ))}
                  </select>
                </div>
              )}

              {importDestination === 'event' && (
                <div style={{ marginTop: '4px' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                    {lang === 'bn' ? 'কোন ইভেন্টের সাথে যুক্ত হবে:' : 'Select Target Event:'}
                  </label>
                  <select
                    value={targetEventId}
                    onChange={(e) => setTargetEventId(e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', fontSize: '0.84rem', fontWeight: '700' }}
                  >
                    {personalEvents.map(evt => (
                      <option key={evt.id} value={evt.id}>🎯 {evt.title}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Step 2: File Upload & Action Box */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text-main)' }}>
                {lang === 'bn' ? '২. আপনার Excel (.xlsx, .csv) বা PDF ফাইল আপলোড ও অ্যানালাইসিস করুন' : '2. Upload & Analyze Excel or PDF File'}
              </label>

              {!importFile ? (
                /* File Dropzone */
                <label
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '28px 20px',
                    borderRadius: '14px',
                    border: '2px dashed var(--border-color)',
                    background: 'var(--bg-main)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'center'
                  }}
                >
                  <div
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '50%',
                      background: 'rgba(15, 118, 110, 0.12)',
                      color: '#0f766e',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '10px'
                    }}
                  >
                    <Upload size={26} />
                  </div>
                  <div style={{ fontSize: '0.96rem', fontWeight: '800', color: 'var(--text-main)' }}>
                    {lang === 'bn' ? 'PDF বা Excel ফাইল এখানে ড্রপ করুন অথবা ক্লিক করে নির্বাচন করুন' : 'Click or drag PDF/Excel file here'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {lang === 'bn' ? 'সাপোর্টেড ফরম্যাট: .pdf (স্টেটমেন্ট/বিল/রিপোর্ট) এবং .xlsx, .xls, .csv' : 'Supported: .pdf, .xlsx, .xls, and .csv'}
                  </div>
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv, .pdf"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                </label>
              ) : (
                /* Selected File Card & Prominent Upload Action Button */
                <div style={{
                  background: 'var(--bg-main)',
                  border: '1.5px solid var(--border-color)',
                  borderRadius: '14px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '10px',
                        background: /\.pdf$/i.test(importFile.name) ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                        color: /\.pdf$/i.test(importFile.name) ? '#ef4444' : '#10b981',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {/\.pdf$/i.test(importFile.name) ? <FileText size={22} /> : <FileSpreadsheet size={22} />}
                      </div>
                      <div>
                        <div style={{ fontWeight: '800', fontSize: '0.92rem', color: 'var(--text-main)', wordBreak: 'break-all' }}>
                          {importFile.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '8px', marginTop: '2px' }}>
                          <span>সাইজ: {(importFile.size / 1024).toFixed(1)} KB</span>
                          <span>•</span>
                          <span style={{ color: /\.pdf$/i.test(importFile.name) ? '#ef4444' : '#10b981', fontWeight: '700' }}>
                            {/\.pdf$/i.test(importFile.name) ? '📄 PDF ট্রানজেকশন ফাইল' : '📊 Excel স্প্রেডশীট'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <label style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-muted)',
                      fontSize: '0.78rem',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}>
                      <RefreshCw size={14} />
                      <span>{lang === 'bn' ? 'ফাইল পরিবর্তন' : 'Change File'}</span>
                      <input
                        type="file"
                        accept=".xlsx, .xls, .csv, .pdf"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>

                  {/* PROMINENT UPLOAD & START ANALYSIS BUTTON */}
                  <button
                    type="button"
                    onClick={handleStartAnalysis}
                    disabled={isParsing}
                    style={{
                      width: '100%',
                      padding: '12px 18px',
                      borderRadius: '10px',
                      background: isParsing 
                        ? 'rgba(15, 118, 110, 0.5)' 
                        : 'linear-gradient(135deg, #0ea5e9, #0f766e)',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '0.95rem',
                      fontWeight: '800',
                      cursor: isParsing ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 16px rgba(14, 165, 233, 0.35)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Sparkles size={18} />
                    <span>
                      {isParsing
                        ? (lang === 'bn' ? 'অ্যানালাইসিস চলছে...' : 'Analyzing File...')
                        : (lang === 'bn' 
                            ? `⚡ ${/\.pdf$/i.test(importFile.name) ? 'PDF' : 'Excel'} ফাইল আপলোড ও অ্যানালাইসিস শুরু করুন` 
                            : '⚡ Upload & Start Deep Analysis')}
                    </span>
                  </button>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                    {lang === 'bn' 
                      ? '💡 স্মার্ট ইঞ্জিন ফাইলটির পৃষ্ঠা ও লাইন স্ক্যান করে তারিখ, টাকা, পণ্যের বিবরণ ও ক্যাটাগরি স্বয়ংক্রিয়ভাবে বের করবে।'
                      : 'AI/Regex engine scans pages, lines, dates, amounts, and auto-classifies categories.'}
                  </div>
                </div>
              )}
            </div>

            {/* REAL-TIME PROGRESS BAR & STAGE INDICATOR */}
            {isParsing && (
              <div style={{
                background: 'rgba(15, 118, 110, 0.08)',
                border: '1px solid rgba(15, 118, 110, 0.25)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', fontWeight: '800', color: 'var(--text-main)' }}>
                    <RefreshCw size={16} className="spin" style={{ color: '#0ea5e9' }} />
                    <span>{parseProgress.stage || (lang === 'bn' ? 'ফাইল প্রসেস হচ্ছে...' : 'Processing file...')}</span>
                  </div>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.95rem',
                    fontWeight: '900',
                    color: '#0ea5e9',
                    background: 'rgba(14, 165, 233, 0.15)',
                    padding: '2px 8px',
                    borderRadius: '6px'
                  }}>
                    {parseProgress.percent}%
                  </span>
                </div>

                {/* Progress Bar Track */}
                <div style={{
                  height: '8px',
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${parseProgress.percent}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #0ea5e9, #10b981)',
                    transition: 'width 0.25s ease',
                    borderRadius: '4px'
                  }} />
                </div>
              </div>
            )}

            {/* Column Mapper for Excel */}
            {excelData && !isParsing && (
              <div
                style={{
                  background: 'var(--bg-main)',
                  borderRadius: '10px',
                  padding: '12px',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div style={{ fontSize: '0.84rem', fontWeight: '800', marginBottom: '8px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Filter size={15} style={{ color: '#0f766e' }} />
                  <span>{lang === 'bn' ? 'কলাম ম্যাপিং যাচাই (Column Auto-Detection):' : 'Column Mapping Verification:'}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                  {/* Date Column */}
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                      {lang === 'bn' ? 'তারিখের কলাম' : 'Date Column'}
                    </label>
                    <select
                      value={columnMapping.date}
                      onChange={(e) => {
                        const next = { ...columnMapping, date: parseInt(e.target.value) };
                        setColumnMapping(next);
                        buildCandidateRowsFromExcel(excelData.rawRows, next);
                      }}
                      style={{ width: '100%', fontSize: '0.8rem', padding: '5px' }}
                    >
                      <option value="-1">স্বয়ংক্রিয় / আজকের তারিখ</option>
                      {excelData.headers.map((h, i) => (
                        <option key={i} value={i}>{h || `কলাম ${i + 1}`}</option>
                      ))}
                    </select>
                  </div>

                  {/* Item Column */}
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                      {lang === 'bn' ? 'পণ্যের নাম / বিবরণ' : 'Item Description'}
                    </label>
                    <select
                      value={columnMapping.item}
                      onChange={(e) => {
                        const next = { ...columnMapping, item: parseInt(e.target.value) };
                        setColumnMapping(next);
                        buildCandidateRowsFromExcel(excelData.rawRows, next);
                      }}
                      style={{ width: '100%', fontSize: '0.8rem', padding: '5px', fontWeight: '700' }}
                    >
                      <option value="-1">বাছাই করুন...</option>
                      {excelData.headers.map((h, i) => (
                        <option key={i} value={i}>{h || `কলাম ${i + 1}`}</option>
                      ))}
                    </select>
                  </div>

                  {/* Amount Column */}
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                      {lang === 'bn' ? 'টাকার পরিমাণ (৳)' : 'Amount Column'}
                    </label>
                    <select
                      value={columnMapping.amount}
                      onChange={(e) => {
                        const next = { ...columnMapping, amount: parseInt(e.target.value) };
                        setColumnMapping(next);
                        buildCandidateRowsFromExcel(excelData.rawRows, next);
                      }}
                      style={{ width: '100%', fontSize: '0.8rem', padding: '5px', fontWeight: '700' }}
                    >
                      <option value="-1">বাছাই করুন...</option>
                      {excelData.headers.map((h, i) => (
                        <option key={i} value={i}>{h || `কলাম ${i + 1}`}</option>
                      ))}
                    </select>
                  </div>

                  {/* Folder / Category Column */}
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                      {lang === 'bn' ? 'ফোল্ডার / ক্যাটাগরি' : 'Category Column'}
                    </label>
                    <select
                      value={columnMapping.folder}
                      onChange={(e) => {
                        const next = { ...columnMapping, folder: parseInt(e.target.value) };
                        setColumnMapping(next);
                        buildCandidateRowsFromExcel(excelData.rawRows, next);
                      }}
                      style={{ width: '100%', fontSize: '0.8rem', padding: '5px' }}
                    >
                      <option value="-1">ডিফল্ট ফোল্ডার ব্যবহার হবে</option>
                      {excelData.headers.map((h, i) => (
                        <option key={i} value={i}>{h || `কলাম ${i + 1}`}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Candidate Rows Preview & Reconciliation Dashboard */}
            {candidateRows.length > 0 && !isParsing && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* 1. MASTER RECONCILIATION & AUDIT CARD */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(14, 165, 233, 0.08))',
                  border: '1.5px solid rgba(16, 185, 129, 0.35)',
                  borderRadius: '14px',
                  padding: '14px 16px',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: '800', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        <CheckCheck size={16} />
                        <span>{lang === 'bn' ? '🔍 সামঞ্জস্য ও রিকনসিলিয়েশন অডিট' : 'Reconciliation Audit'}</span>
                      </div>
                      <h4 style={{ margin: '4px 0 2px', fontSize: '1.45rem', fontWeight: '900', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
                        ৳{candidateMetrics.selectedAmount.toLocaleString('en-IN')}
                        <span style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-muted)', marginLeft: '8px' }}>
                          ({lang === 'bn' ? 'নির্বাচিত মোট টাকা' : 'Selected Total'})
                        </span>
                      </h4>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span>
                          {lang === 'bn' 
                            ? `মোট ${candidateMetrics.selectedCount}টি খরচ প্রস্তুত (ফাইলে পাওয়া গেছে ${candidateMetrics.totalFoundCount}টি)` 
                            : `${candidateMetrics.selectedCount} of ${candidateMetrics.totalFoundCount} selected`}
                        </span>
                        {dateRangeSummary.min && (
                          <>
                            <span>•</span>
                            <span style={{ color: '#f59e0b', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Calendar size={13} />
                              {dateRangeSummary.min} থেকে {dateRangeSummary.max}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={toggleSelectAll}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-main)',
                          fontSize: '0.76rem',
                          fontWeight: '800',
                          cursor: 'pointer'
                        }}
                      >
                        {selectAll ? (lang === 'bn' ? 'সব আনচেক করুন' : 'Unselect All') : (lang === 'bn' ? 'সব সিলেক্ট করুন' : 'Select All')}
                      </button>
                    </div>
                  </div>

                  {/* Category-wise Breakdown Chips Grid */}
                  <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed rgba(16, 185, 129, 0.25)' }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Tag size={12} />
                      <span>{lang === 'bn' ? 'ক্যাটাগরি অনুযায়ী মোট টাকার বিভাজন (ফাইলের সাথে মিলান):' : 'Category Totals Breakdown:'}</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {Object.entries(candidateMetrics.categoryBreakdown).map(([catName, info]) => (
                        <div
                          key={catName}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '20px',
                            padding: '3px 10px',
                            fontSize: '0.75rem',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
                          }}
                        >
                          <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>{catName}</span>
                          <span style={{ background: 'rgba(14, 165, 233, 0.15)', color: '#0ea5e9', padding: '1px 5px', borderRadius: '10px', fontSize: '0.68rem', fontWeight: '800' }}>
                            {info.count}টি
                          </span>
                          <span style={{ fontWeight: '900', color: '#10b981' }}>
                            ৳{info.amount.toLocaleString('en-IN')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. INTERACTIVE EDITABLE PREVIEW TABLE */}
                <div style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  background: 'var(--bg-card)',
                  overflow: 'hidden'
                }}>
                  <div style={{ padding: '8px 12px', background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-main)' }}>
                      {lang === 'bn' ? '📝 লেনদেনের তালিকা (প্রয়োজনে তারিখ, নাম, ক্যাটাগরি ও টাকা সংশোধন করুন):' : 'Detailed Records (Editable):'}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {candidateRows.filter(r => r.selected).length}/{candidateRows.length} {lang === 'bn' ? 'নির্বাচিত' : 'selected'}
                    </span>
                  </div>

                  <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: 'var(--bg-main)', position: 'sticky', top: 0, borderBottom: '1px solid var(--border-color)', zIndex: 10 }}>
                          <th style={{ padding: '8px 6px', width: '30px', textAlign: 'center' }}>✓</th>
                          <th style={{ padding: '8px 4px', width: '38px', textAlign: 'center' }}>#</th>
                          <th style={{ padding: '8px 8px', width: '95px' }}>তারিখ</th>
                          <th style={{ padding: '8px 8px' }}>খরচের আইটেম / বিবরণ</th>
                          <th style={{ padding: '8px 6px', width: '90px' }}>পরিমাণ/একক</th>
                          <th style={{ padding: '8px 8px', width: '130px' }}>ক্যাটাগরি</th>
                          <th style={{ padding: '8px 8px', width: '95px', textAlign: 'right' }}>টাকা (৳)</th>
                          <th style={{ padding: '8px 6px', width: '65px', textAlign: 'center' }}>অ্যাকশন</th>
                        </tr>
                      </thead>
                      <tbody>
                        {candidateRows.map((r, idx) => (
                          <tr
                            key={r.id}
                            style={{
                              borderBottom: '1px solid var(--border-color)',
                              background: r.selected ? 'transparent' : 'rgba(255,255,255,0.02)',
                              opacity: r.selected ? 1 : 0.45,
                              transition: 'background 0.15s ease'
                            }}
                          >
                            {/* Checkbox */}
                            <td style={{ padding: '6px 6px', textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                checked={r.selected}
                                onChange={() => toggleRow(r.id)}
                                style={{ cursor: 'pointer' }}
                              />
                            </td>

                            {/* Serial Number */}
                            <td style={{ padding: '6px 4px', textAlign: 'center', fontWeight: '800', color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                              #{r.serial || (idx + 1)}
                            </td>

                            {/* Editable Date */}
                            <td style={{ padding: '6px 4px' }}>
                              <input
                                type="text"
                                value={r.date}
                                onChange={(e) => updateCandidateRow(r.id, 'date', e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '4px 6px',
                                  borderRadius: '6px',
                                  border: '1px solid var(--border-color)',
                                  background: 'var(--bg-primary)',
                                  color: 'var(--text-main)',
                                  fontSize: '0.72rem',
                                  fontFamily: 'monospace'
                                }}
                              />
                            </td>

                            {/* Editable Item Description */}
                            <td style={{ padding: '6px 4px' }}>
                              <input
                                type="text"
                                value={r.item}
                                onChange={(e) => updateCandidateRow(r.id, 'item', e.target.value)}
                                placeholder="কী কেনা হয়েছে"
                                style={{
                                  width: '100%',
                                  padding: '4px 6px',
                                  borderRadius: '6px',
                                  border: '1px solid var(--border-color)',
                                  background: 'var(--bg-primary)',
                                  color: 'var(--text-main)',
                                  fontSize: '0.78rem',
                                  fontWeight: '700'
                                }}
                              />
                            </td>

                            {/* Editable Qty & Unit */}
                            <td style={{ padding: '6px 4px' }}>
                              <div style={{ display: 'flex', gap: '2px' }}>
                                <input
                                  type="text"
                                  value={r.quantity || ''}
                                  placeholder="পরিমাণ"
                                  onChange={(e) => updateCandidateRow(r.id, 'quantity', e.target.value)}
                                  style={{
                                    width: '45px',
                                    padding: '4px 4px',
                                    borderRadius: '5px',
                                    border: '1px solid var(--border-color)',
                                    background: 'var(--bg-primary)',
                                    color: 'var(--text-main)',
                                    fontSize: '0.72rem',
                                    textAlign: 'center'
                                  }}
                                />
                                <input
                                  type="text"
                                  value={r.unit || ''}
                                  placeholder="একক"
                                  onChange={(e) => updateCandidateRow(r.id, 'unit', e.target.value)}
                                  style={{
                                    width: '40px',
                                    padding: '4px 4px',
                                    borderRadius: '5px',
                                    border: '1px solid var(--border-color)',
                                    background: 'var(--bg-primary)',
                                    color: '#06b6d4',
                                    fontSize: '0.72rem',
                                    fontWeight: '700'
                                  }}
                                />
                              </div>
                            </td>

                            {/* Editable Category Dropdown */}
                            <td style={{ padding: '6px 4px' }}>
                              <select
                                value={r.folder}
                                onChange={(e) => updateCandidateRow(r.id, 'folder', e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '4px 6px',
                                  borderRadius: '6px',
                                  border: '1px solid var(--border-color)',
                                  background: 'var(--bg-primary)',
                                  color: 'var(--text-main)',
                                  fontSize: '0.72rem'
                                }}
                              >
                                {availableFolders.map((f, fIdx) => (
                                  <option key={fIdx} value={f}>{f}</option>
                                ))}
                              </select>
                            </td>

                            {/* Editable Amount */}
                            <td style={{ padding: '6px 4px', textAlign: 'right' }}>
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={r.amount}
                                onChange={(e) => updateCandidateRow(r.id, 'amount', e.target.value)}
                                style={{
                                  width: '85px',
                                  textAlign: 'right',
                                  padding: '4px 6px',
                                  borderRadius: '6px',
                                  border: '1px solid var(--border-color)',
                                  background: 'var(--bg-primary)',
                                  color: '#10b981',
                                  fontWeight: '900',
                                  fontSize: '0.8rem'
                                }}
                              />
                            </td>

                            {/* Actions (Rename prompt + Delete) */}
                            <td style={{ padding: '6px 4px', textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newName = window.prompt(lang === 'bn' ? 'আইটেমের নাম রিনেম বা পরিবর্তন করুন:' : 'Rename item:', r.item);
                                    if (newName && newName.trim()) {
                                      updateCandidateRow(r.id, 'item', newName.trim());
                                    }
                                  }}
                                  title={lang === 'bn' ? 'নাম রিনেম করুন' : 'Rename'}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#06b6d4',
                                    cursor: 'pointer',
                                    padding: '3px',
                                    borderRadius: '4px'
                                  }}
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteCandidateRow(r.id)}
                                  title={lang === 'bn' ? 'বাদ দিন' : 'Delete'}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#ef4444',
                                    cursor: 'pointer',
                                    padding: '3px',
                                    borderRadius: '4px'
                                  }}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 3. FINAL IMPORT & AUTO-BACKUP ACTION BUTTON */}
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  style={{
                    width: '100%',
                    padding: '13px 18px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '0.96rem',
                    fontWeight: '900',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    boxShadow: '0 6px 20px rgba(16, 185, 129, 0.38)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <CheckCircle2 size={20} />
                  <span>
                    {lang === 'bn'
                      ? `💾 নির্বাচিত ${candidateMetrics.selectedCount}টি খরচ সিস্টেমে যোগ ও অটো-ব্যাকআপ করুন (মোট ৳${candidateMetrics.selectedAmount.toLocaleString('en-IN')})`
                      : `💾 Import & Auto-Backup ${candidateMetrics.selectedCount} Records (৳${candidateMetrics.selectedAmount.toLocaleString('en-IN')})`}
                  </span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: AES-256 ENCRYPTED BACKUP & RESTORE                */}
        {/* ======================================================== */}
        {activeTab === 'encrypted_backup' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{
              padding: '14px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(15, 118, 110, 0.08), rgba(16, 185, 129, 0.08))',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}>
              <ShieldCheck size={24} style={{ color: '#059669', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  {lang === 'bn' ? 'মিলিটারী-গ্রেড AES-256-GCM এন্ড-টু-এন্ড এনক্রিপশন' : 'Military-Grade AES-256-GCM E2EE Backup'}
                </h4>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {lang === 'bn'
                    ? 'আপনার হিসাবের সকল তথ্য আপনার নিজস্ব পাসওয়ার্ড দ্বারা ক্রিপ্টোগ্রাফিকভাবে লক হয়ে .hk360enc ফাইল হিসেবে ডাউনলোড হবে। আপনার পাসওয়ার্ড ছাড়া কেউ এই ব্যাকআপ খুলতে পারবে না।'
                    : 'Your entire business & personal ledger is securely encrypted with AES-256-GCM before saving. Nobody can open your data without your password.'}
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {/* Encrypted Export Card */}
              <div style={{
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-main)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Lock size={18} style={{ color: '#059669' }} />
                  <h5 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-main)' }}>
                    {lang === 'bn' ? '১. সুরক্ষিত ব্যাকআপ এক্সপোর্ট (.hk360enc)' : '1. Export Encrypted Backup'}
                  </h5>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-muted)' }}>
                    {lang === 'bn' ? 'ব্যাকআপের জন্য পাসওয়ার্ড সেট করুন:' : 'Set Backup Password:'}
                  </label>
                  <input
                    type="password"
                    placeholder="কমপক্ষে ৪ অক্ষরের পাসওয়ার্ড"
                    value={encryptPassphrase}
                    onChange={(e) => setEncryptPassphrase(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-main)',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-muted)' }}>
                    {lang === 'bn' ? 'পাসওয়ার্ড নিশ্চিত করুন:' : 'Confirm Password:'}
                  </label>
                  <input
                    type="password"
                    placeholder="পুনরায় পাসওয়ার্ড লিখুন"
                    value={confirmEncryptPassphrase}
                    onChange={(e) => setConfirmEncryptPassphrase(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-main)',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleExecuteEncryptedExport}
                  disabled={isEncrypting}
                  style={{
                    marginTop: 'auto',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #059669, #047857)',
                    color: '#fff',
                    fontWeight: '800',
                    fontSize: '0.85rem',
                    cursor: isEncrypting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Download size={16} />
                  <span>{isEncrypting ? 'এনক্রিপ্ট হচ্ছে...' : 'এনক্রিপ্টেড ব্যাকআপ ডাউনলোড করুন'}</span>
                </button>
              </div>

              {/* Encrypted Restore Card */}
              <div style={{
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-main)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Key size={18} style={{ color: '#2563eb' }} />
                  <h5 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-main)' }}>
                    {lang === 'bn' ? '২. এনক্রিপ্টেড ব্যাকআপ রিস্টোর' : '2. Restore Encrypted Backup'}
                  </h5>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-muted)' }}>
                    {lang === 'bn' ? '.hk360enc ব্যাকআপ ফাইল সিলেক্ট করুন:' : 'Select .hk360enc File:'}
                  </label>
                  <input
                    type="file"
                    accept=".hk360enc,.json"
                    onChange={(e) => setEncryptedFileToRestore(e.target.files?.[0] || null)}
                    style={{
                      width: '100%',
                      padding: '6px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-main)',
                      fontSize: '0.8rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-muted)' }}>
                    {lang === 'bn' ? 'ডিক্রিপশন পাসওয়ার্ড লিখুন:' : 'Enter Decryption Password:'}
                  </label>
                  <input
                    type="password"
                    placeholder="ব্যাকআপের পাসওয়ার্ড দিন"
                    value={decryptPassphrase}
                    onChange={(e) => setDecryptPassphrase(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-main)',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleExecuteEncryptedImport}
                  disabled={isDecrypting}
                  style={{
                    marginTop: 'auto',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                    color: '#fff',
                    fontWeight: '800',
                    fontSize: '0.85rem',
                    cursor: isDecrypting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Upload size={16} />
                  <span>{isDecrypting ? 'ডিক্রিপ্ট হচ্ছে...' : 'ডিক্রিপ্ট ও ডেটা রিস্টোর করুন'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: IMPORTED EXPENSES BACKUP ARCHIVES & HISTORY       */}
        {/* ======================================================== */}
        {activeTab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{
              padding: '12px 14px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(99, 102, 241, 0.08))',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <History size={22} style={{ color: '#8b5cf6' }} />
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.94rem', fontWeight: '800', color: 'var(--text-main)' }}>
                    {lang === 'bn' ? 'আপলোডকৃত এক্সেল ও পিডিএফ ব্যাকআপ আর্কাইভ' : 'Imported Expense Backup Archives'}
                  </h4>
                  <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    {lang === 'bn' 
                      ? 'পূর্বে ইমপোর্ট করা সমস্ত খরচের তারিখ, মোট টাকা ও ক্যাটাগরিভিত্তিক সংরক্ষিত স্ন্যাপশট।' 
                      : 'Audit log and full snapshots of all previously ingested Excel & PDF ledgers.'}
                  </p>
                </div>
              </div>

              {importHistory.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(lang === 'bn' ? 'আপনি কি সমস্ত ব্যাকআপ হিস্ট্রি ক্লিয়ার করতে চান?' : 'Clear all backup history?')) {
                      localStorage.removeItem('hk360_smart_import_backups');
                      setImportHistory([]);
                      showToast(lang === 'bn' ? 'ব্যাকআপ হিস্ট্রি ক্লিয়ার করা হয়েছে' : 'History cleared');
                    }
                  }}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    background: 'rgba(239, 68, 68, 0.08)',
                    color: '#ef4444',
                    fontSize: '0.74rem',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  {lang === 'bn' ? 'হিস্ট্রি মুছুন' : 'Clear History'}
                </button>
              )}
            </div>

            {importHistory.length === 0 ? (
              <div style={{
                padding: '36px 20px',
                textAlign: 'center',
                borderRadius: '12px',
                border: '1.5px dashed var(--border-color)',
                background: 'var(--bg-main)'
              }}>
                <Archive size={38} style={{ color: 'var(--text-muted)', marginBottom: '8px', opacity: 0.6 }} />
                <div style={{ fontSize: '0.92rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  {lang === 'bn' ? 'এখনো কোনো ব্যাকআপ সংরক্ষিত নেই' : 'No Backup Archives Found'}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {lang === 'bn' 
                    ? '১ম ট্যাবে ("খরচ ইমপোর্ট ও ব্যাকআপ") গিয়ে আপনার আগের মাসের এক্সেল বা পিডিএফ আপলোড করলেই এখানে অটো ব্যাকআপ তৈরি হবে।' 
                    : 'Upload any Excel or PDF in the first tab to automatically generate backup archives.'}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {importHistory.map((snap) => (
                  <div
                    key={snap.id}
                    style={{
                      background: 'var(--bg-main)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          background: snap.fileType === 'pdf' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                          color: snap.fileType === 'pdf' ? '#ef4444' : '#10b981',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {snap.fileType === 'pdf' ? <FileText size={18} /> : <FileSpreadsheet size={18} />}
                        </div>
                        <div>
                          <div style={{ fontWeight: '800', fontSize: '0.88rem', color: 'var(--text-main)' }}>
                            {snap.fileName}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {new Date(snap.importedAt).toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US')} • {snap.destination === 'family' ? '🏠 পারিবারিক' : snap.destination === 'biz_expense' ? '🏢 ব্যবসায়িক' : '🛒 দৈনিক'}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.05rem', fontWeight: '900', color: '#10b981' }}>
                          ৳{(Number(snap.totalAmount) || 0).toLocaleString('en-IN')}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {snap.itemCount}টি আইটেম
                        </div>
                      </div>
                    </div>

                    {/* Category summary pills */}
                    {snap.categoryBreakdown && snap.categoryBreakdown.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', paddingTop: '4px' }}>
                        {snap.categoryBreakdown.map((cat, cIdx) => (
                          <span
                            key={cIdx}
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: '700',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              background: 'var(--bg-card)',
                              border: '1px solid var(--border-color)',
                              color: 'var(--text-main)'
                            }}
                          >
                            {cat.name}: <strong>৳{(Number(cat.amount) || 0).toLocaleString('en-IN')}</strong> ({cat.count}টি)
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Action button to download snapshot */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(snap, null, 2));
                          const downloadAnchor = document.createElement('a');
                          downloadAnchor.setAttribute("href", dataStr);
                          downloadAnchor.setAttribute("download", `Backup_${snap.fileName.replace(/\.[^/.]+$/, "")}_${snap.id}.json`);
                          document.body.appendChild(downloadAnchor);
                          downloadAnchor.click();
                          downloadAnchor.remove();
                          showToast(lang === 'bn' ? 'JSON ব্যাকআপ ফাইল ডাউনলোড সম্পন্ন!' : 'Downloaded snapshot JSON');
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-card)',
                          color: 'var(--text-main)',
                          fontSize: '0.72rem',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        <Download size={12} />
                        <span>{lang === 'bn' ? 'স্ন্যাপশট ডাউনলোড' : 'Download JSON'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* In-App Interactive PDF/Report Preview Modal (Android Freeze-Proof) */}
        {previewDoc && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.88)',
              backdropFilter: 'blur(8px)',
              zIndex: 100000,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Sticky Mobile-Friendly Header with Safe Back Button */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                backgroundColor: '#0f172a',
                color: '#ffffff',
                borderBottom: '1px solid #334155',
                boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
                zIndex: 10,
                gap: '10px',
                flexWrap: 'wrap'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '800',
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)'
                  }}
                >
                  <X size={18} />
                  <span>{lang === 'bn' ? '✕ ফিরে যান' : '✕ Back / Close'}</span>
                </button>
                <div>
                  <div style={{ fontSize: '0.98rem', fontWeight: '800', color: '#f8fafc' }}>
                    {previewDoc.title}
                  </div>
                  {previewDoc.subtitle && (
                    <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                      {previewDoc.subtitle}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
                <button
                  type="button"
                  onClick={() => {
                    if (previewDoc.exportTarget === 'business_inventory') {
                      exportBusinessProductsExcel(products, lang);
                    } else if (previewDoc.exportTarget === 'debts') {
                      exportDebtsExcel(allDebts, lang);
                    } else if (previewDoc.exportTarget === 'full_business') {
                      exportFullBusinessExcel({ products, debts: allDebts, salesHistory, lang });
                    } else if (previewDoc.exportTarget === 'family') {
                      const filtered = personalExpenses.filter(e => e.type === 'family');
                      exportFamilyExpensesExcel(filtered, lang);
                    } else if (previewDoc.exportTarget === 'daily') {
                      const filtered = personalExpenses.filter(e => e.type === 'daily');
                      exportDailyExpensesExcel(filtered, lang);
                    } else if (previewDoc.exportTarget === 'business_sales') {
                      exportBusinessSalesExcel(salesHistory, lang);
                    }
                    showToast(lang === 'bn' ? 'Excel ব্যাকআপ ফাইল ডাউনলোড সম্পন্ন!' : 'Downloaded Excel backup!', 'success');
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '0.84rem',
                    cursor: 'pointer'
                  }}
                >
                  <FileSpreadsheet size={16} />
                  <span>{lang === 'bn' ? 'Excel ডাউনলোড' : 'Download Excel'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    printHtmlContent(previewDoc.html, { title: previewDoc.title, paperType: 'a4' });
                    showToast(lang === 'bn' ? '🖨️ প্রিন্ট ও PDF সংরক্ষণ ডায়ালগ ওপেন হয়েছে' : 'Print dialog triggered', 'info');
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    backgroundColor: '#0f766e',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '800',
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(15, 118, 110, 0.4)'
                  }}
                >
                  <FileText size={16} />
                  <span>{lang === 'bn' ? '🖨️ প্রিন্ট / PDF সংরক্ষণ' : 'Print / Save PDF'}</span>
                </button>
              </div>
            </div>

            {/* Document Live Preview Canvas */}
            <div
              style={{
                flex: 1,
                backgroundColor: '#e2e8f0',
                overflow: 'hidden',
                display: 'flex',
                justifyContent: 'center',
                padding: '0'
              }}
            >
              <iframe
                title="Report Document Preview"
                srcDoc={previewDoc.html}
                style={{
                  width: '100%',
                  maxWidth: '920px',
                  height: '100%',
                  border: 'none',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 0 24px rgba(0,0,0,0.15)'
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataExportImportModal;
