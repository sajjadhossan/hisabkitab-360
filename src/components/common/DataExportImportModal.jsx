import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Download,
  Upload,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertCircle,
  Folder,
  Calendar,
  Sparkles,
  Home,
  ShoppingCart,
  Boxes,
  TrendingDown,
  RefreshCw,
  Trash2,
  Layers,
  ArrowRight,
  Filter
} from 'lucide-react';
import {
  exportFamilyExpensesExcel,
  exportDailyExpensesExcel,
  exportBusinessProductsExcel,
  exportBusinessSalesExcel,
  exportTableToPrintablePdf,
  parseExcelFile,
  parsePdfFile
} from '../../services/exportImportService';

export const DataExportImportModal = ({
  isOpen,
  onClose,
  defaultTab = 'export',
  initialTarget = 'family'
}) => {
  const {
    personalExpenses,
    personalEvents = [],
    products,
    salesHistory,
    businessExpenses,
    addPersonalExpense,
    addProduct,
    addBusinessExpense,
    categories = {},
    showToast,
    lang
  } = useApp();

  const [activeTab, setActiveTab] = useState(defaultTab); // 'export' | 'import'

  // EXPORT STATE
  const [exportTarget, setExportTarget] = useState(initialTarget);
  const [exportFormat, setExportFormat] = useState('excel'); // 'excel' | 'pdf'
  const [exportDateRange, setExportDateRange] = useState('all'); // 'all' | 'this_month' | 'last_month'

  // IMPORT STATE
  const [importFile, setImportFile] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [importDestination, setImportDestination] = useState('family'); // 'family' | 'daily' | 'event' | 'biz_product' | 'biz_expense'
  const [targetEventId, setTargetEventId] = useState(personalEvents[0]?.id || '');
  const [defaultFolder, setDefaultFolder] = useState('গৃহস্থালি ও নিত্য কেনাকাটা');

  // Excel parsing state
  const [excelData, setExcelData] = useState(null); // { headers, rawRows, detectedMapping }
  const [columnMapping, setColumnMapping] = useState({
    date: -1,
    item: -1,
    amount: -1,
    quantity: -1,
    unit: -1,
    folder: -1,
    note: -1
  });

  // PDF parsing state
  const [pdfData, setPdfData] = useState(null); // { rawLinesCount, parsedRecords }

  // Candidate rows to import (with checked status)
  const [candidateRows, setCandidateRows] = useState([]);
  const [selectAll, setSelectAll] = useState(true);

  const availableFolders = categories.familyExpenseFolders || [
    'বাসা ও ফ্ল্যাট খরচ',
    'বিদ্যুৎ, গ্যাস ও ইউটিলিটি',
    'সন্তানের পড়াশোনা ও স্কুল',
    'পারিবারিক চিকিৎসা ও ওষুধ',
    'ইন্টারনেট ও মোবাইল রিচার্জ',
    'গৃহস্থালি ও নিত্য কেনাকাটা',
    'অন্যান্য পারিবারিক খরচ'
  ];

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
        if (exportTarget === 'family') {
          const filtered = personalExpenses.filter(e => e.type === 'family' && filterByDate(e.date));
          exportFamilyExpensesExcel(filtered, lang);
          showToast(lang === 'bn' ? 'পারিবারিক খরচের এক্সেল ফাইল ডাউনলোড হয়েছে' : 'Family expenses exported');
        } else if (exportTarget === 'daily') {
          const filtered = personalExpenses.filter(e => e.type === 'daily' && filterByDate(e.date));
          exportDailyExpensesExcel(filtered, lang);
          showToast(lang === 'bn' ? 'দৈনিক খরচের এক্সেল ফাইল ডাউনলোড হয়েছে' : 'Daily expenses exported');
        } else if (exportTarget === 'events') {
          const filtered = personalExpenses.filter(e => e.eventId && filterByDate(e.date));
          exportFamilyExpensesExcel(filtered, lang);
          showToast(lang === 'bn' ? 'ইভেন্ট খরচের এক্সেল ফাইল ডাউনলোড হয়েছে' : 'Event expenses exported');
        } else if (exportTarget === 'business_inventory') {
          exportBusinessProductsExcel(products, lang);
          showToast(lang === 'bn' ? 'দোকানের ইনভেন্টরি এক্সেল ডাউনলোড হয়েছে' : 'Inventory exported');
        } else if (exportTarget === 'business_sales') {
          const filtered = salesHistory.filter(s => filterByDate(s.date));
          exportBusinessSalesExcel(filtered, lang);
          showToast(lang === 'bn' ? 'বিক্রয় খাতা এক্সেল ডাউনলোড হয়েছে' : 'Sales history exported');
        }
      } else {
        // PDF Export via Printable Engine
        let title = '';
        let columns = [];
        let rows = [];
        let summaryRows = [];

        if (exportTarget === 'family') {
          title = lang === 'bn' ? 'পারিবারিক খরচের পূর্ণাঙ্গ বিবরণী' : 'Family Expense Statement';
          const filtered = personalExpenses.filter(e => e.type === 'family' && filterByDate(e.date));
          const total = filtered.reduce((s, e) => s + (Number(e.amount) || 0), 0);

          columns = [
            { header: lang === 'bn' ? 'তারিখ' : 'Date', key: 'date' },
            { header: lang === 'bn' ? 'ফোল্ডার' : 'Folder', key: 'folder' },
            { header: lang === 'bn' ? 'কি কিনলেন / বিবরণ' : 'Item Description', key: 'item' },
            { header: lang === 'bn' ? 'পরিমাণ ও একক' : 'Quantity', key: 'qty' },
            { header: lang === 'bn' ? 'টাকার পরিমাণ (৳)' : 'Amount (BDT)', key: 'amount', align: 'right' }
          ];

          rows = filtered.map(item => ({
            date: item.date,
            folder: item.folder || 'অন্যান্য',
            item: item.item || item.title,
            qty: item.quantity ? `${item.quantity} ${item.unit || ''}` : '—',
            amount: `৳${Number(item.amount).toLocaleString('en-IN')}`
          }));

          summaryRows = [
            { label: lang === 'bn' ? 'মোট পারিবারিক ব্যয়:' : 'Total Household Expense:', value: `৳${total.toLocaleString('en-IN')}` }
          ];
        } else if (exportTarget === 'daily') {
          title = lang === 'bn' ? 'দৈনন্দিন খরচের বিবরণী' : 'Daily Expense Statement';
          const filtered = personalExpenses.filter(e => e.type === 'daily' && filterByDate(e.date));
          const total = filtered.reduce((s, e) => s + (Number(e.amount) || 0), 0);

          columns = [
            { header: lang === 'bn' ? 'তারিখ' : 'Date', key: 'date' },
            { header: lang === 'bn' ? 'ক্যাটাগরি' : 'Category', key: 'category' },
            { header: lang === 'bn' ? 'আইটেম' : 'Item', key: 'item' },
            { header: lang === 'bn' ? 'পরিমাণ' : 'Qty', key: 'qty' },
            { header: lang === 'bn' ? 'টাকা (৳)' : 'Amount', key: 'amount', align: 'right' }
          ];

          rows = filtered.map(item => ({
            date: item.date,
            category: item.category || 'bazaar',
            item: item.item || item.title,
            qty: item.quantity ? `${item.quantity} ${item.unit || ''}` : '—',
            amount: `৳${Number(item.amount).toLocaleString('en-IN')}`
          }));

          summaryRows = [
            { label: lang === 'bn' ? 'মোট দৈনিক খরচ:' : 'Total Daily Expense:', value: `৳${total.toLocaleString('en-IN')}` }
          ];
        } else if (exportTarget === 'business_inventory') {
          title = lang === 'bn' ? 'দোকানের বর্তমান পণ্য স্টক রিপোর্ট' : 'Business Inventory Report';
          columns = [
            { header: lang === 'bn' ? 'বারকোড/SKU' : 'Barcode', key: 'sku' },
            { header: lang === 'bn' ? 'পণ্যের নাম' : 'Product Name', key: 'name' },
            { header: lang === 'bn' ? 'ক্যাটাগরি' : 'Category', key: 'cat' },
            { header: lang === 'bn' ? 'বর্তমান স্টক' : 'Stock', key: 'stock', align: 'center' },
            { header: lang === 'bn' ? 'বিক্রয় মূল্য (৳)' : 'Sell Price', key: 'price', align: 'right' }
          ];

          rows = products.map(p => ({
            sku: p.barcode || p.sku || '—',
            name: p.name,
            cat: p.category,
            stock: `${p.stock} টি`,
            price: `৳${Number(p.sellingPrice).toLocaleString('en-IN')}`
          }));
        }

        exportTableToPrintablePdf({
          title,
          subtitle: lang === 'bn' ? `হিসাবের সময়কাল: ${exportDateRange === 'all' ? 'সকল লেনদেন' : exportDateRange === 'this_month' ? 'চলতি মাস' : 'গত মাস'}` : `Period: ${exportDateRange}`,
          columns,
          rows,
          summaryRows,
          lang
        });
      }

      onClose();
    } catch (err) {
      console.error(err);
      showToast(lang === 'bn' ? 'এক্সপোর্টে সমস্যা হয়েছে' : 'Export failed', 'danger');
    }
  };

  // ----------------------------------------------------
  // IMPORT: FILE UPLOAD & PARSE
  // ----------------------------------------------------
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImportFile(file);
    setIsParsing(true);
    setCandidateRows([]);
    setExcelData(null);
    setPdfData(null);

    const isExcel = /\.(xlsx|xls|csv)$/i.test(file.name);
    const isPdf = /\.pdf$/i.test(file.name);

    try {
      if (isExcel) {
        const parsed = await parseExcelFile(file);
        setExcelData(parsed);
        setColumnMapping(parsed.detectedMapping);

        // Generate candidate rows from detected mapping
        buildCandidateRowsFromExcel(parsed.rawRows, parsed.detectedMapping);
      } else if (isPdf) {
        const parsed = await parsePdfFile(file);
        setPdfData(parsed);

        // Convert parsed records into candidate rows
        const rows = parsed.parsedRecords.map((rec, i) => ({
          id: `cand-${i}`,
          selected: true,
          date: rec.date || new Date().toISOString().split('T')[0],
          item: rec.item || 'অজ্ঞাত খরচ',
          amount: Number(rec.amount) || 0,
          quantity: rec.quantity || null,
          unit: rec.unit || '',
          folder: rec.folder || defaultFolder,
          note: rec.note || 'Imported from PDF'
        }));

        setCandidateRows(rows);
      } else {
        showToast(lang === 'bn' ? 'শুধুমাত্র Excel (.xlsx, .csv) বা PDF ফাইল আপলোড করুন' : 'Please upload .xlsx, .csv or .pdf', 'warning');
      }
    } catch (err) {
      console.error('File parsing error:', err);
      showToast(err.message || (lang === 'bn' ? 'ফাইল পড়তে সমস্যা হয়েছে' : 'Could not read file'), 'danger');
    } finally {
      setIsParsing(false);
      e.target.value = '';
    }
  };

  // Build candidate rows when mapping changes
  const buildCandidateRowsFromExcel = (rawRows, mapping) => {
    const candidates = [];
    rawRows.forEach((row, i) => {
      const itemVal = mapping.item !== -1 ? String(row[mapping.item] || '').trim() : '';
      const amountVal = mapping.amount !== -1 ? parseFloat(String(row[mapping.amount] || '').replace(/[^\d.-]/g, '')) : 0;

      if (itemVal && !isNaN(amountVal) && amountVal > 0) {
        const dateVal = mapping.date !== -1 && row[mapping.date] ? String(row[mapping.date]).trim() : new Date().toISOString().split('T')[0];
        const qtyVal = mapping.quantity !== -1 && row[mapping.quantity] ? parseFloat(String(row[mapping.quantity])) : null;
        const unitVal = mapping.unit !== -1 && row[mapping.unit] ? String(row[mapping.unit]).trim() : '';
        const folderVal = mapping.folder !== -1 && row[mapping.folder] ? String(row[mapping.folder]).trim() : defaultFolder;
        const noteVal = mapping.note !== -1 && row[mapping.note] ? String(row[mapping.note]).trim() : '';

        candidates.push({
          id: `cand-${i}`,
          selected: true,
          date: dateVal,
          item: itemVal,
          amount: amountVal,
          quantity: !isNaN(qtyVal) ? qtyVal : null,
          unit: unitVal,
          folder: folderVal || defaultFolder,
          note: noteVal
        });
      }
    });

    setCandidateRows(candidates);
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

  // Execute Import
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
          amount: row.amount,
          quantity: row.quantity,
          unit: row.unit,
          folder: row.folder || defaultFolder,
          category: row.folder || defaultFolder,
          type: 'family',
          date: row.date,
          note: row.note ? `${row.note} (ইমপোর্টকৃত)` : 'ইমপোর্টকৃত'
        });
        count++;
      } else if (importDestination === 'daily') {
        addPersonalExpense({
          title: row.item,
          item: row.item,
          amount: row.amount,
          quantity: row.quantity,
          unit: row.unit,
          category: 'bazaar',
          type: 'daily',
          date: row.date,
          note: row.note ? `${row.note} (ইমপোর্টকৃত)` : 'ইমপোর্টকৃত'
        });
        count++;
      } else if (importDestination === 'event') {
        addPersonalExpense({
          title: row.item,
          item: row.item,
          amount: row.amount,
          quantity: row.quantity,
          unit: row.unit,
          folder: row.folder || defaultFolder,
          category: row.folder || defaultFolder,
          type: 'family',
          eventId: targetEventId,
          eventName: linkedEvent ? linkedEvent.title : '',
          date: row.date,
          note: row.note ? `${row.note} (ইমপোর্টকৃত)` : 'ইমপোর্টকৃত'
        });
        count++;
      } else if (importDestination === 'biz_expense') {
        addBusinessExpense({
          title: row.item,
          amount: row.amount,
          category: 'other',
          date: row.date,
          note: row.note ? `${row.note} (ইমপোর্টকৃত)` : 'ইমপোর্টকৃত'
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

    showToast(
      lang === 'bn'
        ? `সফলভাবে ${count}টি রেকর্ড ইমপোর্ট করে ব্যাকআপ যুক্ত করা হয়েছে!`
        : `Successfully imported ${count} records!`
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
        padding: '20px 14px',
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        overflowY: 'auto'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-content animate-scale-up"
        style={{
          maxWidth: '740px',
          width: '95%',
          marginTop: '8px',
          background: 'var(--bg-card)',
          borderRadius: '18px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
          padding: '1.5rem',
          maxHeight: 'calc(100vh - 40px)',
          overflowY: 'auto'
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
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)' }}>
                {lang === 'bn' ? 'এক্সেল ও পিডিএফ ডেটা হাব (Export & Import)' : 'Excel & PDF Data Hub'}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {lang === 'bn' ? 'হিসাব এক্সপোর্ট করুন বা অন্য অ্যাপসের Excel/PDF থেকে ডেটা ইমপোর্ট করুন' : 'Export reports or import data from other app spreadsheets/PDFs'}
              </p>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem', background: 'var(--bg-main)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setActiveTab('export')}
            style={{
              flex: 1,
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'export' ? 'var(--bg-card)' : 'transparent',
              color: activeTab === 'export' ? 'var(--text-main)' : 'var(--text-muted)',
              fontWeight: '700',
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: activeTab === 'export' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            <Download size={16} style={{ color: '#0f766e' }} />
            <span>{lang === 'bn' ? '📤 ডেটা এক্সপোর্ট (Excel / PDF)' : 'Export Data'}</span>
          </button>

          <button
            onClick={() => setActiveTab('import')}
            style={{
              flex: 1,
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'import' ? 'var(--bg-card)' : 'transparent',
              color: activeTab === 'import' ? 'var(--text-main)' : 'var(--text-muted)',
              fontWeight: '700',
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: activeTab === 'import' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            <Upload size={16} style={{ color: '#ec4899' }} />
            <span>{lang === 'bn' ? '📥 স্মার্ট ইমপোর্ট (Excel / PDF)' : 'Intelligent Import'}</span>
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
                  { id: 'family', label: lang === 'bn' ? 'পারিবারিক খরচ' : 'Family Expenses', icon: Home, color: '#f97316' },
                  { id: 'daily', label: lang === 'bn' ? 'দৈনন্দিন খরচ' : 'Daily Expenses', icon: ShoppingCart, color: '#10b981' },
                  { id: 'events', label: lang === 'bn' ? 'ইভেন্ট ও অনুষ্ঠান' : 'Events & Occasions', icon: Sparkles, color: '#ec4899' },
                  { id: 'business_inventory', label: lang === 'bn' ? 'দোকানের স্টক পণ্য' : 'Business Stock', icon: Boxes, color: '#6366f1' },
                  { id: 'business_sales', label: lang === 'bn' ? 'বিক্রয় খাতা (Sales)' : 'Sales History', icon: TrendingDown, color: '#06b6d4' }
                ].map((item) => {
                  const isSelected = exportTarget === item.id;
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setExportTarget(item.id)}
                      style={{
                        padding: '12px',
                        borderRadius: '10px',
                        border: isSelected ? `2px solid ${item.color}` : '1px solid var(--border-color)',
                        background: isSelected ? 'rgba(15, 118, 110, 0.08)' : 'var(--bg-main)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Icon size={18} style={{ color: item.color }} />
                      <span style={{ fontSize: '0.86rem', fontWeight: isSelected ? '800' : '600', color: 'var(--text-main)' }}>
                        {item.label}
                      </span>
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

            {/* Step 2: File Upload Box */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-main)' }}>
                {lang === 'bn' ? '২. আপনার Excel (.xlsx, .csv) বা PDF ফাইল আপলোড করুন' : '2. Upload your Excel or PDF File'}
              </label>

              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '24px',
                  borderRadius: '12px',
                  border: '2px dashed var(--border-color)',
                  background: 'var(--bg-main)',
                  cursor: 'pointer',
                  transition: 'border 0.2s ease',
                  textAlign: 'center'
                }}
              >
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    background: 'rgba(15, 118, 110, 0.12)',
                    color: '#0f766e',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '8px'
                  }}
                >
                  <Upload size={22} />
                </div>
                <div style={{ fontSize: '0.92rem', fontWeight: '700', color: 'var(--text-main)' }}>
                  {importFile ? importFile.name : (lang === 'bn' ? 'ফাইল সিলেক্ট করুন বা ড্র্যাগ করে ছাড়ুন' : 'Click or drag file here')}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {lang === 'bn' ? 'সাপোর্টেড ফরম্যাট: .xlsx, .xls, .csv এবং .pdf' : 'Supported: .xlsx, .xls, .csv, and .pdf'}
                </div>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv, .pdf"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {/* Parsing Indicator */}
            {isParsing && (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                <RefreshCw size={24} className="spin" style={{ color: '#0f766e', marginBottom: '6px' }} />
                <div>{lang === 'bn' ? 'স্মার্ট এনালাইজার ফাইলটি স্ক্যান করছে...' : 'Smart analyzer is scanning your file...'}</div>
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

            {/* Candidate Rows Preview */}
            {candidateRows.length > 0 && !isParsing && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={16} style={{ color: '#10b981' }} />
                    <span>
                      {lang === 'bn'
                        ? `মোট ${candidateRows.length}টি রেকর্ড পাওয়া গেছে (${candidateRows.filter(r => r.selected).length}টি নির্বাচিত)`
                        : `Found ${candidateRows.length} records (${candidateRows.filter(r => r.selected).length} selected)`}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    style={{ background: 'transparent', border: 'none', color: '#0f766e', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer' }}
                  >
                    {selectAll ? (lang === 'bn' ? 'সব আনচেক করুন' : 'Unselect All') : (lang === 'bn' ? 'সব নির্বাচন করুন' : 'Select All')}
                  </button>
                </div>

                {/* Preview Table */}
                <div style={{ maxHeight: '240px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-main)', position: 'sticky', top: 0, borderBottom: '1px solid var(--border-color)' }}>
                        <th style={{ padding: '6px 8px', width: '30px', textAlign: 'center' }}>✓</th>
                        <th style={{ padding: '6px 8px' }}>তারিখ</th>
                        <th style={{ padding: '6px 8px' }}>আইটেম / বিবরণ</th>
                        <th style={{ padding: '6px 8px' }}>ফোল্ডার</th>
                        <th style={{ padding: '6px 8px', textAlign: 'right' }}>টাকা (৳)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {candidateRows.map((r) => (
                        <tr
                          key={r.id}
                          style={{
                            borderBottom: '1px solid var(--border-color)',
                            background: r.selected ? 'transparent' : 'rgba(255,255,255,0.02)',
                            opacity: r.selected ? 1 : 0.4
                          }}
                        >
                          <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={r.selected}
                              onChange={() => toggleRow(r.id)}
                            />
                          </td>
                          <td style={{ padding: '6px 8px', whiteSpace: 'nowrap' }}>{r.date}</td>
                          <td style={{ padding: '6px 8px', fontWeight: '700' }}>
                            {r.item}
                            {r.quantity && <span style={{ fontSize: '0.72rem', color: '#06b6d4', marginLeft: '4px' }}>({r.quantity} {r.unit})</span>}
                          </td>
                          <td style={{ padding: '6px 8px', color: 'var(--text-muted)' }}>{r.folder}</td>
                          <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: '800', color: '#ef4444' }}>
                            ৳{r.amount.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Import Confirmation Button */}
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  style={{
                    width: '100%',
                    marginTop: '1rem',
                    padding: '12px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '0.95rem',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 16px rgba(16, 185, 129, 0.35)'
                  }}
                >
                  <CheckCircle2 size={18} />
                  <span>
                    {lang === 'bn'
                      ? `নির্বাচিত ${candidateRows.filter(r => r.selected).length}টি রেকর্ড সিস্টেমে যোগ করুন`
                      : `Import ${candidateRows.filter(r => r.selected).length} Records`}
                  </span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DataExportImportModal;
