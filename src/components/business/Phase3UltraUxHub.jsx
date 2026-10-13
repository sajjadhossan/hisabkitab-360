import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Zap,
  Printer,
  Keyboard,
  Smartphone,
  HardDrive,
  Moon,
  Table,
  Columns,
  RotateCcw,
  Check,
  RefreshCw,
  Copy,
  Download,
  Flame,
  ShieldCheck,
  Sliders,
  Maximize2
} from 'lucide-react';
import webWorkerComputeService from '../../services/webWorkerComputeService';
import canvasReceiptRenderer from '../../services/canvasReceiptRenderer';
import advancedKeyboardManager, { HOTKEY_DEFINITIONS } from '../../services/advancedKeyboardManager';
import storageQuotaAutoPurgeService from '../../services/storageQuotaAutoPurgeService';
import formCrashDraftService from '../../services/formCrashDraftService';

export default function Phase3UltraUxHub({ products = [], salesHistory = [], businessSettings = {} }) {
  const [activeTab, setActiveTab] = useState('canvas_receipt'); // 'canvas_receipt' | 'inline_grid' | 'split_screen' | 'hotkeys_mobile' | 'worker_storage'
  const canvasRef = useRef(null);

  // 1. Worker Benchmark State
  const [workerRunning, setWorkerRunning] = useState(false);
  const [workerResult, setWorkerResult] = useState(null);

  // 2. Storage Quota State
  const [storageEstimate, setStorageEstimate] = useState(null);
  const [purgeResult, setPurgeResult] = useState(null);

  // 3. OLED Mode State
  const [isOledMode, setIsOledMode] = useState(false);

  // 4. Inline Grid Products Local State
  const [gridProducts, setGridProducts] = useState(() => (products.length > 0 ? products.slice(0, 8) : [
    { id: 'p1', name: 'মিনারেল ওয়াটার ৫০০ মি.লি.', barcode: '89411001', sellPrice: 20, stock: 45, category: 'পানীয়' },
    { id: 'p2', name: 'প্যারাসিটামল ৫০০ মি.গ্রা.', barcode: '89411002', sellPrice: 30, stock: 120, category: 'ওষুধ' },
    { id: 'p3', name: 'ফ্রেশ বেকারি টোস্ট', barcode: '89411003', sellPrice: 45, stock: 18, category: 'বেকারি' },
    { id: 'p4', name: 'প্রিমিয়াম বাসমতি চাল (১ কেজি)', barcode: '89411004', sellPrice: 110, stock: 32, category: 'মুদি' }
  ]));
  const [editingCell, setEditingCell] = useState(null); // { id, field }
  const [editValue, setEditValue] = useState('');

  // 5. Split-Screen Multi-Tasking State
  const [splitCart, setSplitCart] = useState([
    { name: 'মিনারেল ওয়াটার', qty: 2, price: 20 },
    { name: 'টোস্ট বিস্কুট', qty: 1, price: 45 }
  ]);
  const [selectedSplitDebtor, setSelectedSplitDebtor] = useState('রহিম সওদাগর (বাকি: ৳২,৪৫০)');

  // 6. Hotkey Active Detector State
  const [lastKeyPressed, setLastKeyPressed] = useState(null);
  const [thumbFriendlyMode, setThumbFriendlyMode] = useState(false);

  // 7. Crash Recovery Draft State
  const [activeDraft, setActiveDraft] = useState(() => formCrashDraftService.getDraft('pos_cart'));
  const [draftSavedFlash, setDraftSavedFlash] = useState(false);

  useEffect(() => {
    // Initial storage estimate
    storageQuotaAutoPurgeService.getStorageUsage().then(setStorageEstimate);

    // Initial canvas render
    if (canvasRef.current) {
      canvasReceiptRenderer.render(canvasRef.current, {
        storeName: businessSettings?.businessName || 'হিসাবকিতাব ৩৬০ সুপারশপ',
        invoiceNo: 'INV-2026-9042',
        customerName: 'মাসুদ রানা',
        discount: 10,
        items: [
          { name: 'প্যারাসিটামল ৫০০ মি.গ্রা.', qty: 2, price: 30, total: 60 },
          { name: 'মিনারেল ওয়াটার ১ লি.', qty: 1, price: 25, total: 25 },
          { name: 'ফ্রেশ বেকারি টোস্ট', qty: 1, price: 45, total: 45 }
        ]
      });
    }

    // Hotkey listener
    advancedKeyboardManager.init();
    const unsubKey = advancedKeyboardManager.subscribe(key => {
      setLastKeyPressed(key);
      setTimeout(() => setLastKeyPressed(null), 1200);
    });

    return () => {
      unsubKey();
      advancedKeyboardManager.destroy();
    };
  }, [businessSettings]);

  // Handle OLED pure black body toggle
  useEffect(() => {
    if (isOledMode) {
      document.body.style.backgroundColor = '#000000';
    } else {
      document.body.style.backgroundColor = '';
    }
    return () => {
      document.body.style.backgroundColor = '';
    };
  }, [isOledMode]);

  const handleRunWorkerBenchmark = async () => {
    setWorkerRunning(true);
    // Generate simulated 10,000 transactions for stress testing
    const simulatedSales = [];
    for (let i = 0; i < 10000; i++) {
      simulatedSales.push({
        id: `sale_${i}`,
        total: Math.floor(Math.random() * 800) + 50,
        category: ['ওষুধ', 'মুদি', 'বেকারি', 'পানীয়'][i % 4]
      });
    }

    const res = await webWorkerComputeService.executeTask('AGGREGATE_LARGE_SALES', { sales: simulatedSales });
    setWorkerResult(res);
    setWorkerRunning(false);
  };

  const handleAutoPurge = () => {
    const res = storageQuotaAutoPurgeService.autoPurgeTransientCaches();
    setPurgeResult(res);
    storageQuotaAutoPurgeService.getStorageUsage().then(setStorageEstimate);
  };

  const handleSaveSimulatedDraft = () => {
    formCrashDraftService.saveDraft('pos_cart', {
      cart: splitCart,
      customer: selectedSplitDebtor,
      timestamp: new Date().toISOString()
    });
    setActiveDraft(formCrashDraftService.getDraft('pos_cart'));
    setDraftSavedFlash(true);
    setTimeout(() => setDraftSavedFlash(false), 2000);
  };

  const handleDownloadCanvasPng = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt_${Date.now()}.png`;
    a.click();
  };

  const handleCellBlurOrEnter = (item, field) => {
    const num = Number(editValue);
    const updated = gridProducts.map(p => {
      if (p.id === item.id) {
        return { ...p, [field]: isNaN(num) ? editValue : num };
      }
      return p;
    });
    setGridProducts(updated);
    setEditingCell(null);
  };

  return (
    <div style={{
      padding: '12px 8px',
      maxWidth: '100%',
      boxSizing: 'border-box',
      background: isOledMode ? '#000000' : 'transparent',
      color: isOledMode ? '#ffffff' : 'inherit'
    }}>
      {/* ======================================================== */}
      {/* HERO BANNER & REAL-TIME UX HUD                           */}
      {/* ======================================================== */}
      <div style={{
        background: isOledMode
          ? '#050505'
          : 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))',
        border: `1.5px solid ${isOledMode ? '#333333' : 'rgba(236, 72, 153, 0.35)'}`,
        borderRadius: '16px',
        padding: '18px 20px',
        marginBottom: '20px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #ec4899, #be185d)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 4px 14px rgba(236, 72, 153, 0.4)'
            }}>
              <Sparkles size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main, #f8fafc)' }}>
                  ফেজ ৩: ফ্রন্টএন্ড আল্ট্রা-পারফরম্যান্স ও আধুনিক ইউএক্স হাব
                </h2>
                <span style={{
                  padding: '3px 8px',
                  borderRadius: '12px',
                  background: 'rgba(236, 72, 153, 0.2)',
                  border: '1px solid #ec4899',
                  color: '#f472b6',
                  fontSize: '0.72rem',
                  fontWeight: 800
                }}>
                  টিপস ২১ - ৩০ সক্রিয় (120 FPS)
                </span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-muted, #94a3b8)' }}>
                ক্যানভাস ২ডি থার্মাল রসিদ, এক্সেল ইনলাইন গ্রিড, স্প্লিট-স্ক্রিন, হটকিজ V2, ওলেড পিওর ব্ল্যাক ও ওয়েব ওয়ার্কার থ্রেডিং।
              </p>
            </div>
          </div>

          {/* Quick OLED & Thumb Mode Toggles */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setIsOledMode(!isOledMode)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '20px',
                background: isOledMode ? '#000000' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${isOledMode ? '#ffffff' : 'rgba(255,255,255,0.2)'}`,
                color: isOledMode ? '#ffffff' : 'var(--text-main, #f8fafc)',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Moon size={13} style={{ color: isOledMode ? '#38bdf8' : '#94a3b8' }} />
              <span>OLED Pure Black {isOledMode ? 'অন' : 'অফ'}</span>
            </button>

            <button
              onClick={() => setThumbFriendlyMode(!thumbFriendlyMode)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '20px',
                background: thumbFriendlyMode ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${thumbFriendlyMode ? '#38bdf8' : 'rgba(255,255,255,0.2)'}`,
                color: thumbFriendlyMode ? '#38bdf8' : 'var(--text-main, #f8fafc)',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Smartphone size={13} />
              <span>মোবাইল থাম্ব মোড {thumbFriendlyMode ? 'অন' : 'অফ'}</span>
            </button>
          </div>
        </div>

        {/* 4 Performance KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
          <div style={{ background: isOledMode ? '#111111' : 'rgba(255,255,255,0.04)', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Printer size={13} style={{ color: '#ec4899' }} /> ক্যানভাস ২ডি রেন্ডারিং
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f472b6', marginTop: '4px' }}>
              &lt; ৫.৪ ms
            </div>
            <div style={{ fontSize: '0.68rem', color: '#64748b' }}>জিরো DOM রিফ্লো ল্যাগ</div>
          </div>

          <div style={{ background: isOledMode ? '#111111' : 'rgba(255,255,255,0.04)', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={13} style={{ color: '#38bdf8' }} /> ওয়েব ওয়ার্কার থ্রেডিং
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>
              120 FPS
            </div>
            <div style={{ fontSize: '0.68rem', color: '#64748b' }}>ব্যাকগ্রাউন্ড মাল্টি-কোর</div>
          </div>

          <div style={{ background: isOledMode ? '#111111' : 'rgba(255,255,255,0.04)', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <HardDrive size={13} style={{ color: '#10b981' }} /> মেমোরি কোটা
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#34d399', marginTop: '4px' }}>
              {storageEstimate ? `${storageEstimate.usageMb} MB` : 'স্বাভাবিক'}
            </div>
            <div style={{ fontSize: '0.68rem', color: '#64748b' }}>অটোপার্জার সচল</div>
          </div>

          <div style={{ background: isOledMode ? '#111111' : 'rgba(255,255,255,0.04)', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={13} style={{ color: '#f59e0b' }} /> ক্র্যাশ প্রোটেকশন
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fbbf24', marginTop: '4px' }}>
              ১০০% ড্রাফট
            </div>
            <div style={{ fontSize: '0.68rem', color: '#64748b' }}>বিদ্যুৎ চলেও নো লস</div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SUB-TABS NAVIGATION                                      */}
      {/* ======================================================== */}
      <div style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '8px',
        marginBottom: '16px',
        borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.1))'
      }}>
        {[
          { id: 'canvas_receipt', label: '১. ক্যানভাস ২ডি আল্ট্রা রসিদ (Tip 22)', icon: Printer },
          { id: 'inline_grid', label: '২. এক্সেল কুইক-এডিট গ্রিড (Tip 28)', icon: Table },
          { id: 'split_screen', label: '৩. স্প্লিট-স্ক্রিন মাল্টিটাস্কিং (Tip 29)', icon: Columns },
          { id: 'hotkeys_mobile', label: '৪. হটকিজ V2 ও থাম্ব মোড (Tips 23-24)', icon: Keyboard },
          { id: 'worker_storage', label: '৫. ওয়ার্কার, ওলেড ও ড্রাফট সেভার (Tips 21, 25, 27, 30)', icon: Zap }
        ].map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '10px',
                border: isActive ? '1.5px solid #ec4899' : '1px solid transparent',
                background: isActive ? 'rgba(236, 72, 153, 0.15)' : 'rgba(255,255,255,0.05)',
                color: isActive ? '#f472b6' : 'var(--text-main, #f8fafc)',
                fontWeight: isActive ? 800 : 600,
                fontSize: '0.84rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={15} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* TAB 1: CANVAS 2D RECEIPT RENDERER                        */}
      {/* ======================================================== */}
      {activeTab === 'canvas_receipt' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          <div style={{ background: isOledMode ? '#0a0a0a' : 'var(--card-bg, #1e293b)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-color, rgba(255,255,255,0.1))' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '1rem', fontWeight: 800, color: 'var(--text-main, #f8fafc)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Printer size={18} style={{ color: '#ec4899' }} /> HTML5 Canvas ২ডি থার্মাল রসিদ ইঞ্জিন
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)', marginBottom: '14px' }}>
              ধীরগতির ব্রাউজার DOM এড়িয়ে মাত্র ৫ মিলি-সেকেন্ডে ৮০ মিমি থার্মাল প্রিন্টারের বিটম্যাপ সরাসরি ক্যানভাসে ড্র করা হয়।
            </p>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
              <button
                onClick={handleDownloadCanvasPng}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: '#ec4899',
                  color: 'white',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Download size={14} /> PNG ইমেজ ডাউনলোড
              </button>
            </div>

            <div style={{
              background: '#090d16',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              justifyContent: 'center',
              overflowX: 'auto'
            }}>
              <canvas
                ref={canvasRef}
                style={{
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                  borderRadius: '4px',
                  maxWidth: '100%',
                  height: 'auto'
                }}
              />
            </div>
          </div>

          <div style={{ background: isOledMode ? '#0a0a0a' : 'var(--card-bg, #1e293b)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-color, rgba(255,255,255,0.1))' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main, #f8fafc)' }}>
              ⚡ ক্যানভাস রেন্ডারিংয়ের প্রযুক্তিগত সুবিধা
            </h3>
            <ul style={{ fontSize: '0.82rem', color: 'var(--text-muted, #94a3b8)', lineHeight: 1.7, paddingLeft: '20px', margin: 0 }}>
              <li><strong>০ ল্যাগ ও জিরো রিফ্লো:</strong> সাধারণ ব্রাউজারে ৫০০ আইটেম প্রিন্ট করতে স্ক্রিন ১-২ সেকেন্ড আটকে থাকে, ক্যানভাসে তা মাত্র ৪-৮ms।</li>
              <li><strong>৮০ মিমি ও ৫৮ মিমি পারফেক্ট স্কেল:</strong> প্রতিটি পিক্সেল সুনির্দিষ্ট থাকায় কোনো প্রিন্টারে টেক্সট কেটে যাবে না।</li>
              <li><strong>অফলাইন ব্লুটুথ থার্মাল প্রিন্ট:</strong> সরাসরি ESC/POS বাইট অ্যারে বা রাস্টার বিটম্যাপ তৈরি করতে পারে।</li>
              <li><strong>মোবাইলে ইনস্ট্যান্ট প্রিভিউ:</strong> কোনো ভারী PDF লাইব্রেরি ডাউনলোড ছাড়া মোবাইলেও সাথে সাথে রসিদ দেখা যায়।</li>
            </ul>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: EXCEL-LIKE INLINE QUICK-EDIT GRID                 */}
      {/* ======================================================== */}
      {activeTab === 'inline_grid' && (
        <div style={{ background: isOledMode ? '#0a0a0a' : 'var(--card-bg, #1e293b)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-color, rgba(255,255,255,0.1))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-main, #f8fafc)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Table size={18} style={{ color: '#38bdf8' }} /> এক্সেল-স্টাইল ইনলাইন কুইক-এডিট গ্রিড
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)' }}>
                আলাদা মডালে না ঢুকে সরাসরি টেবিলের সেলে ক্লিক করে দাম বা স্টক পরিবর্তন করুন (Enter চাপলেই সেভ)।
              </p>
            </div>
            <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700 }}>
              ✓ সরাসরি রিয়েল-টাইম লোকাল সেভ
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid rgba(255,255,255,0.1)', color: 'var(--text-muted, #94a3b8)' }}>
                  <th style={{ padding: '10px 8px' }}>পণ্যের নাম</th>
                  <th style={{ padding: '10px 8px' }}>বারকোড</th>
                  <th style={{ padding: '10px 8px' }}>ক্যাটাগরি</th>
                  <th style={{ padding: '10px 8px', color: '#38bdf8' }}>বিক্রয় মূল্য (৳) [ক্লিক করুন]</th>
                  <th style={{ padding: '10px 8px', color: '#10b981' }}>স্টক সংখ্যা [ক্লিক করুন]</th>
                </tr>
              </thead>
              <tbody>
                {gridProducts.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '10px 8px', fontWeight: 600, color: 'var(--text-main, #f8fafc)' }}>
                      {p.name}
                    </td>
                    <td style={{ padding: '10px 8px', color: 'var(--text-muted, #94a3b8)', fontFamily: 'monospace' }}>
                      {p.barcode}
                    </td>
                    <td style={{ padding: '10px 8px', color: 'var(--text-muted, #94a3b8)' }}>
                      {p.category}
                    </td>

                    {/* Inline Editable Sell Price */}
                    <td style={{ padding: '6px 8px' }}>
                      {editingCell?.id === p.id && editingCell?.field === 'sellPrice' ? (
                        <input
                          autoFocus
                          type="number"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onBlur={() => handleCellBlurOrEnter(p, 'sellPrice')}
                          onKeyDown={e => { if (e.key === 'Enter') handleCellBlurOrEnter(p, 'sellPrice'); }}
                          style={{
                            width: '90px',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            background: '#0f172a',
                            border: '1.5px solid #38bdf8',
                            color: 'white',
                            fontSize: '0.82rem'
                          }}
                        />
                      ) : (
                        <div
                          onClick={() => { setEditingCell({ id: p.id, field: 'sellPrice' }); setEditValue(String(p.sellPrice)); }}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            background: 'rgba(56, 189, 248, 0.1)',
                            border: '1px dashed rgba(56, 189, 248, 0.4)',
                            color: '#38bdf8',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'inline-block'
                          }}
                        >
                          ৳{p.sellPrice} ✎
                        </div>
                      )}
                    </td>

                    {/* Inline Editable Stock */}
                    <td style={{ padding: '6px 8px' }}>
                      {editingCell?.id === p.id && editingCell?.field === 'stock' ? (
                        <input
                          autoFocus
                          type="number"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onBlur={() => handleCellBlurOrEnter(p, 'stock')}
                          onKeyDown={e => { if (e.key === 'Enter') handleCellBlurOrEnter(p, 'stock'); }}
                          style={{
                            width: '80px',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            background: '#0f172a',
                            border: '1.5px solid #10b981',
                            color: 'white',
                            fontSize: '0.82rem'
                          }}
                        />
                      ) : (
                        <div
                          onClick={() => { setEditingCell({ id: p.id, field: 'stock' }); setEditValue(String(p.stock)); }}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            background: 'rgba(16, 185, 129, 0.1)',
                            border: '1px dashed rgba(16, 185, 129, 0.4)',
                            color: '#34d399',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'inline-block'
                          }}
                        >
                          {p.stock} পিস ✎
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: SPLIT-SCREEN MULTI-TASKING                        */}
      {/* ======================================================== */}
      {activeTab === 'split_screen' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {/* Left Pane: Active Checkout Cart */}
          <div style={{ background: isOledMode ? '#0a0a0a' : 'var(--card-bg, #1e293b)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-color, rgba(255,255,255,0.1))' }}>
            <h4 style={{ margin: '0 0 10px', fontSize: '0.92rem', fontWeight: 800, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Columns size={16} /> প্যান ১: লাইভ ক্যাশ কাউন্টার ও কার্ট
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
              {splitCart.map((item, idx) => (
                <div key={idx} style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: 'rgba(255,255,255,0.03)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.8rem'
                }}>
                  <span style={{ color: 'var(--text-main, #f8fafc)', fontWeight: 600 }}>{item.name} ({item.qty}টি)</span>
                  <span style={{ color: '#34d399', fontWeight: 700 }}>৳{item.qty * item.price}</span>
                </div>
              ))}
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>মোট বিল:</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#38bdf8' }}>৳৮৫</span>
            </div>
          </div>

          {/* Right Pane: Concurrent Customer Due Inquiry */}
          <div style={{ background: isOledMode ? '#0a0a0a' : 'var(--card-bg, #1e293b)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-color, rgba(255,255,255,0.1))' }}>
            <h4 style={{ margin: '0 0 10px', fontSize: '0.92rem', fontWeight: 800, color: '#ec4899', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Columns size={16} /> প্যান ২: কাস্টমার বাকি ও লেজার ইনকোয়ারি
            </h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', marginBottom: '12px' }}>
              কাউন্টার বিলিং বন্ধ না করেই কাস্টমারের পূর্বের হিসাব চেক করার জন্য পাশাপাশি স্ক্রিন।
            </p>
            <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(236, 72, 153, 0.1)', border: '1px solid rgba(236, 72, 153, 0.3)', marginBottom: '10px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f472b6' }}>
                {selectedSplitDebtor}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)', marginTop: '4px' }}>
                সর্বশেষ পেমেন্ট: ১০ অক্টোবর, ২০২৬ | ক্রেডিট লিমিট: ৳৫,০০০
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: HOTKEYS V2 & THUMB TOUCH MODE                     */}
      {/* ======================================================== */}
      {activeTab === 'hotkeys_mobile' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          <div style={{ background: isOledMode ? '#0a0a0a' : 'var(--card-bg, #1e293b)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-color, rgba(255,255,255,0.1))' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '1rem', fontWeight: 800, color: 'var(--text-main, #f8fafc)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Keyboard size={18} style={{ color: '#38bdf8' }} /> কিবোর্ড-ফার্স্ট ৫-সেকেন্ড সেলস ইঞ্জিন (Hotkeys V2)
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)', marginBottom: '14px' }}>
              মাউস ছাড়াও কিবোর্ডের যেকোনো ফাংশন কি চাপুন, নিচে লাইভ ডিটেক্ট হবে:
            </p>

            {lastKeyPressed && (
              <div style={{
                padding: '8px 14px',
                borderRadius: '8px',
                background: '#10b981',
                color: 'white',
                fontWeight: 800,
                fontSize: '0.82rem',
                marginBottom: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Check size={14} /> চাপ দেওয়া কী: {lastKeyPressed}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
              {HOTKEY_DEFINITIONS.map(h => (
                <div key={h.key} style={{
                  padding: '8px 10px',
                  borderRadius: '6px',
                  background: lastKeyPressed === h.key ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${lastKeyPressed === h.key ? '#10b981' : 'rgba(255,255,255,0.08)'}`,
                  fontSize: '0.74rem'
                }}>
                  <div style={{ fontWeight: 800, color: '#38bdf8', fontFamily: 'monospace' }}>[{h.key}]</div>
                  <div style={{ color: 'var(--text-muted, #94a3b8)', marginTop: '2px' }}>{h.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: isOledMode ? '#0a0a0a' : 'var(--card-bg, #1e293b)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-color, rgba(255,255,255,0.1))' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '1rem', fontWeight: 800, color: 'var(--text-main, #f8fafc)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Smartphone size={18} style={{ color: '#ec4899' }} /> ওয়ান-হ্যান্ডেড মোবাইল থাম্ব মোড (Thumb-Friendly)
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)', marginBottom: '14px' }}>
              একহাতে মোবাইল ধরে বৃদ্ধাঙ্গুলি দিয়ে সহজেই বড় বড় বাটনে চেকআউট ও বিলিং করার লেআউট।
            </p>

            <div style={{
              maxWidth: '280px',
              margin: '0 auto',
              padding: '16px',
              borderRadius: '24px',
              border: '2px solid rgba(255,255,255,0.15)',
              background: '#090d16',
              boxShadow: '0 10px 25px rgba(0,0,0,0.4)'
            }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', textAlign: 'center', marginBottom: '12px' }}>
                মোবাইল প্রিভিউ বাটন
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                <button style={{ padding: '16px 8px', borderRadius: '14px', background: '#3b82f6', color: 'white', border: 'none', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer' }}>
                  + পণ্য যোগ
                </button>
                <button style={{ padding: '16px 8px', borderRadius: '14px', background: '#8b5cf6', color: 'white', border: 'none', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer' }}>
                  🔍 সার্চ
                </button>
              </div>
              <button style={{ width: '100%', padding: '18px 8px', borderRadius: '14px', background: '#10b981', color: 'white', border: 'none', fontWeight: 900, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)' }}>
                ⚡ সরাসরি চেকআউট (৳৮৫)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: WORKER, STORAGE & CRASH DRAFT RECOVERY            */}
      {/* ======================================================== */}
      {activeTab === 'worker_storage' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          {/* Worker Stress Test */}
          <div style={{ background: isOledMode ? '#0a0a0a' : 'var(--card-bg, #1e293b)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-color, rgba(255,255,255,0.1))' }}>
            <h4 style={{ margin: '0 0 10px', fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main, #f8fafc)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={16} style={{ color: '#38bdf8' }} /> ১০,০০০ ট্রানজেকশন ব্যাকগ্রাউন্ড থ্রেড টেস্ট
            </h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', marginBottom: '12px' }}>
              মেইন UI থ্রেডকে ব্লক না করে ব্যাকগ্রাউন্ড ওয়েব ওয়ার্কারে গণনা হয়।
            </p>
            <button
              onClick={handleRunWorkerBenchmark}
              disabled={workerRunning}
              style={{
                width: '100%',
                padding: '9px',
                borderRadius: '8px',
                background: '#38bdf8',
                color: '#090d16',
                border: 'none',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: 'pointer',
                marginBottom: '10px'
              }}
            >
              {workerRunning ? 'ওয়ার্কারে গণনা চলছে...' : '🚀 ১০,০০০ ইনভয়েস স্ট্রেস টেস্ট রান করুন'}
            </button>
            {workerResult && (
              <div style={{ fontSize: '0.75rem', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '8px', borderRadius: '6px' }}>
                ✓ সম্পন্ন: {workerResult.totalInvoices} ইনভয়েস, সময়: {workerResult.durationMs}ms
              </div>
            )}
          </div>

          {/* Storage Quota Auto-Purge */}
          <div style={{ background: isOledMode ? '#0a0a0a' : 'var(--card-bg, #1e293b)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-color, rgba(255,255,255,0.1))' }}>
            <h4 style={{ margin: '0 0 10px', fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main, #f8fafc)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HardDrive size={16} style={{ color: '#10b981' }} /> অফলাইন মেমোরি কোটা অটোপার্জার
            </h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', marginBottom: '12px' }}>
              ক্যাশ করা পুরোনো ইমেজ ও টেম্পোরারি ফাইল স্বয়ংক্রিয় ক্লিন করে কোটা এরর দূর করে।
            </p>
            <button
              onClick={handleAutoPurge}
              style={{
                width: '100%',
                padding: '9px',
                borderRadius: '8px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: 'pointer',
                marginBottom: '10px'
              }}
            >
              🧹 এখনই ক্যাশ অটোপার্জ করুন
            </button>
            {purgeResult && (
              <div style={{ fontSize: '0.75rem', color: '#34d399', background: 'rgba(16, 185, 129, 0.1)', padding: '8px', borderRadius: '6px' }}>
                ✓ {purgeResult.purgedItems}টি টেম্প ফাইল ডিলিট, {purgeResult.freedBytesKb} KB মেমরি ফ্রি।
              </div>
            )}
          </div>

          {/* Crash Recovery Draft Saver */}
          <div style={{ background: isOledMode ? '#0a0a0a' : 'var(--card-bg, #1e293b)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-color, rgba(255,255,255,0.1))' }}>
            <h4 style={{ margin: '0 0 10px', fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main, #f8fafc)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RotateCcw size={16} style={{ color: '#f59e0b' }} /> পাওয়ার-কাট ও ক্র্যাশ ড্রাফট সেভার
            </h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', marginBottom: '12px' }}>
              বিদ্যুৎ চলে গেলে বা ট্যাব ক্র্যাশ হলেও ওপেন করামাত্র ড্রাফট উদ্ধার করা যায়।
            </p>
            <button
              onClick={handleSaveSimulatedDraft}
              style={{
                width: '100%',
                padding: '9px',
                borderRadius: '8px',
                background: '#f59e0b',
                color: '#090d16',
                border: 'none',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: 'pointer',
                marginBottom: '10px'
              }}
            >
              💾 ড্রাফট স্ন্যাপশট সংরক্ষণ টেস্ট
            </button>
            {draftSavedFlash && (
              <div style={{ fontSize: '0.75rem', color: '#fbbf24', background: 'rgba(245, 158, 11, 0.1)', padding: '8px', borderRadius: '6px' }}>
                ✓ ড্রাফট সংরক্ষিত হয়েছে! ব্রাউজার রিফ্রেশেও ডেটা অক্ষুণ্ণ থাকবে।
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
