import React, { useState, useMemo } from 'react';
import { useHealthcare } from '../../context/HealthcareContext';
import { generateHealthcareId } from '../../services/healthcareIdService';

export default function PharmacyFEFOManager() {
  const {
    pharmacyMedicines,
    patients,
    prescriptions,
    dispensePharmacyMedicine,
    updatePrescriptionDispensingStatus
  } = useHealthcare();

  const [activeTab, setActiveTab] = useState('pos'); // 'pos' | 'prescriptions' | 'inventory' | 'alerts'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [cart, setCart] = useState([]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [lastInvoice, setLastInvoice] = useState(null);
  const [activePrescriptionId, setActivePrescriptionId] = useState(null);

  // Selected patient details for allergy check
  const selectedPatient = useMemo(() => {
    return patients.find(p => p.patient_id === selectedPatientId);
  }, [patients, selectedPatientId]);

  // Filtered medicines
  const filteredMedicines = useMemo(() => {
    return pharmacyMedicines.filter(med => {
      const matchesSearch =
        med.brand_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.generic_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.barcode.includes(searchTerm) ||
        med.manufacturer.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || med.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [pharmacyMedicines, searchTerm, selectedCategory]);

  // Categories
  const categories = useMemo(() => {
    const set = new Set(pharmacyMedicines.map(m => m.category));
    return ['All', ...Array.from(set)];
  }, [pharmacyMedicines]);

  // Get FEFO sorted batches for a medicine
  const getFefoBatches = (med) => {
    return [...med.batches].sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));
  };

  // Add to cart using FEFO (earliest expiring batch with stock)
  const addToCart = (medicine, preferredBatchNumber = null, unitType = 'strip') => {
    // Check allergy
    if (selectedPatient && selectedPatient.allergies) {
      const allergyLower = selectedPatient.allergies.toLowerCase();
      if (
        allergyLower.includes(medicine.generic_name.toLowerCase()) ||
        allergyLower.includes(medicine.brand_name.toLowerCase())
      ) {
        const proceed = window.confirm(
          `⚠️ অ্যালার্জি সতর্কতা (ALLERGY WARNING)!\nরোগী ${selectedPatient.full_name}-এর এই ওষুধের উপাদানে অ্যালার্জি রয়েছে (${selectedPatient.allergies})। আপনি কি তবুও এটি কার্টে যুক্ত করতে চান?`
        );
        if (!proceed) return;
      }
    }

    const fefoBatches = getFefoBatches(medicine).filter(b => b.stock_tablets > 0);
    if (fefoBatches.length === 0) {
      alert(`⚠️ '${medicine.brand_name}' এর কোনো সক্রিয় স্টক নেই!`);
      return;
    }

    let targetBatch = fefoBatches[0];
    if (preferredBatchNumber) {
      const found = medicine.batches.find(b => b.batch_number === preferredBatchNumber);
      if (found && found.stock_tablets > 0) targetBatch = found;
    }

    // Check if expired
    const isExpired = new Date(targetBatch.expiry_date) < new Date();
    if (isExpired) {
      alert(`❌ ব্যাচ ${targetBatch.batch_number} এর মেয়াদ উত্তীর্ণ (Expired)! এটি বিক্রয় নিষিদ্ধ।`);
      return;
    }

    // Determine unit multiplier and pricing
    const multiplier = unitType === 'box'
      ? medicine.box_size * medicine.strip_size
      : unitType === 'strip'
      ? medicine.strip_size
      : 1;

    const unitPrice = unitType === 'box'
      ? medicine.box_mrp
      : unitType === 'strip'
      ? medicine.strip_mrp
      : medicine.unit_mrp;

    setCart(prev => {
      const existing = prev.find(item => item.medicine_id === medicine.medicine_id && item.batch_number === targetBatch.batch_number && item.unitType === unitType);
      if (existing) {
        return prev.map(item =>
          item === existing
            ? { ...item, qty: item.qty + 1 }
            : item
        );
      } else {
        return [
          ...prev,
          {
            medicine_id: medicine.medicine_id,
            brand_name: medicine.brand_name,
            generic_name: medicine.generic_name,
            dosage_form: medicine.dosage_form,
            batch_number: targetBatch.batch_number,
            expiry_date: targetBatch.expiry_date,
            unitType,
            multiplier,
            unitPrice,
            qty: 1,
            maxTablets: targetBatch.stock_tablets
          }
        ];
      }
    });
  };

  // Cart calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.unitPrice * item.qty), 0);
  }, [cart]);

  const discountAmount = Math.round((subtotal * (Number(discountPercent) || 0)) / 100);
  const netPayable = Math.max(0, subtotal - discountAmount);
  const dueAmount = Math.max(0, netPayable - (Number(paidAmount) || 0));

  // Handle Checkout
  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('কার্ট খালি! অনুগ্রহ করে ওষুধ যোগ করুন।');
      return;
    }

    const saleId = generateHealthcareId('PHARMACY_SALE');
    const invoiceData = {
      sale_id: saleId,
      date: new Date().toLocaleString('bn-BD'),
      patient: selectedPatient ? { id: selectedPatient.patient_id, name: selectedPatient.full_name, phone: selectedPatient.mobile_number } : { name: 'সাধারণ কাস্টমার (Walk-in)', phone: 'N/A' },
      prescription_id: activePrescriptionId,
      items: [...cart],
      subtotal,
      discountAmount,
      netPayable,
      paidAmount: Number(paidAmount) || netPayable,
      dueAmount: Number(paidAmount) ? Math.max(0, netPayable - Number(paidAmount)) : 0,
      paymentMethod
    };

    // Deduct stock for each item
    cart.forEach(item => {
      const tabletsToDeduct = item.qty * item.multiplier;
      dispensePharmacyMedicine({
        medicineId: item.medicine_id,
        batchNumber: item.batch_number,
        quantityTablets: tabletsToDeduct
      });
    });

    // If linked to a prescription, mark it as dispensed
    if (activePrescriptionId) {
      updatePrescriptionDispensingStatus(activePrescriptionId, 'Fully Dispensed');
    }

    setLastInvoice(invoiceData);
    setCart([]);
    setPaidAmount('');
    setActivePrescriptionId(null);
  };

  // Load items from prescription directly to cart
  const loadPrescriptionToCart = (rx) => {
    setSelectedPatientId(rx.patient_id);
    setActivePrescriptionId(rx.prescription_id);

    rx.medicines.forEach(prescribedMed => {
      // Find matching medicine in stock
      const matched = pharmacyMedicines.find(m =>
        m.brand_name.toLowerCase() === prescribedMed.brand_name.toLowerCase() ||
        m.generic_name.toLowerCase() === prescribedMed.generic_name.toLowerCase()
      );
      if (matched) {
        addToCart(matched, null, 'strip');
      }
    });

    setActiveTab('pos');
  };

  // Near expiry / expired calculations
  const alertMedicines = useMemo(() => {
    const list = [];
    const now = new Date();
    const ninetyDays = new Date();
    ninetyDays.setDate(ninetyDays.getDate() + 90);

    pharmacyMedicines.forEach(med => {
      med.batches.forEach(b => {
        const exp = new Date(b.expiry_date);
        if (exp < now) {
          list.push({ ...med, batch: b, alertType: 'EXPIRED' });
        } else if (exp <= ninetyDays) {
          const daysLeft = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
          list.push({ ...med, batch: b, alertType: 'NEAR_EXPIRY', daysLeft });
        }
      });
    });
    return list;
  }, [pharmacyMedicines]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-xl">💊</span>
            <h1 className="text-2xl font-bold text-slate-800">ফার্মেসি ও FEFO ব্যাচ ডিসপেনসিং (Pharmacy Management)</h1>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            ফার্স্ট-এক্সপায়ারি-ফার্স্ট-আউট (FEFO) নীতি, জেনেরিক সার্চ, ইউনিট কনভার্সন (বক্স/পাতা/ট্যাবলেট) ও ডিজিটাল প্রেসক্রিপশন বিতরণ
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 overflow-x-auto text-sm">
          <button
            onClick={() => setActiveTab('pos')}
            className={`px-4 py-2 font-medium rounded-lg transition-all ${
              activeTab === 'pos' ? 'bg-white text-emerald-600 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🛒 ফার্মেসি বিক্রয় (POS)
          </button>
          <button
            onClick={() => setActiveTab('prescriptions')}
            className={`px-4 py-2 font-medium rounded-lg transition-all relative ${
              activeTab === 'prescriptions' ? 'bg-white text-emerald-600 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📋 প্রেসক্রিপশন কিউ
            {prescriptions.filter(p => p.dispensing_status === 'Sent to Pharmacy').length > 0 && (
              <span className="ml-1.5 px-2 py-0.5 bg-rose-500 text-white text-xs rounded-full font-bold">
                {prescriptions.filter(p => p.dispensing_status === 'Sent to Pharmacy').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 font-medium rounded-lg transition-all ${
              activeTab === 'inventory' ? 'bg-white text-emerald-600 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📦 ব্যাচ স্টক ও র্যাক
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-4 py-2 font-medium rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'alerts' ? 'bg-white text-amber-600 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ⚠️ মেয়াদ ও রিকল অ্যালার্ট
            {alertMedicines.length > 0 && (
              <span className="px-2 py-0.5 bg-amber-500 text-white text-xs rounded-full font-bold">
                {alertMedicines.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* POS TAB */}
      {activeTab === 'pos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Medicine Catalog */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="🔍 ব্র্যান্ড নাম, জেনেরিক বা বারকোড দিয়ে খুঁজুন..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">✕</button>
                )}
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Medicine Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[620px] overflow-y-auto pr-1">
              {filteredMedicines.map(med => {
                const totalStockTablets = med.batches.reduce((sum, b) => sum + b.stock_tablets, 0);
                const totalStrips = Math.floor(totalStockTablets / med.strip_size);
                const fefoBatch = getFefoBatches(med).find(b => b.stock_tablets > 0);

                return (
                  <div
                    key={med.medicine_id}
                    className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md font-semibold">
                            {med.dosage_form}
                          </span>
                          <h3 className="font-bold text-slate-800 text-base mt-1">{med.brand_name}</h3>
                          <p className="text-xs text-slate-500 italic">{med.generic_name}</p>
                        </div>
                        <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded border">
                          📍 {med.rack_location}
                        </span>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between text-xs text-slate-600 border-t border-slate-100 pt-2">
                        <span>কোম্পানি: <strong className="text-slate-700">{med.manufacturer}</strong></span>
                        <span>স্টক: <strong className={totalStockTablets < 50 ? 'text-rose-600' : 'text-emerald-700'}>
                          {totalStrips} পাতা ({totalStockTablets} টি)
                        </strong></span>
                      </div>

                      {fefoBatch && (
                        <div className="mt-2 bg-amber-50/70 border border-amber-200/60 rounded-lg p-2 text-xs text-amber-900 flex justify-between items-center">
                          <span>FEFO ব্যাচ: <strong>{fefoBatch.batch_number}</strong></span>
                          <span>মেয়াদ: <strong>{fefoBatch.expiry_date}</strong></span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="text-xs text-slate-700">
                        <div>পাতা: <strong>৳{med.strip_mrp}</strong></div>
                        <div className="text-[11px] text-slate-400">প্রতি পিস: ৳{med.unit_mrp}</div>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => addToCart(med, null, 'tablet')}
                          className="px-2.5 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold rounded-lg"
                          title="ট্যাবলেট যোগ করুন"
                        >
                          + ১ টি
                        </button>
                        <button
                          onClick={() => addToCart(med, null, 'strip')}
                          className="px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold rounded-lg shadow-sm"
                          title="পাতা যোগ করুন"
                        >
                          + ১ পাতা
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Billing & Cart */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between h-fit sticky top-4">
            <div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <span>🛒</span> বিক্রয় কার্ট (Checkout Cart)
                </h2>
                <span className="text-xs font-semibold px-2 py-1 bg-slate-100 rounded text-slate-600">
                  আইটেম: {cart.length}
                </span>
              </div>

              {/* Patient Selector */}
              <div className="mt-3 space-y-1">
                <label className="text-xs font-medium text-slate-600">রোগী নির্বাচন করুন (Patient ID / Name):</label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- সাধারণ কাস্টমার (Walk-in Customer) --</option>
                  {patients.map(p => (
                    <option key={p.patient_id} value={p.patient_id}>
                      {p.patient_id} - {p.full_name} ({p.mobile_number})
                    </option>
                  ))}
                </select>

                {/* Patient Allergy Alert */}
                {selectedPatient && selectedPatient.allergies && (
                  <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                    <span className="text-base">⚠️</span>
                    <div>
                      <strong>অ্যালার্জি সতর্কতা:</strong> {selectedPatient.allergies}
                    </div>
                  </div>
                )}

                {activePrescriptionId && (
                  <div className="p-2 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex justify-between items-center">
                    <span>সংযুক্ত প্রেসক্রিপশন: <strong>{activePrescriptionId}</strong></span>
                    <button onClick={() => setActivePrescriptionId(null)} className="text-blue-600 hover:underline">রিমুভ</button>
                  </div>
                )}
              </div>

              {/* Cart Items List */}
              <div className="mt-4 max-h-[260px] overflow-y-auto space-y-2 pr-1">
                {cart.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-sm">
                    কার্ট খালি। বাম পাশ থেকে ওষুধ নির্বাচন করুন।
                  </div>
                ) : (
                  cart.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2 text-xs">
                      <div className="flex-1">
                        <div className="font-bold text-slate-800 text-sm">{item.brand_name}</div>
                        <div className="text-slate-500">
                          ব্যাচ: <span className="font-mono">{item.batch_number}</span> | মেয়াদ: {item.expiry_date}
                        </div>
                        <div className="text-emerald-700 font-semibold mt-0.5">
                          {item.unitType === 'strip' ? '১ পাতা' : item.unitType === 'box' ? '১ বক্স' : '১ টি'} @ ৳{item.unitPrice}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center border border-slate-200 bg-white rounded-lg overflow-hidden">
                          <button
                            onClick={() => {
                              if (item.qty > 1) {
                                setCart(prev => prev.map((x, i) => i === idx ? { ...x, qty: x.qty - 1 } : x));
                              } else {
                                setCart(prev => prev.filter((_, i) => i !== idx));
                              }
                            }}
                            className="px-2 py-1 text-slate-600 hover:bg-slate-100 font-bold"
                          >
                            -
                          </button>
                          <span className="px-2.5 font-bold text-slate-800">{item.qty}</span>
                          <button
                            onClick={() => setCart(prev => prev.map((x, i) => i === idx ? { ...x, qty: x.qty + 1 } : x))}
                            className="px-2 py-1 text-slate-600 hover:bg-slate-100 font-bold"
                          >
                            +
                          </button>
                        </div>
                        <span className="font-bold text-slate-800 text-sm min-w-[50px] text-right">
                          ৳{item.unitPrice * item.qty}
                        </span>
                        <button
                          onClick={() => setCart(prev => prev.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-rose-500 font-bold px-1"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Calculations & Payment */}
            <div className="mt-4 pt-3 border-t border-slate-200 space-y-3">
              <div className="space-y-1 text-sm text-slate-600">
                <div className="flex justify-between">
                  <span>মোট সাব-টোটাল:</span>
                  <span className="font-bold text-slate-800">৳{subtotal}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>ডিসকাউন্ট (%):</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                    className="w-16 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-right text-xs"
                  />
                </div>
                <div className="flex justify-between text-base font-extrabold text-slate-900 border-t border-slate-100 pt-2">
                  <span>সর্বমোট প্রদেয়:</span>
                  <span className="text-emerald-600">৳{netPayable}</span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="grid grid-cols-4 gap-1.5 text-xs font-semibold">
                {['Cash', 'bKash', 'Nagad', 'Card'].map(m => (
                  <button
                    key={m}
                    onClick={() => setPaymentMethod(m)}
                    className={`py-2 rounded-xl border text-center transition-all ${
                      paymentMethod === m
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder={`জমা টাকা (ডিফল্ট: ৳${netPayable})`}
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
                <button
                  onClick={handleCheckout}
                  disabled={cart.length === 0}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-md transition-all text-sm flex items-center gap-2"
                >
                  <span>✓</span> বিল কনফার্ম করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRESCRIPTION QUEUE TAB */}
      {activeTab === 'prescriptions' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-800">ডাক্তারের ডিজিটাল প্রেসক্রিপশন কিউ (Pharmacy Dispense Queue)</h2>
              <p className="text-slate-500 text-xs">ডাক্তারের স্বাক্ষরিত প্রেসক্রিপশন থেকে সরাসরি ওষুধ লোড করে ডিসপেন্স করুন</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {prescriptions.map(rx => (
              <div key={rx.prescription_id} className="p-4 border border-slate-200 rounded-2xl hover:border-emerald-300 transition-all bg-slate-50 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      {rx.prescription_id}
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                      rx.dispensing_status === 'Fully Dispensed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {rx.dispensing_status || 'Sent to Pharmacy'}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-800 text-base mt-2">{rx.patient_name}</h3>
                  <p className="text-xs text-slate-500">রোগী আইডি: {rx.patient_id} | বয়স: {rx.patient_age}</p>
                  <p className="text-xs text-slate-600 mt-1">ডাক্তার: <strong>{rx.doctor_name}</strong></p>

                  <div className="mt-3 bg-white p-3 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="text-xs font-semibold text-slate-700">প্রেসক্রাইবড ওষুধসমূহ:</div>
                    {rx.medicines.map((m, i) => (
                      <div key={i} className="text-xs text-slate-600 flex justify-between">
                        <span>• {m.brand_name} ({m.strength})</span>
                        <span className="font-semibold text-slate-800">{m.frequency} - {m.duration}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex justify-end">
                  <button
                    onClick={() => loadPrescriptionToCart(rx)}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>🛒</span> কার্টে লোড করুন ও বিল করুন
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BATCH INVENTORY TAB */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-800">ব্যাচ স্টক ও র্যাক অবস্থান (Batch Inventory & Rack Location)</h2>
              <p className="text-slate-500 text-xs">প্রতিটি ওষুধের ব্যাচ নম্বর, মেয়াদ, ক্রয়মূল্য ও বিক্রয়মূল্য ট্র্যাকিং</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <th className="p-3">ওষুধের নাম</th>
                  <th className="p-3">জেনেরিক ও কোম্পানি</th>
                  <th className="p-3">র্যাক</th>
                  <th className="p-3">ব্যাচ নম্বর</th>
                  <th className="p-3">মেয়াদ উত্তীর্ণ তারিখ</th>
                  <th className="p-3">স্টক (ট্যাবলেট/পিস)</th>
                  <th className="p-3">খুচরা মূল্য (পাতা)</th>
                  <th className="p-3">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pharmacyMedicines.flatMap(med =>
                  med.batches.map((b, idx) => {
                    const isExpired = new Date(b.expiry_date) < new Date();
                    return (
                      <tr key={`${med.medicine_id}-${idx}`} className="hover:bg-slate-50/70">
                        <td className="p-3 font-bold text-slate-800">{med.brand_name}</td>
                        <td className="p-3 text-slate-500">{med.generic_name} ({med.manufacturer})</td>
                        <td className="p-3 font-mono font-semibold text-slate-700">{med.rack_location}</td>
                        <td className="p-3 font-mono font-bold text-slate-800">{b.batch_number}</td>
                        <td className="p-3 font-mono">{b.expiry_date}</td>
                        <td className="p-3 font-bold text-slate-900">{b.stock_tablets} টি</td>
                        <td className="p-3 font-semibold text-emerald-700">৳{med.strip_mrp}</td>
                        <td className="p-3">
                          {isExpired ? (
                            <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-bold text-[10px]">
                              EXPIRED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                              AVAILABLE
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EXPIRY ALERTS TAB */}
      {activeTab === 'alerts' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-800">মেয়াদোত্তীর্ণ ও আসন্ন মেয়াদোত্তীর্ণ ওষুধ (FEFO Safety Alerts)</h2>
              <p className="text-slate-500 text-xs">মেয়াদোত্তীর্ণ ওষুধ বিক্রয় সম্পূর্ণ নিষিদ্ধ এবং ৯০ দিনের মধ্যে মেয়াদোত্তীর্ণ ওষুধসমূহ সতর্কবার্তা</p>
            </div>
          </div>

          <div className="space-y-3">
            {alertMedicines.map((item, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
                  item.alertType === 'EXPIRED'
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base">{item.brand_name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      item.alertType === 'EXPIRED' ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'
                    }`}>
                      {item.alertType === 'EXPIRED' ? 'মেয়াদোত্তীর্ণ (EXPIRED)' : `মেয়াদ আর ${item.daysLeft} দিন`}
                    </span>
                  </div>
                  <p className="text-xs mt-1">জেনেরিক: {item.generic_name} | কোম্পানি: {item.manufacturer}</p>
                  <p className="text-xs font-mono mt-0.5">ব্যাচ নম্বর: {item.batch.batch_number} | মেয়াদ: {item.batch.expiry_date} | অবশিষ্ট স্টক: {item.batch.stock_tablets} টি</p>
                </div>

                <div className="flex gap-2">
                  {item.alertType === 'EXPIRED' ? (
                    <button
                      onClick={() => alert(`ব্যাচ ${item.batch.batch_number} কোম্পানি রিটার্ন/ডিসপোজাল রেজিস্টারে পাঠানো হয়েছে।`)}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-sm"
                    >
                      কোম্পানি রিটার্ন করুন
                    </button>
                  ) : (
                    <button
                      onClick={() => alert(`ব্যাচ ${item.batch.batch_number} ডিসকাউন্ট ক্যাম্পেইনে যুক্ত করা হয়েছে।`)}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-sm"
                    >
                      ক্লিয়ারেন্স অফার দিন
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {lastInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="text-center pb-3 border-b border-slate-200">
              <h3 className="font-bold text-lg text-slate-800">হিসাবকিতাব ৩৬০ - হেলথকেয়ার ফার্মেসি</h3>
              <p className="text-xs text-slate-500">ক্যাশ ইনভয়েস ও রসিদ</p>
              <p className="text-xs font-mono font-bold text-emerald-700 mt-1">{lastInvoice.sale_id}</p>
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <div>তারিখ: <strong>{lastInvoice.date}</strong></div>
              <div>ক্রেতা: <strong>{lastInvoice.patient.name}</strong> ({lastInvoice.patient.phone})</div>
              {lastInvoice.prescription_id && (
                <div>প্রেসক্রিপশন: <strong>{lastInvoice.prescription_id}</strong></div>
              )}
            </div>

            <div className="border-t border-b border-slate-200 py-2 space-y-1.5 max-h-48 overflow-y-auto">
              {lastInvoice.items.map((it, idx) => (
                <div key={idx} className="flex justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800">{it.brand_name}</span> ({it.qty} {it.unitType})
                    <div className="text-[10px] text-slate-400">ব্যাচ: {it.batch_number}</div>
                  </div>
                  <span className="font-bold text-slate-800">৳{it.unitPrice * it.qty}</span>
                </div>
              ))}
            </div>

            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span>সাবটোটাল:</span>
                <span className="font-bold">৳{lastInvoice.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>ডিসকাউন্ট:</span>
                <span className="font-bold">৳{lastInvoice.discountAmount}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-800 border-t pt-1">
                <span>মোট প্রদেয়:</span>
                <span className="text-emerald-700">৳{lastInvoice.netPayable}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>পরিশোধিত ({lastInvoice.paymentMethod}):</span>
                <span className="font-bold">৳{lastInvoice.paidAmount}</span>
              </div>
              {lastInvoice.dueAmount > 0 && (
                <div className="flex justify-between text-rose-600 font-bold">
                  <span>বকেয়া:</span>
                  <span>৳{lastInvoice.dueAmount}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                🖨️ প্রিন্ট করুন
              </button>
              <button
                onClick={() => setLastInvoice(null)}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
