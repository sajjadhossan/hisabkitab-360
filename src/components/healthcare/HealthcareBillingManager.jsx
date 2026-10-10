import React, { useState } from 'react';
import { useHealthcare } from '../../context/HealthcareContext';
import {
  CreditCard,
  DollarSign,
  Receipt,
  Search,
  Plus,
  Trash2,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Wallet,
  Building,
  Sparkles,
  TrendingUp,
  UserCheck,
  BarChart3,
  RotateCcw,
  FileText,
  XCircle,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  PieChart,
  Users,
  Stethoscope,
  FlaskConical,
  Pill,
  Boxes,
  Percent,
  Truck
} from 'lucide-react';

export const HealthcareBillingManager = () => {
  const {
    patients = [],
    doctors = [],
    diagnosticTests = [],
    branches = [],
    activeBranchId = 'dhanmondi',
    appointments = [],
    labOrders = [],
    pharmacyMedicines = []
  } = useHealthcare();

  const currentBranch = branches.find(b => b.id === activeBranchId) || { name: 'ধানমন্ডি মেইন ব্রাঞ্চ', code: 'DHD-01' };

  // Master Section: 'bills' | 'accounts' | 'reports'
  const [masterTab, setMasterTab] = useState('bills');

  // Subtabs within 1.9 Bills & Payments
  const [billSubTab, setBillSubTab] = useState('new_bill'); // 'new_bill' | 'recent_invoices' | 'due_collection' | 'refunds'

  // Subtabs within 1.9 Income & Expenses
  const [accountSubTab, setAccountSubTab] = useState('cash_closing'); // 'income' | 'expenses' | 'supplier_payables' | 'cash_closing' | 'branch_accounts'

  // Subtabs within 1.9 Reports
  const [reportSubTab, setReportSubTab] = useState('rep_patient'); // 9 reports

  // State for New Bill POS
  const [selectedPatient, setSelectedPatient] = useState(patients[0] || null);
  const [billItems, setBillItems] = useState([
    { id: 1, type: 'ডাক্তার ভিজিট', name: 'কনসালটেন্সি ফি (ডা: রফিকুল ইসলাম)', qty: 1, rate: 800, total: 800 },
    { id: 2, type: 'ল্যাব টেস্ট', name: 'কমপ্লিট ব্লাড কাউন্ট (CBC with ESR)', qty: 1, rate: 450, total: 450 }
  ]);
  const [discountAmount, setDiscountAmount] = useState(50);
  const [paidAmount, setPaidAmount] = useState(1200);
  const [paymentMethod, setPaymentMethod] = useState('নগদ (Cash)');
  const [cashierName, setCashierName] = useState('প্রধান ক্যাশিয়ার');

  // Receipt Modal State
  const [viewingReceipt, setViewingReceipt] = useState(null);

  // Invoices List
  const [invoices, setInvoices] = useState([
    {
      invoiceNo: 'INV-2026-1001',
      date: '2026-10-10 11:30 AM',
      patientName: 'মো: রফিকুল ইসলাম',
      uhid: 'UHID-2026-001',
      subtotal: 1250,
      discount: 50,
      total: 1200,
      paid: 1200,
      due: 0,
      method: 'নগদ (Cash)',
      cashier: 'প্রধান ক্যাশিয়ার',
      status: 'পরিশোধিত'
    },
    {
      invoiceNo: 'INV-2026-1002',
      date: '2026-10-10 12:15 PM',
      patientName: 'মোসা: সুমি আক্তার',
      uhid: 'UHID-2026-003',
      subtotal: 3500,
      discount: 200,
      total: 3300,
      paid: 2000,
      due: 1300,
      method: 'বিকাশ (bKash)',
      cashier: 'প্রধান ক্যাশিয়ার',
      status: 'আংশিক বকেয়া'
    },
    {
      invoiceNo: 'INV-2026-1003',
      date: '2026-10-10 02:40 PM',
      patientName: 'আলহাজ্ব মো: আব্দুল করিম',
      uhid: 'UHID-2026-002',
      subtotal: 8200,
      discount: 500,
      total: 7700,
      paid: 7700,
      due: 0,
      method: 'কার্ড (Card)',
      cashier: 'শিফট-২ ক্যাশিয়ার',
      status: 'পরিশোধিত'
    }
  ]);

  // Refunds and Cancelled Bills
  const [refundsList, setRefundsList] = useState([
    {
      refundId: 'REF-2026-501',
      invoiceNo: 'INV-2026-0985',
      date: '2026-10-10 10:45 AM',
      patientName: 'জাহাঙ্গীর আলম',
      uhid: 'UHID-2026-015',
      serviceType: 'ডায়াগনস্টিক টেস্ট বাতিল',
      amount: 1450,
      reason: 'রোগী অন্য হাসপাতালে ট্রান্সফার হয়েছেন',
      status: 'রিফান্ড সম্পন্ন'
    },
    {
      refundId: 'REF-2026-502',
      invoiceNo: 'INV-2026-0992',
      date: '2026-10-10 01:20 PM',
      patientName: 'ফারজানা ইয়াসমিন',
      uhid: 'UHID-2026-022',
      serviceType: 'ডাক্তার অ্যাপয়েন্টমেন্ট বাতিল',
      amount: 800,
      reason: 'ডাক্তার জরুরি সার্জারিতে ব্যস্ত',
      status: 'বাতিল ও রিফান্ডেড'
    }
  ]);

  // Income Streams State
  const [incomeStreams] = useState([
    { category: 'ডাক্তার কনসালটেশন ফি', amount: 38500, transactions: 45, share: '32%' },
    { category: 'ডায়াগনস্টিক ল্যাব টেস্ট', amount: 48200, transactions: 62, share: '40%' },
    { category: 'ফার্মেসি ঔষধ বিক্রি', amount: 26800, transactions: 78, share: '22%' },
    { category: 'আইপিডি বেড ও কেবিন চার্জ', amount: 7200, transactions: 3, share: '6%' }
  ]);

  // Expenses State
  const [expensesList, setExpensesList] = useState([
    { id: 1, date: '2026-10-10', title: 'ল্যাব রিএজেন্ট ও কেমিক্যাল ক্রয়', category: 'মেডিকেল সাপ্লাই', amount: 12500, paidTo: 'বায়োটেক সাপ্লাইয়ার্স', method: 'ব্যাংক চেক' },
    { id: 2, date: '2026-10-10', title: 'জেনারেটর ডিজেল ও বিদ্যুৎ জ্বালানি', category: 'ইউটিলিটি ও অপারেশন', amount: 3200, paidTo: 'পদ্মা ফিলিং স্টেশন', method: 'নগদ ক্যাশ' },
    { id: 3, date: '2026-10-09', title: 'অক্সিজেন সিলিন্ডার রিফিল চার্জ', category: 'ক্লিনিক্যাল সেবা', amount: 4800, paidTo: 'লিন্ডে বাংলাদেশ', method: 'বিকাশ' },
    { id: 4, date: '2026-10-08', title: 'স্টাফ ও নার্সিং ওভারটাইম ভাতা', category: 'বেতন ও ভাতা', amount: 6500, paidTo: 'শিফট ইনচার্জ', method: 'নগদ ক্যাশ' }
  ]);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [newExpenseForm, setNewExpenseForm] = useState({
    title: '',
    category: 'মেডিকেল সাপ্লাই',
    amount: '',
    paidTo: '',
    method: 'নগদ ক্যাশ'
  });

  // Supplier Payables
  const [supplierPayables] = useState([
    { id: 1, supplier: 'Square Pharmaceuticals Ltd.', phone: '০১৭৭০০০০০০১', totalPurchased: 125000, totalPaid: 80000, balance: 45000, dueDate: '2026-10-25' },
    { id: 2, supplier: 'Beximco Pharma Ltd.', phone: '০১৭৭০০০০০০২', totalPurchased: 98000, totalPaid: 66000, balance: 32000, dueDate: '2026-10-30' },
    { id: 3, supplier: 'Popular Diagnostic Reagent Ltd.', phone: '০১৭৭০০০০০০৩', totalPurchased: 45000, totalPaid: 26500, balance: 18500, dueDate: '2026-10-20' }
  ]);

  // Due Collection Modal
  const [dueCollectionTarget, setDueCollectionTarget] = useState(null);
  const [collectAmount, setCollectAmount] = useState('');

  // Calculations for current bill POS
  const subtotal = billItems.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  const grandTotal = Math.max(0, subtotal - (Number(discountAmount) || 0));
  const dueAmount = Math.max(0, grandTotal - (Number(paidAmount) || 0));

  const handleAddItem = (type, name, rate) => {
    setBillItems([...billItems, { id: Date.now(), type, name, qty: 1, rate, total: rate }]);
  };

  const handleRemoveItem = (id) => {
    setBillItems(billItems.filter(item => item.id !== id));
  };

  const handleCreateInvoice = (e) => {
    e.preventDefault();
    if (!selectedPatient) {
      alert('অনুগ্রহ করে একজন রোগী নির্বাচন করুন!');
      return;
    }

    const newInvoice = {
      invoiceNo: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toLocaleString('bn-BD'),
      patientName: selectedPatient.full_name,
      uhid: selectedPatient.patient_id || 'UHID-NEW',
      subtotal,
      discount: Number(discountAmount) || 0,
      total: grandTotal,
      paid: Number(paidAmount) || 0,
      due: dueAmount,
      method: paymentMethod,
      cashier: cashierName,
      status: dueAmount === 0 ? 'পরিশোধিত' : 'আংশিক বকেয়া'
    };

    setInvoices([newInvoice, ...invoices]);
    setViewingReceipt(newInvoice);
    setBillItems([]);
    setDiscountAmount(0);
    setPaidAmount(0);
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 mb-2">
              <Sparkles size={13} />
              <span>১.৯ বিল, হিসাব ও রিপোর্ট এন্টারপ্রাইজ হাব</span>
            </span>
            <h2 className="text-2xl font-black tracking-tight">বিলিং, আয়-ব্যয় ও ৯টি সমন্বিত রিপোর্ট</h2>
            <p className="text-sm text-emerald-100/80 mt-1">
              সেন্ট্রাল ক্যাশ কালেকশন, বকেয়া খতিয়ান, ভাউচার অডিট এবং হাসপাতাল ও ফার্মেসির এক্সিকিউটিভ রিপোর্ট।
            </p>
          </div>

          {/* Master 3 Section Tabs */}
          <div className="flex bg-slate-900/80 p-1.5 rounded-2xl border border-slate-700/80 gap-1 text-xs font-bold">
            <button
              onClick={() => setMasterTab('bills')}
              className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
                masterTab === 'bills' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-300 hover:text-white'
              }`}
            >
              <CreditCard size={15} />
              <span>১.৯ বিল ও পেমেন্ট</span>
            </button>
            <button
              onClick={() => setMasterTab('accounts')}
              className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
                masterTab === 'accounts' ? 'bg-teal-500 text-white shadow-md' : 'text-slate-300 hover:text-white'
              }`}
            >
              <DollarSign size={15} />
              <span>১.৯ আয়-ব্যয়</span>
            </button>
            <button
              onClick={() => setMasterTab('reports')}
              className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
                masterTab === 'reports' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-300 hover:text-white'
              }`}
            >
              <BarChart3 size={15} />
              <span>১.৯ রিপোর্ট হাব (৯টি রিপোর্ট)</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          SECTION 1: বিল ও পেমেন্ট (BILLS & PAYMENTS)
      ======================================================== */}
      {masterTab === 'bills' && (
        <div className="space-y-4">
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 overflow-x-auto text-xs font-bold w-fit">
            <button
              onClick={() => setBillSubTab('new_bill')}
              className={`px-4 py-2 rounded-xl transition-all ${billSubTab === 'new_bill' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'}`}
            >
              নতুন বিল (New POS)
            </button>
            <button
              onClick={() => setBillSubTab('recent_invoices')}
              className={`px-4 py-2 rounded-xl transition-all ${billSubTab === 'recent_invoices' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'}`}
            >
              ইনভয়েস তালিকা ও রসিদ ({invoices.length})
            </button>
            <button
              onClick={() => setBillSubTab('due_collection')}
              className={`px-4 py-2 rounded-xl transition-all ${billSubTab === 'due_collection' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'}`}
            >
              বকেয়া ও আংশিক পেমেন্ট ({invoices.filter(i => i.due > 0).length})
            </button>
            <button
              onClick={() => setBillSubTab('refunds')}
              className={`px-4 py-2 rounded-xl transition-all ${billSubTab === 'refunds' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'}`}
            >
              রিফান্ড ও বাতিল বিল ({refundsList.length})
            </button>
          </div>

          {/* SUBTAB 1.1: NEW BILL POS */}
          {billSubTab === 'new_bill' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Patient & Items (7 Cols) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                  <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-200 text-xs font-bold text-teal-900 flex items-center justify-between">
                    <span>📍 বিল তৈরির সক্রিয় শাখা: <strong>{currentBranch.name}</strong></span>
                    <span className="text-[10px] bg-teal-200 text-teal-900 px-2 py-0.5 rounded font-black">{currentBranch.code}</span>
                  </div>

                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <UserCheck size={18} className="text-teal-600" />
                    <span>রোগী নির্বাচন (Patient Selection)</span>
                  </h3>

                  <select
                    value={selectedPatient?.patient_id || ''}
                    onChange={e => {
                      const p = patients.find(item => item.patient_id === e.target.value);
                      if (p) setSelectedPatient(p);
                    }}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 font-medium"
                  >
                    {patients.map(p => (
                      <option key={p.patient_id} value={p.patient_id}>
                        {p.full_name} ({p.patient_id}) • {p.mobile_number || p.phone}
                      </option>
                    ))}
                  </select>

                  {selectedPatient && (
                    <div className="p-3 rounded-xl bg-teal-50/60 border border-teal-200 text-xs flex justify-between items-center">
                      <div>
                        <span className="font-bold text-teal-950">{selectedPatient.full_name}</span> ({selectedPatient.age} বছর)
                        <div className="text-[11px] text-teal-800">মোবাইল: {selectedPatient.mobile_number || selectedPatient.phone}</div>
                      </div>
                      <span className="px-2.5 py-1 bg-teal-200 text-teal-900 font-black rounded-lg text-[10px]">{selectedPatient.patient_id}</span>
                    </div>
                  )}
                </div>

                {/* Quick Service Adders */}
                <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                  <h3 className="text-sm font-black text-slate-900">কুইক সার্ভিস ও চার্জ যোগ করুন</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button type="button" onClick={() => handleAddItem('ডাক্তার ফি', 'কনসালটেন্সি ফি (সাধারণ)', 600)} className="p-2.5 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50 text-left transition-all text-xs">
                      <div className="font-bold text-slate-900">🩺 ডক্টর ফি</div>
                      <div className="text-[11px] text-teal-700 font-extrabold">৳৬০০</div>
                    </button>
                    <button type="button" onClick={() => handleAddItem('ল্যাব টেস্ট', 'ব্লাড সুগার (RBS)', 150)} className="p-2.5 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50 text-left transition-all text-xs">
                      <div className="font-bold text-slate-900">🧪 ব্লাড সুগার</div>
                      <div className="text-[11px] text-teal-700 font-extrabold">৳১৫০</div>
                    </button>
                    <button type="button" onClick={() => handleAddItem('ফার্মেসি', 'Napa Extra Strip (10 pcs)', 25)} className="p-2.5 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50 text-left transition-all text-xs">
                      <div className="font-bold text-slate-900">💊 নাপা এক্সট্রা</div>
                      <div className="text-[11px] text-teal-700 font-extrabold">৳২৫</div>
                    </button>
                    <button type="button" onClick={() => handleAddItem('আইপিডি', 'জেনারেল বেড ভাড়া (১ দিন)', 1000)} className="p-2.5 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50 text-left transition-all text-xs">
                      <div className="font-bold text-slate-900">🛏️ বেড চার্জ</div>
                      <div className="text-[11px] text-teal-700 font-extrabold">৳১,০০০</div>
                    </button>
                  </div>
                </div>

                {/* Items in Current Cart */}
                <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                  <h3 className="text-sm font-black text-slate-900">বিল আইটেম তালিকা ({billItems.length})</h3>
                  <div className="divide-y divide-slate-100">
                    {billItems.map(item => (
                      <div key={item.id} className="py-2.5 flex justify-between items-center text-xs">
                        <div>
                          <div className="font-bold text-slate-900">{item.name}</div>
                          <span className="text-[10px] text-teal-700 font-semibold">{item.type}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-slate-900">৳{item.total}</span>
                          <button onClick={() => handleRemoveItem(item.id)} className="text-rose-500 hover:text-rose-700 p-1">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Checkout & Receipt (5 Cols) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-base font-black text-slate-900">পেমেন্ট গ্রহণ ও রসিদ</h3>
                  <div className="space-y-2 text-xs border-b border-slate-100 pb-3">
                    <div className="flex justify-between text-slate-600"><span>সাবটোটাল:</span><strong className="text-slate-900">৳{subtotal}</strong></div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>ছাড় (Discount):</span>
                      <input type="number" value={discountAmount} onChange={e => setDiscountAmount(e.target.value)} className="w-24 px-2 py-1 border rounded text-right font-bold text-xs" />
                    </div>
                    <div className="flex justify-between text-base font-black text-slate-900 pt-1">
                      <span>মোট প্রদেয়:</span><span className="text-emerald-700 font-black">৳{grandTotal}</span>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="font-bold block mb-1">পেমেন্ট মাধ্যম</label>
                      <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full px-3 py-2 border rounded-xl font-bold">
                        <option value="নগদ (Cash)">নগদ (Cash)</option>
                        <option value="বিকাশ (bKash)">বিকাশ (bKash)</option>
                        <option value="নগদ (Nagad)">নগদ (Nagad)</option>
                        <option value="কার্ড (POS Card)">কার্ড (POS Card)</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-bold block mb-1">পরিশোধিত টাকা (Paid Amount)</label>
                      <input type="number" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} className="w-full px-3 py-2 border rounded-xl font-black text-emerald-700 text-sm" />
                    </div>
                    {dueAmount > 0 && (
                      <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 flex justify-between items-center text-xs text-rose-800 font-bold">
                        <span>অবশিষ্ট বকেয়া (Due):</span><span>৳{dueAmount}</span>
                      </div>
                    )}
                  </div>

                  <button onClick={handleCreateInvoice} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2">
                    <Printer size={16} />
                    <span>ইনভয়েস তৈরি ও রসিদ প্রিন্ট</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB 1.2: RECENT INVOICES */}
          {billSubTab === 'recent_invoices' && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-black text-slate-900">সর্বশেষ ইনভয়েস ও রসিদ তালিকা</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[11px]">
                    <tr>
                      <th className="p-3">ইনভয়েস নং</th>
                      <th className="p-3">তারিখ ও সময়</th>
                      <th className="p-3">রোগীর নাম</th>
                      <th className="p-3">মোট টাকা</th>
                      <th className="p-3">পরিশোধ</th>
                      <th className="p-3">বকেয়া</th>
                      <th className="p-3">পদ্ধতি</th>
                      <th className="p-3">স্ট্যাটাস</th>
                      <th className="p-3 text-right">রসিদ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {invoices.map(inv => (
                      <tr key={inv.invoiceNo} className="hover:bg-slate-50/60">
                        <td className="p-3 font-bold text-teal-700">{inv.invoiceNo}</td>
                        <td className="p-3 text-slate-500">{inv.date}</td>
                        <td className="p-3 font-bold">{inv.patientName} ({inv.uhid})</td>
                        <td className="p-3 font-black">৳{inv.total}</td>
                        <td className="p-3 text-emerald-700 font-bold">৳{inv.paid}</td>
                        <td className="p-3 text-rose-600 font-bold">{inv.due > 0 ? `৳${inv.due}` : '৳০'}</td>
                        <td className="p-3">{inv.method}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${inv.due === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button onClick={() => setViewingReceipt(inv)} className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-lg">
                            <Printer size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SUBTAB 1.3: DUE COLLECTION */}
          {billSubTab === 'due_collection' && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-black text-slate-900">বকেয়া খতিয়ান ও আংশিক পেমেন্ট সংগ্রহ (Due Ledger)</h3>
                  <p className="text-xs text-slate-500">বকেয়া বিলসমূহ থেকে অবশিষ্ট অর্থ আদায় ও রসিদ আপডেট</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[11px]">
                    <tr>
                      <th className="p-3">ইনভয়েস নং</th>
                      <th className="p-3">রোগীর নাম ও UHID</th>
                      <th className="p-3">মোট বিল</th>
                      <th className="p-3">পূর্বের পরিশোধ</th>
                      <th className="p-3">বর্তমান বকেয়া</th>
                      <th className="p-3 text-right">বকেয়া গ্রহণ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoices.filter(i => i.due > 0).map(inv => (
                      <tr key={inv.invoiceNo}>
                        <td className="p-3 font-mono font-bold text-teal-700">{inv.invoiceNo}</td>
                        <td className="p-3 font-bold">{inv.patientName} ({inv.uhid})</td>
                        <td className="p-3">৳{inv.total}</td>
                        <td className="p-3 text-emerald-700">৳{inv.paid}</td>
                        <td className="p-3 text-rose-600 font-black">৳{inv.due}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              setDueCollectionTarget(inv);
                              setCollectAmount(inv.due);
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm"
                          >
                            পেমেন্ট নিন
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SUBTAB 1.4: REFUNDS & CANCELLED */}
          {billSubTab === 'refunds' && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-black text-slate-900">রিফান্ড ও বাতিল বিল ট্র্যাকিং</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[11px]">
                    <tr>
                      <th className="p-3">রিফান্ড আইডি</th>
                      <th className="p-3">মূল ইনভয়েস</th>
                      <th className="p-3">রোগীর নাম</th>
                      <th className="p-3">সেবার বিবরণ</th>
                      <th className="p-3">ফেরত টাকা</th>
                      <th className="p-3">বাতিলের কারণ</th>
                      <th className="p-3">স্ট্যাটাস</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {refundsList.map(ref => (
                      <tr key={ref.refundId}>
                        <td className="p-3 font-mono font-bold text-rose-700">{ref.refundId}</td>
                        <td className="p-3 font-mono">{ref.invoiceNo}</td>
                        <td className="p-3 font-bold">{ref.patientName} ({ref.uhid})</td>
                        <td className="p-3">{ref.serviceType}</td>
                        <td className="p-3 font-black text-rose-600">৳{ref.amount}</td>
                        <td className="p-3 text-slate-500">{ref.reason}</td>
                        <td className="p-3"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">{ref.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          SECTION 2: আয়-ব্যয় (INCOME & EXPENSES)
      ======================================================== */}
      {masterTab === 'accounts' && (
        <div className="space-y-4">
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 overflow-x-auto text-xs font-bold w-fit">
            <button
              onClick={() => setAccountSubTab('cash_closing')}
              className={`px-4 py-2 rounded-xl transition-all ${accountSubTab === 'cash_closing' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-600'}`}
            >
              দৈনিক ক্যাশ ক্লোজিং
            </button>
            <button
              onClick={() => setAccountSubTab('income')}
              className={`px-4 py-2 rounded-xl transition-all ${accountSubTab === 'income' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-600'}`}
            >
              আয় খাতসমূহ
            </button>
            <button
              onClick={() => setAccountSubTab('expenses')}
              className={`px-4 py-2 rounded-xl transition-all ${accountSubTab === 'expenses' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-600'}`}
            >
              খরচ খতিয়ান ({expensesList.length})
            </button>
            <button
              onClick={() => setAccountSubTab('supplier_payables')}
              className={`px-4 py-2 rounded-xl transition-all ${accountSubTab === 'supplier_payables' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-600'}`}
            >
              সরবরাহকারী পাওনা ({supplierPayables.length})
            </button>
            <button
              onClick={() => setAccountSubTab('branch_accounts')}
              className={`px-4 py-2 rounded-xl transition-all ${accountSubTab === 'branch_accounts' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-600'}`}
            >
              শাখাভিত্তিক হিসাব
            </button>
          </div>

          {/* 2.1 CASH CLOSING */}
          {accountSubTab === 'cash_closing' && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-black text-slate-900">দৈনিক ক্যাশ ক্লোজিং (Daily Cash Closing)</h3>
                  <p className="text-xs text-slate-500">তারিখ: {new Date().toLocaleDateString('bn-BD')} • সক্রিয় শাখা: {currentBranch.name}</p>
                </div>
                <button
                  onClick={() => alert('আজকের ডে-এন্ড ক্যাশ ক্লোজিং সফলভাবে লক ও অডিট লগ সংরক্ষণ করা হয়েছে!')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  ক্যাশ লক ও ক্লোজ করুন
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <div className="text-xs font-bold text-emerald-800">মোট ক্যাশ জমা (Cash)</div>
                  <div className="text-2xl font-black text-emerald-900 mt-1">৳২৮,৫০০</div>
                </div>
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
                  <div className="text-xs font-bold text-blue-800">ডিজিটাল পেমেন্ট (bKash/Card)</div>
                  <div className="text-2xl font-black text-blue-900 mt-1">৳৮২,২০০</div>
                </div>
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
                  <div className="text-xs font-bold text-rose-800">আজকের রিফান্ড ও খরচ</div>
                  <div className="text-2xl font-black text-rose-900 mt-1">৳১৫,৭০০</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-900 text-white">
                  <div className="text-xs font-bold text-teal-300">নেট ক্যাশ ইন হ্যান্ড (Net Cash)</div>
                  <div className="text-2xl font-black text-emerald-400 mt-1">৳৯৫,০০০</div>
                </div>
              </div>
            </div>
          )}

          {/* 2.2 INCOME STREAMS */}
          {accountSubTab === 'income' && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-black text-slate-900">আয় খাতসমূহ ও রাজস্ব উৎস</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {incomeStreams.map((inc, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="text-xs font-bold text-slate-600">{inc.category}</div>
                    <div className="text-xl font-black text-slate-900">৳{inc.amount.toLocaleString()}</div>
                    <div className="text-[11px] text-teal-700 font-semibold flex justify-between">
                      <span>{inc.transactions}টি লেনদেন</span>
                      <span>অংশীদারিত্ব: {inc.share}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2.3 EXPENSES LEDGER */}
          {accountSubTab === 'expenses' && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-black text-slate-900">খরচ খতিয়ান ও ভাউচার তালিকা</h3>
                  <p className="text-xs text-slate-500">মোট খরচ: ৳{expensesList.reduce((s, x) => s + x.amount, 0).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => setShowAddExpenseModal(true)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5"
                >
                  <Plus size={14} /> নতুন খরচ এন্ট্রি
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[11px]">
                    <tr>
                      <th className="p-3">তারিখ</th>
                      <th className="p-3">খরচের শিরোনাম</th>
                      <th className="p-3">ক্যাটাগরি</th>
                      <th className="p-3">প্রাপক / ভেন্ডর</th>
                      <th className="p-3">পদ্ধতি</th>
                      <th className="p-3 text-right">পরিমাণ (৳)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {expensesList.map(exp => (
                      <tr key={exp.id}>
                        <td className="p-3 font-mono">{exp.date}</td>
                        <td className="p-3 font-bold text-slate-900">{exp.title}</td>
                        <td className="p-3"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">{exp.category}</span></td>
                        <td className="p-3 text-slate-600">{exp.paidTo}</td>
                        <td className="p-3">{exp.method}</td>
                        <td className="p-3 text-right font-black text-rose-600">৳{exp.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2.4 SUPPLIER PAYABLES */}
          {accountSubTab === 'supplier_payables' && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-black text-slate-900">সরবরাহকারী ও কোম্পানি পাওনা (Supplier Payables)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[11px]">
                    <tr>
                      <th className="p-3">সরবরাহকারী</th>
                      <th className="p-3">যোগাযোগ</th>
                      <th className="p-3">মোট ক্রয়</th>
                      <th className="p-3">পরিশোধ</th>
                      <th className="p-3">বাকি পাওনা (Balance)</th>
                      <th className="p-3">পরিশোধের মেয়াদ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {supplierPayables.map(sup => (
                      <tr key={sup.id}>
                        <td className="p-3 font-bold">{sup.supplier}</td>
                        <td className="p-3">{sup.phone}</td>
                        <td className="p-3">৳{sup.totalPurchased.toLocaleString()}</td>
                        <td className="p-3 text-emerald-700 font-bold">৳{sup.totalPaid.toLocaleString()}</td>
                        <td className="p-3 font-black text-rose-600">৳{sup.balance.toLocaleString()}</td>
                        <td className="p-3 font-mono text-slate-500">{sup.dueDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2.5 BRANCH ACCOUNTS */}
          {accountSubTab === 'branch_accounts' && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-black text-slate-900">শাখাভিত্তিক আর্থিক হিসাব (Branch Accounts)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="font-black text-slate-900">ধানমন্ডি মেইন ব্রাঞ্চ</div>
                  <div className="text-xs text-slate-600">মোট রাজস্ব: ৳১,৮৫,০০০</div>
                  <div className="text-xs text-rose-600">মোট খরচ: ৳৪৭,০০০</div>
                  <div className="text-sm font-black text-emerald-700 pt-1 border-t">নিট লাভ: ৳১,৩৮,০০০</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="font-black text-slate-900">মিরপুর শাখা</div>
                  <div className="text-xs text-slate-600">মোট রাজস্ব: ৳৮২,৫০০</div>
                  <div className="text-xs text-rose-600">মোট খরচ: ৳২৩,৫০০</div>
                  <div className="text-sm font-black text-emerald-700 pt-1 border-t">নিট লাভ: ৳৫৯,০০০</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="font-black text-slate-900">উত্তরা শাখা</div>
                  <div className="text-xs text-slate-600">মোট রাজস্ব: ৳৭৪,০০০</div>
                  <div className="text-xs text-rose-600">মোট খরচ: ৳১৯,২০০</div>
                  <div className="text-sm font-black text-emerald-700 pt-1 border-t">নিট লাভ: ৳৫৪,৮০০</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          SECTION 3: রিপোর্ট হাব (৯টি সমন্বিত রিপোর্ট)
      ======================================================== */}
      {masterTab === 'reports' && (
        <div className="space-y-4">
          {/* 9 Reports Navigation Grid */}
          <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">৯টি বিজনেস রিপোর্ট সিলেক্টর</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2 text-xs font-bold">
              {[
                { id: 'rep_patient', label: '১. রোগী রিপোর্ট', icon: Users },
                { id: 'rep_appointment', label: '২. অ্যাপয়েন্টমেন্ট', icon: Calendar },
                { id: 'rep_doctor', label: '৩. ডাক্তার রিপোর্ট', icon: Stethoscope },
                { id: 'rep_test', label: '৪. টেস্ট ও রিপোর্ট', icon: FlaskConical },
                { id: 'rep_pharmacy', label: '৫. ফার্মেসি বিক্রি', icon: Pill },
                { id: 'rep_stock', label: '৬. স্টক ও মেয়াদ', icon: Boxes },
                { id: 'rep_income_expense', label: '৭. আয়-ব্যয়', icon: DollarSign },
                { id: 'rep_due', label: '৮. বকেয়া রিপোর্ট', icon: Percent },
                { id: 'rep_branch_compare', label: '৯. শাখা তুলনা', icon: Building }
              ].map(r => {
                const IconComponent = r.icon;
                return (
                  <button
                    key={r.id}
                    onClick={() => setReportSubTab(r.id)}
                    className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                      reportSubTab === r.id
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                        : 'border-slate-200 text-slate-700 hover:border-indigo-400 hover:bg-indigo-50/50'
                    }`}
                  >
                    <IconComponent size={16} />
                    <span className="text-[11px] leading-tight">{r.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* REPORT 1: PATIENTS REPORT */}
          {reportSubTab === 'rep_patient' && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <div>
                  <h3 className="text-base font-black text-slate-900">১. রোগী নিবন্ধন ও ডেমোগ্রাফিক রিপোর্ট</h3>
                  <p className="text-xs text-slate-500">মোট রোগী: {patients.length} জন • নতুন ও নিয়মিত রোগী অনুপাত</p>
                </div>
                <button onClick={() => window.print()} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1">
                  <Printer size={13} /> প্রিন্ট রিপোর্ট
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100"><div className="text-xs text-indigo-700 font-bold">মোট নিবন্ধিত রোগী</div><div className="text-2xl font-black text-indigo-950 mt-1">{patients.length} জন</div></div>
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100"><div className="text-xs text-emerald-700 font-bold">চলতি মাসের নতুন রোগী</div><div className="text-2xl font-black text-emerald-950 mt-1">৮৫ জন</div></div>
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100"><div className="text-xs text-blue-700 font-bold">পুনরাবৃত্ত রোগী (Returning)</div><div className="text-2xl font-black text-blue-950 mt-1">৭২%</div></div>
              </div>
            </div>
          )}

          {/* REPORT 2: APPOINTMENTS REPORT */}
          {reportSubTab === 'rep_appointment' && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <div>
                  <h3 className="text-base font-black text-slate-900">২. অ্যাপয়েন্টমেন্ট ও সিরিয়াল রিপোর্ট</h3>
                  <p className="text-xs text-slate-500">মোট অ্যাপয়েন্টমেন্ট: {appointments.length}টি • সেবা প্রদান ও অনুপস্থিতি হার</p>
                </div>
                <button onClick={() => window.print()} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1">
                  <Printer size={13} /> প্রিন্ট রিপোর্ট
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100"><div className="text-xs text-blue-700 font-bold">মোট বুকিং</div><div className="text-2xl font-black text-blue-950 mt-1">{appointments.length} টি</div></div>
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100"><div className="text-xs text-emerald-700 font-bold">ভিজিট সম্পন্ন</div><div className="text-2xl font-black text-emerald-950 mt-1">{appointments.filter(a => a.appointment_status === 'Completed').length} টি</div></div>
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100"><div className="text-xs text-amber-700 font-bold">অপেক্ষমাণ</div><div className="text-2xl font-black text-amber-950 mt-1">{appointments.filter(a => a.appointment_status === 'Waiting').length} টি</div></div>
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100"><div className="text-xs text-rose-700 font-bold">বাতিল / অনুপস্থিত</div><div className="text-2xl font-black text-rose-950 mt-1">৩ টি</div></div>
              </div>
            </div>
          )}

          {/* REPORT 3: DOCTOR REPORT */}
          {reportSubTab === 'rep_doctor' && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <div>
                  <h3 className="text-base font-black text-slate-900">৩. ডাক্তারভিত্তিক রোগী ও পারফরম্যান্স রিপোর্ট</h3>
                  <p className="text-xs text-slate-500">ডাক্তার তালিকা, পরামর্শ ফি এবং রোগী দেখার গড় সংখ্যা</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[11px]">
                    <tr><th className="p-3">ডাক্তারের নাম</th><th className="p-3">বিশেষত্ব</th><th className="p-3">মোট রোগী</th><th className="p-3">ভিজিট ফি</th><th className="p-3">মোট সংগৃহীত ফি</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {doctors.map(doc => (
                      <tr key={doc.doctor_id}>
                        <td className="p-3 font-bold text-slate-900">{doc.full_name}</td>
                        <td className="p-3">{doc.specialty}</td>
                        <td className="p-3 font-bold">২৮ জন</td>
                        <td className="p-3">৳{doc.consultation_fee}</td>
                        <td className="p-3 font-black text-emerald-700">৳{(doc.consultation_fee * 28).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* REPORT 4: TEST & REPORTS */}
          {reportSubTab === 'rep_test' && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <div>
                  <h3 className="text-base font-black text-slate-900">৪. টেস্ট ও রিপোর্ট ডেলিভারি রিপোর্ট</h3>
                  <p className="text-xs text-slate-500">মোট ল্যাব অর্ডার: {labOrders.length}টি • ডেলিভারি সম্পন্ন ও পেন্ডিং বিশ্লেষণ</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-teal-50 border border-teal-100"><div className="text-xs text-teal-800 font-bold">মোট টেস্ট অর্ডার</div><div className="text-2xl font-black text-teal-950 mt-1">{labOrders.length} টি</div></div>
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100"><div className="text-xs text-emerald-800 font-bold">রিপোর্ট ডেলিভার্ড</div><div className="text-2xl font-black text-emerald-950 mt-1">{labOrders.filter(o => o.order_status === 'Delivered').length} টি</div></div>
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100"><div className="text-xs text-amber-800 font-bold">প্রক্রিয়াধীন ও যাচাই বাকি</div><div className="text-2xl font-black text-amber-950 mt-1">{labOrders.filter(o => o.order_status !== 'Delivered').length} টি</div></div>
              </div>
            </div>
          )}

          {/* REPORT 5: PHARMACY SALES */}
          {reportSubTab === 'rep_pharmacy' && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-black text-slate-900">৫. ফার্মেসি বিক্রি ও কাউন্টার সেলস রিপোর্ট</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100"><div className="text-xs text-emerald-800 font-bold">মোট ওষুধ বিক্রি</div><div className="text-2xl font-black text-emerald-950 mt-1">৳১,২৬,৫০০</div></div>
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100"><div className="text-xs text-blue-800 font-bold">প্রেসক্রিপশন বিক্রি</div><div className="text-2xl font-black text-blue-950 mt-1">৳৮৮,০০০</div></div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100"><div className="text-xs text-slate-800 font-bold">ওটিসি কাউন্টার বিক্রি</div><div className="text-2xl font-black text-slate-950 mt-1">৳৩৮,৫০০</div></div>
              </div>
            </div>
          )}

          {/* REPORT 6: STOCK & EXPIRY */}
          {reportSubTab === 'rep_stock' && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-black text-slate-900">৬. ইনভেন্টরি স্টক ও মেয়াদ রিপোর্ট</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200"><div className="text-xs text-slate-600 font-bold">মোট ওষুধের আইটেম</div><div className="text-2xl font-black text-slate-900 mt-1">{pharmacyMedicines.length} টি</div></div>
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200"><div className="text-xs text-rose-800 font-bold">কম স্টক অ্যালার্ট</div><div className="text-2xl font-black text-rose-900 mt-1">৩ টি</div></div>
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200"><div className="text-xs text-amber-800 font-bold">আসন্ন মেয়াদোত্তীর্ণ (&lt; ৯০ দিন)</div><div className="text-2xl font-black text-amber-900 mt-1">২ টি</div></div>
              </div>
            </div>
          )}

          {/* REPORT 7: INCOME & EXPENSE REPORT */}
          {reportSubTab === 'rep_income_expense' && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-black text-slate-900">৭. সমন্বিত আয়-ব্যয় ও লাভ-ক্ষতি বিবরণী</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200"><div className="text-xs text-emerald-800 font-bold">মোট রাজস্ব আয়</div><div className="text-2xl font-black text-emerald-900 mt-1">৳৩,৪১,৫০০</div></div>
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200"><div className="text-xs text-rose-800 font-bold">মোট পরিচালন খরচ</div><div className="text-2xl font-black text-rose-900 mt-1">৳৮৯,৭০০</div></div>
                <div className="p-4 rounded-2xl bg-teal-900 text-white"><div className="text-xs text-teal-300 font-bold">নিট প্রফিট মার্জিন</div><div className="text-2xl font-black text-emerald-400 mt-1">৳২,৫১,৮০০ (৭৩.৭%)</div></div>
              </div>
            </div>
          )}

          {/* REPORT 8: DUE REPORT */}
          {reportSubTab === 'rep_due' && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-black text-slate-900">৮. বকেয়া রিপোর্ট (Outstanding Due Ledger)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200"><div className="text-xs text-rose-800 font-bold">মোট বকেয়া পাওনা (রোগী)</div><div className="text-2xl font-black text-rose-900 mt-1">৳১,৩০০</div></div>
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200"><div className="text-xs text-amber-800 font-bold">বকেয়া ইনভয়েসের সংখ্যা</div><div className="text-2xl font-black text-amber-900 mt-1">{invoices.filter(i => i.due > 0).length} টি</div></div>
              </div>
            </div>
          )}

          {/* REPORT 9: BRANCH COMPARISON */}
          {reportSubTab === 'rep_branch_compare' && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-black text-slate-900">৯. শাখা তুলনা রিপোর্ট (Multi-Branch Performance)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[11px]">
                    <tr><th className="p-3">শাখার নাম</th><th className="p-3">রোগী সংখ্যা</th><th className="p-3">মোট আয়</th><th className="p-3">মোট খরচ</th><th className="p-3">নিট আয়</th><th className="p-3">পারফরম্যান্স</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr><td className="p-3 font-bold">ধানমন্ডি মেইন ব্রাঞ্চ</td><td className="p-3">৮২ জন</td><td className="p-3 font-bold">৳১,৮৫,০০০</td><td className="p-3 text-rose-600">৳৪৭,০০০</td><td className="p-3 text-emerald-700 font-black">৳১,৩৮,০০০</td><td className="p-3"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">শীর্ষ পারফর্মার</span></td></tr>
                    <tr><td className="p-3 font-bold">মিরপুর শাখা</td><td className="p-3">৪৫ জন</td><td className="p-3 font-bold">৳৮২,৫০০</td><td className="p-3 text-rose-600">৳২৩,৫০০</td><td className="p-3 text-emerald-700 font-black">৳৫৯,০০০</td><td className="p-3"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">সন্তোষজনক</span></td></tr>
                    <tr><td className="p-3 font-bold">উত্তরা শাখা</td><td className="p-3">৩৮ জন</td><td className="p-3 font-bold">৳৭৪,০০০</td><td className="p-3 text-rose-600">৳১৯,২০০</td><td className="p-3 text-emerald-700 font-black">৳৫৪,৮০০</td><td className="p-3"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">সন্তোষজনক</span></td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: ADD EXPENSE */}
      {showAddExpenseModal && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content glass-card" style={{ maxWidth: '480px', width: '95%', padding: '1.5rem', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarSign size={18} color="#ef4444" />
                <span>নতুন খরচ ভাউচার এন্ট্রি (Add Expense)</span>
              </h3>
              <button onClick={() => setShowAddExpenseModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
            </div>
            <form onSubmit={e => {
              e.preventDefault();
              const newExp = {
                id: Date.now(),
                date: new Date().toISOString().split('T')[0],
                title: newExpenseForm.title,
                category: newExpenseForm.category,
                amount: Number(newExpenseForm.amount) || 0,
                paidTo: newExpenseForm.paidTo,
                method: newExpenseForm.method
              };
              setExpensesList([newExp, ...expensesList]);
              alert(`খরচ '${newExp.title}' সফলভাবে সংরক্ষিত হয়েছে!`);
              setShowAddExpenseModal(false);
            }} style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '700' }}>খরচের শিরোনাম</label>
                <input required placeholder="যেমন: ল্যাব রিএজেন্ট ক্রয়" value={newExpenseForm.title} onChange={e => setNewExpenseForm({ ...newExpenseForm, title: e.target.value })} className="input-field" style={{ width: '100%', padding: '6px 10px' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '700' }}>ক্যাটাগরি</label>
                  <select value={newExpenseForm.category} onChange={e => setNewExpenseForm({ ...newExpenseForm, category: e.target.value })} className="input-field" style={{ width: '100%', padding: '6px 10px' }}>
                    <option value="মেডিকেল সাপ্লাই">মেডিকেল সাপ্লাই</option>
                    <option value="ইউটিলিটি ও অপারেশন">ইউটিলিটি ও অপারেশন</option>
                    <option value="বেতন ও ভাতা">বেতন ও ভাতা</option>
                    <option value="মেরামত ও রক্ষণাবেক্ষণ">মেরামত ও রক্ষণাবেক্ষণ</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '700' }}>পরিমাণ (৳)</label>
                  <input type="number" required value={newExpenseForm.amount} onChange={e => setNewExpenseForm({ ...newExpenseForm, amount: e.target.value })} className="input-field" style={{ width: '100%', padding: '6px 10px' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '700' }}>প্রাপক / ভেন্ডর</label>
                  <input required placeholder="যেমন: পদ্মা ফিলিং স্টেশন" value={newExpenseForm.paidTo} onChange={e => setNewExpenseForm({ ...newExpenseForm, paidTo: e.target.value })} className="input-field" style={{ width: '100%', padding: '6px 10px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '700' }}>পেমেন্ট পদ্ধতি</label>
                  <select value={newExpenseForm.method} onChange={e => setNewExpenseForm({ ...newExpenseForm, method: e.target.value })} className="input-field" style={{ width: '100%', padding: '6px 10px' }}>
                    <option value="নগদ ক্যাশ">নগদ ক্যাশ</option>
                    <option value="ব্যাংক চেক">ব্যাংক চেক</option>
                    <option value="বিকাশ / নগদ">বিকাশ / নগদ</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowAddExpenseModal(false)} className="btn btn-secondary press-scale">বাতিল</button>
                <button type="submit" className="btn btn-primary press-scale" style={{ background: '#ef4444', borderColor: '#ef4444' }}>খরচ এন্ট্রি সম্পন্ন</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DUE COLLECTION MODAL */}
      {dueCollectionTarget && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content glass-card" style={{ maxWidth: '420px', width: '95%', padding: '1.5rem', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)' }}>বকেয়া টাকা গ্রহণ</h3>
              <button onClick={() => setDueCollectionTarget(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
            </div>
            <div className="space-y-3 text-xs">
              <div>ইনভয়েস: <strong>{dueCollectionTarget.invoiceNo}</strong></div>
              <div>রোগী: <strong>{dueCollectionTarget.patientName}</strong></div>
              <div>বর্তমান বকেয়া: <strong className="text-rose-600 font-bold">৳{dueCollectionTarget.due}</strong></div>
              <div>
                <label className="font-bold block mb-1">আদায়কৃত টাকা (৳)</label>
                <input
                  type="number"
                  value={collectAmount}
                  onChange={e => setCollectAmount(e.target.value)}
                  className="input-field w-full text-sm font-bold text-emerald-700"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setDueCollectionTarget(null)} className="btn btn-secondary">বাতিল</button>
                <button
                  onClick={() => {
                    const c = Number(collectAmount) || 0;
                    setInvoices(invoices.map(i => i.invoiceNo === dueCollectionTarget.invoiceNo ? {
                      ...i,
                      paid: i.paid + c,
                      due: Math.max(0, i.due - c),
                      status: i.due - c <= 0 ? 'পরিশোধিত' : 'আংশিক বকেয়া'
                    } : i));
                    alert(`বকেয়া ৳${c} সফলভাবে সংগৃহীত ও ইনভয়েস আপডেট হয়েছে!`);
                    setDueCollectionTarget(null);
                  }}
                  className="btn btn-primary"
                  style={{ background: '#10b981', borderColor: '#10b981' }}
                >
                  কালেকশন নিশ্চিত করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: INVOICE RECEIPT SLIP MODAL */}
      {viewingReceipt && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content glass-card" style={{ maxWidth: '440px', width: '95%', padding: '1.25rem', borderRadius: '18px' }}>
            <div style={{ textAlign: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>হিসাবকিতাব ৩৬০ - হেলথকেয়ার সেন্টার</h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: 'var(--text-muted)' }}>শাখা: {currentBranch.name} • মানি রিসিট</p>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: '800', color: '#10b981', fontSize: '0.85rem', marginTop: '4px' }}>
                #{viewingReceipt.invoiceNo}
              </div>
            </div>

            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '10px' }}>
              <div>তারিখ: <strong style={{ color: 'var(--text-main)' }}>{viewingReceipt.date}</strong></div>
              <div>রোগীর নাম: <strong style={{ color: 'var(--text-main)' }}>{viewingReceipt.patientName}</strong></div>
              <div>পেশেন্ট UHID: <strong style={{ color: '#2563eb' }}>{viewingReceipt.uhid}</strong></div>
              <div>ক্যাশিয়ার: <strong>{viewingReceipt.cashier || 'প্রধান ক্যাশিয়ার'}</strong></div>
            </div>

            <div style={{ padding: '8px 0', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.78rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>মোট বিল:</span><strong>৳{viewingReceipt.total}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981' }}><span>পরিশোধিত ({viewingReceipt.method}):</span><strong>৳{viewingReceipt.paid}</strong></div>
              {viewingReceipt.due > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444', fontWeight: 'bold' }}><span>বকেয়া:</span><strong>৳{viewingReceipt.due}</strong></div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={() => window.print()} className="btn btn-secondary press-scale" style={{ flex: 1, padding: '8px', fontSize: '0.8rem' }}>
                🖨️ প্রিন্ট রসিদ
              </button>
              <button onClick={() => setViewingReceipt(null)} className="btn btn-primary press-scale" style={{ flex: 1, padding: '8px', fontSize: '0.8rem', background: '#10b981', borderColor: '#10b981' }}>
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthcareBillingManager;
