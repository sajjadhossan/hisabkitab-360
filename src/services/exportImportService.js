import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';
import { printHtmlContent } from './printService';

// Set up pdfjs worker using inline/bundled approach or disable worker for basic text extraction
if (pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.0.379'}/pdf.worker.min.mjs`;
}

// ----------------------------------------------------
// 1. EXCEL EXPORT HELPERS
// ----------------------------------------------------

export const exportToExcel = (data, sheetName = 'Sheet1', fileName = 'Export.xlsx') => {
  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Native Android APK Direct Spooler/Download Bridge
    if (typeof window !== 'undefined' && window.AndroidFileBridge && typeof window.AndroidFileBridge.downloadBase64File === 'function') {
      const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });
      window.AndroidFileBridge.downloadBase64File(
        wbout,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        fileName
      );
      return true;
    }

    XLSX.writeFile(workbook, fileName);
    return true;
  } catch (error) {
    console.error('Excel Export Error:', error);
    throw error;
  }
};

export const exportMultiSheetToExcel = (sheets = [], fileName = 'Full_Export.xlsx') => {
  try {
    const workbook = XLSX.utils.book_new();
    sheets.forEach(({ data, sheetName }) => {
      const worksheet = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName || 'Sheet');
    });

    if (typeof window !== 'undefined' && window.AndroidFileBridge && typeof window.AndroidFileBridge.downloadBase64File === 'function') {
      const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });
      window.AndroidFileBridge.downloadBase64File(
        wbout,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        fileName
      );
      return true;
    }

    XLSX.writeFile(workbook, fileName);
    return true;
  } catch (error) {
    console.error('MultiSheet Excel Export Error:', error);
    throw error;
  }
};

export const exportFamilyExpensesExcel = (expenses, lang = 'bn') => {
  const formattedData = expenses.map((exp, idx) => ({
    [lang === 'bn' ? 'ক্রমিক' : 'SL']: idx + 1,
    [lang === 'bn' ? 'তারিখ' : 'Date']: exp.date || '',
    [lang === 'bn' ? 'ফোল্ডার / খাত' : 'Folder']: exp.folder || exp.category || '',
    [lang === 'bn' ? 'বাজারের আইটেম / খরচ (তেল, চাল, ডাল)' : 'Item Description']: exp.item || exp.title || '',
    [lang === 'bn' ? 'পরিবারের সদস্য (কার খরচ)' : 'Member / Spent By']: exp.member || exp.person || exp.spentBy || 'পরিবার',
    [lang === 'bn' ? 'পরিমাণ' : 'Quantity']: exp.quantity !== null && exp.quantity !== undefined ? exp.quantity : '',
    [lang === 'bn' ? 'পরিমাপের একক' : 'Unit']: exp.unit || '',
    [lang === 'bn' ? 'টাকার পরিমাণ (৳)' : 'Amount (BDT)']: Number(exp.amount) || 0,
    [lang === 'bn' ? 'ইভেন্ট / অনুষ্ঠান' : 'Event']: exp.eventName || '',
    [lang === 'bn' ? 'নোট / মেমো' : 'Notes']: exp.note || ''
  }));

  const fileName = `Family_Expenses_${new Date().toISOString().split('T')[0]}.xlsx`;
  return exportToExcel(formattedData, lang === 'bn' ? 'পারিবারিক বিস্তারিত খরচ' : 'Family Expenses', fileName);
};

export const exportDailyExpensesExcel = (expenses, lang = 'bn') => {
  const formattedData = expenses.map((exp, idx) => ({
    [lang === 'bn' ? 'ক্রমিক' : 'SL']: idx + 1,
    [lang === 'bn' ? 'তারিখ' : 'Date']: exp.date || '',
    [lang === 'bn' ? 'ক্যাটাগরি' : 'Category']: exp.category || '',
    [lang === 'bn' ? 'খরচের আইটেম / বিবরণ' : 'Item Description']: exp.item || exp.title || '',
    [lang === 'bn' ? 'সদস্য / ব্যক্তি' : 'Person']: exp.member || exp.person || 'ব্যক্তিগত',
    [lang === 'bn' ? 'পরিমাণ' : 'Quantity']: exp.quantity !== null && exp.quantity !== undefined ? exp.quantity : '',
    [lang === 'bn' ? 'একক' : 'Unit']: exp.unit || '',
    [lang === 'bn' ? 'টাকার পরিমাণ (৳)' : 'Amount (BDT)']: Number(exp.amount) || 0,
    [lang === 'bn' ? 'ইভেন্ট' : 'Event']: exp.eventName || '',
    [lang === 'bn' ? 'নোট' : 'Notes']: exp.note || ''
  }));

  const fileName = `Daily_Expenses_${new Date().toISOString().split('T')[0]}.xlsx`;
  return exportToExcel(formattedData, lang === 'bn' ? 'দৈনিক খরচ' : 'Daily Expenses', fileName);
};

export const exportBusinessProductsExcel = (products, lang = 'bn') => {
  const formattedData = products.map((prod, idx) => {
    const stockQty = Number(prod.stock) || 0;
    const costPrice = Number(prod.costPrice) || 0;
    const sellPrice = Number(prod.sellingPrice) || 0;
    const damagedQty = Number(prod.damagedQuantity || prod.damagedStock) || 0;

    return {
      [lang === 'bn' ? 'ক্রমিক' : 'SL']: idx + 1,
      [lang === 'bn' ? 'বারকোড / SKU' : 'Barcode / SKU']: prod.barcode || prod.sku || '',
      [lang === 'bn' ? 'পণ্যের নাম' : 'Product Name']: prod.name || '',
      [lang === 'bn' ? 'ক্যাটাগরি' : 'Category']: prod.category || '',
      [lang === 'bn' ? 'বর্তমান স্টক' : 'Stock Quantity']: stockQty,
      [lang === 'bn' ? 'ক্রয় মূল্য (৳)' : 'Cost Price (BDT)']: costPrice,
      [lang === 'bn' ? 'বিক্রয় মূল্য (৳)' : 'Selling Price (BDT)']: sellPrice,
      [lang === 'bn' ? 'মোট স্টক ভ্যালু (৳)' : 'Stock Value (Cost)']: stockQty * costPrice,
      [lang === 'bn' ? 'সম্ভাব্য বিক্রয় মূল্য (৳)' : 'Potential Sell Value']: stockQty * sellPrice,
      [lang === 'bn' ? 'ড্যামেজ বা নষ্ট স্টক' : 'Damaged Stock']: damagedQty,
      [lang === 'bn' ? 'ক্ষতির আর্থিক পরিমাণ (৳)' : 'Damage Loss (BDT)']: damagedQty * costPrice
    };
  });

  const fileName = `Business_Inventory_Damage_${new Date().toISOString().split('T')[0]}.xlsx`;
  return exportToExcel(formattedData, lang === 'bn' ? 'পণ্য স্টক ও ক্ষতি' : 'Inventory & Damage', fileName);
};

export const exportDebtsExcel = (debts = [], lang = 'bn') => {
  const todayStr = new Date().toISOString().split('T')[0];
  const formattedData = debts.map((d, idx) => {
    const txs = d.transactions || [];
    let lent = 0, repayLend = 0, borrowed = 0, repayBorrow = 0;
    txs.forEach(t => {
      const a = Number(t.amount) || 0;
      if (t.type === 'lend') lent += a;
      else if (t.type === 'repay_lend') repayLend += a;
      else if (t.type === 'borrow') borrowed += a;
      else if (t.type === 'repay_borrow') repayBorrow += a;
    });

    const netReceivable = (lent - repayLend) - (borrowed - repayBorrow);
    const isReceivable = netReceivable > 0;
    const isPayable = netReceivable < 0;
    const statusLabel = isReceivable
      ? (lang === 'bn' ? 'আমি পাবো (পাওনা)' : 'Receivable')
      : isPayable
      ? (lang === 'bn' ? 'আমি দেবো (দেনা)' : 'Payable')
      : (lang === 'bn' ? 'পরিশোধিত' : 'Settled');

    const upcomingTxs = txs.filter(t => t.dueDate && t.dueDate >= todayStr).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    const nextDueDate = upcomingTxs[0]?.dueDate || d.initialDueDate || '—';

    return {
      [lang === 'bn' ? 'ক্রমিক' : 'SL']: idx + 1,
      [lang === 'bn' ? 'পার্টনার / ব্যক্তির নাম' : 'Name']: d.name || '',
      [lang === 'bn' ? 'সম্পর্ক / ধরণ' : 'Relation / Type']: d.relation || (d.type === 'supplier' ? 'মহাজন / সাপ্লায়ার' : 'কাস্টমার'),
      [lang === 'bn' ? 'মোবাইল নম্বর' : 'Phone']: d.phone || '',
      [lang === 'bn' ? 'মোট দিয়েছি (৳)' : 'Total Lent (BDT)']: lent,
      [lang === 'bn' ? 'ফেরত পেয়েছি (৳)' : 'Repaid to Me (BDT)']: repayLend,
      [lang === 'bn' ? 'মোট নিয়েছি (৳)' : 'Total Borrowed (BDT)']: borrowed,
      [lang === 'bn' ? 'দেনা শোধ (৳)' : 'Repaid by Me (BDT)']: repayBorrow,
      [lang === 'bn' ? 'নেট বাকি টাকা (৳)' : 'Net Balance (BDT)']: Math.abs(netReceivable),
      [lang === 'bn' ? 'বর্তমান অবস্থা' : 'Status']: statusLabel,
      [lang === 'bn' ? 'পরবর্তী সম্ভাব্য কালেকশন / তাগাদা' : 'Next Due Date']: nextDueDate,
      [lang === 'bn' ? 'ঠিকানা' : 'Address']: d.address || '',
      [lang === 'bn' ? 'নোট / মন্তব্য' : 'Notes']: d.notes || ''
    };
  });

  const fileName = `Debts_Khata_${new Date().toISOString().split('T')[0]}.xlsx`;
  return exportToExcel(formattedData, lang === 'bn' ? 'দেনা-পাওনা খাতা' : 'Debts Ledger', fileName);
};

export const exportFullBusinessExcel = ({ products = [], debts = [], salesHistory = [], lang = 'bn' }) => {
  let totalStockCost = 0, totalStockSell = 0, totalDamagedQty = 0, totalDamagedCost = 0;
  products.forEach(p => {
    const s = Number(p.stock) || 0;
    const c = Number(p.costPrice) || 0;
    const sel = Number(p.sellingPrice) || 0;
    const dmg = Number(p.damagedQuantity || p.damagedStock) || 0;
    totalStockCost += s * c;
    totalStockSell += s * sel;
    totalDamagedQty += dmg;
    totalDamagedCost += dmg * c;
  });

  let totalReceivable = 0, totalPayable = 0;
  debts.forEach(d => {
    let lent = 0, repayLend = 0, borrowed = 0, repayBorrow = 0;
    (d.transactions || []).forEach(t => {
      const a = Number(t.amount) || 0;
      if (t.type === 'lend') lent += a;
      else if (t.type === 'repay_lend') repayLend += a;
      else if (t.type === 'borrow') borrowed += a;
      else if (t.type === 'repay_borrow') repayBorrow += a;
    });
    const net = (lent - repayLend) - (borrowed - repayBorrow);
    if (net > 0) totalReceivable += net;
    else if (net < 0) totalPayable += Math.abs(net);
  });

  const overviewData = [
    { [lang === 'bn' ? 'সূচক' : 'Metric']: lang === 'bn' ? 'মোট পণ্যের আইটেম' : 'Total Unique Products', [lang === 'bn' ? 'পরিমাণ / মান' : 'Value']: products.length },
    { [lang === 'bn' ? 'সূচক' : 'Metric']: lang === 'bn' ? 'মোট ভালো স্টক মূল্য (ক্রয়মূল্যে)' : 'Stock Valuation (Cost)', [lang === 'bn' ? 'পরিমাণ / মান' : 'Value']: `৳${totalStockCost.toLocaleString('en-IN')}` },
    { [lang === 'bn' ? 'সূচক' : 'Metric']: lang === 'bn' ? 'মোট সম্ভাব্য বিক্রয় মূল্য' : 'Stock Potential Selling Value', [lang === 'bn' ? 'পরিমাণ / মান' : 'Value']: `৳${totalStockSell.toLocaleString('en-IN')}` },
    { [lang === 'bn' ? 'সূচক' : 'Metric']: lang === 'bn' ? 'ড্যামেজ বা নষ্ট পণ্যের সংখ্যা' : 'Damaged Stock Qty', [lang === 'bn' ? 'পরিমাণ / মান' : 'Value']: totalDamagedQty },
    { [lang === 'bn' ? 'সূচক' : 'Metric']: lang === 'bn' ? 'ড্যামেজ পণ্যের আর্থিক ক্ষতি (৳)' : 'Damage Financial Loss', [lang === 'bn' ? 'পরিমাণ / মান' : 'Value']: `৳${totalDamagedCost.toLocaleString('en-IN')}` },
    { [lang === 'bn' ? 'সূচক' : 'Metric']: lang === 'bn' ? 'বাজার থেকে মোট পাওনা (৳)' : 'Total Market Receivables', [lang === 'bn' ? 'পরিমাণ / মান' : 'Value']: `৳${totalReceivable.toLocaleString('en-IN')}` },
    { [lang === 'bn' ? 'সূচক' : 'Metric']: lang === 'bn' ? 'মহাজন / সাপ্লায়ারের কাছে দেনা (৳)' : 'Total Business Payables', [lang === 'bn' ? 'পরিমাণ / মান' : 'Value']: `৳${totalPayable.toLocaleString('en-IN')}` },
    { [lang === 'bn' ? 'সূচক' : 'Metric']: lang === 'bn' ? 'নেট ব্যবসায়িক স্থিতি (পাওনা - দেনা)' : 'Net Debt/Receivable Position', [lang === 'bn' ? 'পরিমাণ / মান' : 'Value']: `৳${(totalReceivable - totalPayable).toLocaleString('en-IN')}` }
  ];

  const inventoryData = products.map((prod, idx) => ({
    [lang === 'bn' ? 'ক্রমিক' : 'SL']: idx + 1,
    [lang === 'bn' ? 'বারকোড' : 'Barcode']: prod.barcode || prod.sku || '',
    [lang === 'bn' ? 'পণ্যের নাম' : 'Product Name']: prod.name || '',
    [lang === 'bn' ? 'ক্যাটাগরি' : 'Category']: prod.category || '',
    [lang === 'bn' ? 'বর্তমান স্টক' : 'Stock']: Number(prod.stock) || 0,
    [lang === 'bn' ? 'ক্রয় মূল্য (৳)' : 'Cost Price']: Number(prod.costPrice) || 0,
    [lang === 'bn' ? 'বিক্রয় মূল্য (৳)' : 'Sell Price']: Number(prod.sellingPrice) || 0,
    [lang === 'bn' ? 'মোট স্টক মূল্য (৳)' : 'Stock Value']: (Number(prod.stock) || 0) * (Number(prod.costPrice) || 0),
    [lang === 'bn' ? 'ড্যামেজ স্টক' : 'Damaged Stock']: Number(prod.damagedQuantity || prod.damagedStock) || 0,
    [lang === 'bn' ? 'ক্ষতির পরিমাণ (৳)' : 'Damage Loss']: (Number(prod.damagedQuantity || prod.damagedStock) || 0) * (Number(prod.costPrice) || 0)
  }));

  const debtsData = debts.map((d, idx) => {
    let lent = 0, repayLend = 0, borrowed = 0, repayBorrow = 0;
    (d.transactions || []).forEach(t => {
      const a = Number(t.amount) || 0;
      if (t.type === 'lend') lent += a;
      else if (t.type === 'repay_lend') repayLend += a;
      else if (t.type === 'borrow') borrowed += a;
      else if (t.type === 'repay_borrow') repayBorrow += a;
    });
    const net = (lent - repayLend) - (borrowed - repayBorrow);
    const todayStr = new Date().toISOString().split('T')[0];
    const upcoming = (d.transactions || []).filter(t => t.dueDate && t.dueDate >= todayStr).sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    return {
      [lang === 'bn' ? 'ক্রমিক' : 'SL']: idx + 1,
      [lang === 'bn' ? 'নাম' : 'Name']: d.name || '',
      [lang === 'bn' ? 'সম্পর্ক' : 'Relation']: d.relation || '',
      [lang === 'bn' ? 'মোবাইল' : 'Phone']: d.phone || '',
      [lang === 'bn' ? 'নেট বাকি টাকা (৳)' : 'Net Due']: Math.abs(net),
      [lang === 'bn' ? 'স্ট্যাটাস' : 'Status']: net > 0 ? 'পাবো' : net < 0 ? 'দেবো' : 'পরিশোধিত',
      [lang === 'bn' ? 'পরবর্তী তাগাদা' : 'Due Date']: upcoming[0]?.dueDate || d.initialDueDate || '—'
    };
  });

  const salesData = salesHistory.map((s, idx) => ({
    [lang === 'bn' ? 'ক্রমিক' : 'SL']: idx + 1,
    [lang === 'bn' ? 'ইনভয়েস নং' : 'Invoice No']: s.invoiceNo || `INV-${s.id}`,
    [lang === 'bn' ? 'তারিখ' : 'Date']: (s.date || '').split('T')[0],
    [lang === 'bn' ? 'কাস্টমার' : 'Customer']: s.customerName || 'খুচরা ক্রেতা',
    [lang === 'bn' ? 'মোট মূল্য (৳)' : 'Grand Total']: s.grandTotal || 0,
    [lang === 'bn' ? 'পেমেন্ট মেথড' : 'Payment Method']: s.paymentMethod || 'cash'
  }));

  const fileName = `Full_Business_Backup_${new Date().toISOString().split('T')[0]}.xlsx`;
  return exportMultiSheetToExcel([
    { data: overviewData, sheetName: lang === 'bn' ? 'আর্থিক সারসংক্ষেপ' : 'Overview' },
    { data: inventoryData, sheetName: lang === 'bn' ? 'পণ্য ও স্টক' : 'Inventory' },
    { data: debtsData, sheetName: lang === 'bn' ? 'দেনা-পাওনা খাতা' : 'Debts Khata' },
    { data: salesData, sheetName: lang === 'bn' ? 'বিক্রয় খাতা' : 'Sales History' }
  ], fileName);
};

export const exportBusinessSalesExcel = (sales, lang = 'bn') => {
  const formattedData = sales.map((sale, _idx) => ({
    [lang === 'bn' ? 'ইনভয়েস নং' : 'Invoice No']: sale.invoiceNo || `INV-${sale.id}`,
    [lang === 'bn' ? 'তারিখ' : 'Date']: (sale.date || '').split('T')[0],
    [lang === 'bn' ? 'কাস্টমার' : 'Customer']: sale.customerName || 'খুচরা ক্রেতা',
    [lang === 'bn' ? 'মোট মূল্য (৳)' : 'Grand Total']: sale.grandTotal || 0,
    [lang === 'bn' ? 'পেমেন্ট মেথড' : 'Payment Method']: sale.paymentMethod || 'cash'
  }));

  const fileName = `Business_Sales_${new Date().toISOString().split('T')[0]}.xlsx`;
  return exportToExcel(formattedData, lang === 'bn' ? 'বিক্রয় খাতা' : 'Sales History', fileName);
};

// ----------------------------------------------------
// 2. MODERN COLORFUL REPORT HTML GENERATORS
// ----------------------------------------------------

export const buildModernDocumentHtml = ({
  title,
  subtitle = '',
  kpiCards = [],
  tables = [],
  summaryRows = [],
  footerNote = '',
  lang = 'bn'
}) => {
  const currentDate = new Date().toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
    <!DOCTYPE html>
    <html lang="${lang}">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        body {
          font-family: 'Hind Siliguri', 'Plus Jakarta Sans', -apple-system, sans-serif;
          color: #0f172a;
          margin: 0;
          padding: 24px;
          background: #ffffff;
          line-height: 1.5;
        }

        .header {
          border-bottom: 2px solid #0f766e;
          padding-bottom: 14px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 16px;
        }

        .brand-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(15, 118, 110, 0.1);
          color: #0f766e;
          padding: 4px 10px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .brand {
          font-size: 22px;
          font-weight: 800;
          color: #0f766e;
          letter-spacing: -0.5px;
        }

        .report-title {
          font-size: 20px;
          font-weight: 800;
          color: #0f172a;
          margin: 4px 0 2px;
        }

        .report-subtitle {
          font-size: 13px;
          color: #64748b;
          font-weight: 500;
        }

        .meta {
          font-size: 12px;
          color: #64748b;
          text-align: right;
          flex-shrink: 0;
        }

        /* KPI Cards Grid */
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px;
          margin-bottom: 24px;
        }

        .kpi-card {
          border-radius: 14px;
          padding: 14px 16px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .kpi-title {
          font-size: 11.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .kpi-value {
          font-size: 20px;
          font-weight: 800;
          letter-spacing: -0.5px;
        }

        .kpi-sub {
          font-size: 11px;
          color: #64748b;
        }

        /* Table Section */
        .section-title {
          font-size: 15px;
          font-weight: 800;
          color: #1e293b;
          margin: 18px 0 8px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          margin-top: 6px;
          font-size: 12px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          overflow: hidden;
        }

        th {
          background-color: #f1f5f9;
          color: #334155;
          font-weight: 700;
          text-align: left;
          padding: 9px 12px;
          border-bottom: 2px solid #cbd5e1;
        }

        td {
          padding: 8px 12px;
          border-bottom: 1px solid #e2e8f0;
          color: #334155;
        }

        tr:last-child td {
          border-bottom: none;
        }

        tr:nth-child(even) td {
          background-color: #f8fafc;
        }

        .badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
        }

        .badge-green { background: #dcfce7; color: #15803d; }
        .badge-red { background: #fee2e2; color: #b91c1c; }
        .badge-amber { background: #fef3c7; color: #b45309; }
        .badge-blue { background: #e0f2fe; color: #0369a1; }

        .summary-box {
          margin-top: 18px;
          border-top: 2px solid #cbd5e1;
          padding-top: 12px;
          display: flex;
          justify-content: flex-end;
        }

        .summary-table {
          width: auto;
          min-width: 280px;
          border: none;
        }

        .summary-table td {
          padding: 4px 10px;
          border: none;
          background: transparent !important;
        }

        .summary-table .total-label {
          font-weight: 700;
          text-align: right;
          color: #475569;
        }

        .summary-table .total-val {
          font-weight: 800;
          font-size: 15px;
          color: #0f766e;
          text-align: right;
        }

        .footer {
          margin-top: 28px;
          border-top: 1px dashed #cbd5e1;
          padding-top: 10px;
          font-size: 11px;
          color: #94a3b8;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        @media print {
          body { padding: 0; }
          .no-print { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 16px; display: flex; gap: 10px; align-items: center; background: #f8fafc; padding: 12px 16px; border-radius: 10px; border: 1px solid #e2e8f0;">
        <button onclick="window.print()" style="padding: 9px 18px; background: #0f766e; color: #fff; border: none; border-radius: 8px; font-weight: 800; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
          🖨️ ${lang === 'bn' ? 'প্রিন্ট বা PDF হিসেবে সেভ করুন' : 'Print / Save as PDF'}
        </button>
        <button onclick="window.close()" style="padding: 9px 16px; background: #e2e8f0; color: #334155; border: none; border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer;">
          ✕ ${lang === 'bn' ? 'বন্ধ করুন / ফিরে যান' : 'Close'}
        </button>
        <span style="font-size: 12px; color: #64748b; margin-left: auto;">
          ${lang === 'bn' ? '💡 মোবাইল থেকে সেভ করতে Print বাটনে চাপ দিয়ে "Save as PDF" নির্বাচন করুন।' : 'Select "Save as PDF" to download.'}
        </span>
      </div>

      <div class="header">
        <div>
          <div class="brand-badge">✨ HisabKitab 360 Smart Report</div>
          <div class="brand">হিসাব-কিতাব ৩৬০</div>
          <div class="report-title">${title}</div>
          ${subtitle ? `<div class="report-subtitle">${subtitle}</div>` : ''}
        </div>
        <div class="meta">
          <div><strong>${lang === 'bn' ? 'তৈরির তারিখ:' : 'Generated on:'}</strong> ${currentDate}</div>
          <div>${lang === 'bn' ? 'স্মার্ট ফিন্যান্সিয়াল ব্যাকআপ ভেরিফাইড' : 'Verified Smart Backup'}</div>
        </div>
      </div>

      ${kpiCards.length > 0 ? `
        <div class="kpi-grid">
          ${kpiCards.map(c => `
            <div class="kpi-card" style="background: ${c.bg || '#f8fafc'}; border-color: ${c.border || '#e2e8f0'};">
              <div class="kpi-title" style="color: ${c.color || '#475569'};">${c.label}</div>
              <div class="kpi-value" style="color: ${c.color || '#0f172a'};">${c.value}</div>
              ${c.subtext ? `<div class="kpi-sub">${c.subtext}</div>` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${tables.map(tbl => `
        ${tbl.sectionTitle ? `<div class="section-title">${tbl.sectionTitle}</div>` : ''}
        <table>
          <thead>
            <tr>
              ${(tbl.columns || []).map(col => `<th style="${col.align ? `text-align: ${col.align};` : ''}">${col.header}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${(tbl.rows || []).map(row => `
              <tr>
                ${(tbl.columns || []).map(col => `<td style="${col.align ? `text-align: ${col.align};` : ''}">${row[col.key] !== undefined && row[col.key] !== null ? row[col.key] : '—'}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      `).join('')}

      ${summaryRows.length > 0 ? `
        <div class="summary-box">
          <table class="summary-table">
            ${summaryRows.map(sr => `
              <tr>
                <td class="total-label">${sr.label}</td>
                <td class="total-val">${sr.value}</td>
              </tr>
            `).join('')}
          </table>
        </div>
      ` : ''}

      <div class="footer">
        <span>হিসাব-কিতাব ৩৬০ ডিজিটাল ব্যবসায়িক হিসাব খাতা | ${footerNote || 'সব অধিকার সংরক্ষিত'}</span>
        <span>পৃষ্ঠা ১/১</span>
      </div>

      <script>
        window.onload = function() {
          // If inside a desktop popup window, auto trigger print
          if (window.opener && window.print) {
            setTimeout(function() {
              window.print();
            }, 300);
          }
        };
      </script>
    </body>
    </html>
  `;
};

// Specialized Generator: Stock & Damaged Items Report
export const generateStockReportHtml = ({ products = [], lang = 'bn' }) => {
  let totalStockCost = 0;
  let totalStockSell = 0;
  let totalDamagedQty = 0;
  let totalDamagedCost = 0;
  let lowStockCount = 0;

  products.forEach(p => {
    const s = Number(p.stock) || 0;
    const c = Number(p.costPrice) || 0;
    const sel = Number(p.sellingPrice) || 0;
    const dmg = Number(p.damagedQuantity || p.damagedStock) || 0;
    totalStockCost += s * c;
    totalStockSell += s * sel;
    totalDamagedQty += dmg;
    totalDamagedCost += dmg * c;
    if (s <= (p.lowStockThreshold || 5)) lowStockCount++;
  });

  const kpiCards = [
    {
      label: lang === 'bn' ? 'মোট পণ্যের আইটেম' : 'Total Products',
      value: `${products.length} টি`,
      subtext: lang === 'bn' ? `কম স্টক সতর্কতা: ${lowStockCount} টি` : `${lowStockCount} items low stock`,
      color: '#0f766e',
      bg: 'rgba(15, 118, 110, 0.05)',
      border: 'rgba(15, 118, 110, 0.2)'
    },
    {
      label: lang === 'bn' ? 'মোট বর্তমান স্টক মূল্য' : 'Stock Value (Cost)',
      value: `৳${totalStockCost.toLocaleString('en-IN')}`,
      subtext: lang === 'bn' ? `সম্ভাব্য বিক্রয়: ৳${totalStockSell.toLocaleString('en-IN')}` : `Retail: ৳${totalStockSell.toLocaleString('en-IN')}`,
      color: '#0284c7',
      bg: 'rgba(2, 132, 199, 0.05)',
      border: 'rgba(2, 132, 199, 0.2)'
    },
    {
      label: lang === 'bn' ? 'ড্যামেজ বা বিনষ্ট পণ্য' : 'Damaged Stock Qty',
      value: `${totalDamagedQty} টি`,
      subtext: lang === 'bn' ? 'নষ্ট / বিক্রয় অযোগ্য' : 'Damaged / expired',
      color: '#ea580c',
      bg: 'rgba(234, 88, 12, 0.05)',
      border: 'rgba(234, 88, 12, 0.2)'
    },
    {
      label: lang === 'bn' ? 'ড্যামেজ পণ্যের আর্থিক ক্ষতি' : 'Total Damage Loss',
      value: `৳${totalDamagedCost.toLocaleString('en-IN')}`,
      subtext: lang === 'bn' ? 'ক্রয়মূল্য ভিত্তিক ক্ষতি' : 'Direct capital loss',
      color: '#e11d48',
      bg: 'rgba(225, 29, 72, 0.05)',
      border: 'rgba(225, 29, 72, 0.2)'
    }
  ];

  const columns = [
    { header: lang === 'bn' ? 'ক্রমিক' : 'SL', key: 'sl', align: 'center' },
    { header: lang === 'bn' ? 'বারকোড' : 'Barcode', key: 'sku' },
    { header: lang === 'bn' ? 'পণ্যের নাম' : 'Product Name', key: 'name' },
    { header: lang === 'bn' ? 'ক্যাটাগরি' : 'Category', key: 'cat' },
    { header: lang === 'bn' ? 'বর্তমান স্টক' : 'Stock', key: 'stock', align: 'center' },
    { header: lang === 'bn' ? 'ক্রয় মূল্য' : 'Cost Price', key: 'cost', align: 'right' },
    { header: lang === 'bn' ? 'বিক্রয় মূল্য' : 'Sell Price', key: 'sell', align: 'right' },
    { header: lang === 'bn' ? 'স্টক ভ্যালু (৳)' : 'Stock Value', key: 'val', align: 'right' },
    { header: lang === 'bn' ? 'ড্যামেজ' : 'Damaged', key: 'dmg', align: 'center' },
    { header: lang === 'bn' ? 'ক্ষতির পরিমাণ' : 'Damage Loss', key: 'loss', align: 'right' }
  ];

  const rows = products.map((p, idx) => {
    const s = Number(p.stock) || 0;
    const c = Number(p.costPrice) || 0;
    const dmg = Number(p.damagedQuantity || p.damagedStock) || 0;
    return {
      sl: idx + 1,
      sku: p.barcode || p.sku || '—',
      name: `<strong>${p.name}</strong>`,
      cat: p.category || 'সাধারণ',
      stock: s <= 5 ? `<span class="badge badge-amber">${s} টি</span>` : `${s} টি`,
      cost: `৳${c.toLocaleString('en-IN')}`,
      sell: `৳${(Number(p.sellingPrice) || 0).toLocaleString('en-IN')}`,
      val: `<strong>৳${(s * c).toLocaleString('en-IN')}</strong>`,
      dmg: dmg > 0 ? `<span class="badge badge-red">${dmg} টি</span>` : '০',
      loss: dmg > 0 ? `<span style="color: #e11d48; font-weight: 700;">৳${(dmg * c).toLocaleString('en-IN')}</span>` : '—'
    };
  });

  return buildModernDocumentHtml({
    title: lang === 'bn' ? 'দোকানের বর্তমান পণ্য স্টক ও ড্যামেজ রিপোর্ট' : 'Business Inventory & Damage Report',
    subtitle: lang === 'bn' ? 'স্টক ভ্যালুয়েশন, ক্ষতি মূল্যায়ন ও রিস্টক গাইডলাইন' : 'Stock valuation, damage loss and restock guide',
    kpiCards,
    tables: [{ sectionTitle: lang === 'bn' ? '📦 পণ্য তালিকা ও স্টক বিবরণী' : 'Product Inventory Breakdown', columns, rows }],
    summaryRows: [
      { label: lang === 'bn' ? 'মোট ভালো স্টক মূল্য:' : 'Total Good Stock Value:', value: `৳${totalStockCost.toLocaleString('en-IN')}` },
      { label: lang === 'bn' ? 'মোট ড্যামেজ আর্থিক ক্ষতি:' : 'Total Damage Loss:', value: `৳${totalDamagedCost.toLocaleString('en-IN')}` }
    ],
    lang
  });
};

// Specialized Generator: Debt & Dues Ledger Report
export const generateDebtReportHtml = ({ debts = [], lang = 'bn' }) => {
  let totalReceivable = 0;
  let totalPayable = 0;
  let overdueCount = 0;
  const todayStr = new Date().toISOString().split('T')[0];

  debts.forEach(d => {
    let lent = 0, repayLend = 0, borrowed = 0, repayBorrow = 0;
    (d.transactions || []).forEach(t => {
      const a = Number(t.amount) || 0;
      if (t.type === 'lend') lent += a;
      else if (t.type === 'repay_lend') repayLend += a;
      else if (t.type === 'borrow') borrowed += a;
      else if (t.type === 'repay_borrow') repayBorrow += a;

      if (t.dueDate && t.dueDate < todayStr) overdueCount++;
    });
    const net = (lent - repayLend) - (borrowed - repayBorrow);
    if (net > 0) totalReceivable += net;
    else if (net < 0) totalPayable += Math.abs(net);
  });

  const kpiCards = [
    {
      label: lang === 'bn' ? 'বাজার থেকে মোট পাওনা' : 'Total Receivables',
      value: `৳${totalReceivable.toLocaleString('en-IN')}`,
      subtext: lang === 'bn' ? 'আমি পাবো (কাস্টমার ও পার্টনার)' : 'Money owed to business',
      color: '#15803d',
      bg: 'rgba(21, 128, 61, 0.05)',
      border: 'rgba(21, 128, 61, 0.2)'
    },
    {
      label: lang === 'bn' ? 'মহাজন / সাপ্লায়ারের কাছে দেনা' : 'Total Payables',
      value: `৳${totalPayable.toLocaleString('en-IN')}`,
      subtext: lang === 'bn' ? 'আমি দেবো (মহাজন ও পাওনাদার)' : 'Business liabilities',
      color: '#b91c1c',
      bg: 'rgba(185, 28, 28, 0.05)',
      border: 'rgba(185, 28, 28, 0.2)'
    },
    {
      label: lang === 'bn' ? 'নেট ব্যালেন্স (পাওনা - দেনা)' : 'Net Position',
      value: `৳${(totalReceivable - totalPayable).toLocaleString('en-IN')}`,
      subtext: totalReceivable >= totalPayable ? (lang === 'bn' ? 'সার্বিক উদ্বৃত্ত' : 'Positive Surplus') : (lang === 'bn' ? 'সার্বিক ঘাটতি' : 'Deficit'),
      color: '#0f766e',
      bg: 'rgba(15, 118, 110, 0.05)',
      border: 'rgba(15, 118, 110, 0.2)'
    },
    {
      label: lang === 'bn' ? 'বকেয়া গ্রাহক ও পার্টনার' : 'Total Debtors/Creditors',
      value: `${debts.length} জন`,
      subtext: lang === 'bn' ? `মেয়াদোত্তীর্ণ লেনদেন: ${overdueCount} টি` : `${overdueCount} overdue entries`,
      color: '#7c3aed',
      bg: 'rgba(124, 58, 237, 0.05)',
      border: 'rgba(124, 58, 237, 0.2)'
    }
  ];

  const columns = [
    { header: lang === 'bn' ? 'ক্রমিক' : 'SL', key: 'sl', align: 'center' },
    { header: lang === 'bn' ? 'ব্যক্তি / প্রতিষ্ঠানের নাম' : 'Name', key: 'name' },
    { header: lang === 'bn' ? 'সম্পর্ক' : 'Relation', key: 'rel' },
    { header: lang === 'bn' ? 'মোবাইল' : 'Phone', key: 'phone' },
    { header: lang === 'bn' ? 'মোট দেওয়া' : 'Lent', key: 'lent', align: 'right' },
    { header: lang === 'bn' ? 'মোট নেওয়া' : 'Borrowed', key: 'borrowed', align: 'right' },
    { header: lang === 'bn' ? 'অবস্থা' : 'Status', key: 'status', align: 'center' },
    { header: lang === 'bn' ? 'বাকি ব্যালেন্স' : 'Net Due', key: 'balance', align: 'right' },
    { header: lang === 'bn' ? 'পরবর্তী সম্ভাব্য তাগাদা' : 'Next Due Date', key: 'due', align: 'center' }
  ];

  const rows = debts.map((d, idx) => {
    let lent = 0, repayLend = 0, borrowed = 0, repayBorrow = 0;
    (d.transactions || []).forEach(t => {
      const a = Number(t.amount) || 0;
      if (t.type === 'lend') lent += a;
      else if (t.type === 'repay_lend') repayLend += a;
      else if (t.type === 'borrow') borrowed += a;
      else if (t.type === 'repay_borrow') repayBorrow += a;
    });

    const net = (lent - repayLend) - (borrowed - repayBorrow);
    const upcoming = (d.transactions || []).filter(t => t.dueDate && t.dueDate >= todayStr).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    const nextDue = upcoming[0]?.dueDate || d.initialDueDate || '—';

    let statusHtml = '<span class="badge badge-blue">পরিশোধিত</span>';
    if (net > 0) {
      statusHtml = '<span class="badge badge-green">পাবো</span>';
    } else if (net < 0) {
      statusHtml = '<span class="badge badge-red">দেবো</span>';
    }

    return {
      sl: idx + 1,
      name: `<strong>${d.name}</strong>`,
      rel: d.relation || (d.type === 'supplier' ? 'মহাজন' : 'কাস্টমার'),
      phone: d.phone || '—',
      lent: `৳${lent.toLocaleString('en-IN')}`,
      borrowed: `৳${borrowed.toLocaleString('en-IN')}`,
      status: statusHtml,
      balance: `<strong style="color: ${net > 0 ? '#15803d' : net < 0 ? '#b91c1c' : '#475569'};">৳${Math.abs(net).toLocaleString('en-IN')}</strong>`,
      due: nextDue !== '—' ? `<span class="badge badge-amber">${nextDue}</span>` : '—'
    };
  });

  return buildModernDocumentHtml({
    title: lang === 'bn' ? 'দেনা-পাওনা ও বাকির খাতার পূর্ণাঙ্গ বিবরণী' : 'Debt & Credit Ledger Statement',
    subtitle: lang === 'bn' ? 'সকল গ্রাহক, সাপ্লায়ার ও ব্যবসায়িক পার্টনারের বকেয়া ও তাগাদার সময়সূচী' : 'Receivables, payables and upcoming collection schedules',
    kpiCards,
    tables: [{ sectionTitle: lang === 'bn' ? '👥 দেনা-পাওনা বিবরণী তালিকা' : 'Debtor & Creditor Ledger List', columns, rows }],
    summaryRows: [
      { label: lang === 'bn' ? 'মোট বাজার পাওনা:' : 'Total Receivables:', value: `৳${totalReceivable.toLocaleString('en-IN')}` },
      { label: lang === 'bn' ? 'মোট দেনা (মহাজন):' : 'Total Payables:', value: `৳${totalPayable.toLocaleString('en-IN')}` },
      { label: lang === 'bn' ? 'সার্বিক নেট অবস্থান:' : 'Overall Net Position:', value: `৳${(totalReceivable - totalPayable).toLocaleString('en-IN')}` }
    ],
    lang
  });
};

// Specialized Generator: Full All-in-One Business Financial Report
export const generateFullBusinessReportHtml = ({ products = [], debts = [], salesHistory = [], lang = 'bn' }) => {
  let totalStockCost = 0;
  let totalDamagedCost = 0;
  products.forEach(p => {
    const s = Number(p.stock) || 0;
    const c = Number(p.costPrice) || 0;
    const dmg = Number(p.damagedQuantity || p.damagedStock) || 0;
    totalStockCost += s * c;
    totalDamagedCost += dmg * c;
  });

  let totalReceivable = 0;
  let totalPayable = 0;
  debts.forEach(d => {
    let lent = 0, repayLend = 0, borrowed = 0, repayBorrow = 0;
    (d.transactions || []).forEach(t => {
      const a = Number(t.amount) || 0;
      if (t.type === 'lend') lent += a;
      else if (t.type === 'repay_lend') repayLend += a;
      else if (t.type === 'borrow') borrowed += a;
      else if (t.type === 'repay_borrow') repayBorrow += a;
    });
    const net = (lent - repayLend) - (borrowed - repayBorrow);
    if (net > 0) totalReceivable += net;
    else if (net < 0) totalPayable += Math.abs(net);
  });

  const totalSalesVal = salesHistory.reduce((s, sl) => s + (Number(sl.grandTotal) || 0), 0);

  const kpiCards = [
    {
      label: lang === 'bn' ? 'স্টক সম্পদ মূল্য' : 'Stock Capital',
      value: `৳${totalStockCost.toLocaleString('en-IN')}`,
      subtext: lang === 'bn' ? `মোট ${products.length} প্রকার পণ্য` : `${products.length} total products`,
      color: '#0f766e',
      bg: 'rgba(15, 118, 110, 0.05)',
      border: 'rgba(15, 118, 110, 0.2)'
    },
    {
      label: lang === 'bn' ? 'ড্যামেজ পণ্যের ক্ষতি' : 'Damaged Stock Loss',
      value: `৳${totalDamagedCost.toLocaleString('en-IN')}`,
      subtext: lang === 'bn' ? 'অপ্রয়োজনীয় আর্থিক অপচয়' : 'Damaged inventory loss',
      color: '#e11d48',
      bg: 'rgba(225, 29, 72, 0.05)',
      border: 'rgba(225, 29, 72, 0.2)'
    },
    {
      label: lang === 'bn' ? 'বাজার থেকে পাওনা' : 'Receivables',
      value: `৳${totalReceivable.toLocaleString('en-IN')}`,
      subtext: lang === 'bn' ? 'আমি কাস্টমারদের কাছে পাবো' : 'Customer dues',
      color: '#15803d',
      bg: 'rgba(21, 128, 61, 0.05)',
      border: 'rgba(21, 128, 61, 0.2)'
    },
    {
      label: lang === 'bn' ? 'মহাজন দেনা' : 'Payables',
      value: `৳${totalPayable.toLocaleString('en-IN')}`,
      subtext: lang === 'bn' ? 'সাপ্লায়ারকে পরিশোধ করতে হবে' : 'Supplier debt',
      color: '#b91c1c',
      bg: 'rgba(185, 28, 28, 0.05)',
      border: 'rgba(185, 28, 28, 0.2)'
    }
  ];

  // Section 1: Stock preview (top 15)
  const stockCols = [
    { header: 'পণ্যের নাম', key: 'name' },
    { header: 'স্টক', key: 'stock', align: 'center' },
    { header: 'ক্রয় মূল্য', key: 'cost', align: 'right' },
    { header: 'স্টক মূল্য', key: 'val', align: 'right' },
    { header: 'ড্যামেজ ক্ষতি', key: 'dmg', align: 'right' }
  ];
  const stockRows = products.slice(0, 15).map(p => {
    const s = Number(p.stock) || 0;
    const c = Number(p.costPrice) || 0;
    const d = Number(p.damagedQuantity || p.damagedStock) || 0;
    return {
      name: p.name,
      stock: `${s} টি`,
      cost: `৳${c.toLocaleString('en-IN')}`,
      val: `৳${(s * c).toLocaleString('en-IN')}`,
      dmg: d > 0 ? `<span style="color:#e11d48;">৳${(d * c).toLocaleString('en-IN')}</span>` : '—'
    };
  });

  // Section 2: Debts preview (top 15)
  const debtCols = [
    { header: 'নাম ও মোবাইল', key: 'name' },
    { header: 'সম্পর্ক', key: 'rel' },
    { header: 'স্ট্যাটাস', key: 'status', align: 'center' },
    { header: 'বাকি টাকা (৳)', key: 'due', align: 'right' }
  ];
  const debtRows = debts.slice(0, 15).map(d => {
    let lent = 0, repayLend = 0, borrowed = 0, repayBorrow = 0;
    (d.transactions || []).forEach(t => {
      const a = Number(t.amount) || 0;
      if (t.type === 'lend') lent += a;
      else if (t.type === 'repay_lend') repayLend += a;
      else if (t.type === 'borrow') borrowed += a;
      else if (t.type === 'repay_borrow') repayBorrow += a;
    });
    const net = (lent - repayLend) - (borrowed - repayBorrow);
    return {
      name: `<strong>${d.name}</strong> <span style="font-size:10px; color:#64748b;">(${d.phone || '—'})</span>`,
      rel: d.relation || '',
      status: net > 0 ? '<span class="badge badge-green">পাবো</span>' : net < 0 ? '<span class="badge badge-red">দেবো</span>' : '<span class="badge badge-blue">পরিশোধিত</span>',
      due: `৳${Math.abs(net).toLocaleString('en-IN')}`
    };
  });

  return buildModernDocumentHtml({
    title: lang === 'bn' ? 'সম্পূর্ণ ব্যবসায়িক আর্থিক হিসাব ব্যাকআপ' : 'Full Business Financial Backup Report',
    subtitle: lang === 'bn' ? 'স্টক ভ্যালু, ড্যামেজ মূল্যায়ন, দেনা-পাওনা ও সার্বিক স্থিতি' : 'Stock valuation, damage loss, receivables and liabilities',
    kpiCards,
    tables: [
      { sectionTitle: lang === 'bn' ? '📦 ইনভেন্টরি স্টক ও ড্যামেজ সারসংক্ষেপ' : 'Inventory & Damage Summary', columns: stockCols, rows: stockRows },
      { sectionTitle: lang === 'bn' ? '🤝 দেনা-পাওনা খাতা সারসংক্ষেপ' : 'Debts & Receivables Summary', columns: debtCols, rows: debtRows }
    ],
    summaryRows: [
      { label: lang === 'bn' ? 'মোট স্টক মূলধন:' : 'Total Stock Capital:', value: `৳${totalStockCost.toLocaleString('en-IN')}` },
      { label: lang === 'bn' ? 'মোট বাজার পাওনা:' : 'Total Market Receivables:', value: `৳${totalReceivable.toLocaleString('en-IN')}` },
      { label: lang === 'bn' ? 'মোট দেনা (সাপ্লায়ার):' : 'Total Supplier Debt:', value: `৳${totalPayable.toLocaleString('en-IN')}` },
      { label: lang === 'bn' ? 'মোট বিক্রয় লেনদেন:' : 'Recorded Sales:', value: `৳${totalSalesVal.toLocaleString('en-IN')}` }
    ],
    lang
  });
};

// Specialized Generator: Detailed Itemized Family Expenses Report
export const generateFamilyExpenseReportHtml = ({ expenses = [], lang = 'bn' }) => {
  const total = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const kpiCards = [
    {
      label: lang === 'bn' ? 'মোট পারিবারিক ব্যয়' : 'Total Household Expenses',
      value: `৳${total.toLocaleString('en-IN')}`,
      subtext: lang === 'bn' ? 'সকল কেনাকাটা ও খরচের সমষ্টি' : 'Sum of all expenses',
      color: '#ea580c',
      bg: 'rgba(234, 88, 12, 0.05)',
      border: 'rgba(234, 88, 12, 0.2)'
    },
    {
      label: lang === 'bn' ? 'মোট বাজার ও আইটেম সংখ্যা' : 'Total Expense Entries',
      value: `${expenses.length} টি`,
      subtext: lang === 'bn' ? 'আইটেম বাই আইটেম এন্ট্রি' : 'Itemized line entries',
      color: '#0f766e',
      bg: 'rgba(15, 118, 110, 0.05)',
      border: 'rgba(15, 118, 110, 0.2)'
    }
  ];

  const columns = [
    { header: lang === 'bn' ? 'ক্রমিক' : 'SL', key: 'sl', align: 'center' },
    { header: lang === 'bn' ? 'তারিখ' : 'Date', key: 'date' },
    { header: lang === 'bn' ? 'খাত / ফোল্ডার' : 'Folder', key: 'folder' },
    { header: lang === 'bn' ? 'বাজারের পণ্য / আইটেম (তেল, চাল, ডাল)' : 'Item Description', key: 'item' },
    { header: lang === 'bn' ? 'পরিবারের সদস্য' : 'Member', key: 'member' },
    { header: lang === 'bn' ? 'পরিমাণ ও একক' : 'Quantity', key: 'qty', align: 'center' },
    { header: lang === 'bn' ? 'টাকার পরিমাণ (৳)' : 'Amount', key: 'amount', align: 'right' },
    { header: lang === 'bn' ? 'নোট' : 'Notes', key: 'note' }
  ];

  const rows = expenses.map((item, idx) => ({
    sl: idx + 1,
    date: item.date || '—',
    folder: `<span class="badge badge-amber">${item.folder || item.category || 'গৃহস্থালি'}</span>`,
    item: `<strong>${item.item || item.title || 'বাজার খরচ'}</strong>`,
    member: item.member || item.person || item.spentBy || 'পরিবার',
    qty: item.quantity ? `${item.quantity} ${item.unit || ''}` : '—',
    amount: `<strong style="color: #ea580c;">৳${(Number(item.amount) || 0).toLocaleString('en-IN')}</strong>`,
    note: item.note || '—'
  }));

  return buildModernDocumentHtml({
    title: lang === 'bn' ? 'পারিবারিক খরচের বিস্তারিত লাইন-বাই-লাইন হিসাব' : 'Detailed Family Household Expense Report',
    subtitle: lang === 'bn' ? 'তেল, চাল, ডাল, লবণসহ প্রতিটি কেনাকাটা ও সদস্যভিত্তিক ব্যয়ের বিবরণী' : 'Line-by-line breakdown of household bazaar, grocery and utility expenses',
    kpiCards,
    tables: [{ sectionTitle: lang === 'bn' ? '🛒 বাজার ও পারিবারিক ব্যয়ের তালিকা' : 'Expense Line Items', columns, rows }],
    summaryRows: [
      { label: lang === 'bn' ? 'সর্বমোট পারিবারিক ব্যয়:' : 'Total Household Expenses:', value: `৳${total.toLocaleString('en-IN')}` }
    ],
    lang
  });
};

export const exportTableToPrintablePdf = ({
  title,
  subtitle = '',
  columns = [],
  rows = [],
  summaryRows = [],
  kpiCards = [],
  lang = 'bn'
}) => {
  const html = buildModernDocumentHtml({
    title,
    subtitle,
    kpiCards,
    tables: [{ columns, rows }],
    summaryRows,
    lang
  });

  // Safe fallback if popups are blocked or on mobile WebView
  try {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      // Popups blocked or Android WebView restriction: Print directly via compositor iframe!
      printHtmlContent(html, { title, paperType: 'a4' });
      return;
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  } catch (err) {
    console.warn('Popup print blocked or failed, using offscreen print iframe fallback:', err);
    printHtmlContent(html, { title, paperType: 'a4' });
  }
};

// ----------------------------------------------------
// 3. INTELLIGENT EXCEL PARSER
// ----------------------------------------------------

export const parseExcelFile = async (file) => {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // Raw array of arrays (headers + rows)
  const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  if (!rawRows || rawRows.length < 2) {
    throw new Error('এক্সেল ফাইলটিতে পর্যাপ্ত ডেটা পাওয়া যায়নি।');
  }

  // Find header line
  let headerIndex = 0;
  for (let i = 0; i < Math.min(5, rawRows.length); i++) {
    const row = rawRows[i];
    if (row && row.some(cell => String(cell).trim().length > 0)) {
      headerIndex = i;
      break;
    }
  }

  const rawHeaders = rawRows[headerIndex].map(h => String(h || '').trim());
  const dataRows = rawRows.slice(headerIndex + 1).filter(r => r && r.some(c => String(c).trim().length > 0));

  // Intelligent column detection
  const detectedMapping = {
    date: detectColumnIndex(rawHeaders, ['date', 'তারিখ', 'time', 'দিন', 'dt']),
    item: detectColumnIndex(rawHeaders, ['item', 'title', 'description', 'বিবরণ', 'পণ্য', 'নাম', 'খরচ', 'নাম/বিবরণ', 'খরচের নাম']),
    member: detectColumnIndex(rawHeaders, ['member', 'person', 'spentby', 'who', 'কার খরচ', 'সদস্য', 'ব্যক্তি']),
    amount: detectColumnIndex(rawHeaders, ['amount', 'total', 'taka', 'টাকা', 'মূল্য', 'মোট', 'টাকার পরিমাণ', 'price', 'খরচ']),
    quantity: detectColumnIndex(rawHeaders, ['quantity', 'qty', 'পরিমাণ', 'সংখ্যা', 'কতটুকু']),
    unit: detectColumnIndex(rawHeaders, ['unit', 'একক', 'পরিমাপ']),
    folder: detectColumnIndex(rawHeaders, ['folder', 'category', 'খাত', 'ক্যাটাগরি', 'ধরন', 'ফোল্ডার']),
    note: detectColumnIndex(rawHeaders, ['note', 'remarks', 'মন্তব্য', 'মেমো', 'নোট'])
  };

  return {
    headers: rawHeaders,
    rawRows: dataRows,
    detectedMapping
  };
};

function detectColumnIndex(headers, keywords) {
  for (let idx = 0; idx < headers.length; idx++) {
    const h = headers[idx].toLowerCase();
    for (const kw of keywords) {
      if (h.includes(kw.toLowerCase())) {
        return idx;
      }
    }
  }
  return -1;
}

// ----------------------------------------------------
// 4. INTELLIGENT PDF PARSER
// ----------------------------------------------------

export const parsePdfFile = async (file, onProgress) => {
  const reportProgress = (percent, stage) => {
    if (typeof onProgress === 'function') {
      onProgress({ percent, stage });
    }
  };

  reportProgress(10, 'ফাইল পড়া শুরু হচ্ছে...');
  const buffer = await file.arrayBuffer();

  reportProgress(25, 'PDF ইঞ্জিন প্রস্তুত হচ্ছে ও পেজ ডিটেক্ট করা হচ্ছে...');
  const loadingTask = pdfjsLib.getDocument({ data: buffer });
  const pdf = await loadingTask.promise;

  let allLines = [];
  const totalPages = pdf.numPages || 1;

  for (let i = 1; i <= totalPages; i++) {
    const pagePercent = Math.round(25 + ((i / totalPages) * 35));
    reportProgress(pagePercent, `পেজ ${i}/${totalPages} স্ক্যান ও লাইন এক্সট্রাক্ট করা হচ্ছে...`);

    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const items = textContent.items || [];

    // Group items by line (similar y coordinates)
    const lineMap = new Map();
    items.forEach(item => {
      const y = Math.round(item.transform[5]);
      if (!lineMap.has(y)) {
        lineMap.set(y, []);
      }
      lineMap.get(y).push({
        x: item.transform[4],
        text: item.str
      });
    });

    // Sort lines from top to bottom
    const sortedY = Array.from(lineMap.keys()).sort((a, b) => b - a);
    sortedY.forEach(y => {
      const lineItems = lineMap.get(y).sort((a, b) => a.x - b.x);
      const lineText = lineItems.map(it => it.text).join(' ').trim();
      if (lineText.length > 0) {
        allLines.push(lineText);
      }
    });
  }

  reportProgress(65, 'লাইন বাই লাইন লেনদেন ও তারিখ অ্যানালাইসিস শুরু...');
  const parsedRecords = [];

  // Robust Date regex: DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY, or Month Name dates (supporting Bengali digits)
  const dateRegex = /\b([0-9০-৯]{1,4}[-/.\s][0-9০-৯]{1,2}[-/.\s][0-9০-৯]{1,4}|[0-9০-৯]{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December|জানুয়ারি|ফেব্রুয়ারি|মার্চ|এপ্রিল|মে|জুন|জুলাই|আগস্ট|সেপ্টেম্বর|অক্টোবর|নভেম্বর|ডিসেম্বর)[a-z]*\s+[0-9০-৯]{2,4})\b/i;
  // Currency/Number regex: handles 1,500.00, ৳১,৫০০, 500, etc.
  const numberRegex = /(?:[৳$€£]\s*)?([0-9০-৯]{1,3}(?:[, ][0-9০-৯]{3})*(?:\.[0-9০-৯]+)?|[0-9০-৯]+(?:\.[0-9০-৯]+)?)/g;

  const totalLines = allLines.length;
  allLines.forEach((line, idx) => {
    if (idx % 20 === 0 && totalLines > 0) {
      const lineProgress = Math.round(65 + ((idx / totalLines) * 25));
      reportProgress(lineProgress, `লেনদেনের বিবরণ ও ক্যাটাগরি তৈরি হচ্ছে (${idx}/${totalLines})...`);
    }

    // Ignore lines that are strictly header or summary totals
    if (
      line.includes('Page ') || 
      (line.includes('Total') && line.includes('Report')) ||
      line.includes('Statement Period') ||
      line.toLowerCase().includes('generated on')
    ) {
      return;
    }

    const dateMatch = line.match(dateRegex);
    const rawMatches = line.match(numberRegex) || [];

    // If line has a date and at least one number, it's likely a transaction
    if (dateMatch && rawMatches.length > 0) {
      // Pick the last number on the line as the amount (typical for expense/statement sheets)
      const lastNumStr = rawMatches[rawMatches.length - 1];
      const amountVal = parseAmountSafely(lastNumStr);

      if (amountVal > 0) {
        const foundDate = dateMatch[0];
        // Clean description: strip date and amount from the line
        let desc = line
          .replace(foundDate, '')
          .replace(lastNumStr, '')
          .replace(/[৳$€£,]/g, '')
          .replace(/\s+/g, ' ')
          .trim();

        // Extract possible quantity & unit (e.g. 5 kg, 2 pcs, 500 g)
        const qtyMatch = desc.match(/([0-9০-৯]+(?:\.[0-9০-৯]+)?)\s*(কেজি|গ্রাম|লিটার|পিস|টিপ|ডজন|kg|g|gm|ltr|l|pcs|ft)/i);
        let quantity = null;
        let unit = '';

        if (qtyMatch) {
          quantity = parseAmountSafely(qtyMatch[1]);
          unit = qtyMatch[2];
        }

        if (desc.length > 1) {
          parsedRecords.push({
            date: normalizeDate(foundDate),
            item: desc,
            amount: amountVal,
            quantity: quantity,
            unit: unit,
            folder: guessFolderFromText(desc, 'family'),
            note: 'PDF থেকে ইমপোর্টকৃত'
          });
        }
      }
    }
  });

  reportProgress(100, `অ্যানালাইসিস সম্পন্ন! মোট ${parsedRecords.length}টি লেনদেন পাওয়া গেছে।`);

  return {
    rawLinesCount: allLines.length,
    parsedRecords
  };
};

export function parseAmountSafely(val) {
  if (typeof val === 'number') return isNaN(val) ? 0 : Math.abs(val);
  if (!val) return 0;
  try {
    const bnDigits = { '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9' };
    let clean = String(val)
      .replace(/[০-৯]/g, d => bnDigits[d] || d)
      .replace(/[৳$€£,]/g, '')
      .replace(/tk|bdt|taka|টাকা/gi, '')
      .trim();
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : Math.abs(parsed);
  } catch (err) {
    console.warn('parseAmountSafely fallback:', err);
    return 0;
  }
}

export function normalizeDate(str) {
  if (!str) return new Date().toISOString().split('T')[0];
  try {
    // 1. JavaScript Date instance
    if (str instanceof Date && !isNaN(str.getTime())) {
      return str.toISOString().split('T')[0];
    }

    // 2. Excel Numeric Serial Date (e.g. 45200 ~ 2023+)
    if (typeof str === 'number' || (!isNaN(str) && Number(str) > 20000 && Number(str) < 70000)) {
      const excelEpoch = new Date(Math.round((Number(str) - 25569) * 86400 * 1000));
      if (!isNaN(excelEpoch.getTime())) {
        return excelEpoch.toISOString().split('T')[0];
      }
    }

    // 3. Convert Bengali digits to English
    const bnDigits = { '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9' };
    let clean = String(str).replace(/[০-৯]/g, d => bnDigits[d] || d).trim();

    // Month mapping table
    const monthMap = {
      jan: '01', january: '01', 'জানু': '01', 'জানুয়ারি': '01',
      feb: '02', february: '02', 'ফেব্রু': '02', 'ফেব্রুয়ারি': '02',
      mar: '03', march: '03', 'মার্চ': '03',
      apr: '04', april: '04', 'এপ্রিল': '04',
      may: '05', 'মে': '05',
      jun: '06', june: '06', 'জুন': '06',
      jul: '07', july: '07', 'জুলাই': '07',
      aug: '08', august: '08', 'আগস্ট': '08',
      sep: '09', september: '09', 'সেপ্টেম্বর': '09',
      oct: '10', october: '10', 'অক্টোবর': '10',
      nov: '11', november: '11', 'নভেম্বর': '11',
      dec: '12', december: '12', 'ডিসেম্বর': '12'
    };

    // Check for "15 May 2026" or "15-May-2026"
    const textMonthMatch = clean.match(/^(\d{1,2})[-/\s]+([a-zA-Z\u0980-\u09FF]+)[-/\s,]+(\d{2,4})$/);
    if (textMonthMatch) {
      const day = textMonthMatch[1].padStart(2, '0');
      const mStr = textMonthMatch[2].toLowerCase().slice(0, 3);
      const month = monthMap[mStr] || '01';
      let year = textMonthMatch[3];
      if (year.length === 2) year = `20${year}`;
      return `${year}-${month}-${day}`;
    }

    // Check for "May 15, 2026"
    const monthFirstMatch = clean.match(/^([a-zA-Z\u0980-\u09FF]+)[-/\s]+(\d{1,2})[-/\s,]+(\d{2,4})$/);
    if (monthFirstMatch) {
      const mStr = monthFirstMatch[1].toLowerCase().slice(0, 3);
      const month = monthMap[mStr] || '01';
      const day = monthFirstMatch[2].padStart(2, '0');
      let year = monthFirstMatch[3];
      if (year.length === 2) year = `20${year}`;
      return `${year}-${month}-${day}`;
    }

    const parts = clean.split(/[-/.]/);
    if (parts.length === 3) {
      // YYYY-MM-DD
      if (parts[0].length === 4) {
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      }
      // DD-MM-YYYY
      if (parts[2].length === 4) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
      // DD-MM-YY
      if (parts[2].length === 2) {
        return `20${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
  } catch (e) {
    console.warn('Date normalize fallback:', e);
  }
  return new Date().toISOString().split('T')[0];
}

export function guessFolderFromText(text, destinationType = 'family') {
  if (!text) return destinationType === 'biz_expense' ? 'অন্যান্য ব্যবসায়িক খরচ' : 'গৃহস্থালি ও নিত্য কেনাকাটা';
  const t = String(text).toLowerCase();

  // Gas, Cylinder, LPG, Electricity, Water, Utilities
  if (
    t.includes('গ্যাস') || t.includes('gas') || t.includes('lpg') || t.includes('এলপিজি') ||
    t.includes('সিলিন্ডার') || t.includes('cylinder') || t.includes('বিদ্যুৎ') || t.includes('কারেন্ট') ||
    t.includes('পানি') || t.includes('water') || t.includes('bill') || t.includes('ডেসকো') ||
    t.includes('ওয়াসা') || t.includes('নেস্কো') || t.includes('পল্লী') || t.includes('বিদ্যুত')
  ) {
    return destinationType === 'biz_expense' ? 'ইউটিলিটি ও বিল' : 'বিদ্যুৎ, গ্যাস ও ইউটিলিটি';
  }

  // House / Flat / Shop Rent
  if (t.includes('ভাড়া') || t.includes('বাসা') || t.includes('ফ্ল্যাট') || t.includes('rent') || t.includes('দোকান ভাড়া') || t.includes('গোডাউন')) {
    return destinationType === 'biz_expense' ? 'দোকান ও গোডাউন ভাড়া' : 'বাসা ও ফ্ল্যাট খরচ';
  }

  // Grocery, Bazaar, Meat, Fish, Daily items
  if (
    t.includes('চাল') || t.includes('তেল') || t.includes('বাজার') || t.includes('মাছ') ||
    t.includes('সবজি') || t.includes('ডিম') || t.includes('grocery') || t.includes('মুরগি') ||
    t.includes('মাংস') || t.includes('গোশত') || t.includes('ডাল') || t.includes('আলু') ||
    t.includes('পেঁয়াজ') || t.includes('মসলা') || t.includes('দুধ') || t.includes('চিনি')
  ) {
    return destinationType === 'biz_expense' ? 'দোকান ও টিফিন খরচ' : 'গৃহস্থালি ও নিত্য কেনাকাটা';
  }

  // Children, School, Tuition, Books
  if (t.includes('স্কুল') || t.includes('কলেজ') || t.includes('বই') || t.includes('টিউটর') || t.includes('খাতা') || t.includes('school') || t.includes('মাদ্রাসা') || t.includes('কোচিং') || t.includes('ফি')) {
    return destinationType === 'biz_expense' ? 'অফিস সাপ্লাই ও স্টেশনারি' : 'সন্তানের পড়াশোনা ও স্কুল';
  }

  // Medical, Doctor, Medicine, Pharmacy
  if (t.includes('ওষুধ') || t.includes('ঔষধ') || t.includes('ডাক্তার') || t.includes('হাসপাতাল') || t.includes('ফার্মেসি') || t.includes('টেস্ট') || t.includes('pharma') || t.includes('med') || t.includes('clinic')) {
    return destinationType === 'biz_expense' ? 'জরুরি চিকিৎসা ও ফার্স্ট এইড' : 'পারিবারিক চিকিৎসা ও ওষুধ';
  }

  // Internet, Mobile, Recharge, WiFi
  if (t.includes('ইন্টারনেট') || t.includes('মোবাইল') || t.includes('রিচার্জ') || t.includes('ওয়াইফাই') || t.includes('wifi') || t.includes('recharge') || t.includes('mb') || t.includes('data')) {
    return destinationType === 'biz_expense' ? 'ইন্টারনেট ও ফোন বিল' : 'ইন্টারনেট ও মোবাইল রিচার্জ';
  }

  // Transport, Travel, Fuel
  if (t.includes('গাড়ি') || t.includes('সিএনজি') || t.includes('রিকশা') || t.includes('উবার') || t.includes('পাঠাও') || t.includes('তেল/অকটেন') || t.includes('ফুয়েল') || t.includes('পেট্রোল') || t.includes('ডিজেল') || t.includes('যাতায়াত')) {
    return destinationType === 'biz_expense' ? 'যাতায়াত ও পরিবহন খরচ' : 'যাতায়াত ও পরিবহন';
  }

  // Salary, Staff wages
  if (t.includes('বেতন') || t.includes('salary') || t.includes('স্টাফ') || t.includes('মজুরি') || t.includes('কর্মচারী')) {
    return destinationType === 'biz_expense' ? 'কর্মচারী বেতন ও মজুরি' : 'গৃহকর্মী ও কাজের লোক';
  }

  return destinationType === 'biz_expense' ? 'অন্যান্য ব্যবসায়িক খরচ' : 'অন্যান্য পারিবারিক খরচ';
}
