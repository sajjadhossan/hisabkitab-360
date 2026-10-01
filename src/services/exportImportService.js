import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';

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
    XLSX.writeFile(workbook, fileName);
    return true;
  } catch (error) {
    console.error('Excel Export Error:', error);
    throw error;
  }
};

export const exportFamilyExpensesExcel = (expenses, lang = 'bn') => {
  const formattedData = expenses.map((exp, idx) => ({
    [lang === 'bn' ? 'ক্রমিক' : 'SL']: idx + 1,
    [lang === 'bn' ? 'তারিখ' : 'Date']: exp.date || '',
    [lang === 'bn' ? 'ফোল্ডার' : 'Folder']: exp.folder || exp.category || '',
    [lang === 'bn' ? 'আইটেম / বিবরণ' : 'Item Description']: exp.item || exp.title || '',
    [lang === 'bn' ? 'পরিমাণ' : 'Quantity']: exp.quantity !== null && exp.quantity !== undefined ? exp.quantity : '',
    [lang === 'bn' ? 'পরিমাপের একক' : 'Unit']: exp.unit || '',
    [lang === 'bn' ? 'টাকার পরিমাণ (৳)' : 'Amount (BDT)']: Number(exp.amount) || 0,
    [lang === 'bn' ? 'ইভেন্ট / অনুষ্ঠান' : 'Event']: exp.eventName || '',
    [lang === 'bn' ? 'নোট / মেমো' : 'Notes']: exp.note || ''
  }));

  const fileName = `Family_Expenses_${new Date().toISOString().split('T')[0]}.xlsx`;
  return exportToExcel(formattedData, lang === 'bn' ? 'পারিবারিক খরচ' : 'Family Expenses', fileName);
};

export const exportDailyExpensesExcel = (expenses, lang = 'bn') => {
  const formattedData = expenses.map((exp, idx) => ({
    [lang === 'bn' ? 'ক্রমিক' : 'SL']: idx + 1,
    [lang === 'bn' ? 'তারিখ' : 'Date']: exp.date || '',
    [lang === 'bn' ? 'ক্যাটাগরি' : 'Category']: exp.category || '',
    [lang === 'bn' ? 'আইটেম / বিবরণ' : 'Item Description']: exp.item || exp.title || '',
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
  const formattedData = products.map((prod, idx) => ({
    [lang === 'bn' ? 'ক্রমিক' : 'SL']: idx + 1,
    [lang === 'bn' ? 'বারকোড / SKU' : 'Barcode / SKU']: prod.barcode || prod.sku || '',
    [lang === 'bn' ? 'পণ্যের নাম' : 'Product Name']: prod.name || '',
    [lang === 'bn' ? 'ক্যাটাগরি' : 'Category']: prod.category || '',
    [lang === 'bn' ? 'বর্তমান স্টক' : 'Stock Quantity']: prod.stock || 0,
    [lang === 'bn' ? 'ক্রয় মূল্য (৳)' : 'Cost Price (BDT)']: prod.costPrice || 0,
    [lang === 'bn' ? 'বিক্রয় মূল্য (৳)' : 'Selling Price (BDT)']: prod.sellingPrice || 0
  }));

  const fileName = `Business_Inventory_${new Date().toISOString().split('T')[0]}.xlsx`;
  return exportToExcel(formattedData, lang === 'bn' ? 'পণ্য স্টক' : 'Inventory', fileName);
};

export const exportBusinessSalesExcel = (sales, lang = 'bn') => {
  const formattedData = sales.map((sale, idx) => ({
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
// 2. PDF EXPORT HELPERS (PRINTABLE BROWSER ENGINE)
// ----------------------------------------------------

export const exportTableToPrintablePdf = ({
  title,
  subtitle = '',
  columns = [],
  rows = [],
  summaryRows = [],
  lang = 'bn'
}) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert(lang === 'bn' ? 'পপ-আপ উইন্ডো ব্লক করা আছে। দয়া করে অনুমতি দিন।' : 'Pop-up blocked. Please allow popups.');
    return;
  }

  const currentDate = new Date().toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const html = `
    <!DOCTYPE html>
    <html lang="${lang}">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;600;700;800&family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
        
        body {
          font-family: 'Hind Siliguri', 'Plus Jakarta Sans', sans-serif;
          color: #1e293b;
          margin: 0;
          padding: 24px;
          background: #ffffff;
        }

        .header {
          border-bottom: 2px solid #0f766e;
          padding-bottom: 12px;
          margin-bottom: 16px;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }

        .brand {
          font-size: 22px;
          font-weight: 800;
          color: #0f766e;
        }

        .report-title {
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
          margin: 4px 0 2px;
        }

        .report-subtitle {
          font-size: 13px;
          color: #64748b;
        }

        .meta {
          font-size: 12px;
          color: #64748b;
          text-align: right;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 12px;
          font-size: 12px;
        }

        th {
          background-color: #f1f5f9;
          color: #334155;
          font-weight: 700;
          text-align: left;
          padding: 8px 10px;
          border-top: 1px solid #cbd5e1;
          border-bottom: 2px solid #cbd5e1;
        }

        td {
          padding: 8px 10px;
          border-bottom: 1px solid #e2e8f0;
        }

        tr:nth-child(even) td {
          background-color: #f8fafc;
        }

        .summary-box {
          margin-top: 16px;
          border-top: 2px solid #cbd5e1;
          padding-top: 10px;
          display: flex;
          justify-content: flex-end;
        }

        .summary-table {
          width: auto;
          min-width: 250px;
        }

        .summary-table td {
          padding: 4px 8px;
          border: none;
        }

        .summary-table .total-label {
          font-weight: 700;
          text-align: right;
        }

        .summary-table .total-val {
          font-weight: 800;
          font-size: 14px;
          color: #0f766e;
          text-align: right;
        }

        .footer {
          margin-top: 30px;
          border-top: 1px dashed #cbd5e1;
          padding-top: 8px;
          font-size: 11px;
          color: #94a3b8;
          display: flex;
          justify-content: space-between;
        }

        @media print {
          body { padding: 0; }
          .no-print { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 15px; display: flex; gap: 10px;">
        <button onclick="window.print()" style="padding: 8px 16px; background: #0f766e; color: #fff; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">
          🖨️ ${lang === 'bn' ? 'প্রিন্ট বা PDF হিসেবে সেভ করুন' : 'Print / Save as PDF'}
        </button>
        <button onclick="window.close()" style="padding: 8px 16px; background: #e2e8f0; color: #334155; border: none; border-radius: 6px; cursor: pointer;">
          ${lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
        </button>
      </div>

      <div class="header">
        <div>
          <div class="brand">হিসাব-কিতাব ৩৬০ (HisabKitab 360)</div>
          <div class="report-title">${title}</div>
          ${subtitle ? `<div class="report-subtitle">${subtitle}</div>` : ''}
        </div>
        <div class="meta">
          <div>${lang === 'bn' ? 'তৈরির তারিখ:' : 'Generated on:'} ${currentDate}</div>
          <div>${lang === 'bn' ? 'মোট রেকর্ড:' : 'Total Records:'} ${rows.length} টি</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            ${columns.map(col => `<th style="${col.align ? `text-align: ${col.align};` : ''}">${col.header}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.map(row => `
            <tr>
              ${columns.map(col => `<td style="${col.align ? `text-align: ${col.align};` : ''}">${row[col.key] || '—'}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>

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
        <span>হিসাব-কিতাব ৩৬০ স্মার্ট ফিন্যান্স সিস্টেম থেকে মুদ্রিত</span>
        <span>পৃষ্ঠা ১/১</span>
      </div>

      <script>
        // Auto trigger print prompt for convenience
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 300);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};

// ----------------------------------------------------
// 3. INTELLIGENT EXCEL PARSER
// ----------------------------------------------------

export const parseExcelFile = async (file) => {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
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

export const parsePdfFile = async (file) => {
  const buffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: buffer });
  const pdf = await loadingTask.promise;

  let allLines = [];

  for (let i = 1; i <= pdf.numPages; i++) {
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

  // Analyze lines using intelligent regex heuristics for Date, Amount, Description
  const parsedRecords = [];

  // Date regex: DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY, or DD Mon YYYY
  const dateRegex = /\b(\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4})\b/;
  // Currency/Number regex: e.g. 1,500.00 or 500 or 1500
  const numberRegex = /\b(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+)\b/g;

  allLines.forEach((line) => {
    // Ignore lines that are header-like or footer-like
    if (line.includes('Page ') || line.includes('Total') && line.includes('Report')) {
      return;
    }

    const dateMatch = line.match(dateRegex);
    const numbers = line.match(numberRegex) || [];

    // If line has a date and at least one number, it's likely a transaction
    if (dateMatch && numbers.length > 0) {
      // Pick the last number on the line as the amount (typical for expense sheets)
      const rawAmountStr = numbers[numbers.length - 1].replace(/,/g, '');
      const amountVal = parseFloat(rawAmountStr);

      if (!isNaN(amountVal) && amountVal > 0) {
        const foundDate = dateMatch[0];
        // Clean description: strip date and amount from the line
        let desc = line
          .replace(foundDate, '')
          .replace(numbers[numbers.length - 1], '')
          .replace(/[৳$€£,]/g, '')
          .trim();

        // Extract possible quantity & unit (e.g. 5 kg, 2 pcs, 500 g)
        const qtyMatch = desc.match(/(\d+(?:\.\d+)?)\s*(কেজি|গ্রাম|লিটার|পিস|টিপ|ডজন|kg|g|gm|ltr|l|pcs|ft)/i);
        let quantity = null;
        let unit = '';

        if (qtyMatch) {
          quantity = parseFloat(qtyMatch[1]);
          unit = qtyMatch[2];
        }

        if (desc.length > 1) {
          parsedRecords.push({
            date: normalizeDate(foundDate),
            item: desc,
            amount: amountVal,
            quantity: quantity,
            unit: unit,
            folder: guessFolderFromText(desc),
            note: 'Imported from PDF'
          });
        }
      }
    }
  });

  return {
    rawLinesCount: allLines.length,
    parsedRecords
  };
};

function normalizeDate(str) {
  try {
    const parts = str.split(/[-/.]/);
    if (parts.length === 3) {
      // If YYYY-MM-DD
      if (parts[0].length === 4) {
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      }
      // If DD-MM-YYYY
      if (parts[2].length === 4) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
  } catch {
    // fallback
  }
  return new Date().toISOString().split('T')[0];
}

function guessFolderFromText(text) {
  const t = text.toLowerCase();
  if (t.includes('চাল') || t.includes('তেল') || t.includes('বাজার') || t.includes('মাছ') || t.includes('সবজি') || t.includes('ডিম') || t.includes('grocery')) {
    return 'গৃহস্থালি ও নিত্য কেনাকাটা';
  }
  if (t.includes('বিদ্যুৎ') || t.includes('গ্যাস') || t.includes('পানি') || t.includes('কারেন্ট') || t.includes('bill')) {
    return 'বিদ্যুৎ, গ্যাস ও ইউটিলিটি';
  }
  if (t.includes('স্কুল') || t.includes('কলেজ') || t.includes('বই') || t.includes('বেতন') || t.includes('টিউটর') || t.includes('খাতা')) {
    return 'সন্তানের পড়াশোনা ও স্কুল';
  }
  if (t.includes('ওষুধ') || t.includes('ডাক্তার') || t.includes('হাসপাতাল') || t.includes('ফার্মেসি') || t.includes('টেস্ট')) {
    return 'পারিবারিক চিকিৎসা ও ওষুধ';
  }
  if (t.includes('ইন্টারনেট') || t.includes('মোবাইল') || t.includes('রিচার্জ') || t.includes('ওয়াইফাই')) {
    return 'ইন্টারনেট ও মোবাইল রিচার্জ';
  }
  if (t.includes('ভাড়া') || t.includes('বাসা') || t.includes('ফ্ল্যাট') || t.includes('rent')) {
    return 'বাসা ও ফ্ল্যাট খরচ';
  }
  return 'অন্যান্য পারিবারিক খরচ';
}
