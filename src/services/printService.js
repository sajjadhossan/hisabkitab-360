// Universal High-Reliability Print Service for HisabKitab 360
// Supports: Direct Instant A4 Invoice Printing, Thermal Receipts (58mm/80mm),
// Quotations, Barcodes, Labels & Salary Slips with Zero-Failure Architecture.

import { generateQrDataUrl, generateInvoiceQrPayload } from './qrService';

/**
 * Universal print runner that prints any HTML string using a reliable,
 * off-screen compositor iframe with real dimensions and opacity 0.01.
 * This completely avoids the Chrome/Chromium 0x0 hidden iframe blocking bug.
 */
export const printHtmlContent = (htmlContent, options = {}) => {
  const {
    title = 'HisabKitab 360 Document',
    paperType = 'a4', // 'a4' | 'receipt' | 'label'
    paperWidth = '80mm'
  } = options;

  let pageCss = '';
  if (paperType === 'receipt') {
    const widthMm = paperWidth === '58mm' ? '58mm' : '80mm';
    pageCss = `
      @page {
        size: ${widthMm} auto;
        margin: 0mm;
      }
      html, body {
        width: 100% !important;
        max-width: ${widthMm} !important;
        margin: 0 auto !important;
        padding: 1mm 2mm !important;
        font-family: 'JetBrains Mono', 'Courier New', monospace !important;
        font-size: ${paperWidth === '58mm' ? '10.5px' : '11.5px'} !important;
        background: #ffffff !important;
        color: #000000 !important;
      }
      .printable-receipt {
        width: 100% !important;
        max-width: 100% !important;
        box-shadow: none !important;
        border: none !important;
        margin: 0 auto !important;
        padding: 0 !important;
      }
    `;
  } else if (paperType === 'label') {
    pageCss = `
      @page {
        size: auto;
        margin: 4mm;
      }
      html, body {
        margin: 0 !important;
        padding: 2mm !important;
        background: #ffffff !important;
        color: #000000 !important;
        font-family: 'Hind Siliguri', 'Plus Jakarta Sans', sans-serif !important;
      }
    `;
  } else {
    // Official A4 Document
    pageCss = `
      @page {
        size: A4 portrait;
        margin: 8mm 10mm;
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        font-family: 'Hind Siliguri', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif !important;
        color: #0f172a !important;
        background: #ffffff !important;
        font-size: 13px !important;
        line-height: 1.5 !important;
      }
      .printable-invoice,
      .printable-quotation {
        width: 100% !important;
        max-width: 100% !important;
        box-shadow: none !important;
        border: 1px solid #cbd5e1 !important;
        margin: 0 auto !important;
        padding: 8mm 10mm !important;
      }
    `;
  }

  const fullDoc = `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after {
      box-sizing: border-box !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    ${pageCss}
    .no-print { display: none !important; }
    table { width: 100% !important; border-collapse: collapse !important; }
    th, td, tr { page-break-inside: avoid !important; }
    img { max-width: 100% !important; }
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>`;

  // Print execution: Use off-screen rendered iframe with real dimensions and low opacity
  const frameId = 'hk360-print-worker-frame';
  let iframe = document.getElementById(frameId);
  if (iframe) iframe.remove();

  iframe = document.createElement('iframe');
  iframe.id = frameId;
  iframe.setAttribute('title', 'Print Frame');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '1000px';
  iframe.style.height = '1000px';
  iframe.style.opacity = '0.01';
  iframe.style.pointerEvents = 'none';
  iframe.style.zIndex = '-9999';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  doc.open();
  doc.write(fullDoc);
  doc.close();

  // Allow web fonts, images, and QR canvas to settle
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.warn('Iframe print error, falling back to popup window:', err);
      try {
        const win = window.open('', '_blank', 'width=850,height=750');
        if (win) {
          win.document.write(fullDoc);
          win.document.close();
          win.focus();
          setTimeout(() => {
            win.print();
          }, 300);
        }
      } catch (e) {
        window.print();
      }
    }
  }, 220);
};

/**
 * Prints an existing DOM element by its ID or HTMLElement reference
 */
export const printElement = (elementOrId, options = {}) => {
  let el = null;
  if (typeof elementOrId === 'string') {
    el = document.getElementById(elementOrId) || document.querySelector(elementOrId);
  } else if (elementOrId instanceof HTMLElement) {
    el = elementOrId;
  }

  if (!el) {
    console.warn(`Print target "${elementOrId}" not found, falling back to window.print()`);
    window.print();
    return;
  }

  printHtmlContent(el.outerHTML, options);
};

/**
 * Builds standalone, pixel-perfect A4 Tax Invoice HTML
 */
export const buildInvoiceHtml = (inv, settings = {}, lang = 'bn', qrCodeUrl = '') => {
  const companyName = settings.companyName || 'হিসাব কিতাব ৩৬০';
  const tagline = settings.tagline || 'ব্যবসা ও হিসাবের সম্পূর্ণ সমাধান';
  const address = settings.address || '';
  const phone = settings.phone || '';
  const altPhone = settings.altPhone || '';
  const email = settings.email || '';
  const website = settings.website || '';
  const binNo = settings.binNo || '004829104-0101';
  const logo = settings.companyLogo || '';
  const footerText = settings.invoiceFooter || 'আমাদের সাথে কেনাকাটা করার জন্য ধন্যবাদ!';
  const stampSeal = settings.signatureStamp || '';

  const grandTotal = Number(inv.grandTotal) || 0;
  const returnTotal = Number(inv.returnTotal) || 0;
  const paidVal = inv.paidAmount !== undefined ? Number(inv.paidAmount) : (inv.status === 'paid' ? grandTotal : 0);
  const dueVal = inv.dueAmount !== undefined ? Number(inv.dueAmount) : (inv.status === 'paid' ? 0 : grandTotal);
  const isReturned = inv.status === 'returned';
  const isPartialReturn = inv.status === 'partial_return';
  const isPaid = !isReturned && (inv.status === 'paid' || dueVal === 0);
  const isPartial = !isPaid && !isReturned && !isPartialReturn && paidVal > 0;

  const stampColor = isReturned
    ? '#a855f7'
    : isPartialReturn
    ? '#f97316'
    : isPaid
    ? '#10b981'
    : isPartial
    ? '#f59e0b'
    : '#ef4444';

  const stampText = isReturned
    ? (lang === 'bn' ? 'সম্পূর্ণ ফেরত (RETURNED)' : 'RETURNED')
    : isPartialReturn
    ? (lang === 'bn' ? 'আংশিক ফেরত (PARTIAL RETURN)' : 'PARTIAL RETURN')
    : isPaid
    ? (lang === 'bn' ? 'পরিশোধিত (PAID)' : 'PAID')
    : isPartial
    ? (lang === 'bn' ? 'আংশিক পরিশোধ (PARTIAL)' : 'PARTIAL PAID')
    : (lang === 'bn' ? 'বকেয়া (DUE)' : 'UNPAID');

  const itemsRows = (inv.items || []).map((item, idx) => `
    <tr style="border-bottom: 1px solid #e2e8f0; background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
      <td style="padding: 8px 10px; color: #64748b; font-size: 11px;">${idx + 1}</td>
      <td style="padding: 8px 10px; font-weight: 600; color: #1e293b;">${item.name}</td>
      <td style="padding: 8px 10px; text-align: center; color: #64748b; font-family: monospace; font-size: 11px;">${item.sku || '-'}</td>
      <td style="padding: 8px 10px; text-align: center; font-weight: 600;">
        ${item.qty}
        ${item.returnedQty > 0 ? `<div style="color: #ea580c; font-size: 10px; font-weight: 700;">(-${item.returnedQty} ${lang === 'bn' ? 'ফেরত' : 'ret'})</div>` : ''}
      </td>
      <td style="padding: 8px 10px; text-align: right; font-family: monospace;">৳${Number(item.price).toLocaleString()}</td>
      <td style="padding: 8px 10px; text-align: right; font-weight: 700; font-family: monospace;">৳${Number(item.subtotal || (item.price * item.qty)).toLocaleString()}</td>
    </tr>
  `).join('');

  return `
    <div class="printable-invoice" style="background: #ffffff; color: #0f172a; padding: 2.5rem 2rem; border-radius: 8px; font-family: 'Hind Siliguri', 'Plus Jakarta Sans', sans-serif; font-size: 13px; line-height: 1.5; border: 1px solid #e2e8f0; position: relative;">
      <!-- Status Stamp -->
      <div style="position: absolute; top: 40px; right: 40px; border: 3px solid ${stampColor}; color: ${stampColor}; padding: 6px 18px; font-weight: 900; fontSize: 17px; letter-spacing: 2px; text-transform: uppercase; border-radius: 8px; transform: rotate(-12deg); opacity: 0.85; pointer-events: none;">
        ${stampText}
      </div>

      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 1.25rem; margin-bottom: 1.5rem;">
        <div>
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px;">
            ${logo ? `<img src="${logo}" alt="Logo" style="max-height: 46px; max-width: 140px; object-fit: contain;" />` : '<span style="font-size: 26px;">💼</span>'}
            <h1 style="font-size: 22px; font-weight: 800; margin: 0; color: #0f172a; letter-spacing: -0.02em;">${companyName}</h1>
          </div>
          <p style="margin: 2px 0; font-size: 12px; color: #64748b; font-weight: 500;">${tagline}</p>
          <div style="margin-top: 8px; font-size: 11px; color: #475569; line-height: 1.6;">
            <div>📍 ${address}</div>
            <div>📞 ${phone} ${altPhone ? `| 📱 ${altPhone}` : ''} | ✉️ ${email}</div>
            ${website ? `<div>🌐 ${website}</div>` : ''}
            <div>🏛️ ${lang === 'bn' ? 'ট্যাক্স / BIN নং:' : 'BIN / TIN No:'} ${binNo}</div>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 14px; margin-top: 16px;">
          ${qrCodeUrl ? `
            <div style="text-align: center; background: #ffffff; padding: 6px 8px; border: 1.5px solid #0f172a; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
              <img src="${qrCodeUrl}" alt="Scan QR" style="width: 92px; height: 92px; display: block; margin: 0 auto;" />
              <span style="font-size: 8.5px; font-weight: 800; color: #0f172a; display: block; margin-top: 3px; letter-spacing: 0.3px;">
                ${lang === 'bn' ? '✓ ডিজিটাল মেমো কিউআর' : '✓ VERIFIED QR'}
              </span>
              <span style="font-size: 7.5px; color: #64748b; display: block; font-weight: 600;">
                ${lang === 'bn' ? 'ক্যামেরায় স্ক্যান করুন' : 'Scan with Camera'}
              </span>
            </div>
          ` : ''}
          <div style="text-align: right;">
            <div style="font-size: 20px; font-weight: 800; color: #1e293b; text-transform: uppercase; letter-spacing: 1px;">
              ${lang === 'bn' ? 'ট্যাক্স ইনভয়েস' : 'TAX INVOICE'}
            </div>
            <div style="font-size: 13px; font-weight: 700; color: #6366f1; margin-top: 2px;">#${inv.id}</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 4px;"><strong>${lang === 'bn' ? 'ইস্যুর তারিখ:' : 'Date:'}</strong> ${inv.date}</div>
            <div style="font-size: 11px; color: #64748b;"><strong>${lang === 'bn' ? 'পরিশোধের শেষ তারিখ:' : 'Due Date:'}</strong> ${inv.dueDate || inv.date}</div>
            ${inv.paymentTerms ? `<div style="font-size: 11px; color: #64748b;"><strong>${lang === 'bn' ? 'শর্ত:' : 'Terms:'}</strong> ${inv.paymentTerms}</div>` : ''}
          </div>
        </div>
      </div>

      <!-- Bill To & Dispatch Grid -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem; background: #f8fafc; padding: 1rem; border-radius: 6px; border: 1px solid #e2e8f0;">
        <div>
          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 4px;">
            ${lang === 'bn' ? 'বিল প্রাপক (CUSTOMER DETAILS):' : 'BILL TO:'}
          </div>
          <div style="font-size: 14px; font-weight: 700; color: #0f172a;">${inv.customerName || 'সাধারণ ক্রেতা'}</div>
          ${inv.customerPhone ? `<div style="font-size: 12px; color: #334155; margin-top: 2px;">📞 ${inv.customerPhone}</div>` : ''}
          ${inv.customerEmail ? `<div style="font-size: 12px; color: #334155;">✉️ ${inv.customerEmail}</div>` : ''}
          ${inv.customerAddress ? `<div style="font-size: 12px; color: #334155; margin-top: 2px;">📍 ${inv.customerAddress}</div>` : ''}
        </div>
        <div>
          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 4px;">
            ${lang === 'bn' ? 'পেমেন্ট ও চালান তথ্য:' : 'PAYMENT & DISPATCH:'}
          </div>
          <div style="font-size: 12px; color: #334155; line-height: 1.6;">
            <div><strong>${lang === 'bn' ? 'পেমেন্ট মেথড:' : 'Method:'}</strong> ${inv.paymentMethod ? inv.paymentMethod.toUpperCase() : (isPaid ? 'PAID' : 'DUE / CREDIT')}</div>
            <div><strong>${lang === 'bn' ? 'কারেন্সি:' : 'Currency:'}</strong> BDT (৳)</div>
            <div><strong>${lang === 'bn' ? 'স্ট্যাটাস:' : 'Status:'}</strong> <span style="color: ${isPaid ? '#16a34a' : '#dc2626'}; font-weight: 700;">${isPaid ? (lang === 'bn' ? 'পরিশোধিত' : 'PAID') : (lang === 'bn' ? 'বকেয়া' : 'DUE')}</span></div>
          </div>
        </div>
      </div>

      <!-- Items Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 1.5rem;">
        <thead>
          <tr style="background: #0f172a; color: #ffffff; text-align: left; font-size: 11px; text-transform: uppercase;">
            <th style="padding: 8px 10px; border-radius: 4px 0 0 0;">#</th>
            <th style="padding: 8px 10px;">${lang === 'bn' ? 'পণ্যের বিবরণ / আইটেম' : 'Item Description'}</th>
            <th style="padding: 8px 10px; text-align: center;">SKU</th>
            <th style="padding: 8px 10px; text-align: center;">${lang === 'bn' ? 'পরিমাণ' : 'Qty'}</th>
            <th style="padding: 8px 10px; text-align: right;">${lang === 'bn' ? 'দর (টাকা)' : 'Unit Price'}</th>
            <th style="padding: 8px 10px; text-align: right; border-radius: 0 4px 0 0;">${lang === 'bn' ? 'মোট (টাকা)' : 'Total'}</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <!-- Financials Grid -->
      <div style="display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 1.5rem; margin-bottom: 2rem;">
        <div>
          <div style="background: #f8fafc; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0; margin-bottom: 10px;">
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #475569; margin-bottom: 4px;">
              ${lang === 'bn' ? 'ব্যাংক ও অনলাইন পেমেন্ট তথ্য:' : 'BANK & PAYMENT DETAILS:'}
            </div>
            <div style="font-size: 11px; color: #334155; line-height: 1.6;">
              <div><strong>${lang === 'bn' ? 'ব্যাংক:' : 'Bank:'}</strong> ${settings.bankName || 'ব্র্যাক ব্যাংক পিএলসি, মিরপুর শাখা'}</div>
              <div><strong>${lang === 'bn' ? 'হিসাব নং:' : 'A/C No:'}</strong> ${settings.bankAccountNo || '1501204892019001 (মেসার্স আল-মদিনা)'}</div>
              <div><strong>${lang === 'bn' ? 'বিকাশ মার্চেন্ট:' : 'bKash Merchant:'}</strong> ${settings.bkashMerchant || '01712-345678'}</div>
            </div>
          </div>
          ${inv.notes ? `
            <div style="font-size: 11px; color: #475569; background: #fffbeb; padding: 8px 12px; border-radius: 6px; border: 1px solid #fef3c7;">
              <strong>${lang === 'bn' ? 'বিশেষ দ্রষ্টব্য / নোট:' : 'Notes:'}</strong> ${inv.notes}
            </div>
          ` : ''}
        </div>

        <div style="background: #f8fafc; padding: 12px 16px; border-radius: 6px; border: 1px solid #e2e8f0;">
          <div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; color: #475569;">
            <span>${lang === 'bn' ? 'সাবটোটাল:' : 'Subtotal:'}</span>
            <span style="font-weight: 600; font-family: monospace;">৳${Number(inv.subtotal).toLocaleString()}</span>
          </div>
          ${inv.discount > 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; color: #16a34a;">
              <span>${lang === 'bn' ? 'ডিসকাউন্ট / ছাড়:' : 'Discount:'}</span>
              <span style="font-weight: 600; font-family: monospace;">- ৳${Number(inv.discount).toLocaleString()}</span>
            </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; color: #475569;">
            <span>${lang === 'bn' ? `ভ্যাট (${inv.vatRate || 5}%):` : `VAT (${inv.vatRate || 5}%):`}</span>
            <span style="font-weight: 600; font-family: monospace;">+ ৳${Number(inv.vat).toLocaleString()}</span>
          </div>
          <div style="border-top: 2px solid #0f172a; margin-top: 8px; padding-top: 8px; display: flex; justify-content: space-between; font-size: 14px; font-weight: 800; color: #0f172a;">
            <span>${lang === 'bn' ? 'মূল প্রদেয় বিল:' : 'Original Total:'}</span>
            <span style="font-family: monospace;">৳${grandTotal.toLocaleString()}</span>
          </div>
          ${returnTotal > 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; color: #ea580c;">
              <span>${lang === 'bn' ? 'পণ্য ফেরত সমন্বয় (Return Credit):' : 'Return Credit:'}</span>
              <span style="font-weight: 700; font-family: monospace;">- ৳${returnTotal.toLocaleString()}</span>
            </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; color: #16a34a; border-top: 1px dashed #cbd5e1; margin-top: 6px; padding-top: 6px;">
            <span>${lang === 'bn' ? 'পরিশোধিত অর্থ (Paid):' : 'Paid Amount:'}</span>
            <span style="font-weight: 700; font-family: monospace;">৳${paidVal.toLocaleString()}</span>
          </div>
          ${dueVal > 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; color: #dc2626; font-weight: 800;">
              <span>${lang === 'bn' ? 'অবশিষ্ট বকেয়া (Due Balance):' : 'Remaining Due:'}</span>
              <span style="font-family: monospace;">৳${dueVal.toLocaleString()}</span>
            </div>
          ` : `
            <div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 11px; color: #16a34a; font-weight: 700;">
              <span>${lang === 'bn' ? 'স্ট্যাটাস:' : 'Status:'}</span>
              <span>${isReturned ? (lang === 'bn' ? 'সম্পূর্ণ ফেরত (Returned)' : 'Returned') : (lang === 'bn' ? 'সম্পূর্ণ পরিশোধিত (All Clear)' : 'Fully Paid')}</span>
            </div>
          `}
        </div>
      </div>

      <!-- Signatures Footer -->
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 3rem; padding-top: 1rem; border-top: 1px dashed #cbd5e1;">
        <div style="text-align: center; width: 180px;">
          <div style="border-top: 1px solid #475569; padding-top: 6px; font-size: 11px; color: #475569;">
            ${lang === 'bn' ? 'গ্রাহকের স্বাক্ষর' : 'Customer Signature'}
          </div>
        </div>

        <div style="text-align: center; font-size: 10px; color: #94a3b8;">
          <div>${footerText}</div>
          <div style="font-size: 9px; color: #64748b; margin-top: 2px;">
            🛡️ ${lang === 'bn' ? 'এই ক্যাশমেমোর সঠিকতা যেকোনো স্মার্টফোনে কিউআর কোড স্ক্যান করে যাচাই করা যাবে।' : 'Scan QR code to verify this official invoice.'}
          </div>
          <div>Generated by HisabKitab 360 OS</div>
        </div>

        <div style="text-align: center; width: 180px;">
          ${stampSeal ? `<img src="${stampSeal}" alt="Official Seal" style="max-height: 48px; max-width: 120px; object-fit: contain; margin: 0 auto 4px; display: block;" />` : ''}
          <div style="border-top: 1px solid #475569; padding-top: 6px; font-size: 11px; color: #475569; font-weight: 700;">
            ${lang === 'bn' ? 'অনুমোদিত স্বাক্ষর ও সিল' : 'Authorized Signature'}
          </div>
        </div>
      </div>
    </div>
  `;
};

/**
 * Builds standalone Thermal Receipt HTML (58mm/80mm)
 */
export const buildReceiptHtml = (receipt, settings = {}, lang = 'bn', qrCodeUrl = '') => {
  const companyName = settings.companyName || 'হিসাব কিতাব ৩৬০';
  const address = settings.address || '';
  const phone = settings.phone || '';
  const binNo = settings.binNo || '';
  const paperWidth = settings.receiptPaperWidth === '58mm' ? '280px' : '360px';
  const footerText = settings.invoiceFooter || 'ধন্যবাদ! আবার আসবেন';

  const itemsRows = (receipt.items || []).map(item => `
    <div style="display: grid; grid-template-columns: 3fr 1fr 1fr; padding: 4px 0; border-bottom: 1px dotted #e2e8f0; font-size: 11px;">
      <span style="word-break: break-word;">${item.name}</span>
      <span style="text-align: center;">${item.qty} × ${item.price}</span>
      <span style="text-align: right; font-weight: 600;">৳${(item.qty * item.price).toLocaleString()}</span>
    </div>
  `).join('');

  return `
    <div class="printable-receipt" style="background: #ffffff; color: #0f172a; border-radius: 8px; padding: 1.25rem 1rem; font-family: 'JetBrains Mono', monospace; font-size: 11.5px; border: 1px solid #e2e8f0; max-width: ${paperWidth}; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 10px;">
        <h2 style="font-size: 16px; font-weight: 800; margin: 0 0 3px; color: #0f172a;">${companyName}</h2>
        ${address ? `<p style="margin: 2px 0; font-size: 11px; color: #475569;">${address}</p>` : ''}
        ${phone ? `<p style="margin: 2px 0; font-size: 11px; color: #475569;">📞 ${phone}</p>` : ''}
        ${binNo ? `<p style="margin: 2px 0; font-size: 10px; color: #64748b;">BIN / TIN: ${binNo}</p>` : ''}

        <div style="border-top: 1px dashed #94a3b8; margin: 8px 0;"></div>

        <div style="display: flex; justify-content: space-between; font-size: 11px; color: #334155;">
          <span>${receipt.id}</span>
          <span>${receipt.date}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 11px; color: #334155; margin-top: 3px;">
          <span>${lang === 'bn' ? 'গ্রাহক:' : 'Customer:'} ${receipt.customerName || 'Walk-in'}</span>
          ${receipt.customerPhone ? `<span>${receipt.customerPhone}</span>` : ''}
        </div>
      </div>

      <div style="border-top: 1px dashed #94a3b8; margin: 8px 0;"></div>

      <div style="width: 100%; margin-bottom: 8px;">
        <div style="display: grid; grid-template-columns: 3fr 1fr 1fr; font-weight: 700; padding-bottom: 4px; border-bottom: 1px solid #cbd5e1; font-size: 11px;">
          <span>${lang === 'bn' ? 'আইটেম' : 'Item'}</span>
          <span style="text-align: center;">${lang === 'bn' ? 'পরিমাণ' : 'Qty'}</span>
          <span style="text-align: right;">${lang === 'bn' ? 'মোট' : 'Total'}</span>
        </div>
        ${itemsRows}
      </div>

      <div style="border-top: 1px dashed #94a3b8; margin: 8px 0;"></div>

      <div style="font-size: 11px; display: flex; flex-direction: column; gap: 3px;">
        <div style="display: flex; justify-content: space-between;">
          <span>${lang === 'bn' ? 'সাবটোটাল:' : 'Subtotal:'}</span>
          <span>৳${(receipt.subtotal || 0).toLocaleString()}</span>
        </div>
        ${receipt.discount > 0 ? `
          <div style="display: flex; justify-content: space-between; color: #dc2626;">
            <span>${lang === 'bn' ? 'ডিসকাউন্ট:' : 'Discount:'}</span>
            <span>-৳${receipt.discount.toLocaleString()}</span>
          </div>
        ` : ''}
        <div style="display: flex; justify-content: space-between;">
          <span>${lang === 'bn' ? 'ভ্যাট:' : 'VAT:'}</span>
          <span>+৳${(receipt.vat || 0).toLocaleString()}</span>
        </div>
        <div style="border-top: 1px solid #0f172a; padding-top: 4px; margin-top: 2px; display: flex; justify-content: space-between; font-size: 13px; font-weight: 800;">
          <span>${lang === 'bn' ? 'সর্বমোট বিল:' : 'Grand Total:'}</span>
          <span>৳${(receipt.grandTotal || 0).toLocaleString()}</span>
        </div>
        <div style="display: flex; justify-content: space-between; color: #16a34a; font-weight: 700;">
          <span>${lang === 'bn' ? 'পরিশোধ:' : 'Paid:'}</span>
          <span>৳${Number(receipt.paidAmount || (receipt.status === 'paid' ? receipt.grandTotal : 0)).toLocaleString()}</span>
        </div>
        ${Number(receipt.dueAmount) > 0 ? `
          <div style="display: flex; justify-content: space-between; color: #dc2626; font-weight: 800;">
            <span>${lang === 'bn' ? 'বকেয়া:' : 'Due:'}</span>
            <span>৳${Number(receipt.dueAmount).toLocaleString()}</span>
          </div>
        ` : ''}
      </div>

      <!-- QR Code -->
      <div style="text-align: center; margin-top: 12px; border-top: 1px dashed #94a3b8; padding-top: 8px;">
        ${qrCodeUrl ? `
          <div style="display: inline-block; text-align: center; margin: 4px auto;">
            <img src="${qrCodeUrl}" alt="QR" style="width: 104px; height: 104px; display: block; margin: 0 auto; background: #ffffff; padding: 3px; border: 1.5px solid #0f172a; border-radius: 6px;" />
            <div style="font-size: 9px; font-weight: 800; color: #0f172a; margin-top: 4px; letter-spacing: 0.3px;">
              ${lang === 'bn' ? '✓ ডিজিটাল মেমো কিউআর' : '✓ VERIFIED DIGITAL QR'}
            </div>
            <div style="font-size: 8px; color: #475569; margin-top: 1px;">
              ${lang === 'bn' ? 'যেকোনো ক্যামেরা বা বিকাশ দিয়ে স্ক্যান করুন' : 'Scan with any Camera / bKash'}
            </div>
          </div>
        ` : ''}
        <p style="margin: 6px 0 2px; font-size: 10px; color: #64748b;">${footerText}</p>
        <p style="margin: 0; font-size: 9px; color: #94a3b8;">Powered by HisabKitab 360 OS</p>
      </div>
    </div>
  `;
};

/**
 * 1-Click Direct Print for Invoices (called from tables or anywhere)
 * Generates the QR code and opens browser print preview instantly!
 */
export const printInvoiceDirectly = async (invoice, businessSettings, lang = 'bn') => {
  if (!invoice) return;

  let qrCodeUrl = '';
  try {
    const payload = generateInvoiceQrPayload(invoice, businessSettings);
    qrCodeUrl = await generateQrDataUrl(payload, { width: 220, margin: 1 });
  } catch (err) {
    console.warn('QR code generation warning during direct print:', err);
  }

  const invoiceHtml = buildInvoiceHtml(invoice, businessSettings, lang, qrCodeUrl);
  printHtmlContent(invoiceHtml, {
    title: `Invoice #${invoice.id}`,
    paperType: 'a4'
  });
};

/**
 * 1-Click Direct Print for Thermal Receipts
 */
export const printReceiptDirectly = async (receipt, businessSettings, lang = 'bn') => {
  if (!receipt) return;

  let qrCodeUrl = '';
  try {
    const payload = generateInvoiceQrPayload(receipt, businessSettings);
    qrCodeUrl = await generateQrDataUrl(payload, {
      width: businessSettings?.receiptPaperWidth === '58mm' ? 180 : 220,
      margin: 1
    });
  } catch (err) {
    console.warn('QR code generation warning during direct receipt print:', err);
  }

  const receiptHtml = buildReceiptHtml(receipt, businessSettings, lang, qrCodeUrl);
  printHtmlContent(receiptHtml, {
    title: `Receipt #${receipt.id}`,
    paperType: 'receipt',
    paperWidth: businessSettings?.receiptPaperWidth || '80mm'
  });
};

/**
 * Sends an ESC/POS drawer kick pulse (ESC p 0 25 250)
 * to open the connected cash drawer via thermal printer RJ11/RJ12 port.
 */
export const kickCashDrawer = () => {
  try {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('title', 'Cash Drawer Pulse');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '10px';
    iframe.style.height = '10px';
    iframe.style.opacity = '0.01';
    iframe.style.pointerEvents = 'none';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      const kickCommand = String.fromCharCode(27) + 'p' + String.fromCharCode(0, 25, 250);
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              @page { size: 58mm 5mm; margin: 0; }
              body { margin: 0; padding: 0; font-size: 1px; color: transparent; line-height: 1; }
            </style>
          </head>
          <body>${kickCommand}</body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.warn('Silent drawer print kick notice:', e);
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 1500);
        }
      }, 100);
    }
  } catch (err) {
    console.warn('kickCashDrawer warning:', err);
  }
};
