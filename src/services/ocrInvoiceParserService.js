/**
 * HisabKitab 360 - OCR Invoice & Receipt Smart Parser (Tip 44)
 * High-precision heuristic parser for scanned vendor purchase slips, cash memos,
 * and supplier challans. Extracts Invoice No, Date, Line Items, VAT, and Grand Total.
 */

class OcrInvoiceParserService {
  /**
   * Convert Bengali numerals to standard Western numerals
   */
  normalizeNumerals(str = '') {
    const bnToEnMap = { '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9' };
    return str.replace(/[০-৯]/g, match => bnToEnMap[match] || match);
  }

  /**
   * Parse OCR text into structured invoice JSON
   * @param {string} rawOcrText - Raw OCR transcript from camera or image scanner
   * @returns {Object} Structured invoice record
   */
  parseInvoice(rawOcrText = '') {
    if (!rawOcrText || typeof rawOcrText !== 'string') {
      return {
        success: false,
        error: 'কোনো টেক্সট পাওয়া যায়নি'
      };
    }

    const normalized = this.normalizeNumerals(rawOcrText);
    const lines = normalized.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

    let invoiceNumber = '';
    let invoiceDate = new Date().toISOString().split('T')[0];
    let supplierName = '';
    let subtotal = 0;
    let vatAmount = 0;
    let grandTotal = 0;
    const lineItems = [];

    // 1. Extract Invoice / Memo Number
    const invRegex = /(?:invoice|memo|bill|challan|মেমো|বিল|চালান নং|নং)\s*[:#\.\-]?\s*([A-Za-z0-9\-]+)/i;
    for (const line of lines) {
      const match = line.match(invRegex);
      if (match && match[1]) {
        invoiceNumber = match[1];
        break;
      }
    }
    if (!invoiceNumber) {
      invoiceNumber = 'INV-' + Math.floor(100000 + Math.random() * 900000);
    }

    // 2. Extract Date
    const dateRegex = /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/;
    for (const line of lines) {
      const match = line.match(dateRegex);
      if (match && match[1]) {
        invoiceDate = match[1];
        break;
      }
    }

    // 3. Extract Supplier Name (usually top 1-3 lines before invoice meta)
    if (lines.length > 0) {
      // Find candidate non-numeric line at top
      for (let i = 0; i < Math.min(4, lines.length); i++) {
        const line = lines[i];
        if (line.length > 3 && !invRegex.test(line) && !dateRegex.test(line) && !line.includes('Total')) {
          supplierName = line;
          break;
        }
      }
    }
    if (!supplierName) supplierName = 'সাধারণ সরবরাহকারী (Supplier)';

    // 4. Extract Line Items (e.g., "Miniket Rice 25 kg 1850" or "সয়াবিন তেল 5 লিটার 950")
    // Pattern: [Item Name] [Quantity] [Unit/Price] [Total]
    const itemPattern = /^(.*?)\s+(\d+(?:\.\d+)?)\s*(?:পিস|কেজি|লিটার|কার্টন|kg|pcs|ltr)?\s+(?:@?\s*(\d+(?:\.\d+)?)\s+)?(\d+(?:\.\d+)?)$/i;

    lines.forEach(line => {
      // Skip summary lines
      if (/total|মোট|subtotal|vat|ভ্যাট|সার্ভিস|discount|ছাড়/i.test(line)) return;

      const match = line.match(itemPattern);
      if (match) {
        const name = match[1].trim();
        const qty = parseFloat(match[2]);
        let unitPrice = match[3] ? parseFloat(match[3]) : 0;
        const total = parseFloat(match[4]);

        if (qty > 0 && total > 0) {
          if (!unitPrice) unitPrice = Math.round(total / qty);
          lineItems.push({
            name,
            quantity: qty,
            unitPrice,
            total
          });
        }
      }
    });

    // 5. Extract Totals
    lines.forEach(line => {
      if (/grand\s*total|সর্বমোট|নেট\s*পরিশোধ/i.test(line)) {
        const numMatch = line.match(/(\d+(?:\.\d+)?)/g);
        if (numMatch) grandTotal = parseFloat(numMatch[numMatch.length - 1]);
      } else if (/vat|ভ্যাট|কর|tax/i.test(line)) {
        const numMatch = line.match(/(\d+(?:\.\d+)?)/g);
        if (numMatch) vatAmount = parseFloat(numMatch[numMatch.length - 1]);
      } else if (/sub\s*total|সাব\s*টোটাল/i.test(line)) {
        const numMatch = line.match(/(\d+(?:\.\d+)?)/g);
        if (numMatch) subtotal = parseFloat(numMatch[numMatch.length - 1]);
      }
    });

    // Fallback totals calculation
    const calculatedItemSum = lineItems.reduce((sum, item) => sum + item.total, 0);
    if (!grandTotal) {
      grandTotal = calculatedItemSum > 0 ? (calculatedItemSum + vatAmount) : 0;
    }
    if (!subtotal) {
      subtotal = calculatedItemSum > 0 ? calculatedItemSum : grandTotal;
    }

    return {
      success: true,
      invoiceNumber,
      invoiceDate,
      supplierName,
      lineItems,
      itemCount: lineItems.length,
      subtotal,
      vatAmount,
      grandTotal,
      rawLineCount: lines.length
    };
  }
}

export const ocrInvoiceParserService = new OcrInvoiceParserService();
export default ocrInvoiceParserService;
