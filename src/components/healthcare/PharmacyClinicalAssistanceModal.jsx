import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Pill,
  Camera,
  Search,
  Barcode,
  Bed,
  Users,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Printer,
  Sparkles,
  HeartPulse,
  Clock,
  ShieldCheck,
  FileText,
  Plus,
  Trash2,
  Calendar,
  Phone,
  User,
  Stethoscope,
  Info
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { playButtonClick, playSuccessChime } from '../../services/soundFeedback';

/**
 * HisabKitab 360 - Pharmacy, Clinical Assistance & Healthcare Verticals Hub (Phase 8, Features 71, 72, 73, 74, 75, 76)
 * Features:
 * - 71 & 73: Generic Alternative Drug Finder with Inventory Stock Cross-Reference
 * - 72: Prescription Camera Attachment & Digital Rx Archive
 * - 74: Drug Dosage & Intake Frequency Schedule Generator (খাওয়ার নিয়ম স্লিপ)
 * - 75: Diagnostic Specimen Barcode & Sample Tube Sticker Printer
 * - 76: Inpatient Bed & Cabin Admission / Discharge Billing Engine
 */
export const PharmacyClinicalAssistanceModal = ({ isOpen, onClose, lang = 'bn' }) => {
  const { products = [], showToast = () => {} } = useApp() || {};

  const [activeTab, setActiveTab] = useState('generic_finder'); // 'generic_finder' | 'dosage_slip' | 'prescription_cam' | 'lab_barcode' | 'inpatient_cabin'

  // --------------------------------------------------------------------------
  // 1. Features 71 & 73: Generic Alternative Drug Directory & Inventory Matching
  // --------------------------------------------------------------------------
  const [genericSearch, setGenericSearch] = useState('');
  
  // Standard BD DGDA Essential Generic Reference Database (Used purely as reference directory, zero fake transactions)
  const referenceGenerics = useMemo(() => [
    { brand: 'Napa 500mg', generic: 'Paracetamol', strength: '500mg', form: 'Tablet', company: 'Beximco' },
    { brand: 'Ace 500mg', generic: 'Paracetamol', strength: '500mg', form: 'Tablet', company: 'Square' },
    { brand: 'Fast 500mg', generic: 'Paracetamol', strength: '500mg', form: 'Tablet', company: 'Acme' },
    { brand: 'Renova 500mg', generic: 'Paracetamol', strength: '500mg', form: 'Tablet', company: 'Opsonin' },
    { brand: 'Seclo 20mg', generic: 'Omeprazole', strength: '20mg', form: 'Capsule', company: 'Square' },
    { brand: 'Losectil 20mg', generic: 'Omeprazole', strength: '20mg', form: 'Capsule', company: 'SK+F' },
    { brand: 'Maxpro 20mg', generic: 'Esomeprazole', strength: '20mg', form: 'Tablet', company: 'Aristopharma' },
    { brand: 'Nexum 20mg', generic: 'Esomeprazole', strength: '20mg', form: 'Tablet', company: 'Incepta' },
    { brand: 'Monas 10mg', generic: 'Montelukast', strength: '10mg', form: 'Tablet', company: 'Square' },
    { brand: 'Odmon 10mg', generic: 'Montelukast', strength: '10mg', form: 'Tablet', company: 'Incepta' },
    { brand: 'Zimax 500mg', generic: 'Azithromycin', strength: '500mg', form: 'Tablet', company: 'Square' },
    { brand: 'Azithral 500mg', generic: 'Azithromycin', strength: '500mg', form: 'Tablet', company: 'Beximco' },
    { brand: 'Ciprocin 500mg', generic: 'Ciprofloxacin', strength: '500mg', form: 'Tablet', company: 'Square' },
    { brand: 'Neofloxin 500mg', generic: 'Ciprofloxacin', strength: '500mg', form: 'Tablet', company: 'Beximco' },
    { brand: 'Compath 500mg', generic: 'Metformin HCl', strength: '500mg', form: 'Tablet', company: 'Square' },
    { brand: 'Glucinor 500mg', generic: 'Metformin HCl', strength: '500mg', form: 'Tablet', company: 'Beximco' },
    { brand: 'Camlosart 5/50', generic: 'Amlodipine + Losartan', strength: '5/50mg', form: 'Tablet', company: 'Square' }
  ], []);

  // Cross-reference user's actual inventory products
  const matchedGenerics = useMemo(() => {
    const q = genericSearch.trim().toLowerCase();
    if (!q) return referenceGenerics.slice(0, 10);

    // Filter reference directory
    return referenceGenerics.filter(
      (m) => m.generic.toLowerCase().includes(q) || m.brand.toLowerCase().includes(q) || m.company.toLowerCase().includes(q)
    );
  }, [genericSearch, referenceGenerics]);

  // Actual inventory items that match the searched generic or brand
  const matchingInventoryProducts = useMemo(() => {
    const q = genericSearch.trim().toLowerCase();
    if (!q || !products.length) return [];
    return products.filter((p) => {
      const name = (p.name || '').toLowerCase();
      const cat = (p.category || '').toLowerCase();
      const generic = (p.generic || p.generic_name || '').toLowerCase();
      return name.includes(q) || cat.includes(q) || generic.includes(q);
    });
  }, [genericSearch, products]);

  // --------------------------------------------------------------------------
  // 2. Feature 74: Drug Dosage & Intake Frequency Schedule Generator (খাওয়ার নিয়ম স্লিপ)
  // --------------------------------------------------------------------------
  const [dosageList, setDosageList] = useState([
    { id: 1, medicine: '', morning: '১', noon: '০', night: '১', timing: 'ভরা পেটে', duration: '৭ দিন', instruction: 'পানি বেশি খাবেন' }
  ]);
  const [patientDosageInfo, setPatientDosageInfo] = useState({ name: '', phone: '', doctor: '', date: new Date().toISOString().slice(0, 10) });

  const addDosageRow = () => {
    setDosageList((prev) => [
      ...prev,
      { id: Date.now(), medicine: '', morning: '১', noon: '১', night: '১', timing: 'ভরা পেটে', duration: '৫ দিন', instruction: '' }
    ]);
  };

  const removeDosageRow = (id) => {
    setDosageList((prev) => prev.filter((r) => r.id !== id));
  };

  const updateDosageRow = (id, field, val) => {
    setDosageList((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: val } : r)));
  };

  // --------------------------------------------------------------------------
  // 3. Feature 72: Prescription Camera Attachment & Digital Rx Archive
  // --------------------------------------------------------------------------
  const [rxArchive, setRxArchive] = useState(() => {
    try {
      const saved = localStorage.getItem('hk360_rx_archive');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [capturedPrescription, setCapturedPrescription] = useState(null);
  const [rxCustomerName, setRxCustomerName] = useState('');
  const [linkedInvoiceId, setLinkedInvoiceId] = useState('');
  const [rxNotes, setRxNotes] = useState('');

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        showToast?.('ছবির সাইজ ৩ মেগাবাইটের বেশি হতে পারবে না', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setCapturedPrescription(reader.result);
        playSuccessChime?.();
        showToast?.('প্রেসক্রিপশনের ছবি সফলভাবে লোড হয়েছে', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveRx = () => {
    if (!capturedPrescription) {
      showToast?.('অনুগ্রহ করে প্রেসক্রিপশনের ছবি তুলুন বা আপলোড করুন', 'error');
      return;
    }
    const newEntry = {
      id: `RX-${Date.now().toString(36).toUpperCase()}`,
      image: capturedPrescription,
      customerName: rxCustomerName.trim() || 'সাধারণ রোগী',
      invoiceId: linkedInvoiceId.trim() || 'N/A',
      notes: rxNotes.trim(),
      date: new Date().toLocaleDateString('bn-BD')
    };
    const updated = [newEntry, ...rxArchive];
    setRxArchive(updated);
    try {
      localStorage.setItem('hk360_rx_archive', JSON.stringify(updated.slice(0, 30)));
    } catch (err) {
      console.warn('Storage quota limit reached for rx', err);
    }
    setCapturedPrescription(null);
    setRxCustomerName('');
    setLinkedInvoiceId('');
    setRxNotes('');
    playSuccessChime?.();
    showToast?.('প্রেসক্রিপশন সফলভাবে আর্কাইভে সংরক্ষিত হয়েছে', 'success');
  };

  const handleDeleteRx = (id) => {
    const filtered = rxArchive.filter((item) => item.id !== id);
    setRxArchive(filtered);
    try {
      localStorage.setItem('hk360_rx_archive', JSON.stringify(filtered));
    } catch (e) {
      console.warn(e);
    }
    showToast?.('প্রেসক্রিপশন মুছে ফেলা হয়েছে', 'info');
  };

  // --------------------------------------------------------------------------
  // 4. Feature 75: Diagnostic Specimen Barcode & Sample Tube Sticker
  // --------------------------------------------------------------------------
  const [labSpecimen, setLabSpecimen] = useState({
    patientName: '',
    patientAgeGender: '',
    testName: '',
    sampleType: 'Whole Blood (EDTA)',
    barcode: `LAB-${Date.now().toString().slice(-6)}`
  });

  // --------------------------------------------------------------------------
  // 5. Feature 76: Inpatient Bed & Cabin Admission / Discharge Billing Engine
  // --------------------------------------------------------------------------
  const [cabinBilling, setCabinBilling] = useState({
    patientName: '',
    cabinType: 'এসি কেবিন (Cabin)',
    dailyRate: 0,
    days: 1,
    oxygenHours: 0,
    oxygenRatePerHour: 200,
    nursingChargePerDay: 500,
    doctorVisits: 0,
    doctorFeePerVisit: 800,
    otCharges: 0,
    medicineBill: 0,
    advancePaid: 0
  });

  const totalHospitalBill = useMemo(() => {
    const cabin = (Number(cabinBilling.dailyRate) || 0) * (Number(cabinBilling.days) || 0);
    const oxygen = (Number(cabinBilling.oxygenHours) || 0) * (Number(cabinBilling.oxygenRatePerHour) || 0);
    const nursing = (Number(cabinBilling.nursingChargePerDay) || 0) * (Number(cabinBilling.days) || 0);
    const doctor = (Number(cabinBilling.doctorVisits) || 0) * (Number(cabinBilling.doctorFeePerVisit) || 0);
    const ot = Number(cabinBilling.otCharges) || 0;
    const med = Number(cabinBilling.medicineBill) || 0;
    return cabin + oxygen + nursing + doctor + ot + med;
  }, [cabinBilling]);

  const netPayableHospitalBill = useMemo(() => {
    const net = totalHospitalBill - (Number(cabinBilling.advancePaid) || 0);
    return net > 0 ? net : 0;
  }, [totalHospitalBill, cabinBilling.advancePaid]);

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
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  ফার্মাসি ও ক্লিনিক্যাল হেলথকেয়ার স্যুট
                </h3>
                <span className="hidden sm:inline-block text-[11px] px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 font-semibold border border-teal-300 dark:border-teal-800">
                  Phase 8 Healthcare
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                জেনেরিক ড্রাগ অল্টারনেটিভ, সেবনবিধি স্লিপ, প্রেসক্রিপশন আর্কাইভ, ল্যাব বারকোড ও কেবিন বিলিং
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
            onClick={() => setActiveTab('generic_finder')}
            className={`py-3 px-3 sm:px-4 text-xs font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'generic_finder'
                ? 'border-teal-500 text-teal-600 dark:text-teal-400 bg-white/50 dark:bg-slate-800/80'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Pill className="w-4 h-4" />
            জেনেরিক বিকল্প ওষুধ
          </button>
          <button
            onClick={() => setActiveTab('dosage_slip')}
            className={`py-3 px-3 sm:px-4 text-xs font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'dosage_slip'
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400 bg-white/50 dark:bg-slate-800/80'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            ওষুধ সেবনবিধি স্লিপ (১+০+১)
          </button>
          <button
            onClick={() => setActiveTab('prescription_cam')}
            className={`py-3 px-3 sm:px-4 text-xs font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'prescription_cam'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white/50 dark:bg-slate-800/80'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Camera className="w-4 h-4" />
            প্রেসক্রিপশন আর্কাইভ
          </button>
          <button
            onClick={() => setActiveTab('lab_barcode')}
            className={`py-3 px-3 sm:px-4 text-xs font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'lab_barcode'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-white/50 dark:bg-slate-800/80'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Barcode className="w-4 h-4" />
            ল্যাব টেস্ট ও টিউব বারকোড
          </button>
          <button
            onClick={() => setActiveTab('inpatient_cabin')}
            className={`py-3 px-3 sm:px-4 text-xs font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'inpatient_cabin'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-white/50 dark:bg-slate-800/80'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Bed className="w-4 h-4" />
            ইনডোর বেড ও কেবিন বিলিং
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: GENERIC ALTERNATIVE FINDER */}
          {activeTab === 'generic_finder' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 flex items-start gap-3">
                <Pill className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                <div className="text-xs text-teal-800 dark:text-teal-200 leading-relaxed">
                  <strong>জেনেরিক সাবস্টিটিউট ফাইন্ডার:</strong> নির্দিষ্ট কোনো ব্র্যান্ডের ওষুধ ফুরিয়ে গেলে কাস্টমার না ফিরিয়ে দিয়ে
                  একই জেনেরিকের কোন কোন ব্র্যান্ড স্টকে রয়েছে তা তাৎক্ষণিক দেখে বিক্রি সম্পন্ন করুন।
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="জেনেরিক বা ব্র্যান্ডের নাম দিয়ে খুঁজুন (যেমন: Paracetamol, Omeprazole, Montelukast, Napa, Seclo)..."
                  value={genericSearch}
                  onChange={(e) => setGenericSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Live Inventory Matches (Real Stock) */}
              {matchingInventoryProducts.length > 0 && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      আপনার নিজস্ব ইনভেন্টরিতে প্রাপ্ত ওষুধ ({matchingInventoryProducts.length}টি আইটেম):
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {matchingInventoryProducts.map((p) => (
                      <div key={p.id} className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border text-xs flex justify-between items-center">
                        <div>
                          <div className="font-bold text-slate-800 dark:text-white">{p.name}</div>
                          <div className="text-[10px] text-slate-400">{p.category || 'মেডিসিন'}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-emerald-600">৳{p.selling_price || p.price || 0}</div>
                          <div className="text-[10px] text-slate-500">স্টক: {p.stock || 0}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* National Generic Directory Reference */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-800/60 shadow-sm text-xs">
                <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex justify-between items-center">
                  <span>জাতীয় ঔষধ ডিরেক্টরি রেফারেন্স তালিকা (Generic Reference)</span>
                  <span className="text-[10px] font-normal text-slate-500">স্ট্যান্ডার্ড বাংলাদেশ ফার্মাকোপিয়া</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 text-[11px] border-b dark:border-slate-700">
                      <tr>
                        <th className="p-2.5">ব্র্যান্ড নাম</th>
                        <th className="p-2.5">মূল উপাদান (Generic)</th>
                        <th className="p-2.5">পাওয়ার ও রূপ</th>
                        <th className="p-2.5">কোম্পানি</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700 font-medium">
                      {matchedGenerics.map((med, i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="p-2.5 font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
                            <Pill className="w-3.5 h-3.5" /> {med.brand}
                          </td>
                          <td className="p-2.5 font-semibold text-slate-700 dark:text-slate-200">{med.generic}</td>
                          <td className="p-2.5 text-slate-500">{med.strength} ({med.form})</td>
                          <td className="p-2.5 text-slate-600 dark:text-slate-400">{med.company}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DOSAGE & INTAKE FREQUENCY SCHEDULE GENERATOR (Feature 74) */}
          {activeTab === 'dosage_slip' && (
            <div className="space-y-5">
              <div className="p-3.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800 flex items-start gap-3">
                <FileText className="w-5 h-5 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                <div className="text-xs text-cyan-800 dark:text-cyan-200 leading-relaxed">
                  <strong>ঔষধ সেবনবিধি স্লিপ জেনারেটর (Dosage Frequency Slip):</strong> রোগীর প্যাকেটে বা ইনভয়েসে সহজে
                  বোঝার জন্য সকাল-দুপুর-রাতের সেবন নিয়ম স্লিপ প্রস্তুত করে তাৎক্ষণিক প্রিন্ট দিন।
                </div>
              </div>

              {/* Patient Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">রোগীর নাম:</label>
                  <input
                    type="text"
                    placeholder="নাম লিখুন..."
                    value={patientDosageInfo.name}
                    onChange={(e) => setPatientDosageInfo({ ...patientDosageInfo, name: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">মোবাইল নম্বর:</label>
                  <input
                    type="text"
                    placeholder="০১৭xxxxxxxx"
                    value={patientDosageInfo.phone}
                    onChange={(e) => setPatientDosageInfo({ ...patientDosageInfo, phone: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">চিকিৎসকের নাম (ঐচ্ছিক):</label>
                  <input
                    type="text"
                    placeholder="ডাঃ..."
                    value={patientDosageInfo.doctor}
                    onChange={(e) => setPatientDosageInfo({ ...patientDosageInfo, doctor: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border text-xs"
                  />
                </div>
              </div>

              {/* Dosage Table Editor */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden text-xs">
                <div className="p-2.5 bg-slate-100 dark:bg-slate-800 font-bold flex justify-between items-center">
                  <span>ওষুধ ও সেবনবিধি তালিকা</span>
                  <button
                    onClick={addDosageRow}
                    className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> আরও ঔষধ যোগ করুন
                  </button>
                </div>
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                  {dosageList.map((row) => (
                    <div key={row.id} className="p-3 bg-white dark:bg-slate-900/60 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                      <div className="sm:col-span-4">
                        <label className="block text-[10px] text-slate-400 sm:hidden">ওষুধের নাম:</label>
                        <input
                          type="text"
                          placeholder="ওষুধের নাম (যেমন Napa 500mg)..."
                          value={row.medicine}
                          onChange={(e) => updateDosageRow(row.id, 'medicine', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border font-semibold text-xs text-slate-800 dark:text-white"
                        />
                      </div>
                      <div className="sm:col-span-3 flex items-center gap-1 justify-between">
                        <div className="text-center">
                          <span className="text-[10px] text-slate-400 block">সকাল</span>
                          <input
                            type="text"
                            value={row.morning}
                            onChange={(e) => updateDosageRow(row.id, 'morning', e.target.value)}
                            className="w-8 text-center py-1 rounded bg-slate-50 dark:bg-slate-800 border font-bold"
                          />
                        </div>
                        <span className="text-slate-400 font-bold">+</span>
                        <div className="text-center">
                          <span className="text-[10px] text-slate-400 block">দুপুর</span>
                          <input
                            type="text"
                            value={row.noon}
                            onChange={(e) => updateDosageRow(row.id, 'noon', e.target.value)}
                            className="w-8 text-center py-1 rounded bg-slate-50 dark:bg-slate-800 border font-bold"
                          />
                        </div>
                        <span className="text-slate-400 font-bold">+</span>
                        <div className="text-center">
                          <span className="text-[10px] text-slate-400 block">রাত</span>
                          <input
                            type="text"
                            value={row.night}
                            onChange={(e) => updateDosageRow(row.id, 'night', e.target.value)}
                            className="w-8 text-center py-1 rounded bg-slate-50 dark:bg-slate-800 border font-bold"
                          />
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <select
                          value={row.timing}
                          onChange={(e) => updateDosageRow(row.id, 'timing', e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border text-[11px] font-semibold"
                        >
                          <option value="ভরা পেটে">ভরা পেটে</option>
                          <option value="খালি পেটে">খালি পেটে</option>
                          <option value="খাওয়ার ৩০ মি. পূর্বে">খাওয়ার ৩০ মি. পূর্বে</option>
                          <option value="ঘুমানোর আগে">ঘুমানোর আগে</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          placeholder="মেয়াদ (৭ দিন)..."
                          value={row.duration}
                          onChange={(e) => updateDosageRow(row.id, 'duration', e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border text-[11px]"
                        />
                      </div>
                      <div className="sm:col-span-1 text-right">
                        {dosageList.length > 1 && (
                          <button
                            onClick={() => removeDosageRow(row.id)}
                            className="p-1.5 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Printable Slip Preview */}
              <div className="p-4 rounded-xl border-2 border-dashed border-cyan-400 dark:border-cyan-800 bg-cyan-50/30 dark:bg-cyan-950/20 max-w-lg mx-auto space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <div>
                    <h5 className="font-bold text-xs text-slate-800 dark:text-white">ঔষধ সেবন নির্দেশিকা স্লিপ</h5>
                    <span className="text-[10px] text-slate-500">{patientDosageInfo.name || 'সম্মানিত রোগী'} • {patientDosageInfo.date}</span>
                  </div>
                  <button
                    onClick={() => {
                      playSuccessChime?.();
                      window.print();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition"
                  >
                    <Printer className="w-3.5 h-3.5" /> প্রিন্ট স্লিপ
                  </button>
                </div>
                <div className="space-y-1.5 text-xs">
                  {dosageList.map((d, i) => (
                    <div key={d.id || i} className="p-2 rounded bg-white dark:bg-slate-900 border flex justify-between items-center">
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-100">{d.medicine || 'ঔষধের নাম'}</span>
                        <div className="text-[10px] text-slate-500">{d.timing} • {d.duration}</div>
                      </div>
                      <span className="px-2.5 py-1 rounded bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 font-black tracking-widest text-xs border border-cyan-300">
                        {d.morning} + {d.noon} + {d.night}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PRESCRIPTION CAMERA & ARCHIVE (Feature 72) */}
          {activeTab === 'prescription_cam' && (
            <div className="space-y-5">
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
                <Camera className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-800 dark:text-emerald-200 leading-relaxed">
                  <strong>ডিজিটাল প্রেসক্রিপশন আর্কাইভ:</strong> ডাক্তারের ব্যবস্থাপত্রের স্ন্যাপশট ইনভয়েসের সাথে সুরক্ষিতভাবে ক্লাউড/লোকালে সংরক্ষণ রাখুন।
                </div>
              </div>

              {/* Upload & Form Box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-slate-800/40 text-center">
                  {capturedPrescription ? (
                    <div className="space-y-3 w-full">
                      <img
                        src={capturedPrescription}
                        alt="Prescription"
                        className="max-h-56 rounded-xl border shadow-sm mx-auto object-contain"
                      />
                      <div className="flex justify-center gap-2">
                        <label className="px-3 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-bold cursor-pointer">
                          পরিবর্তন
                          <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                        </label>
                        <button
                          onClick={() => setCapturedPrescription(null)}
                          className="px-3 py-1.5 rounded-lg bg-rose-100 text-rose-700 text-xs font-bold"
                        >
                          মুছুন
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                        <Camera className="w-6 h-6" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          প্রেসক্রিপশন ছবি তুলুন বা আপলোড দিন
                        </h5>
                        <p className="text-[10px] text-slate-400 mt-0.5">ক্যামেরা বা গ্যালারি থেকে স্ন্যাপশট</p>
                      </div>
                      <label className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md cursor-pointer transition">
                        ক্যামেরা / ফাইল ওপেন করুন
                        <input type="file" accept="image/*" capture="environment" onChange={handleFileUpload} className="hidden" />
                      </label>
                    </>
                  )}
                </div>

                <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">রোগী / গ্রাহকের নাম:</label>
                    <input
                      type="text"
                      placeholder="নাম লিখুন..."
                      value={rxCustomerName}
                      onChange={(e) => setRxCustomerName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">সংযুক্ত মেমো / ইনভয়েস নম্বর (ঐচ্ছিক):</label>
                    <input
                      type="text"
                      placeholder="INV-..."
                      value={linkedInvoiceId}
                      onChange={(e) => setLinkedInvoiceId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">বিশেষ নোট / ডাক্তারের নির্দেশ:</label>
                    <textarea
                      rows={2}
                      placeholder="অ্যান্টিবায়োটিক বা নিয়ন্ত্রিত ঔষধের বিশেষ মন্তব্য..."
                      value={rxNotes}
                      onChange={(e) => setRxNotes(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border"
                    />
                  </div>
                  <button
                    onClick={handleSaveRx}
                    disabled={!capturedPrescription}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition"
                  >
                    প্রেসক্রিপশন আর্কাইভে সেভ করুন
                  </button>
                </div>
              </div>

              {/* Saved Prescriptions List */}
              {rxArchive.length > 0 && (
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden text-xs">
                  <div className="p-3 bg-slate-100 dark:bg-slate-800 font-bold flex justify-between">
                    <span>সংরক্ষিত প্রেসক্রিপশন আর্কাইভ ({rxArchive.length}টি)</span>
                  </div>
                  <div className="divide-y divide-slate-200 dark:divide-slate-700">
                    {rxArchive.map((item) => (
                      <div key={item.id} className="p-3 bg-white dark:bg-slate-900 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img src={item.image} alt="Rx" className="w-12 h-12 rounded object-cover border" />
                          <div>
                            <div className="font-bold text-slate-800 dark:text-white">{item.customerName}</div>
                            <div className="text-[10px] text-slate-400">মেমো: {item.invoiceId} • তারিখ: {item.date}</div>
                            {item.notes && <div className="text-[10px] text-slate-500 italic">{item.notes}</div>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={item.image}
                            download={`Prescription_${item.id}.jpg`}
                            className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px]"
                          >
                            ডাউনলোড
                          </a>
                          <button
                            onClick={() => handleDeleteRx(item.id)}
                            className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: LAB TEST & SPECIMEN BARCODE (Feature 75) */}
          {activeTab === 'lab_barcode' && (
            <div className="space-y-5 max-w-xl mx-auto">
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <Barcode className="w-5 h-5 text-blue-600" />
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      ডায়াগনস্টিক টেস্ট ও স্যাম্পল টিউব বারকোড
                    </h4>
                  </div>
                  <button
                    onClick={() => {
                      playSuccessChime?.();
                      window.print();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition"
                  >
                    <Printer className="w-3.5 h-3.5" /> বারকোড স্টিকার প্রিন্ট
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">রোগীর নাম:</label>
                    <input
                      type="text"
                      placeholder="যেমন: মোঃ জাহিদ হাসান"
                      value={labSpecimen.patientName}
                      onChange={(e) => setLabSpecimen({ ...labSpecimen, patientName: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">বয়স ও লিঙ্গ:</label>
                    <input
                      type="text"
                      placeholder="যেমন: ৩২ বছর / পুরুষ"
                      value={labSpecimen.patientAgeGender}
                      onChange={(e) => setLabSpecimen({ ...labSpecimen, patientAgeGender: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">টেস্টের নাম:</label>
                    <input
                      type="text"
                      placeholder="যেমন: CBC, Lipid Profile, RBS"
                      value={labSpecimen.testName}
                      onChange={(e) => setLabSpecimen({ ...labSpecimen, testName: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">স্যাম্পল ধরন:</label>
                    <select
                      value={labSpecimen.sampleType}
                      onChange={(e) => setLabSpecimen({ ...labSpecimen, sampleType: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border text-xs"
                    >
                      <option value="Whole Blood (EDTA)">Whole Blood (EDTA Tube)</option>
                      <option value="Serum (Red Cap)">Serum (Red Cap Clot Act.)</option>
                      <option value="Plasma (Sodium Fluoride)">Plasma (Fluoride Glucose)</option>
                      <option value="Urine Routine">Urine Routine (Sterile Cup)</option>
                      <option value="Stool Routine">Stool Routine Specimen</option>
                    </select>
                  </div>
                </div>

                {/* Thermal Barcode Label Preview */}
                <div className="p-4 rounded-xl border-2 border-slate-800 bg-white text-slate-900 text-center font-mono space-y-1 max-w-[280px] mx-auto shadow-md">
                  <div className="text-[11px] font-bold truncate">{labSpecimen.patientName || 'রোগীর নাম'}</div>
                  <div className="text-[10px] text-slate-600">{labSpecimen.patientAgeGender || 'বয়স / লিঙ্গ'}</div>
                  <div className="text-[10px] font-black text-blue-900 truncate">{labSpecimen.testName || 'টেস্টের নাম'}</div>
                  <div className="py-2">
                    <svg className="w-full h-10 mx-auto" viewBox="0 0 160 40">
                      {Array.from({ length: 45 }).map((_, i) => (
                        <rect
                          key={i}
                          x={i * 3.5 + 4}
                          y={2}
                          width={i % 3 === 0 ? 2.5 : 1.2}
                          height={36}
                          fill="#000"
                        />
                      ))}
                    </svg>
                  </div>
                  <div className="text-xs font-black tracking-widest">{labSpecimen.barcode}</div>
                  <div className="text-[9px] text-slate-600">{labSpecimen.sampleType} • {new Date().toLocaleDateString('bn-BD')}</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: INPATIENT BED & CABIN CHARGE CALCULATOR (Feature 76) */}
          {activeTab === 'inpatient_cabin' && (
            <div className="space-y-5 max-w-xl mx-auto">
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <Bed className="w-5 h-5 text-indigo-600" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        ইনডোর বেড, কেবিন ও ডিসচার্জ বিলিং ইঞ্জিন
                      </h4>
                      <span className="text-[10px] text-slate-400">হাসপাতাল ও ক্লিনিক সমন্বিত ক্যালকুলেটর</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      playSuccessChime?.();
                      window.print();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition"
                  >
                    <Printer className="w-3.5 h-3.5" /> ইনভয়েস প্রিন্ট
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">রোগীর নাম:</label>
                    <input
                      type="text"
                      placeholder="নাম লিখুন..."
                      value={cabinBilling.patientName}
                      onChange={(e) => setCabinBilling({ ...cabinBilling, patientName: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">কেবিন/ওয়ার্ডের ধরন:</label>
                    <input
                      type="text"
                      value={cabinBilling.cabinType}
                      onChange={(e) => setCabinBilling({ ...cabinBilling, cabinType: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">ভর্তি থাকার দিনসংখ্যা:</label>
                    <input
                      type="number"
                      min="1"
                      value={cabinBilling.days}
                      onChange={(e) => setCabinBilling({ ...cabinBilling, days: parseInt(e.target.value, 10) || 0 })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">কেবিন ভাড়া/দিন (৳):</label>
                    <input
                      type="number"
                      value={cabinBilling.dailyRate}
                      onChange={(e) => setCabinBilling({ ...cabinBilling, dailyRate: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">অক্সিজেন ব্যবহারের ঘণ্টা:</label>
                    <input
                      type="number"
                      value={cabinBilling.oxygenHours}
                      onChange={(e) => setCabinBilling({ ...cabinBilling, oxygenHours: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">ডাক্তার ভিজিট সংখ্যা:</label>
                    <input
                      type="number"
                      value={cabinBilling.doctorVisits}
                      onChange={(e) => setCabinBilling({ ...cabinBilling, doctorVisits: parseInt(e.target.value, 10) || 0 })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">ওটি / অপারেশন চার্জ (৳):</label>
                    <input
                      type="number"
                      value={cabinBilling.otCharges}
                      onChange={(e) => setCabinBilling({ ...cabinBilling, otCharges: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">ঔষধ ও টেস্ট বিল (৳):</label>
                    <input
                      type="number"
                      value={cabinBilling.medicineBill}
                      onChange={(e) => setCabinBilling({ ...cabinBilling, medicineBill: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border font-bold"
                    />
                  </div>
                </div>

                {/* Bill Breakdown Summary */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span>কেবিন ভাড়া ({cabinBilling.days} দিন):</span>
                    <span className="font-bold">৳ {(cabinBilling.dailyRate * cabinBilling.days).toLocaleString('bn-BD')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>অক্সিজেন চার্জ ({cabinBilling.oxygenHours} ঘণ্টা):</span>
                    <span className="font-bold">৳ {(cabinBilling.oxygenHours * cabinBilling.oxygenRatePerHour).toLocaleString('bn-BD')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>নার্সিং ও সার্ভিস ফি:</span>
                    <span className="font-bold">৳ {(cabinBilling.nursingChargePerDay * cabinBilling.days).toLocaleString('bn-BD')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ডাক্তার কনসালটেশন ফি:</span>
                    <span className="font-bold">৳ {(cabinBilling.doctorVisits * cabinBilling.doctorFeePerVisit).toLocaleString('bn-BD')}</span>
                  </div>
                  {Number(cabinBilling.otCharges) > 0 && (
                    <div className="flex justify-between">
                      <span>অপারেশন থিয়েটার চার্জ:</span>
                      <span className="font-bold">৳ {Number(cabinBilling.otCharges).toLocaleString('bn-BD')}</span>
                    </div>
                  )}
                  {Number(cabinBilling.medicineBill) > 0 && (
                    <div className="flex justify-between">
                      <span>ফার্মাসি ও ডায়াগনস্টিক বিল:</span>
                      <span className="font-bold">৳ {Number(cabinBilling.medicineBill).toLocaleString('bn-BD')}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-300 dark:border-slate-700 flex justify-between font-black text-sm text-indigo-600 dark:text-indigo-400">
                    <span>মোট হাসপাতাল বিল:</span>
                    <span>৳ {totalHospitalBill.toLocaleString('bn-BD')}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between text-xs text-slate-500">
          <span>HisabKitab 360 Healthcare & Pharmacy Clinical Suite</span>
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

export default PharmacyClinicalAssistanceModal;
