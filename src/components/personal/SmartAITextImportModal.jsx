import React, { useState, useMemo } from 'react';
import {
  X,
  Sparkles,
  Copy,
  Check,
  FileText,
  AlertCircle,
  Calendar,
  Tag,
  FolderTree,
  User,
  Scale,
  Trash2,
  CheckCircle2,
  Search,
  ArrowRight,
  RefreshCw,
  Info
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

// Helper: Convert Bengali digits to English digits
const bnToEnDigits = (str) => {
  if (!str) return '';
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(str).replace(/[০-৯]/g, d => bnDigits.indexOf(d));
};

// Normalize Date to YYYY-MM-DD
const normalizeDateStr = (rawDate) => {
  if (!rawDate) return new Date().toISOString().split('T')[0];
  const cleaned = bnToEnDigits(rawDate).trim();

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return cleaned;

  // DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = cleaned.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // YYYY/MM/DD
  const ymdSlash = cleaned.match(/^(\d{4})[/.](\d{1,2})[/.](\d{1,2})$/);
  if (ymdSlash) {
    const year = ymdSlash[1];
    const month = ymdSlash[2].padStart(2, '0');
    const day = ymdSlash[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return new Date().toISOString().split('T')[0];
};

// Auto-detect category from description
const autoDetectCategory = (text) => {
  if (!text) return 'other';
  const str = text.toLowerCase();
  if (/চাল|ডাল|তেল|লবণ|পেঁয়াজ|আলু|মাছ|মাংস|মুরগি|সবজি|বাজার|কাঁচাবাজার|রসুন|আদা|মসলা|ময়দা|আটা|চিনি|দুধ|ডিম/.test(str)) return 'bazaar';
  if (/ওষুধ|ফার্মেসি|ডাক্তার|প্রেসার|ডায়াবেটিস|মেডিকেল|হাসপাতাল|টেস্ট|ভিটামিন|ইনজেকশন|ক্লিনিক/.test(str)) return 'medical';
  if (/ভাড়া|বাড়ি ভাড়া|বাসা ভাড়া|দোকান ভাড়া|মেস ভাড়া/.test(str)) return 'rent';
  if (/বিদ্যুৎ|কারেন্ট|গ্যাস|পানি|ওয়াসা|ময়লা|দারোয়ান|বিল|ওয়াইফাই|নেট বিল|ইন্টারনেট/.test(str)) return 'utility';
  if (/স্কুল|কলেজ|বিশ্ববিদ্যালয়|টিউশন|টিচার|বই|খাতা|কলম|ফি|বেতন|ক্লাস/.test(str)) return 'education';
  if (/রিকশা|ভ্যান|বাস|সিএনজি|উবার|পাঠাও|তেল|পেট্রোল|অকটেন|গাড়ি|যাতায়াত|ভাড়া|ট্রেন/.test(str)) return 'transport';
  if (/চা|নাস্তা|বিস্কুট|মিষ্টি|ফল|কফি|রেস্টুরেন্ট|বিরিয়ানি|খাবার|লাঞ্চ|ডিনার/.test(str)) return 'snacks';
  if (/শপিং|জামা|কাপড়|জুতা|শার্ট|প্যান্ট|ঘড়ি|ব্যাগ/.test(str)) return 'shopping';
  return 'other';
};

export const SmartAITextImportModal = ({ isOpen, onClose, defaultType = 'daily' }) => {
  const { addMultiplePersonalExpenses, lang } = useApp();

  const [rawText, setRawText] = useState('');
  const [selectedExpenseType, setSelectedExpenseType] = useState(defaultType); // 'daily' | 'family'
  const [parsedItems, setParsedItems] = useState([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showPromptBox, setShowPromptBox] = useState(true);

  // Ready-to-copy AI Prompt Template
  const promptTemplate = `আমার প্রদানকৃত ফাইলটি (PDF / Excel / ছবি / রসিদ) পর্যালোচনা করে প্রতিটি খরচের হিসাব বের করে দাও।

প্রতিটি খরচের জন্য নিচের ফরম্যাটে একটি করে নতুন লাইন তৈরি করবে:
তারিখ | খরচের বিবরণ | টাকার পরিমাণ | ক্যাটাগরি | সাব-ক্যাটাগরি | কার জন্য বা ব্যক্তি | পরিমাণ/ওজন

নিয়মাবলী:
১. তারিখ অবশ্যই YYYY-MM-DD ফরম্যাটে লিখবে (যেমন: 2026-09-15)।
২. টাকার পরিমাণে কোনো কমা বা '৳' চিহ্ন ছাড়া শুধু সংখ্যা লিখবে (যেমন: 1250)।
৩. [খুব গুরুত্বপূর্ণ]: সাব-ক্যাটাগরি, ব্যক্তি (কার জন্য বা কার হাত দিয়ে খরচ), এবং পরিমাণ/ওজন—এই তথ্যগুলো যদি মূল ফাইলে স্পষ্টভাবে উল্লেখ থাকে তবেই লিখবে; আর যদি উল্লেখ না থাকে তবে সেখানে একটি ড্যাশ (-) চিহ্ন দেবে (কোনো অবস্থাতেই নিজের থেকে বানিয়ে লিখবে না)।
৪. ক্যাটাগরি সহজে চেনার জন্য বাস্তবসম্মত নাম দেবে (যেমন: বাজার, মুদি, চিকিৎসা, ইউটিলিটি বিল, শিক্ষা, যাতায়াত, ইত্যাদি)।
৫. কোনো ভূমিকা, ইংরেজি ব্যাখ্যা বা অতিরিক্ত কথা লিখবে না। শুধুমাত্র ডাটার লাইনগুলো আউটপুট হিসেবে দাও।`;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(promptTemplate);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  // Robust Text Parsing
  const handleParseText = () => {
    if (!rawText.trim()) return;
    setIsAnalyzing(true);

    setTimeout(() => {
      try {
        const text = rawText.trim();
        const results = [];

        // Check if JSON
        if (text.startsWith('[') && text.endsWith(']')) {
          try {
            const jsonArr = JSON.parse(text);
            if (Array.isArray(jsonArr)) {
              jsonArr.forEach((item, idx) => {
                const amt = parseFloat(bnToEnDigits(String(item.amount || item.taka || 0)).replace(/[^0-9.]/g, '')) || 0;
                if (amt > 0) {
                  results.push({
                    tempId: `tmp-${Date.now()}-${idx}`,
                    selected: true,
                    date: normalizeDateStr(item.date || item.tarikh),
                    item: (item.item || item.title || item.name || item.description || 'খরচ').trim(),
                    amount: amt,
                    category: item.category || autoDetectCategory(item.item || item.title || ''),
                    subFolder: item.subCategory && item.subCategory !== '-' ? item.subCategory.trim() : '',
                    person: item.person && item.person !== '-' ? item.person.trim() : '',
                    quantity: item.quantity && item.quantity !== '-' ? item.quantity : '',
                    unit: item.unit && item.unit !== '-' ? item.unit : '',
                    type: item.type || selectedExpenseType
                  });
                }
              });
            }
          } catch (e) {
            console.warn('Failed to parse as JSON, falling back to line parser:', e);
          }
        }

        // If not JSON or JSON was empty, use line-by-line pipe/tab/comma parser
        if (results.length === 0) {
          const lines = text.split('\n');

          lines.forEach((line, idx) => {
            const cleanLine = line.trim();
            if (!cleanLine) return;
            // Skip markdown table separators or headers
            if (/^\|?\s*[-:]+\s*\|/.test(cleanLine)) return;
            if (/^(তারিখ|date|sl|নং|ক্রমিক)/i.test(cleanLine)) return;

            // Determine delimiter: Pipe | is primary, then Tab, then comma
            let parts = [];
            if (cleanLine.includes('|')) {
              parts = cleanLine.split('|').map(p => p.trim()).filter((p, i, arr) => !(i === 0 && p === '') && !(i === arr.length - 1 && p === ''));
            } else if (cleanLine.includes('\t')) {
              parts = cleanLine.split('\t').map(p => p.trim());
            } else if (cleanLine.includes(',')) {
              parts = cleanLine.split(',').map(p => p.trim());
            }

            if (parts.length >= 2) {
              const rawDate = parts[0] || '';
              const rawItem = parts[1] || '';
              const rawAmount = parts[2] || '0';
              const rawCat = parts[3] || '';
              const rawSubCat = parts[4] || '';
              const rawPerson = parts[5] || '';
              const rawQtyUnit = parts[6] || '';

              const cleanAmountStr = bnToEnDigits(rawAmount).replace(/[^0-9.]/g, '');
              const amount = parseFloat(cleanAmountStr) || 0;

              if (amount > 0 && rawItem) {
                // Parse optional quantity / unit
                let quantity = '';
                let unit = '';
                if (rawQtyUnit && rawQtyUnit !== '-') {
                  const qtyMatch = bnToEnDigits(rawQtyUnit).match(/^([\d.]+)\s*(.*)$/);
                  if (qtyMatch) {
                    quantity = parseFloat(qtyMatch[1]) || '';
                    unit = qtyMatch[2] ? qtyMatch[2].trim() : '';
                  } else {
                    unit = rawQtyUnit.trim();
                  }
                }

                const catClean = (rawCat && rawCat !== '-') ? rawCat.trim() : autoDetectCategory(rawItem);
                const subCatClean = (rawSubCat && rawSubCat !== '-') ? rawSubCat.trim() : '';
                const personClean = (rawPerson && rawPerson !== '-') ? rawPerson.trim() : '';

                results.push({
                  tempId: `tmp-${Date.now()}-${idx}`,
                  selected: true,
                  date: normalizeDateStr(rawDate),
                  item: rawItem.replace(/^[0-9]+[.)]\s*/, '').trim(),
                  amount,
                  category: catClean,
                  subFolder: subCatClean,
                  person: personClean,
                  quantity,
                  unit,
                  type: selectedExpenseType
                });
              }
            }
          });
        }

        setParsedItems(results);
        setIsAnalyzing(false);
      } catch (err) {
        console.error('Text parsing error:', err);
        setIsAnalyzing(false);
      }
    }, 150);
  };

  // Toggle selection
  const handleToggleSelect = (tempId) => {
    setParsedItems(prev => prev.map(p => p.tempId === tempId ? { ...p, selected: !p.selected } : p));
  };

  // Toggle select all
  const handleToggleSelectAll = () => {
    const allSelected = parsedItems.every(p => p.selected);
    setParsedItems(prev => prev.map(p => ({ ...p, selected: !allSelected })));
  };

  // Remove individual row from preview
  const handleRemoveRow = (tempId) => {
    setParsedItems(prev => prev.filter(p => p.tempId !== tempId));
  };

  // Selected metrics
  const selectedItems = useMemo(() => parsedItems.filter(p => p.selected), [parsedItems]);
  const totalSelectedAmount = useMemo(() => selectedItems.reduce((s, i) => s + (Number(i.amount) || 0), 0), [selectedItems]);

  // Unique detected months
  const detectedMonths = useMemo(() => {
    const set = new Set();
    selectedItems.forEach(i => {
      if (i.date && i.date.length >= 7) set.add(i.date.slice(0, 7));
    });
    return Array.from(set).sort();
  }, [selectedItems]);

  // Unique detected persons
  const detectedPersons = useMemo(() => {
    const set = new Set();
    selectedItems.forEach(i => {
      if (i.person) set.add(i.person);
    });
    return Array.from(set);
  }, [selectedItems]);

  // Filtered view in table
  const displayedItems = useMemo(() => {
    if (!searchFilter.trim()) return parsedItems;
    const q = searchFilter.toLowerCase();
    return parsedItems.filter(i =>
      i.item.toLowerCase().includes(q) ||
      i.date.includes(q) ||
      i.category.toLowerCase().includes(q) ||
      (i.subFolder && i.subFolder.toLowerCase().includes(q)) ||
      (i.person && i.person.toLowerCase().includes(q))
    );
  }, [parsedItems, searchFilter]);

  // Execute Final Import
  const handleExecuteImport = () => {
    if (selectedItems.length === 0) return;

    const formattedPayload = selectedItems.map(item => ({
      date: item.date,
      item: item.item,
      amount: item.amount,
      category: item.category,
      folder: item.type === 'family' ? (item.category || 'পারিবারিক খরচ') : '',
      subFolder: item.subFolder || '',
      person: item.person || '',
      member: item.person || '',
      quantity: item.quantity || null,
      unit: item.unit || '',
      type: item.type || selectedExpenseType
    }));

    addMultiplePersonalExpenses(formattedPayload);

    // Reset and close
    setRawText('');
    setParsedItems([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '850px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '20px',
          background: 'var(--bg-primary, #0f172a)',
          border: '1.5px solid rgba(16, 185, 129, 0.4)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden',
          color: 'var(--text-main, #ffffff)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(6, 182, 212, 0.08))'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main, #ffffff)' }}>
                {lang === 'bn' ? '⚡ স্মার্ট এআই টেক্সট ইমপোর্টার (AI Text Import)' : '⚡ Smart AI Text Importer'}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)' }}>
                {lang === 'bn' ? 'ChatGPT বা Gemini-র তৈরি টেক্সট পেস্ট করে পূর্বের যেকোনো ট্রানজ্যাকশন এক ক্লিকে ইমপোর্ট করুন' : 'Paste text from ChatGPT/Gemini to import bulk expenses seamlessly'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn-icon"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              color: 'var(--text-muted)'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* STEP 1: AI Prompt Generator & Copy Box */}
          <div
            style={{
              borderRadius: '14px',
              background: 'rgba(16, 185, 129, 0.06)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                padding: '10px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(16, 185, 129, 0.1)',
                cursor: 'pointer'
              }}
              onClick={() => setShowPromptBox(!showPromptBox)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.9rem' }}>📋</span>
                <span style={{ fontSize: '0.86rem', fontWeight: '800', color: '#10b981' }}>
                  {lang === 'bn' ? 'ধাপ ১: ChatGPT বা Gemini-র রেডি প্রম্পট (১-ক্লিক কপি)' : 'Step 1: Ready AI Prompt for ChatGPT / Gemini'}
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {showPromptBox ? '▲ সংক্ষেপ করুন' : '▼ বিস্তারিত দেখুন'}
              </span>
            </div>

            {showPromptBox && (
              <div style={{ padding: '12px 14px' }}>
                <p style={{ margin: '0 0 8px', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  {lang === 'bn'
                    ? 'নিচের প্রম্পটটি কপি করে ChatGPT বা Gemini-তে আপনার PDF, Excel বা ছবি ফাইলের সাথে পেস্ট করুন। এআই স্বয়ংক্রিয়ভাবে ক্যাটাগরি, সাব-ক্যাটাগরি ও ব্যক্তি ফিল্টার করে দেবে:'
                    : 'Copy this prompt and paste it into ChatGPT/Gemini along with your document. It will extract dates, items, categories, sub-categories, and persons:'}
                </p>

                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.35)',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    color: '#e2e8f0',
                    lineHeight: '1.45',
                    maxHeight: '120px',
                    overflowY: 'auto',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {promptTemplate}
                </div>

                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={handleCopyPrompt}
                    style={{
                      padding: '7px 16px',
                      borderRadius: '8px',
                      background: copiedPrompt ? '#10b981' : 'linear-gradient(135deg, #10b981, #059669)',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '0.82rem',
                      fontWeight: '800',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {copiedPrompt ? <Check size={16} /> : <Copy size={16} />}
                    <span>{copiedPrompt ? (lang === 'bn' ? '✓ প্রম্পট কপি হয়েছে!' : 'Copied!') : (lang === 'bn' ? '📋 প্রম্পট কপি করুন' : 'Copy Prompt')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* STEP 2: Paste AI Output Area */}
          <div
            style={{
              borderRadius: '14px',
              background: 'var(--bg-secondary, rgba(255, 255, 255, 0.03))',
              border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
              padding: '14px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.9rem' }}>📝</span>
                <span style={{ fontSize: '0.86rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  {lang === 'bn' ? 'ধাপ ২: এআই থেকে পাওয়া টেক্সট এখানে পেস্ট করুন:' : 'Step 2: Paste AI Output Text Here:'}
                </span>
              </div>

              {/* Type Switcher */}
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>খরচের ধরণ:</span>
                <button
                  type="button"
                  onClick={() => setSelectedExpenseType('daily')}
                  style={{
                    padding: '3px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: selectedExpenseType === 'daily' ? '800' : '600',
                    background: selectedExpenseType === 'daily' ? '#0ea5e9' : 'rgba(255, 255, 255, 0.08)',
                    color: selectedExpenseType === 'daily' ? '#ffffff' : 'var(--text-muted)',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  দৈনন্দিন (Daily)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedExpenseType('family')}
                  style={{
                    padding: '3px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: selectedExpenseType === 'family' ? '800' : '600',
                    background: selectedExpenseType === 'family' ? '#f59e0b' : 'rgba(255, 255, 255, 0.08)',
                    color: selectedExpenseType === 'family' ? '#ffffff' : 'var(--text-muted)',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  পারিবারিক (Family)
                </button>
              </div>
            </div>

            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={`উদাহরণ:\n2026-09-05 | চাল ২৫ কেজি | ২১৫০ | বাজার | মুদি | পুরো পরিবার | ২৫ কেজি\n2026-09-12 | প্রেসারের ওষুধ | ৮৫০ | চিকিৎসা | ফার্মেসি | বাবা | -\n2026-09-15 | বিদ্যুৎ বিল | ১৭০০ | ইউটিলিটি | - | - | -`}
              rows={5}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.15))',
                color: 'var(--text-main, #ffffff)',
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                resize: 'vertical',
                outline: 'none',
                lineHeight: '1.4'
              }}
            />

            <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  setRawText('');
                  setParsedItems([]);
                }}
                disabled={!rawText}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.78rem',
                  cursor: rawText ? 'pointer' : 'default',
                  opacity: rawText ? 1 : 0.5
                }}
              >
                {lang === 'bn' ? 'মুছে ফেলুন (Clear)' : 'Clear'}
              </button>

              <button
                type="button"
                onClick={handleParseText}
                disabled={!rawText.trim() || isAnalyzing}
                style={{
                  padding: '8px 18px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #06b6d4, #0284c7)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.84rem',
                  fontWeight: '800',
                  cursor: rawText.trim() ? 'pointer' : 'not-allowed',
                  opacity: rawText.trim() ? 1 : 0.5,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 14px rgba(6, 182, 212, 0.35)'
                }}
              >
                <Sparkles size={16} />
                <span>{isAnalyzing ? (lang === 'bn' ? 'বিশ্লেষণ হচ্ছে...' : 'Analyzing...') : (lang === 'bn' ? '⚡ বিশ্লেষণ ও প্রিভিউ দেখুন' : 'Analyze & Preview')}</span>
              </button>
            </div>
          </div>

          {/* STEP 3: Live Preview Table & Metrics */}
          {parsedItems.length > 0 && (
            <div
              style={{
                borderRadius: '14px',
                background: 'var(--bg-secondary, rgba(255, 255, 255, 0.03))',
                border: '1.5px solid rgba(16, 185, 129, 0.3)',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              {/* Summary Badges */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px',
                  padding: '10px 12px',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(6, 182, 212, 0.08))',
                  borderRadius: '10px',
                  border: '1px solid rgba(16, 185, 129, 0.2)'
                }}
              >
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span
                    style={{
                      background: '#10b981',
                      color: '#ffffff',
                      fontSize: '0.78rem',
                      fontWeight: '800',
                      padding: '3px 10px',
                      borderRadius: '8px'
                    }}
                  >
                    মোট {selectedItems.length} টি লেনদেন নির্বাচিত
                  </span>

                  <span
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      color: '#ef4444',
                      fontSize: '0.84rem',
                      fontWeight: '800',
                      fontFamily: 'var(--font-mono)',
                      padding: '3px 10px',
                      borderRadius: '8px',
                      border: '1px solid rgba(239, 68, 68, 0.3)'
                    }}
                  >
                    মোট টাকা: ৳ {totalSelectedAmount.toLocaleString()}
                  </span>

                  {detectedMonths.length > 0 && (
                    <span style={{ fontSize: '0.76rem', color: '#06b6d4', fontWeight: '700' }}>
                      📅 মাস: {detectedMonths.join(', ')}
                    </span>
                  )}

                  {detectedPersons.length > 0 && (
                    <span style={{ fontSize: '0.76rem', color: '#a855f7', fontWeight: '700' }}>
                      👤 ব্যক্তি: {detectedPersons.join(', ')}
                    </span>
                  )}
                </div>

                {/* Search in preview */}
                <div style={{ position: 'relative', minWidth: '180px' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="প্রিভিউ খুঁজুন..."
                    style={{
                      width: '100%',
                      padding: '4px 10px 4px 28px',
                      borderRadius: '6px',
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-main)',
                      fontSize: '0.75rem'
                    }}
                  />
                </div>
              </div>

              {/* Table */}
              <div style={{ maxHeight: '250px', overflowY: 'auto', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
                  <thead style={{ background: 'rgba(0, 0, 0, 0.35)', position: 'sticky', top: 0, zIndex: 2 }}>
                    <tr>
                      <th style={{ padding: '8px 10px', width: '36px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={parsedItems.length > 0 && parsedItems.every(p => p.selected)}
                          onChange={handleToggleSelectAll}
                          style={{ cursor: 'pointer' }}
                        />
                      </th>
                      <th style={{ padding: '8px 10px' }}>তারিখ</th>
                      <th style={{ padding: '8px 10px' }}>বিবরণ / খরচ</th>
                      <th style={{ padding: '8px 10px' }}>ক্যাটাগরি</th>
                      <th style={{ padding: '8px 10px' }}>সাব-ক্যাটাগরি</th>
                      <th style={{ padding: '8px 10px' }}>ব্যক্তি (Person)</th>
                      <th style={{ padding: '8px 10px' }}>পরিমাণ/একক</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>টাকা</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center', width: '36px' }}>বাদ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedItems.map((item, idx) => (
                      <tr
                        key={item.tempId}
                        style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                          background: item.selected ? 'transparent' : 'rgba(0, 0, 0, 0.25)',
                          opacity: item.selected ? 1 : 0.45
                        }}
                      >
                        <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={item.selected}
                            onChange={() => handleToggleSelect(item.tempId)}
                            style={{ cursor: 'pointer' }}
                          />
                        </td>
                        <td style={{ padding: '6px 10px', whiteSpace: 'nowrap', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                          {item.date}
                        </td>
                        <td style={{ padding: '6px 10px', fontWeight: '700', color: 'var(--text-main)' }}>
                          {item.item}
                        </td>
                        <td style={{ padding: '6px 10px' }}>
                          <span style={{ background: 'rgba(255, 255, 255, 0.08)', padding: '2px 7px', borderRadius: '4px', fontSize: '0.72rem' }}>
                            {item.category}
                          </span>
                        </td>
                        <td style={{ padding: '6px 10px', color: '#06b6d4' }}>
                          {item.subFolder || '-'}
                        </td>
                        <td style={{ padding: '6px 10px', color: '#a855f7', fontWeight: item.person ? '700' : 'normal' }}>
                          {item.person || '-'}
                        </td>
                        <td style={{ padding: '6px 10px', color: 'var(--text-muted)' }}>
                          {item.quantity ? `${item.quantity} ${item.unit}` : (item.unit || '-')}
                        </td>
                        <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: '800', fontFamily: 'var(--font-mono)', color: '#ef4444' }}>
                          ৳{item.amount.toLocaleString()}
                        </td>
                        <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(item.tempId)}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}
                            title="প্রিভিউ থেকে বাদ দিন"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--bg-secondary, rgba(0, 0, 0, 0.2))',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {selectedItems.length > 0 ? (
              <span>
                💡 নিশ্চিত করার পর এই {selectedItems.length}টি খরচ নির্ধারিত মাসে ডাটাবেজে ও ক্লাউডে যুক্ত হয়ে যাবে।
              </span>
            ) : (
              <span>প্রথমে টেক্সট পেস্ট করে বিশ্লেষণ সম্পন্ন করুন।</span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.08)',
                color: 'var(--text-main)',
                border: '1px solid var(--border-color)',
                fontSize: '0.84rem',
                cursor: 'pointer'
              }}
            >
              {lang === 'bn' ? 'বাতিল' : 'Cancel'}
            </button>

            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={selectedItems.length === 0}
              style={{
                padding: '8px 22px',
                borderRadius: '10px',
                background: selectedItems.length > 0 ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255, 255, 255, 0.1)',
                color: selectedItems.length > 0 ? '#ffffff' : 'var(--text-muted)',
                border: 'none',
                fontSize: '0.86rem',
                fontWeight: '800',
                cursor: selectedItems.length > 0 ? 'pointer' : 'not-allowed',
                boxShadow: selectedItems.length > 0 ? '0 4px 16px rgba(16, 185, 129, 0.4)' : 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <CheckCircle2 size={16} />
              <span>
                {lang === 'bn'
                  ? `✅ ডাটাবেজে ইমপোর্ট সম্পন্ন করুন (${selectedItems.length}টি - ৳${totalSelectedAmount.toLocaleString()})`
                  : `Confirm & Import (${selectedItems.length})`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartAITextImportModal;
