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
  UserCheck
} from 'lucide-react';

export const HealthcareBillingManager = () => {
  const { patients = [], doctors = [], diagnosticTests = [] } = useHealthcare();

  // Active Tab: 'new_bill' | 'recent_invoices' | 'cash_closing'
  const [subTab, setSubTab] = useState('new_bill');

  // New Invoice State
  const [selectedPatient, setSelectedPatient] = useState(patients[0] || null);
  const [patientSearch, setPatientSearch] = useState('');
  const [billItems, setBillItems] = useState([
    { id: 1, type: 'ডাক্তার ভিজিট', name: 'কনসালটেন্সি ফি (ডা: রফিকুল ইসলাম)', qty: 1, rate: 800, total: 800 },
    { id: 2, type: 'ল্যাব টেস্ট', name: 'কমপ্লিট ব্লাড কাউন্ট (CBC with ESR)', qty: 1, rate: 450, total: 450 }
  ]);
  const [discountAmount, setDiscountAmount] = useState(50);
  const [paidAmount, setPaidAmount] = useState(1200);
  const [paymentMethod, setPaymentMethod] = useState('নগদ (Cash)');
  const [cashierName, setCashierName] = useState('প্রধান ক্যাশিয়ার');

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

  // Calculations
  const subtotal = billItems.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  const grandTotal = Math.max(0, subtotal - (Number(discountAmount) || 0));
  const dueAmount = Math.max(0, grandTotal - (Number(paidAmount) || 0));

  // Add Item
  const handleAddItem = (type, name, rate) => {
    const newItem = {
      id: Date.now(),
      type,
      name,
      qty: 1,
      rate,
      total: rate
    };
    setBillItems([...billItems, newItem]);
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
    alert(`ইনভয়েস ${newInvoice.invoiceNo} সফলভাবে তৈরি ও ক্যাশ এন্ট্রি সম্পন্ন হয়েছে!`);
    // Reset
    setBillItems([]);
    setDiscountAmount(0);
    setPaidAmount(0);
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 mb-2">
              <Sparkles size={13} />
              <span>মডিউল ১১: সমন্বিত সেন্ট্রাল ক্যাশিয়ার ও মাস্টার বিলিং</span>
            </span>
            <h2 className="text-2xl font-black tracking-tight">বিলিং, ক্যাশ কালেকশন ও পেমেন্ট টার্মিনাল</h2>
            <p className="text-sm text-emerald-100/80 mt-1">
              ডাক্তার ভিজিট, ডায়াগনস্টিক টেস্ট, ফার্মেসি ড্রাগস ও বেড চার্জ—একক ইনভয়েসে প্রিন্ট ও ক্যাশ ক্লোজিং।
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSubTab('new_bill')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                subTab === 'new_bill' ? 'bg-white text-slate-900 shadow-md' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              নতুন বিল তৈরি (New POS)
            </button>
            <button
              onClick={() => setSubTab('recent_invoices')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                subTab === 'recent_invoices' ? 'bg-white text-slate-900 shadow-md' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              ইনভয়েস তালিকা
            </button>
            <button
              onClick={() => setSubTab('cash_closing')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                subTab === 'cash_closing' ? 'bg-white text-slate-900 shadow-md' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              ডেইলি ক্যাশ ক্লোজিং
            </button>
          </div>
        </div>
      </div>

      {/* SUBTAB 1: NEW BILLING POS */}
      {subTab === 'new_bill' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Patient & Items Selection (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Patient Selector */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <UserCheck size={18} className="text-teal-600" />
                <span>রোগী নির্বাচন (Patient Selection)</span>
              </h3>

              <div className="flex gap-2">
                <select
                  value={selectedPatient?.patient_id || ''}
                  onChange={e => {
                    const p = patients.find(item => item.patient_id === e.target.value);
                    if (p) setSelectedPatient(p);
                  }}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-teal-500 font-medium"
                >
                  {patients.map(p => (
                    <option key={p.patient_id} value={p.patient_id}>
                      {p.full_name} ({p.patient_id}) • {p.mobile_number || p.phone}
                    </option>
                  ))}
                </select>
              </div>

              {selectedPatient && (
                <div className="p-3 rounded-xl bg-teal-50/60 border border-teal-200 text-xs flex justify-between items-center">
                  <div>
                    <span className="font-bold text-teal-950">{selectedPatient.full_name}</span> ({selectedPatient.age} বছর, {selectedPatient.gender})
                    <div className="text-[11px] text-teal-800">রক্তের গ্রুপ: {selectedPatient.blood_group || 'N/A'} • মোবাইল: {selectedPatient.mobile_number || selectedPatient.phone}</div>
                  </div>
                  <span className="px-2.5 py-1 bg-teal-200/80 text-teal-900 font-black rounded-lg text-[10px]">
                    {selectedPatient.patient_id}
                  </span>
                </div>
              )}
            </div>

            {/* Quick Service Adders */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-sm font-black text-slate-900">কুইক সার্ভিস ও চার্জ যোগ করুন</h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => handleAddItem('ডাক্তার ফি', 'কনসালটেন্সি ফি (সাধারণ)', 600)}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50 text-left transition-all text-xs"
                >
                  <div className="font-bold text-slate-900">🩺 ডক্টর ফি</div>
                  <div className="text-[11px] text-teal-700 font-extrabold">৳৬০০</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddItem('ল্যাব টেস্ট', 'CBC + ESR ল্যাব টেস্ট', 450)}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50 text-left transition-all text-xs"
                >
                  <div className="font-bold text-slate-900">🔬 সিবিসি টেস্ট</div>
                  <div className="text-[11px] text-teal-700 font-extrabold">৳৪৫০</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddItem('ল্যাব টেস্ট', 'লিপিড প্রোফাইল (Lipid)', 950)}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50 text-left transition-all text-xs"
                >
                  <div className="font-bold text-slate-900">🧪 লিপিড প্রোফাইল</div>
                  <div className="text-[11px] text-teal-700 font-extrabold">৳৯৫০</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddItem('ইমেজিং', 'ডিজিটাল চেস্ট এক্স-রে (X-Ray)', 750)}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50 text-left transition-all text-xs"
                >
                  <div className="font-bold text-slate-900">🩻 এক্স-রে (Chest)</div>
                  <div className="text-[11px] text-teal-700 font-extrabold">৳৭৫০</div>
                </button>
              </div>
            </div>

            {/* Current Itemized Bill Table */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-black text-slate-900">বর্তমান বিলের আইটেমসমূহ ({billItems.length} টি)</h3>
                <button
                  type="button"
                  onClick={() => handleAddItem('সার্ভিস', 'কাস্টম মেডিকেল সার্ভিস', 500)}
                  className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1"
                >
                  <Plus size={14} /> আইটেম যোগ করুন
                </button>
              </div>

              {billItems.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                  কোনো আইটেম যোগ করা হয়নি। উপরের বাটনগুলো থেকে সার্ভিস সিলেক্ট করুন।
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {billItems.map(item => (
                    <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900">{item.name}</div>
                        <div className="text-[10px] text-slate-400">{item.type} • একক দর: ৳{item.rate}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-black text-slate-900">৳{item.total}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Checkout Summary (5 Cols) */}
          <div className="lg:col-span-5">
            <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl space-y-4 sticky top-4">
              <h3 className="text-base font-black flex items-center gap-2 border-b border-slate-800 pb-3">
                <Receipt className="text-emerald-400" size={18} />
                <span>মাস্টার ইনভয়েস সারাংশ</span>
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>সাবটোটাল (Subtotal):</span>
                  <span className="font-bold text-white">৳{subtotal}</span>
                </div>

                <div className="flex justify-between items-center text-slate-400">
                  <span>ডিসকাউন্ট (Discount ৳):</span>
                  <input
                    type="number"
                    value={discountAmount}
                    onChange={e => setDiscountAmount(Number(e.target.value))}
                    className="w-24 px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-right font-bold text-rose-400 focus:outline-emerald-500 text-xs"
                  />
                </div>

                <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-black">
                  <span className="text-emerald-400">সর্বমোট প্রদেয় (Net Payable):</span>
                  <span className="text-emerald-400 text-lg">৳{grandTotal}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">পেমেন্ট মেথড</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-medium text-white focus:outline-emerald-500"
                  >
                    <option value="নগদ (Cash)">💵 নগদ (Cash)</option>
                    <option value="বিকাশ (bKash)">📱 বিকাশ (bKash)</option>
                    <option value="নগদ (Nagad)">📱 নগদ (Nagad)</option>
                    <option value="কার্ড (Card)">💳 ক্রেডিট / ডেবিট কার্ড</option>
                    <option value="ব্যাংক ট্রান্সফার">🏦 ব্যাংক ট্রান্সফার</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">জমা গ্রহণ (Paid ৳)</label>
                  <input
                    type="number"
                    value={paidAmount}
                    onChange={e => setPaidAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-base font-black text-emerald-400 focus:outline-emerald-500"
                  />
                </div>

                {dueAmount > 0 && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs flex justify-between items-center text-rose-400 font-bold">
                    <span>বকেয়া পরিমাণ (Due):</span>
                    <span>৳{dueAmount}</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleCreateInvoice}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black text-sm shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-95"
              >
                <Printer size={16} />
                <span>বিল সংরক্ষণ ও রসিদ প্রিন্ট</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: RECENT INVOICES */}
      {subTab === 'recent_invoices' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-900">সাম্প্রতিক ইনভয়েস ও রসিদসমূহ</h3>
              <p className="text-xs text-slate-500">মোট {invoices.length}টি ইনভয়েস ইস্যু করা হয়েছে</p>
            </div>
          </div>

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
                  <th className="p-3 text-right">অ্যাকশন</th>
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
                      <button
                        onClick={() => alert(`ইনভয়েস ${inv.invoiceNo} প্রিন্ট প্রিভিউ খোলা হচ্ছে...`)}
                        className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-lg"
                      >
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

      {/* SUBTAB 3: DAILY CASH CLOSING */}
      {subTab === 'cash_closing' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-900">আজকের ক্যাশিয়ারভিত্তিক দৈনিক ক্লোজিং (Daily Cash Closing)</h3>
              <p className="text-xs text-slate-500">তারিখ: {new Date().toLocaleDateString('bn-BD')} • হিসাব পরীক্ষক: সুপারভাইজার</p>
            </div>
            <button
              onClick={() => alert('আজকের ডে-এন্ড ক্যাশ সফলভাবে লক ও ক্লোজ করা হয়েছে!')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md"
            >
              ক্যাশ লক ও ক্লোজ করুন
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
              <div className="text-xs font-bold text-emerald-800">মোট ক্যাশ সংগ্রহ (Cash)</div>
              <div className="text-2xl font-black text-emerald-900 mt-1">৳১,২০০</div>
            </div>
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
              <div className="text-xs font-bold text-blue-800">ডিজিটাল পেমেন্ট (bKash/Card)</div>
              <div className="text-2xl font-black text-blue-900 mt-1">৳৯,৭০০</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-xs font-bold text-slate-700">মোট সংগৃহীত রাজস্ব (Total)</div>
              <div className="text-2xl font-black text-slate-900 mt-1">৳১০,৯০০</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthcareBillingManager;
