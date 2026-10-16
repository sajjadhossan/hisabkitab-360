import React, { useState, useMemo } from 'react';
import {
  Download,
  Copy,
  Printer,
  Search,
  X,
  Check,
  FileText,
  Calendar,
  Layers,
  ArrowUpDown,
  Filter,
  Sparkles,
  Share2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function SmartExpenseExportModal({ isOpen, onClose }) {
  const {
    personalExpenses = [],
    lang = 'bn'
  } = useApp();

  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [groupBy, setGroupBy] = useState('month'); // 'month' | 'product' | 'price'
  const [sortDirection, setSortDirection] = useState('desc'); // 'desc' | 'asc'
  const [copied, setCopied] = useState(false);

  // Extract unique available months
  const availableMonths = useMemo(() => {
    const monthsSet = new Set();
    personalExpenses.forEach(exp => {
      if (exp.date && exp.date.length >= 7) {
        monthsSet.add(exp.date.slice(0, 7));
      }
    });
    return Array.from(monthsSet).sort().reverse();
  }, [personalExpenses]);

  // Filter and sort items based on keyword and selected month
  const filteredItems = useMemo(() => {
    let items = personalExpenses.filter(exp => {
      // Month filter
      if (selectedMonth !== 'all' && (!exp.date || !exp.date.startsWith(selectedMonth))) {
        return false;
      }
      // Text keyword filter
      if (searchKeyword.trim()) {
        const kw = searchKeyword.trim().toLowerCase();
        const itemMatch = (exp.item || exp.title || '').toLowerCase().includes(kw);
        const folderMatch = (exp.folder || '').toLowerCase().includes(kw);
        const memberMatch = (exp.person || exp.member || '').toLowerCase().includes(kw);
        const noteMatch = (exp.note || '').toLowerCase().includes(kw);
        const dateMatch = (exp.date || '').includes(kw);
        if (!itemMatch && !folderMatch && !memberMatch && !noteMatch && !dateMatch) {
          return false;
        }
      }
      return true;
    });

    // Sorting
    if (groupBy === 'price') {
      items.sort((a, b) => {
        const amA = Number(a.amount) || 0;
        const amB = Number(b.amount) || 0;
        return sortDirection === 'desc' ? amB - amA : amA - amB;
      });
    } else {
      items.sort((a, b) => {
        const dateA = a.date || '';
        const dateB = b.date || '';
        return sortDirection === 'desc' ? dateB.localeCompare(dateA) : dateA.localeCompare(dateB);
      });
    }

    return items;
  }, [personalExpenses, selectedMonth, searchKeyword, groupBy, sortDirection]);

  // Grouped results based on selected mode
  const groupedData = useMemo(() => {
    if (groupBy === 'month') {
      const groups = {};
      filteredItems.forEach(item => {
        const m = (item.date && item.date.length >= 7) ? item.date.slice(0, 7) : 'অন্যান্য';
        if (!groups[m]) groups[m] = { title: m, items: [], total: 0 };
        groups[m].items.push(item);
        groups[m].total += (Number(item.amount) || 0);
      });
      return Object.values(groups);
    }

    if (groupBy === 'product') {
      const groups = {};
      filteredItems.forEach(item => {
        const key = (item.item || item.title || 'অন্যান্য খরচ').trim();
        if (!groups[key]) groups[key] = { title: key, items: [], total: 0 };
        groups[key].items.push(item);
        groups[key].total += (Number(item.amount) || 0);
      });
      // Sort groups by total descending
      return Object.values(groups).sort((a, b) => b.total - a.total);
    }

    // Price mode (grouped in ranges or raw)
    return [{
      title: lang === 'bn' ? 'প্রাইস-ওয়াইজ তালিকা' : 'Price-wise List',
      items: filteredItems,
      total: filteredItems.reduce((s, r) => s + (Number(r.amount) || 0), 0)
    }];
  }, [filteredItems, groupBy, lang]);

  const totalAmount = useMemo(() => {
    return filteredItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [filteredItems]);

  const getMonthNameBengali = (yyyyMm) => {
    if (!yyyyMm || yyyyMm === 'all') return 'সকল মাস';
    const parts = yyyyMm.split('-');
    if (parts.length !== 2) return yyyyMm;
    const monthNum = parseInt(parts[1], 10);
    const monthsBn = [
      'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
      'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
    ];
    return `${monthsBn[monthNum - 1] || parts[1]} ${parts[0]}`;
  };

  // Generate Clean Plain Text Report for WhatsApp / SMS / Notepad
  const generateTextReport = () => {
    let report = `===============================\n`;
    report += `📊 হিসাবকিতাব ৩৬০ — খরচ রিপোর্ট\n`;
    report += `তারিখ: ${new Date().toLocaleDateString('bn-BD')}\n`;
    report += `ফিল্টার: ${selectedMonth === 'all' ? 'সকল মাস' : getMonthNameBengali(selectedMonth)}\n`;
    if (searchKeyword.trim()) {
      report += `সার্চ কি-ওয়ার্ড: "${searchKeyword.trim()}"\n`;
    }
    report += `মোট এন্ট্রি: ${filteredItems.length}টি | মোট খরচ: ৳${totalAmount.toLocaleString('en-IN')}\n`;
    report += `===============================\n\n`;

    if (groupBy === 'month') {
      groupedData.forEach(grp => {
        report += `📁 [${getMonthNameBengali(grp.title)}] (${grp.items.length}টি - ৳${grp.total.toLocaleString('en-IN')}):\n`;
        grp.items.forEach((it, idx) => {
          report += `  ${idx + 1}. ${it.date} | ${it.item || it.title} - ৳${Number(it.amount || 0).toLocaleString('en-IN')}${it.folder ? ` (${it.folder})` : ''}\n`;
        });
        report += `\n`;
      });
    } else if (groupBy === 'product') {
      groupedData.forEach((grp, idx) => {
        report += `${idx + 1}. 🛍️ ${grp.title} — মোট: ৳${grp.total.toLocaleString('en-IN')} (${grp.items.length} বার):\n`;
        grp.items.forEach(it => {
          report += `   • ${it.date}: ৳${Number(it.amount || 0).toLocaleString('en-IN')}${it.person ? ` (${it.person})` : ''}\n`;
        });
        report += `\n`;
      });
    } else {
      filteredItems.forEach((it, idx) => {
        report += `${idx + 1}. ৳${Number(it.amount || 0).toLocaleString('en-IN')} — ${it.item || it.title} (${it.date})${it.folder ? ` [${it.folder}]` : ''}\n`;
      });
    }

    report += `===============================\n`;
    report += `সর্বমোট হিসাব: ৳${totalAmount.toLocaleString('en-IN')}\n`;
    report += `জেনারেট করেছেন: HisabKitab 360 App\n`;
    return report;
  };

  // Copy to clipboard
  const handleCopyText = async () => {
    try {
      const text = generateTextReport();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      alert('টেক্সট কপি সম্পন্ন করা সম্ভব হয়নি');
    }
  };

  // Download CSV / Excel
  const handleDownloadCsv = () => {
    let csvContent = '\uFEFF'; // UTF-8 BOM for Bengali support in Excel
    csvContent += 'ক্রমিক,তারিখ,মাস,পণ্যের নাম / বিবরণ,ফোল্ডার / ক্যাটাগরি,সদস্য,পরিমাণ,টাকার পরিমাণ (৳),নোট\n';

    filteredItems.forEach((it, idx) => {
      const serial = idx + 1;
      const date = it.date || '';
      const month = date.slice(0, 7);
      const title = `"${(it.item || it.title || '').replace(/"/g, '""')}"`;
      const folder = `"${(it.folder || '').replace(/"/g, '""')}"`;
      const person = `"${(it.person || it.member || '').replace(/"/g, '""')}"`;
      const qty = it.quantity ? `${it.quantity} ${it.unit || ''}` : '';
      const amount = Number(it.amount || 0);
      const note = `"${(it.note || '').replace(/"/g, '""')}"`;
      csvContent += `${serial},${date},${month},${title},${folder},${person},${qty},${amount},${note}\n`;
    });

    csvContent += `,,,সর্বমোট,,,,${totalAmount},\n`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `HisabKitab360_Expenses_${selectedMonth}_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Print Report
  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '840px',
          maxHeight: '92vh',
          backgroundColor: 'var(--surface-color, #1e2230)',
          borderRadius: '20px',
          border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 30px rgba(99, 102, 241, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: 'var(--text-primary, #f8fafc)'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(30, 34, 48, 0.8) 100%)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: 'rgba(99, 102, 241, 0.2)',
                color: '#818cf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(99, 102, 241, 0.35)'
              }}
            >
              <Download size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
                {lang === 'bn' ? 'স্মার্ট খরচ এক্সপোর্ট (Smart Expense Export)' : 'Smart Expense Export'}
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                {lang === 'bn'
                  ? 'মান্থ-ওয়াইজ, প্রোডাক্ট-ওয়াইজ ও প্রাইস-ওয়াইজ সাজিয়ে টেক্সট বা এক্সেলে এক্সপোর্ট করুন।'
                  : 'Export transactions sorted by month, product, or price into text or Excel.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Control Toolbar */}
        <div
          style={{
            padding: '16px 24px',
            backgroundColor: 'rgba(0, 0, 0, 0.15)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          {/* Row 1: Search & Month Filter */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
            {/* Search Keyword */}
            <div style={{ position: 'relative', flex: '1 1 240px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="text"
                placeholder={lang === 'bn' ? 'টেক্সট বা নাম লিখুন (উদা: চাল, বাজার, তেল)...' : 'Filter by keyword (e.g. Rice, Oil)...'}
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 36px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  fontSize: '0.875rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Month Filter Selector */}
            <div style={{ minWidth: '180px' }}>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 14px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#f8fafc',
                  fontSize: '0.875rem',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="all" style={{ backgroundColor: '#1e2230', color: '#fff' }}>
                  📅 {lang === 'bn' ? 'সকল মাসের খরচ' : 'All Months'}
                </option>
                {availableMonths.map(m => (
                  <option key={m} value={m} style={{ backgroundColor: '#1e2230', color: '#fff' }}>
                    {getMonthNameBengali(m)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Grouping Modes & Actions */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Grouping Pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginRight: '4px' }}>
                {lang === 'bn' ? 'সাজানোর ধরণ:' : 'Group by:'}
              </span>

              <button
                onClick={() => setGroupBy('month')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: groupBy === 'month' ? '#6366f1' : 'rgba(255, 255, 255, 0.06)',
                  color: '#fff',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Calendar size={13} />
                <span>{lang === 'bn' ? 'মান্থ-ওয়াইজ' : 'Month-wise'}</span>
              </button>

              <button
                onClick={() => setGroupBy('product')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: groupBy === 'product' ? '#6366f1' : 'rgba(255, 255, 255, 0.06)',
                  color: '#fff',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Layers size={13} />
                <span>{lang === 'bn' ? 'প্রোডাক্ট-ওয়াইজ' : 'Product-wise'}</span>
              </button>

              <button
                onClick={() => setGroupBy('price')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: groupBy === 'price' ? '#6366f1' : 'rgba(255, 255, 255, 0.06)',
                  color: '#fff',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <ArrowUpDown size={13} />
                <span>{lang === 'bn' ? 'প্রাইস-ওয়াইজ' : 'Price-wise'}</span>
              </button>
            </div>

            {/* Total Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                color: '#10b981',
                fontSize: '0.85rem',
                fontWeight: 600
              }}
            >
              <span>{filteredItems.length} {lang === 'bn' ? 'টি আইটেম' : 'items'} |</span>
              <span style={{ fontWeight: 800 }}>৳{totalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Preview Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: '#64748b' }}>
              <FileText size={40} style={{ opacity: 0.5, marginBottom: '10px' }} />
              <p style={{ margin: 0, fontSize: '0.95rem', color: '#94a3b8' }}>
                {lang === 'bn' ? 'কোনো লেনদেন বা খরচের তথ্য পাওয়া যায়নি।' : 'No matching transactions found.'}
              </p>
            </div>
          ) : (
            groupedData.map((group, gIdx) => (
              <div
                key={gIdx}
                style={{
                  borderRadius: '14px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  overflow: 'hidden'
                }}
              >
                {/* Group Header */}
                <div
                  style={{
                    padding: '12px 18px',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f1f5f9' }}>
                      {groupBy === 'month' ? getMonthNameBengali(group.title) : group.title}
                    </span>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        padding: '1px 8px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(99, 102, 241, 0.15)',
                        color: '#818cf8'
                      }}
                    >
                      {group.items.length} {lang === 'bn' ? 'টি' : ''}
                    </span>
                  </div>

                  <span style={{ fontSize: '1rem', fontWeight: 800, color: '#38bdf8' }}>
                    ৳{group.total.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Items in Group */}
                <div style={{ padding: '8px 18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {group.items.map((it, iIdx) => (
                    <div
                      key={it.id || iIdx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 0',
                        borderBottom: iIdx === group.items.length - 1 ? 'none' : '1px solid rgba(255, 255, 255, 0.03)',
                        fontSize: '0.85rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ color: '#64748b', fontSize: '0.78rem', width: '22px' }}>{iIdx + 1}.</span>
                        <div>
                          <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{it.item || it.title}</span>
                          <span style={{ color: '#64748b', fontSize: '0.75rem', marginLeft: '8px' }}>({it.date})</span>
                          {it.folder && (
                            <span style={{ color: '#a5b4fc', fontSize: '0.72rem', marginLeft: '6px' }}>• {it.folder}</span>
                          )}
                        </div>
                      </div>

                      <span style={{ fontWeight: 700, color: '#f8fafc' }}>
                        ৳{Number(it.amount || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            backgroundColor: 'rgba(0, 0, 0, 0.25)'
          }}
        >
          {/* Left Buttons: Copy Text & CSV */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Copy Clean Text Report */}
            <button
              onClick={handleCopyText}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                borderRadius: '10px',
                backgroundColor: copied ? '#10b981' : '#6366f1',
                color: '#fff',
                border: 'none',
                fontSize: '0.875rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
              }}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? (lang === 'bn' ? '✓ টেক্সট কপি হয়েছে!' : 'Copied!') : (lang === 'bn' ? 'ক্লিন টেক্সট রিপোর্ট কপি' : 'Copy Text Report')}</span>
            </button>

            {/* Download CSV / Excel */}
            <button
              onClick={handleDownloadCsv}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                borderRadius: '10px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                color: '#10b981',
                fontSize: '0.875rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Download size={16} />
              <span>{lang === 'bn' ? 'এক্সেল / CSV ডাউনলোড' : 'Download Excel/CSV'}</span>
            </button>

            {/* Print View */}
            <button
              onClick={handlePrint}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 14px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#cbd5e1',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              <Printer size={16} />
              <span>{lang === 'bn' ? 'প্রিন্ট' : 'Print'}</span>
            </button>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              padding: '9px 20px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#e2e8f0',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
