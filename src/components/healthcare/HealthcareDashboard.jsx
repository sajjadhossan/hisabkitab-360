import React, { useState, useMemo } from 'react';
import { useHealthcare } from '../../context/HealthcareContext';
import {
  Users,
  Calendar,
  FileText,
  FlaskConical,
  Pill,
  Activity,
  AlertTriangle,
  Clock,
  ArrowRight,
  TrendingUp,
  Stethoscope,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
  Filter,
  Building2,
  CalendarDays,
  DollarSign,
  AlertCircle,
  BarChart3,
  CheckCircle,
  XCircle,
  Layers,
  ChevronRight,
  RefreshCw,
  ShoppingBag,
  BadgeAlert,
  HelpCircle
} from 'lucide-react';

export const HealthcareDashboard = () => {
  const {
    patients = [],
    doctors = [],
    appointments = [],
    prescriptions = [],
    labOrders = [],
    pharmacyMedicines = [],
    branches = [
      { id: 'all', name: 'সব শাখা (একীভূত রূপ)', code: 'ALL' },
      { id: 'dhanmondi', name: 'ধানমন্ডি মেইন ব্রাঞ্চ', code: 'DHD-01' },
      { id: 'uttara', name: 'উত্তরা শাখা', code: 'UTT-02' },
      { id: 'mirpur', name: 'মিরপুর শাখা', code: 'MIR-03' },
      { id: 'chattogram', name: 'চট্টগ্রাম শাখা', code: 'CTG-04' }
    ],
    activeBranchId = 'dhanmondi',
    setActiveBranchId,
    setActiveHealthcareTab,
    setActiveLinkedApp
  } = useHealthcare();

  // 1.3 DATE RANGE & BRANCH FILTERS STATE
  const [dateRange, setDateRange] = useState('today'); // 'today' | 'yesterday' | '7days' | 'this_month' | 'custom'
  const [customStartDate, setCustomStartDate] = useState('2026-10-01');
  const [customEndDate, setCustomEndDate] = useState('2026-10-10');
  const [selectedBranch, setSelectedBranch] = useState(activeBranchId || 'all');

  const getDateRangeLabel = () => {
    switch (dateRange) {
      case 'today': return 'আজ (১০ অক্টোবর)';
      case 'yesterday': return 'গতকাল (০৯ অক্টোবর)';
      case '7days': return 'গত ৭ দিন (০৪ - ১০ অক্টো)';
      case 'this_month': return 'চলতি মাস (অক্টোবর ২০২৬)';
      case 'custom': return `${customStartDate} হতে ${customEndDate}`;
      default: return 'আজ';
    }
  };

  const getBranchLabel = () => {
    const b = branches.find(item => item.id === selectedBranch);
    return b ? b.name : 'সব শাখা';
  };

  // Branch weight multiplier for demo data distribution
  const branchMultiplier = useMemo(() => {
    switch (selectedBranch) {
      case 'dhanmondi': return 0.45;
      case 'uttara': return 0.25;
      case 'mirpur': return 0.18;
      case 'chattogram': return 0.12;
      default: return 1.0; // 'all'
    }
  }, [selectedBranch]);

  // Date multiplier
  const dateMultiplier = useMemo(() => {
    switch (dateRange) {
      case 'today': return 1.0;
      case 'yesterday': return 0.85;
      case '7days': return 4.2;
      case 'this_month': return 8.5;
      case 'custom': return 3.0;
      default: return 1.0;
    }
  }, [dateRange]);

  // 1. SECTION: SUMMARY STATS (আজকের সারাংশ)
  const totalPatientsCount = Math.round(patients.length * branchMultiplier * (dateRange === 'today' ? 1 : 1.3));
  const waitingCount = Math.round(appointments.filter(a => a.appointment_status === 'Waiting').length * branchMultiplier);
  const totalConsultations = Math.round(appointments.length * branchMultiplier * dateMultiplier);
  const totalLabOrdersCount = Math.round(labOrders.length * branchMultiplier * dateMultiplier);
  const readyReportsCount = Math.round(labOrders.filter(o => o.order_status === 'Report Ready').length * branchMultiplier * dateMultiplier);
  const pendingReportsCount = Math.max(1, totalLabOrdersCount - readyReportsCount);

  const baseAppointmentRevenue = appointments.reduce((sum, a) => sum + (Number(a.paid_amount) || 0), 0);
  const baseLabRevenue = labOrders.reduce((sum, o) => sum + (Number(o.paid_amount) || 0), 0);
  const basePharmacySales = 18500;

  const appointmentRevenue = Math.round(baseAppointmentRevenue * branchMultiplier * dateMultiplier);
  const labRevenue = Math.round(baseLabRevenue * branchMultiplier * dateMultiplier);
  const pharmacyRevenue = Math.round(basePharmacySales * branchMultiplier * dateMultiplier);
  const totalCollection = appointmentRevenue + labRevenue + pharmacyRevenue;
  const totalDueAmount = Math.round(3450 * branchMultiplier * (dateRange === 'today' ? 1 : 2.5));
  const netEstimatedProfit = Math.round(totalCollection * 0.42);

  // 8 & 9. LOW STOCK & EXPIRY ALERTS
  const lowStockDrugs = pharmacyMedicines.filter(m => (m.stock_strips || m.stock_quantity || 15) < 30);
  const nearExpiryDrugs = pharmacyMedicines.filter(m => {
    return m.batches?.some(b => {
      const expDate = new Date(b.expiry_date);
      const diffMonths = (expDate - new Date()) / (1000 * 60 * 60 * 24 * 30);
      return diffMonths <= 6;
    }) || true;
  }).slice(0, 4);

  // 6 & 10. BRANCH REVENUE & COMPARISON MATRIX
  const branchComparisonData = [
    { id: 'dhanmondi', name: 'ধানমন্ডি মেইন ব্রাঞ্চ', patients: Math.round(48 * dateMultiplier), tests: Math.round(36 * dateMultiplier), pharmacy: Math.round(9200 * dateMultiplier), total: Math.round(28500 * dateMultiplier), rating: '৯৮% (সর্বোচ্চ)' },
    { id: 'uttara', name: 'উত্তরা শাখা', patients: Math.round(26 * dateMultiplier), tests: Math.round(18 * dateMultiplier), pharmacy: Math.round(4800 * dateMultiplier), total: Math.round(15200 * dateMultiplier), rating: '৯৪%' },
    { id: 'mirpur', name: 'মিরপুর শাখা', patients: Math.round(19 * dateMultiplier), tests: Math.round(14 * dateMultiplier), pharmacy: Math.round(3100 * dateMultiplier), total: Math.round(9800 * dateMultiplier), rating: '৯১%' },
    { id: 'chattogram', name: 'চট্টগ্রাম শাখা', patients: Math.round(14 * dateMultiplier), tests: Math.round(9 * dateMultiplier), pharmacy: Math.round(2400 * dateMultiplier), total: Math.round(7100 * dateMultiplier), rating: '৮৯%' }
  ];

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* =========================================================
          TOP COMMAND: DATE-RANGE & BRANCH FILTER DOCK (১.৩)
         ========================================================= */}
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-slate-700 shadow-xl text-white space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-teal-500/20 text-teal-400 font-bold text-xs border border-teal-500/30">
                <Filter size={13} />
              </span>
              <h2 className="text-base font-black text-white">
                ১.৩ ড্যাশবোর্ড ফিল্টার কনট্রোল (Date & Branch Filters)
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              প্রতিটি তথ্যের সঙ্গে তারিখসীমা ও শাখা-ফিল্টার সংযুক্ত। ফিল্টার পরিবর্তন করলে পুরো ড্যাশবোর্ড রিয়েলটাইমে রি-ক্যালকুলেট হবে।
            </p>
          </div>

          {/* Active Context Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-teal-300 font-bold text-xs flex items-center gap-1.5">
              <CalendarDays size={12} />
              <span>তারিখ: {getDateRangeLabel()}</span>
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-indigo-300 font-bold text-xs flex items-center gap-1.5">
              <Building2 size={12} />
              <span>শাখা: {getBranchLabel()}</span>
            </span>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* 1. Date Range Dropdown */}
          <div>
            <label className="font-bold text-slate-300 block mb-1">তারিখসীমা নির্বাচন:</label>
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-600 font-bold text-white focus:outline-teal-400"
            >
              <option value="today">📅 আজ (Today)</option>
              <option value="yesterday">📅 গতকাল (Yesterday)</option>
              <option value="7days">📅 গত ৭ দিন (Last 7 Days)</option>
              <option value="this_month">📅 চলতি মাস (This Month)</option>
              <option value="custom">📅 কাস্টম তারিখসীমা (Custom)</option>
            </select>
          </div>

          {/* 2. Branch Filter Dropdown */}
          <div>
            <label className="font-bold text-slate-300 block mb-1">শাখা ফিল্টার নির্বাচন:</label>
            <select
              value={selectedBranch}
              onChange={e => {
                setSelectedBranch(e.target.value);
                if (setActiveBranchId) setActiveBranchId(e.target.value);
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-600 font-bold text-white focus:outline-teal-400"
            >
              {branches.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>

          {/* 3. Custom Date Range Pickers (if custom selected) */}
          {dateRange === 'custom' ? (
            <div className="sm:col-span-2 grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-slate-300 block mb-1">হতে (From):</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={e => setCustomStartDate(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-xl bg-slate-800 border border-slate-600 text-white font-bold"
                />
              </div>
              <div>
                <label className="font-bold text-slate-300 block mb-1">পর্যন্ত (To):</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={e => setCustomEndDate(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-xl bg-slate-800 border border-slate-600 text-white font-bold"
                />
              </div>
            </div>
          ) : (
            <div className="sm:col-span-2 flex items-end gap-2">
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 text-[11px] w-full flex items-center justify-between">
                <span>ফিল্টার স্ট্যাটাস: <strong>সক্রিয় ও আপ-টু-ডেট</strong></span>
                <span className="text-teal-400 font-mono font-bold">● LIVE</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================
          ১. আজকের সারাংশ (EXECUTIVE SUMMARY METRICS)
         ========================================================= */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-500"></span>
            <span>১. সারাংশ ও প্রধান আর্থিক সূচক (Executive Summary)</span>
          </h3>
          <span className="text-[11px] font-bold text-slate-500">
            ফিল্টার: {getDateRangeLabel()} • {getBranchLabel()}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Patients */}
          <div className="p-5 rounded-3xl bg-white border border-teal-100 shadow-sm flex flex-col justify-between space-y-3">
            <div className="flex justify-between items-start">
              <span className="p-2.5 bg-teal-50 text-teal-600 rounded-2xl">
                <Users size={22} />
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-teal-100 text-teal-800 rounded-full">
                {getBranchLabel()}
              </span>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">{totalPatientsCount} জন</div>
              <div className="text-xs font-semibold text-slate-500 mt-0.5">মোট রোগী উপস্থিতি</div>
            </div>
            <div className="pt-2 border-t border-slate-100 text-[11px] text-teal-700 font-bold flex justify-between">
              <span>{getDateRangeLabel()}</span>
              <span>+১২% বৃদ্ধি</span>
            </div>
          </div>

          {/* Card 2: Collection */}
          <div className="p-5 rounded-3xl bg-white border border-emerald-100 shadow-sm flex flex-col justify-between space-y-3">
            <div className="flex justify-between items-start">
              <span className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl">
                <DollarSign size={22} />
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                আদায়কৃত
              </span>
            </div>
            <div>
              <div className="text-2xl font-black text-emerald-700">৳{totalCollection.toLocaleString('bn-BD')}</div>
              <div className="text-xs font-semibold text-slate-500 mt-0.5">মোট রাজস্ব আদায় (Revenue)</div>
            </div>
            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
              <span>ডক্টর + ল্যাব + ড্রাগ</span>
              <span className="text-emerald-700 font-bold">{getBranchLabel()}</span>
            </div>
          </div>

          {/* Card 3: Due Amount */}
          <div className="p-5 rounded-3xl bg-white border border-rose-100 shadow-sm flex flex-col justify-between space-y-3">
            <div className="flex justify-between items-start">
              <span className="p-2.5 bg-rose-50 text-rose-600 rounded-2xl">
                <AlertCircle size={22} />
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full">
                বকেয়া বাকি
              </span>
            </div>
            <div>
              <div className="text-2xl font-black text-rose-600">৳{totalDueAmount.toLocaleString('bn-BD')}</div>
              <div className="text-xs font-semibold text-slate-500 mt-0.5">মোট অপরিশোধিত বকেয়া</div>
            </div>
            <div className="pt-2 border-t border-slate-100 text-[11px] text-rose-600 font-bold flex justify-between">
              <span>তাগাদা বাকি: ৮ জন</span>
              <span>{getDateRangeLabel()}</span>
            </div>
          </div>

          {/* Card 4: Net Estimated Profit */}
          <div className="p-5 rounded-3xl bg-white border border-indigo-100 shadow-sm flex flex-col justify-between space-y-3">
            <div className="flex justify-between items-start">
              <span className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                <TrendingUp size={22} />
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full">
                নিট প্রফিট
              </span>
            </div>
            <div>
              <div className="text-2xl font-black text-indigo-900">৳{netEstimatedProfit.toLocaleString('bn-BD')}</div>
              <div className="text-xs font-semibold text-slate-500 mt-0.5">দৈনিক আনুমানিক লাভ</div>
            </div>
            <div className="pt-2 border-t border-slate-100 text-[11px] text-indigo-700 font-bold flex justify-between">
              <span>মার্জিন: ৪২%</span>
              <span>{getBranchLabel()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          ২, ৩, ৪ & ৫: রোগী, অ্যাপয়েন্টমেন্ট, ল্যাব ও ফার্মেসি মেট্রিক্স
         ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ২. রোগী ও অ্যাপয়েন্টমেন্ট (Patients & Appointments) */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Stethoscope size={16} className="text-blue-600" />
                <span>২. রোগী ও অ্যাপয়েন্টমেন্ট</span>
              </h4>
              <p className="text-[11px] text-slate-500">
                শাখা: {getBranchLabel()} • সময়: {getDateRangeLabel()}
              </p>
            </div>
            <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800">
              মোট: {totalConsultations} টি
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="text-lg font-black text-slate-900">{waitingCount} জন</div>
              <div className="text-[10px] text-slate-500 font-bold mt-0.5">অপেক্ষমাণ (Waiting)</div>
            </div>
            <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-100">
              <div className="text-lg font-black text-blue-700">{Math.max(1, Math.round(totalConsultations * 0.2))} জন</div>
              <div className="text-[10px] text-blue-800 font-bold mt-0.5">ডাক্তার দেখছেন</div>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100">
              <div className="text-lg font-black text-emerald-700">{Math.round(totalConsultations * 0.7)} জন</div>
              <div className="text-[10px] text-emerald-800 font-bold mt-0.5">সম্পন্ন (Visited)</div>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-slate-500 flex justify-between items-center">
            <span>ডাক্তার ফি রাজস্ব: <strong>৳{appointmentRevenue}</strong></span>
            <button
              onClick={() => setActiveLinkedApp('hospital')}
              className="text-blue-600 font-bold hover:underline flex items-center gap-1"
            >
              <span>চেম্বারে যান</span>
              <ArrowRight size={11} />
            </button>
          </div>
        </div>

        {/* ৩ ও ৪. ডায়াগনস্টিক অর্ডার ও রিপোর্টের অবস্থা */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <FlaskConical size={16} className="text-teal-600" />
                <span>৩ ও ৪. ডায়াগনস্টিক অর্ডার ও রিপোর্টের অবস্থা</span>
              </h4>
              <p className="text-[11px] text-slate-500">
                শাখা: {getBranchLabel()} • সময়: {getDateRangeLabel()}
              </p>
            </div>
            <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800">
              অর্ডার: {totalLabOrdersCount} টি
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-100">
              <div className="text-lg font-black text-amber-700">{pendingReportsCount} টি</div>
              <div className="text-[10px] text-amber-800 font-bold mt-0.5">পরীক্ষা চলছে / বাকি</div>
            </div>
            <div className="p-3 rounded-2xl bg-teal-50/60 border border-teal-100">
              <div className="text-lg font-black text-teal-700">{readyReportsCount} টি</div>
              <div className="text-[10px] text-teal-800 font-bold mt-0.5">রিপোর্ট প্রস্তুত</div>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100">
              <div className="text-lg font-black text-emerald-700">{Math.round(readyReportsCount * 0.8)} টি</div>
              <div className="text-[10px] text-emerald-800 font-bold mt-0.5">রোগীকে বিতরণ</div>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-slate-500 flex justify-between items-center">
            <span>ল্যাব টেস্ট রাজস্ব: <strong>৳{labRevenue}</strong></span>
            <button
              onClick={() => setActiveLinkedApp('diagnostic')}
              className="text-teal-600 font-bold hover:underline flex items-center gap-1"
            >
              <span>ল্যাব কাউন্টারে যান</span>
              <ArrowRight size={11} />
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================
          ৫ ও ৬: ফার্মেসি বিক্রি ও শাখাভিত্তিক আয় বিভাজন
         ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ৫. ফার্মেসি বিক্রি (Pharmacy Sales) */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Pill size={16} className="text-emerald-600" />
                <span>৫. ফার্মেসি বিক্রি ও ডিসপেন্সিং</span>
              </h4>
              <p className="text-[11px] text-slate-500">
                শাখা: {getBranchLabel()} • সময়: {getDateRangeLabel()}
              </p>
            </div>
            <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800">
              ৳{pharmacyRevenue.toLocaleString('bn-BD')}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="text-slate-500 text-[10px] font-bold">প্রেসক্রিপশন ভিত্তিক ড্রাগ সেল</div>
              <div className="text-base font-black text-slate-900 mt-1">৳{Math.round(pharmacyRevenue * 0.65).toLocaleString('bn-BD')}</div>
              <div className="text-[10px] text-emerald-700 font-bold mt-0.5">৬৫% অবদান</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="text-slate-500 text-[10px] font-bold">কাউন্টার ওভার-দ্য-কাউন্টার (OTC)</div>
              <div className="text-base font-black text-slate-900 mt-1">৳{Math.round(pharmacyRevenue * 0.35).toLocaleString('bn-BD')}</div>
              <div className="text-[10px] text-slate-500 font-bold mt-0.5">৩৫% অবদান</div>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-slate-500 flex justify-between items-center">
            <span>খুচরা ট্যাবলেট বিক্রি: <strong>২৪০+ পিস</strong></span>
            <button
              onClick={() => setActiveLinkedApp('pharmacy')}
              className="text-emerald-600 font-bold hover:underline flex items-center gap-1"
            >
              <span>ফার্মেসি POS এ যান</span>
              <ArrowRight size={11} />
            </button>
          </div>
        </div>

        {/* ৬. শাখাভিত্তিক আয় (Branch-Wise Revenue Breakdown) */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <BarChart3 size={16} className="text-indigo-600" />
                <span>৬. শাখাভিত্তিক আয় ও অবদান</span>
              </h4>
              <p className="text-[11px] text-slate-500">
                সময়সীমা: {getDateRangeLabel()}
              </p>
            </div>
            <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800">
              ৪টি শাখা সক্রিয়
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            {branchComparisonData.map(b => {
              const totalAllBranches = branchComparisonData.reduce((sum, item) => sum + item.total, 0);
              const percentage = Math.round((b.total / totalAllBranches) * 100);
              return (
                <div key={b.id} className="space-y-1">
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-800">{b.name}</span>
                    <span className="text-slate-900">৳{b.total.toLocaleString('bn-BD')} ({percentage}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 to-indigo-600 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* =========================================================
          ৭, ৮ & ৯: বকেয়া, কম স্টক ও মেয়াদ শেষের সতর্কতা
         ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ৭. বকেয়া (Receivables & Dues) */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <AlertCircle size={16} className="text-rose-600" />
                <span>৭. বকেয়া তালিকা</span>
              </h4>
              <p className="text-[10px] text-slate-500">শাখা: {getBranchLabel()}</p>
            </div>
            <span className="text-xs font-black text-rose-600">
              ৳{totalDueAmount}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-xl bg-rose-50/50 border border-rose-100 flex justify-between items-center">
              <div>
                <div className="font-bold text-slate-900">মোসা: সুমি আক্তার</div>
                <div className="text-[10px] text-slate-500">ল্যাব টেস্ট • DHD-01</div>
              </div>
              <span className="font-black text-rose-700">৳১,৩০০</span>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-50/50 border border-rose-100 flex justify-between items-center">
              <div>
                <div className="font-bold text-slate-900">তারেক মাহমুদ</div>
                <div className="text-[10px] text-slate-500">ফার্মেসি বাকি • DHD-01</div>
              </div>
              <span className="font-black text-rose-700">৳১,১৫০</span>
            </div>
          </div>
        </div>

        {/* ৮. কম স্টক (Low Stock Alerts) */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-600" />
                <span>৮. কম স্টকের ওষুধ</span>
              </h4>
              <p className="text-[10px] text-slate-500">রি-অর্ডার সতর্কতা</p>
            </div>
            <span className="text-xs font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
              {lowStockDrugs.length} টি
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {lowStockDrugs.slice(0, 3).map((m, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-amber-50/50 border border-amber-100 flex justify-between items-center">
                <div>
                  <div className="font-bold text-slate-900">{m.brand_name || m.name}</div>
                  <div className="text-[10px] text-slate-500">{m.generic_name}</div>
                </div>
                <span className="text-[11px] font-black text-amber-700">স্টক: {m.stock_strips || 12} পাতা</span>
              </div>
            ))}
          </div>
        </div>

        {/* ৯. মেয়াদোত্তীর্ণ / মেয়াদ-সতর্কতা (Expiry Warning) */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Clock size={16} className="text-purple-600" />
                <span>৯. মেয়াদ-সতর্কতা (FEFO)</span>
              </h4>
              <p className="text-[10px] text-slate-500">মেয়াদ শেষের কাছাকাছি</p>
            </div>
            <span className="text-xs font-black px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
              {nearExpiryDrugs.length} টি ব্যাচ
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {nearExpiryDrugs.map((m, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-purple-50/50 border border-purple-100 flex justify-between items-center">
                <div>
                  <div className="font-bold text-slate-900">{m.brand_name || m.name}</div>
                  <div className="text-[10px] text-purple-700 font-bold">ব্যাচ: {m.batches?.[0]?.batch_number || 'B-982'}</div>
                </div>
                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                  {m.batches?.[0]?.expiry_date || '২০২৬-১১-৩০'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* =========================================================
          ১০. শাখা তুলনা (BRANCH COMPARISON MATRIX)
         ========================================================= */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Building2 size={18} className="text-teal-600" />
              <span>১০. শাখা তুলনা মেট্রিক্স (Branch Performance Comparison Matrix)</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              ফিল্টার সময়সীমা: <strong>{getDateRangeLabel()}</strong> • সকল শাখার কার্যক্ষমতার তুলনামূলক পরিসংখ্যান
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-700 rounded-xl">
            একীভূত তুলনা মোড
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[11px]">
              <tr>
                <th className="p-3">শাখার নাম</th>
                <th className="p-3 text-center">রোগী সংখ্যা</th>
                <th className="p-3 text-center">ল্যাব টেস্ট</th>
                <th className="p-3 text-center">ফার্মেসি বিক্রি</th>
                <th className="p-3 text-right">মোট সংগৃহীত রাজস্ব</th>
                <th className="p-3 text-center">পারফরম্যান্স রেটিং</th>
                <th className="p-3 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {branchComparisonData.map(b => (
                <tr key={b.id} className="hover:bg-slate-50/70">
                  <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                    <span>{b.name}</span>
                    {b.id === 'dhanmondi' && (
                      <span className="text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.2 rounded font-extrabold">প্রধান</span>
                    )}
                  </td>
                  <td className="p-3 text-center font-bold">{b.patients} জন</td>
                  <td className="p-3 text-center font-bold text-teal-700">{b.tests} টি</td>
                  <td className="p-3 text-center font-bold text-emerald-700">৳{b.pharmacy.toLocaleString('bn-BD')}</td>
                  <td className="p-3 text-right font-black text-slate-900">৳{b.total.toLocaleString('bn-BD')}</td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                      {b.rating}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => {
                        setSelectedBranch(b.id);
                        if (setActiveBranchId) setActiveBranchId(b.id);
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
                    >
                      ফিল্টার করুন ➔
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HealthcareDashboard;
