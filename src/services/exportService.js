/**
 * Export and Bulk Import Service for HisabKitab 360
 * Ensures UTF-8 BOM (\uFEFF) for flawless Bengali rendering in Microsoft Excel & Google Sheets.
 */

const downloadCSVBlob = (csvString, filename) => {
  const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const escapeCSV = (val) => {
  if (val === undefined || val === null) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
};

/**
 * Export Customers List to Excel CSV
 */
export const exportCustomersToCSV = (customers = [], lang = 'bn') => {
  const headers = [
    lang === 'bn' ? 'গ্রাহকের নাম' : 'Customer Name',
    lang === 'bn' ? 'প্রতিষ্ঠান / দোকান' : 'Company Name',
    lang === 'bn' ? 'কাস্টমার ধরন' : 'Type',
    lang === 'bn' ? 'মোবাইল নম্বর' : 'Phone',
    lang === 'bn' ? 'বিকল্প মোবাইল' : 'Alt Phone',
    lang === 'bn' ? 'ঠিকানা' : 'Address',
    lang === 'bn' ? 'মোট ক্রয় (৳)' : 'Total Purchased (BDT)',
    lang === 'bn' ? 'বর্তমান বকেয়া (৳)' : 'Current Due (BDT)',
    lang === 'bn' ? 'বাকি লিমিট (৳)' : 'Credit Limit (BDT)',
    lang === 'bn' ? 'জাতীয় পরিচয়পত্র (NID)' : 'NID No',
    lang === 'bn' ? 'ট্রেড লাইসেন্স' : 'Trade License'
  ];

  const rows = customers.map(c => [
    escapeCSV(c.name),
    escapeCSV(c.companyName || ''),
    escapeCSV(c.customerType || 'খুচরা'),
    escapeCSV(c.phone || ''),
    escapeCSV(c.altPhone || ''),
    escapeCSV(c.address || ''),
    Number(c.totalPurchased || 0),
    Number(c.outstandingDue || 0),
    Number(c.creditLimit || 20000),
    escapeCSV(c.nidNo || ''),
    escapeCSV(c.tradeLicenseNo || '')
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadCSVBlob(csvContent, `HisabKitab_Customers_${dateStr}.csv`);
};

/**
 * Export Invoices & Sales to Excel CSV
 */
export const exportInvoicesToCSV = (invoices = [], lang = 'bn') => {
  const headers = [
    lang === 'bn' ? 'ইনভয়েস নম্বর' : 'Invoice ID',
    lang === 'bn' ? 'তারিখ' : 'Date',
    lang === 'bn' ? 'গ্রাহকের নাম' : 'Customer Name',
    lang === 'bn' ? 'মোবাইল' : 'Phone',
    lang === 'bn' ? 'সাবটোটাল (৳)' : 'Subtotal',
    lang === 'bn' ? 'ডিসকাউন্ট (৳)' : 'Discount',
    lang === 'bn' ? 'ভ্যাট (৳)' : 'VAT',
    lang === 'bn' ? 'মোট বিল (৳)' : 'Grand Total',
    lang === 'bn' ? 'পরিশোধিত (৳)' : 'Paid Amount',
    lang === 'bn' ? 'বকেয়া (৳)' : 'Due Amount',
    lang === 'bn' ? 'পেমেন্ট মাধ্যম' : 'Payment Method',
    lang === 'bn' ? 'স্ট্যাটাস' : 'Status'
  ];

  const rows = invoices.map(inv => {
    const grandTotal = Number(inv.grandTotal) || 0;
    const paid = inv.paidAmount !== undefined ? Number(inv.paidAmount) : (inv.status === 'paid' ? grandTotal : 0);
    const due = inv.dueAmount !== undefined ? Number(inv.dueAmount) : Math.max(0, grandTotal - paid);

    const statusLabel =
      due === 0 ? (lang === 'bn' ? 'পরিশোধিত' : 'Paid') :
      paid > 0 ? (lang === 'bn' ? 'আংশিক পরিশোধ' : 'Partial') :
      (lang === 'bn' ? 'বকেয়া' : 'Unpaid');

    return [
      escapeCSV(inv.id),
      escapeCSV(inv.date || inv.dueDate || ''),
      escapeCSV(inv.customerName || ''),
      escapeCSV(inv.customerPhone || ''),
      Number(inv.subtotal || grandTotal),
      Number(inv.discount || 0),
      Number(inv.vat || 0),
      grandTotal,
      paid,
      due,
      escapeCSV(inv.paymentMethod || 'cash'),
      escapeCSV(statusLabel)
    ];
  });

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadCSVBlob(csvContent, `HisabKitab_Invoices_${dateStr}.csv`);
};

/**
 * Export Debt Khata (বাকির খাতা) to Excel CSV
 */
export const exportDebtKhataToCSV = (debtList = [], getPersonStats, lang = 'bn') => {
  const headers = [
    lang === 'bn' ? 'ব্যক্তির নাম' : 'Person Name',
    lang === 'bn' ? 'সম্পর্ক / ধরণ' : 'Relation',
    lang === 'bn' ? 'মোবাইল' : 'Phone',
    lang === 'bn' ? 'ঠিকানা' : 'Address',
    lang === 'bn' ? 'মোট দিয়েছি (৳)' : 'Total Lent',
    lang === 'bn' ? 'ফেরত পেয়েছি (৳)' : 'Repaid to Me',
    lang === 'bn' ? 'মোট নিয়েছি (৳)' : 'Total Borrowed',
    lang === 'bn' ? 'দেনা শোধ (৳)' : 'Repaid by Me',
    lang === 'bn' ? 'নেট পাওনা / দেনা (৳)' : 'Net Balance',
    lang === 'bn' ? 'অবস্থা' : 'Status'
  ];

  const rows = debtList.map(person => {
    const stats = getPersonStats ? getPersonStats(person) : { netReceivable: 0, isReceivable: false, isPayable: false };
    const statusLabel =
      stats.isReceivable ? (lang === 'bn' ? 'আমি পাবো' : 'Receivable') :
      stats.isPayable ? (lang === 'bn' ? 'আমি দেবো' : 'Payable') :
      (lang === 'bn' ? 'পরিশোধিত' : 'Settled');

    return [
      escapeCSV(person.name),
      escapeCSV(person.relation || ''),
      escapeCSV(person.phone || ''),
      escapeCSV(person.address || ''),
      stats.totalLent || 0,
      stats.totalRepayReceived || 0,
      stats.totalBorrowed || 0,
      stats.totalRepaidPaid || 0,
      Math.abs(stats.netReceivable || 0),
      escapeCSV(statusLabel)
    ];
  });

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadCSVBlob(csvContent, `HisabKitab_DebtKhata_${dateStr}.csv`);
};
