import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  UtensilsCrossed,
  Scissors,
  Wrench,
  Grid,
  QrCode,
  CheckCircle2,
  Clock,
  Printer,
  Plus,
  Trash2,
  Car,
  Layers,
  Sparkles,
  Phone,
  User,
  Calendar,
  AlertCircle,
  Check,
  ShoppingBag
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { playButtonClick, playSuccessChime } from '../../services/soundFeedback';

/**
 * HisabKitab 360 - Specialized Business Verticals Hub (Phase 8, Features 77, 78, 79, 80)
 * Features:
 * - 77: Restaurant Floor Table Map & QR Self-Ordering
 * - 78: Fabrics গজ-মিটার Converter & Tailoring Measurement CRM
 * - 79: Automobile & Motorcycle Workshop Digital Job-Card
 * - 80: Footwear & Apparel Size-Color Lot Matrix
 */
export const SpecializedVerticalsHubModal = ({ isOpen, onClose, lang = 'bn' }) => {
  const { products = [], showToast = () => {}, businessSettings = {} } = useApp() || {};

  const [activeTab, setActiveTab] = useState('restaurant_tables'); // 'restaurant_tables' | 'tailoring_fabrics' | 'workshop_jobcard' | 'lot_size_matrix'

  // --------------------------------------------------------------------------
  // 1. Feature 77: Restaurant Table Management & QR Self-Ordering
  // --------------------------------------------------------------------------
  const [tables, setTables] = useState(() => {
    try {
      const saved = localStorage.getItem('hk360_restaurant_tables');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn(e);
    }
    // Default clean tables for fresh layout
    return [
      { id: 'T-1', name: 'টেবিল ১', capacity: 4, status: 'empty', orderTotal: 0, guests: 0 },
      { id: 'T-2', name: 'টেবিল ২', capacity: 2, status: 'empty', orderTotal: 0, guests: 0 },
      { id: 'T-3', name: 'টেবিল ৩', capacity: 6, status: 'empty', orderTotal: 0, guests: 0 },
      { id: 'VIP-1', name: 'ভিআইপি কেবিন ১', capacity: 8, status: 'empty', orderTotal: 0, guests: 0 }
    ];
  });

  const [selectedTableForQr, setSelectedTableForQr] = useState(null);
  const [newTableName, setNewTableName] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState('4');

  const persistTables = (updated) => {
    setTables(updated);
    try {
      localStorage.setItem('hk360_restaurant_tables', JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
  };

  const handleTableStatusToggle = (id) => {
    playButtonClick?.();
    const updated = tables.map((t) => {
      if (t.id === id) {
        const nextStatus = t.status === 'empty' ? 'occupied' : t.status === 'occupied' ? 'reserved' : 'empty';
        return { ...t, status: nextStatus };
      }
      return t;
    });
    persistTables(updated);
  };

  const handleAddTable = (e) => {
    e.preventDefault();
    if (!newTableName.trim()) return;
    const newId = `T-${Date.now().toString().slice(-4)}`;
    const newTable = {
      id: newId,
      name: newTableName.trim(),
      capacity: parseInt(newTableCapacity, 10) || 4,
      status: 'empty',
      orderTotal: 0,
      guests: 0
    };
    const updated = [...tables, newTable];
    persistTables(updated);
    setNewTableName('');
    playSuccessChime?.();
    showToast?.('নতুন টেবিল সফলভাবে যোগ করা হয়েছে', 'success');
  };

  const handleDeleteTable = (id) => {
    const updated = tables.filter((t) => t.id !== id);
    persistTables(updated);
    showToast?.('টেবিল মুছে ফেলা হয়েছে', 'info');
  };

  // --------------------------------------------------------------------------
  // 2. Feature 78: Fabrics গজ-মিটার Converter & Tailoring Measurement CRM
  // --------------------------------------------------------------------------
  const [fabricYards, setFabricYards] = useState('1');
  const [tailorOrders, setTailorOrders] = useState(() => {
    try {
      const saved = localStorage.getItem('hk360_tailor_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [tailorCustomer, setTailorCustomer] = useState({
    name: '',
    phone: '',
    itemType: 'পাঞ্জাবি ও পায়জামা',
    deliveryDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    measurements: {
      length: '',
      chest: '',
      waist: '',
      sleeve: '',
      shoulder: '',
      neck: '',
      cuff: '',
      bottom: ''
    },
    notes: '',
    makingCharge: '',
    advancePaid: ''
  });

  const convertedMeters = useMemo(() => {
    const y = parseFloat(fabricYards) || 0;
    return {
      meters: (y * 0.9144).toFixed(2),
      inches: (y * 36).toFixed(1),
      girah: (y * 16).toFixed(1)
    };
  }, [fabricYards]);

  const handleSaveTailoringOrder = (e) => {
    e.preventDefault();
    if (!tailorCustomer.name.trim() || !tailorCustomer.phone.trim()) {
      showToast?.('গ্রাহকের নাম ও ফোন নম্বর প্রদান করুন', 'error');
      return;
    }
    const newOrder = {
      ...tailorCustomer,
      id: `TLR-${Date.now().toString(36).toUpperCase()}`,
      status: 'কাটিং ও সেলাই চলছে',
      createdDate: new Date().toLocaleDateString('bn-BD')
    };
    const updated = [newOrder, ...tailorOrders];
    setTailorOrders(updated);
    try {
      localStorage.setItem('hk360_tailor_orders', JSON.stringify(updated.slice(0, 50)));
    } catch (e) {
      console.warn(e);
    }
    // reset form
    setTailorCustomer({
      name: '',
      phone: '',
      itemType: 'পাঞ্জাবি ও পায়জামা',
      deliveryDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      measurements: {
        length: '',
        chest: '',
        waist: '',
        sleeve: '',
        shoulder: '',
        neck: '',
        cuff: '',
        bottom: ''
      },
      notes: '',
      makingCharge: '',
      advancePaid: ''
    });
    playSuccessChime?.();
    showToast?.(`দর্জি পরিমাপ অর্ডার সফলভাবে সংরক্ষিত হয়েছে!`, 'success');
  };

  const handleDeleteTailorOrder = (id) => {
    const filtered = tailorOrders.filter((o) => o.id !== id);
    setTailorOrders(filtered);
    try {
      localStorage.setItem('hk360_tailor_orders', JSON.stringify(filtered));
    } catch (e) {
      console.warn(e);
    }
    showToast?.('অর্ডার মুছে ফেলা হয়েছে', 'info');
  };

  // --------------------------------------------------------------------------
  // 3. Feature 79: Automobile & Motorcycle Workshop Digital Job-Card
  // --------------------------------------------------------------------------
  const [jobCards, setJobCards] = useState(() => {
    try {
      const saved = localStorage.getItem('hk360_workshop_jobcards');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [currentJob, setCurrentJob] = useState({
    id: `JOB-${Date.now().toString(36).toUpperCase()}`,
    vehicleNumber: '',
    vehicleModel: '',
    customerName: '',
    customerPhone: '',
    odometer: '',
    fuelLevel: '50%',
    issues: '',
    parts: [],
    laborCharge: 0
  });

  const [partInput, setPartInput] = useState({ name: '', price: '' });

  const addPartToJob = () => {
    if (!partInput.name.trim()) return;
    setCurrentJob((prev) => ({
      ...prev,
      parts: [...prev.parts, { name: partInput.name.trim(), price: parseFloat(partInput.price) || 0 }]
    }));
    setPartInput({ name: '', price: '' });
  };

  const removePartFromJob = (index) => {
    setCurrentJob((prev) => ({
      ...prev,
      parts: prev.parts.filter((_, i) => i !== index)
    }));
  };

  const currentJobTotal = useMemo(() => {
    const partsSum = currentJob.parts.reduce((a, b) => a + Number(b.price || 0), 0);
    return partsSum + Number(currentJob.laborCharge || 0);
  }, [currentJob]);

  const handleSaveJobCard = () => {
    if (!currentJob.vehicleNumber.trim() || !currentJob.customerName.trim()) {
      showToast?.('গাড়ির নম্বর ও কাস্টমারের নাম প্রদান করুন', 'error');
      return;
    }
    const cardToSave = {
      ...currentJob,
      total: currentJobTotal,
      date: new Date().toLocaleDateString('bn-BD'),
      status: 'সার্ভিসিং চলছে'
    };
    const updated = [cardToSave, ...jobCards];
    setJobCards(updated);
    try {
      localStorage.setItem('hk360_workshop_jobcards', JSON.stringify(updated.slice(0, 50)));
    } catch (e) {
      console.warn(e);
    }
    playSuccessChime?.();
    showToast?.(`ওয়ার্কশপ জব-কার্ড ${currentJob.id} সফলভাবে সেভ হয়েছে!`, 'success');
  };

  // --------------------------------------------------------------------------
  // 4. Feature 80: Footwear & Apparel Size-Color Lot Matrix
  // --------------------------------------------------------------------------
  const [selectedProductId, setSelectedProductId] = useState('');
  const [sizeMatrix, setSizeMatrix] = useState(() => {
    try {
      const saved = localStorage.getItem('hk360_lot_size_matrix');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn(e);
    }
    return {
      '38': { Black: 0, Brown: 0, White: 0 },
      '39': { Black: 0, Brown: 0, White: 0 },
      '40': { Black: 0, Brown: 0, White: 0 },
      '41': { Black: 0, Brown: 0, White: 0 },
      '42': { Black: 0, Brown: 0, White: 0 },
      '43': { Black: 0, Brown: 0, White: 0 }
    };
  });

  const totalMatrixPairs = useMemo(() => {
    let sum = 0;
    Object.values(sizeMatrix).forEach((row) => {
      Object.values(row).forEach((v) => {
        sum += Number(v || 0);
      });
    });
    return sum;
  }, [sizeMatrix]);

  const handleSaveMatrix = () => {
    try {
      localStorage.setItem('hk360_lot_size_matrix', JSON.stringify(sizeMatrix));
    } catch (e) {
      console.warn(e);
    }
    playSuccessChime?.();
    showToast?.(`সাইজ-কালার স্টক ম্যাট্রিক্স (মোট ${totalMatrixPairs} পিস/জোড়া) সফলভাবে সংরক্ষিত হয়েছে!`, 'success');
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9995] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-5xl max-h-[94vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-rose-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  বিশেষায়িত বিজনেস ভার্টিক্যাল ও ইন্ডাস্ট্রি ইঞ্জিন
                </h3>
                <span className="hidden sm:inline-block text-[11px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-semibold border border-amber-300 dark:border-amber-800">
                  Phase 8 Verticals
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                রেস্টুরেন্ট কিউআর সেলফ-অর্ডার, ফেব্রিক্স গজ-মিটার ক্যালকুলেটর, ওয়ার্কশপ জব-কার্ড ও সাইজ ম্যাট্রিক্স
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-3 sm:px-5 bg-slate-100/50 dark:bg-slate-800/40 overflow-x-auto no-scrollbar gap-1">
          <button
            onClick={() => setActiveTab('restaurant_tables')}
            className={`py-3 px-3 sm:px-4 text-xs font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'restaurant_tables'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-white/50 dark:bg-slate-800/80'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            রেস্টুরেন্ট টেবিল ও কিউআর সেলফ-অর্ডার
          </button>
          <button
            onClick={() => setActiveTab('tailoring_fabrics')}
            className={`py-3 px-3 sm:px-4 text-xs font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'tailoring_fabrics'
                ? 'border-rose-500 text-rose-600 dark:text-rose-400 bg-white/50 dark:bg-slate-800/80'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Scissors className="w-4 h-4" />
            ফেব্রিক্স গজ-মিটার ও দর্জি মাপ CRM
          </button>
          <button
            onClick={() => setActiveTab('workshop_jobcard')}
            className={`py-3 px-3 sm:px-4 text-xs font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'workshop_jobcard'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-white/50 dark:bg-slate-800/80'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Wrench className="w-4 h-4" />
            গাড়ি/বাইক ওয়ার্কশপ ডিজিটাল জব-কার্ড
          </button>
          <button
            onClick={() => setActiveTab('lot_size_matrix')}
            className={`py-3 px-3 sm:px-4 text-xs font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'lot_size_matrix'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400 bg-white/50 dark:bg-slate-800/80'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Grid className="w-4 h-4" />
            জুতা ও পোশাকের সাইজ-কালার গ্রিড
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: RESTAURANT TABLE & QR SELF-ORDER (Feature 77) */}
          {activeTab === 'restaurant_tables' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-3">
                  <UtensilsCrossed className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <div className="text-xs text-amber-900 dark:text-amber-200">
                    <strong>রেস্টুরেন্ট ফ্লোর ম্যানেজমেন্ট:</strong> প্রতিটি টেবিলের জন্য স্বতন্ত্র কিউআর কোড রয়েছে।
                    কাস্টমার নিজের স্মার্টফোনে কিউআর স্ক্যান করে ডিজিটাল মেনু থেকে খাবার অর্ডার করতে পারেন।
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold shrink-0">
                  <span className="flex items-center gap-1 text-emerald-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> খালি
                  </span>
                  <span className="flex items-center gap-1 text-rose-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> খাবার চলছে
                  </span>
                  <span className="flex items-center gap-1 text-blue-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> বুকড
                  </span>
                </div>
              </div>

              {/* Add New Table Form */}
              <form onSubmit={handleAddTable} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border flex flex-wrap items-center gap-3 text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">নতুন টেবিল তৈরি:</span>
                <input
                  type="text"
                  placeholder="টেবিলের নাম (যেমন টেবিল ৪, রুফটপ ৩)..."
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border text-xs flex-1 min-w-[160px]"
                />
                <div className="flex items-center gap-1">
                  <span className="text-slate-500">সিট:</span>
                  <input
                    type="number"
                    min="1"
                    value={newTableCapacity}
                    onChange={(e) => setNewTableCapacity(e.target.value)}
                    className="w-16 px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 border text-xs font-bold text-center"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition"
                >
                  <Plus className="w-3.5 h-3.5" /> টেবিল যোগ করুন
                </button>
              </form>

              {/* Table Floor Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {tables.map((t) => (
                  <div
                    key={t.id}
                    className={`p-4 rounded-2xl border-2 transition flex flex-col justify-between ${
                      t.status === 'occupied'
                        ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-400 dark:border-rose-800'
                        : t.status === 'reserved'
                        ? 'bg-blue-50/60 dark:bg-blue-950/20 border-blue-400 dark:border-blue-800'
                        : 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-400 dark:border-emerald-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black text-slate-800 dark:text-slate-100">{t.name}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border">
                            {t.capacity} সিট
                          </span>
                          <button
                            onClick={() => handleDeleteTable(t.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-500"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="text-center py-3">
                        <div
                          className={`text-xl font-black ${
                            t.status === 'occupied'
                              ? 'text-rose-600'
                              : t.status === 'reserved'
                              ? 'text-blue-600'
                              : 'text-emerald-600'
                          }`}
                        >
                          {t.status === 'occupied' ? 'অতিথি আছেন' : t.status === 'reserved' ? 'অগ্রিম বুকড' : 'খালি টেবিল'}
                        </div>
                        <span className="text-[10px] text-slate-500">আইডি: {t.id}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleTableStatusToggle(t.id)}
                        className="flex-1 py-1 px-2 rounded-lg bg-white dark:bg-slate-800 border text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                      >
                        স্ট্যাটাস বদল
                      </button>
                      <button
                        onClick={() => setSelectedTableForQr(t)}
                        className="p-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition"
                        title="টেবিল কিউআর কোড"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* QR Modal Popup if selected */}
              {selectedTableForQr && (
                <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border-2 border-amber-400 dark:border-amber-600 flex flex-col sm:flex-row items-center gap-4 animate-scale-up shadow-lg">
                  <div className="w-24 h-24 bg-slate-100 dark:bg-slate-900 rounded-xl flex items-center justify-center p-2 border">
                    <QrCode className="w-16 h-16 text-slate-800 dark:text-white" />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                      {selectedTableForQr.name} — কিউআর সেলফ-অর্ডার লিঙ্ক
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      গ্রাহক মোবাইলে স্ক্যান করলে সরাসরি টেবিল {selectedTableForQr.id} এর জন্য রেস্টুরেন্টের মেনু কার্ড লোড হবে।
                    </p>
                    <div className="mt-2 text-xs font-mono text-amber-600 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg break-all">
                      https://hisabkitab360.app/order?table={encodeURIComponent(selectedTableForQr.id)}
                    </div>
                  </div>
                  <div className="flex sm:flex-col gap-2">
                    <button
                      onClick={() => {
                        playSuccessChime?.();
                        window.print();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-bold flex items-center gap-1 shadow-sm"
                    >
                      <Printer className="w-3.5 h-3.5" /> প্রিন্ট
                    </button>
                    <button
                      onClick={() => setSelectedTableForQr(null)}
                      className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-xs font-bold"
                    >
                      বন্ধ
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TAILORING MEASUREMENT CRM & FABRICS CONVERTER (Feature 78) */}
          {activeTab === 'tailoring_fabrics' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Unit Converter Left Column */}
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 space-y-3">
                  <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold text-xs">
                    <Scissors className="w-4 h-4" />
                    ফেব্রিক্স গজ-মিটার ক্যালকুলেটর
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      কাপড়ের পরিমাণ (গজ লিখুন):
                    </label>
                    <input
                      type="number"
                      step="0.25"
                      value={fabricYards}
                      onChange={(e) => setFabricYards(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-base font-black text-rose-600 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5 pt-2 border-t border-rose-200 dark:border-rose-800 text-xs text-slate-700 dark:text-slate-300">
                    <div className="flex justify-between">
                      <span>মিটারে রূপান্তর:</span>
                      <span className="font-bold">{convertedMeters.meters} মিটার</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ইঞ্চিতে রূপান্তর:</span>
                      <span className="font-bold">{convertedMeters.inches} ইঞ্চি</span>
                    </div>
                    <div className="flex justify-between">
                      <span>দেশীয় গিরায় হিসাব:</span>
                      <span className="font-bold">{convertedMeters.girah} গিরা</span>
                    </div>
                  </div>
                </div>

                {/* Saved Orders List */}
                {tailorOrders.length > 0 && (
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 text-xs">
                    <div className="font-bold text-slate-700 dark:text-slate-300 flex justify-between">
                      <span>সংরক্ষিত দর্জি অর্ডার ({tailorOrders.length})</span>
                    </div>
                    <div className="space-y-1.5 max-h-60 overflow-y-auto">
                      {tailorOrders.map((ord) => (
                        <div key={ord.id} className="p-2 rounded bg-slate-50 dark:bg-slate-800 border flex justify-between items-center">
                          <div>
                            <div className="font-bold">{ord.name} ({ord.itemType})</div>
                            <div className="text-[10px] text-slate-400">{ord.phone} • ডেলিভারি: {ord.deliveryDate}</div>
                          </div>
                          <button
                            onClick={() => handleDeleteTailorOrder(ord.id)}
                            className="p-1 rounded text-rose-500 hover:bg-rose-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Tailoring Measurement Card Right Column */}
              <div className="md:col-span-2 space-y-4">
                <form onSubmit={handleSaveTailoringOrder} className="p-5 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2">
                      <User className="w-4 h-4 text-rose-500" />
                      গ্রাহকের দর্জি পরিমাপ ও মাপ কার্ড (Tailor CRM)
                    </h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold">
                      পরিমাপ বুকিং
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">গ্রাহকের নাম*</label>
                      <input
                        type="text"
                        required
                        placeholder="নাম লিখুন..."
                        value={tailorCustomer.name}
                        onChange={(e) => setTailorCustomer({ ...tailorCustomer, name: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">মোবাইল নম্বর*</label>
                      <input
                        type="text"
                        required
                        placeholder="০১৭xxxxxxxx"
                        value={tailorCustomer.phone}
                        onChange={(e) => setTailorCustomer({ ...tailorCustomer, phone: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">পোশাকের ধরন</label>
                      <select
                        value={tailorCustomer.itemType}
                        onChange={(e) => setTailorCustomer({ ...tailorCustomer, itemType: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border text-xs font-semibold"
                      >
                        <option value="পাঞ্জাবি ও পায়জামা">পাঞ্জাবি ও পায়জামা</option>
                        <option value="ফর্মাল শার্ট">ফর্মাল শার্ট</option>
                        <option value="প্যান্ট / ট্রাউজার">প্যান্ট / ট্রাউজার</option>
                        <option value="সালোয়ার কামিজ">সালোয়ার কামিজ</option>
                        <option value="বোরকা ও হিজাব">বোরকা ও হিজাব</option>
                        <option value="ব্লেজার ও কোট">ব্লেজার ও কোট</option>
                      </select>
                    </div>
                  </div>

                  {/* Body Measurements Grid */}
                  <div>
                    <span className="block text-[11px] font-bold uppercase text-slate-500 mb-2">
                      পরিমাপ ইনপুট (ইঞ্চিতে লিখুন):
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-8 gap-2">
                      {[
                        { key: 'length', label: 'লম্বা' },
                        { key: 'chest', label: 'বুক' },
                        { key: 'waist', label: 'কোমর' },
                        { key: 'sleeve', label: 'হাতা' },
                        { key: 'shoulder', label: 'তিড়া' },
                        { key: 'neck', label: 'কলার' },
                        { key: 'cuff', label: 'মোহড়া' },
                        { key: 'bottom', label: 'ঘের/হাই' }
                      ].map((m) => (
                        <div key={m.key} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border text-center">
                          <span className="text-[10px] text-slate-400 font-semibold">{m.label}</span>
                          <input
                            type="text"
                            placeholder="০"
                            value={tailorCustomer.measurements[m.key]}
                            onChange={(e) =>
                              setTailorCustomer({
                                ...tailorCustomer,
                                measurements: { ...tailorCustomer.measurements, [m.key]: e.target.value }
                              })
                            }
                            className="w-full text-center text-xs font-black bg-transparent border-none focus:outline-none text-rose-600"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">ডেলিভারির তারিখ*</label>
                      <input
                        type="date"
                        required
                        value={tailorCustomer.deliveryDate}
                        onChange={(e) => setTailorCustomer({ ...tailorCustomer, deliveryDate: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">মজুরি / সেলাই চার্জ (৳)</label>
                      <input
                        type="number"
                        placeholder="০"
                        value={tailorCustomer.makingCharge}
                        onChange={(e) => setTailorCustomer({ ...tailorCustomer, makingCharge: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">অগ্রিম গ্রহণ (৳)</label>
                      <input
                        type="number"
                        placeholder="০"
                        value={tailorCustomer.advancePaid}
                        onChange={(e) => setTailorCustomer({ ...tailorCustomer, advancePaid: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">ডিজাইন বা বিশেষ নোট</label>
                    <input
                      type="text"
                      placeholder="পকেটের স্টাইল, সুতার কাজ ইত্যাদি..."
                      value={tailorCustomer.notes}
                      onChange={(e) => setTailorCustomer({ ...tailorCustomer, notes: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition"
                  >
                    দর্জি পরিমাপ অর্ডার সংরক্ষণ করুন
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 3: AUTOMOBILE & MOTORCYCLE WORKSHOP JOB-CARD (Feature 79) */}
          {activeTab === 'workshop_jobcard' && (
            <div className="space-y-5 max-w-2xl mx-auto">
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-blue-600" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        গাড়ি ও বাইক ওয়ার্কশপ ডিজিটাল জব-কার্ড
                      </h4>
                      <span className="text-[10px] text-slate-400">আইডি: {currentJob.id}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveJobCard}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition"
                    >
                      <Printer className="w-3.5 h-3.5" /> জব-কার্ড সেভ ও গেটপাস
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">গাড়ি/বাইকের নম্বর*</label>
                    <input
                      type="text"
                      placeholder="যেমন: ঢাকা মেট্রো-হ ১২-৩৪৫৬"
                      value={currentJob.vehicleNumber}
                      onChange={(e) => setCurrentJob({ ...currentJob, vehicleNumber: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">মডেল ও কোম্পানি</label>
                    <input
                      type="text"
                      placeholder="যেমন: Yamaha FZS V3 / Toyota Axio"
                      value={currentJob.vehicleModel}
                      onChange={(e) => setCurrentJob({ ...currentJob, vehicleModel: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">মালিকের নাম*</label>
                    <input
                      type="text"
                      placeholder="নাম লিখুন..."
                      value={currentJob.customerName}
                      onChange={(e) => setCurrentJob({ ...currentJob, customerName: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">মোবাইল নম্বর*</label>
                    <input
                      type="text"
                      placeholder="০১৭xxxxxxxx"
                      value={currentJob.customerPhone}
                      onChange={(e) => setCurrentJob({ ...currentJob, customerPhone: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">ওডোমিটার (কিমি)</label>
                    <input
                      type="text"
                      placeholder="যেমন: 24,500 km"
                      value={currentJob.odometer}
                      onChange={(e) => setCurrentJob({ ...currentJob, odometer: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">ফুয়েল লেভেল</label>
                    <select
                      value={currentJob.fuelLevel}
                      onChange={(e) => setCurrentJob({ ...currentJob, fuelLevel: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border"
                    >
                      <option value="Reserve">Reserve (খালি প্রায়)</option>
                      <option value="25%">২৫% (1/4)</option>
                      <option value="50%">৫০% (Half Tank)</option>
                      <option value="75%">৭৫% (3/4)</option>
                      <option value="Full">Full Tank</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">কাজের বিবরণ / গ্রাহকের অভিযোগ</label>
                  <textarea
                    rows={2}
                    placeholder="ইঞ্জিন অয়েল পরিবর্তন, ব্রেক শু সার্ভিসিং, ভাইব্রেশন সমস্যা..."
                    value={currentJob.issues}
                    onChange={(e) => setCurrentJob({ ...currentJob, issues: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border text-xs"
                  />
                </div>

                {/* Parts Entry */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border space-y-2 text-xs">
                  <div className="font-bold text-slate-700 dark:text-slate-300">স্পেয়ার পার্টস ও লুব্রিকেন্ট যোগ করুন:</div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="পার্টস নাম (যেমন ইঞ্জিন অয়েল, স্পার্ক প্লাগ)..."
                      value={partInput.name}
                      onChange={(e) => setPartInput({ ...partInput, name: e.target.value })}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border text-xs"
                    />
                    <input
                      type="number"
                      placeholder="মূল্য ৳"
                      value={partInput.price}
                      onChange={(e) => setPartInput({ ...partInput, price: e.target.value })}
                      className="w-24 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border text-xs font-bold text-center"
                    />
                    <button
                      type="button"
                      onClick={addPartToJob}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                    >
                      যোগ
                    </button>
                  </div>

                  {currentJob.parts.length > 0 && (
                    <div className="divide-y divide-slate-200 dark:divide-slate-700 pt-1">
                      {currentJob.parts.map((p, i) => (
                        <div key={i} className="py-1.5 flex justify-between items-center text-xs">
                          <span>{p.name}</span>
                          <div className="flex items-center gap-3">
                            <span className="font-bold">৳{p.price}</span>
                            <button onClick={() => removePartFromJob(i)} className="text-rose-500">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border">
                  <span className="font-bold">মেকানিক সার্ভিস / লেবার ফি (৳):</span>
                  <input
                    type="number"
                    value={currentJob.laborCharge}
                    onChange={(e) => setCurrentJob({ ...currentJob, laborCharge: parseFloat(e.target.value) || 0 })}
                    className="w-28 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border font-bold text-right"
                  />
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800 flex justify-between items-center font-black text-sm text-blue-900 dark:text-blue-200">
                  <span>সর্বমোট বিল (Estimated Total):</span>
                  <span>৳ {currentJobTotal.toLocaleString('bn-BD')}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FOOTWEAR & APPAREL SIZE-COLOR LOT MATRIX (Feature 80) */}
          {activeTab === 'lot_size_matrix' && (
            <div className="space-y-5">
              <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 flex items-start gap-3">
                <Grid className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                <div className="text-xs text-purple-800 dark:text-purple-200 leading-relaxed">
                  <strong>জুতা ও পোশাকের সাইজ-কালার গ্রিড ম্যাট্রিক্স:</strong> প্রতিটি সাইজ ও কালার ভ্যারিয়েন্টের স্টক আলাদাভাবে
                  হিসাব না করে এক নজরে গ্রিড আকারে দেখে তাৎক্ষণিক ইনভেন্টরি আপডেট সম্পন্ন করুন।
                </div>
              </div>

              {/* Product Selector */}
              <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">পণ্যের নাম / ক্যাটাগরি:</span>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border text-xs font-bold"
                >
                  <option value="">-- সাধারণ ফুটওয়্যার ও পোশাক লট --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.category || 'পণ্য'})
                    </option>
                  ))}
                </select>
                <div className="ml-auto font-black text-purple-600 bg-purple-100 dark:bg-purple-950/80 px-3 py-1 rounded-lg border border-purple-300">
                  মোট স্টক: {totalMatrixPairs} পিস/জোড়া
                </div>
              </div>

              {/* Matrix Table */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-800/60 shadow-sm text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                    <tr>
                      <th className="p-3">সাইজ (Size)</th>
                      <th className="p-3">কালো (Black)</th>
                      <th className="p-3">বাদামি (Brown)</th>
                      <th className="p-3">সাদা / নেভি (White/Navy)</th>
                      <th className="p-3 text-right">মোট স্টক</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700 font-medium">
                    {Object.keys(sizeMatrix).map((sizeKey) => {
                      const row = sizeMatrix[sizeKey];
                      const rowTotal = Object.values(row).reduce((a, b) => a + Number(b || 0), 0);
                      return (
                        <tr key={sizeKey} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="p-3 font-bold text-purple-600">সাইজ {sizeKey}</td>
                          <td className="p-3">
                            <input
                              type="number"
                              min="0"
                              value={row.Black}
                              onChange={(e) =>
                                setSizeMatrix({
                                  ...sizeMatrix,
                                  [sizeKey]: { ...row, Black: parseInt(e.target.value, 10) || 0 }
                                })
                              }
                              className="w-16 px-2 py-1 rounded border dark:bg-slate-900 text-center font-bold"
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              min="0"
                              value={row.Brown}
                              onChange={(e) =>
                                setSizeMatrix({
                                  ...sizeMatrix,
                                  [sizeKey]: { ...row, Brown: parseInt(e.target.value, 10) || 0 }
                                })
                              }
                              className="w-16 px-2 py-1 rounded border dark:bg-slate-900 text-center font-bold"
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              min="0"
                              value={row.White}
                              onChange={(e) =>
                                setSizeMatrix({
                                  ...sizeMatrix,
                                  [sizeKey]: { ...row, White: parseInt(e.target.value, 10) || 0 }
                                })
                              }
                              className="w-16 px-2 py-1 rounded border dark:bg-slate-900 text-center font-bold"
                            />
                          </td>
                          <td className="p-3 text-right font-black text-slate-800 dark:text-white">
                            {rowTotal} জোড়া
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveMatrix}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition"
                >
                  ম্যাট্রিক্স স্টক সংরক্ষণ করুন
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between text-xs text-slate-500">
          <span>HisabKitab 360 Specialized Industry Vertical Engine</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 sm:py-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-300 dark:hover:bg-slate-700 transition"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpecializedVerticalsHubModal;
