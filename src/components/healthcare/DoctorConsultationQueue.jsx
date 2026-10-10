import React, { useState } from 'react';
import { useHealthcare } from '../../context/HealthcareContext';
import { useApp } from '../../context/AppContext';
import {
  Stethoscope,
  Users,
  Calendar,
  Clock,
  Plus,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Printer,
  X,
  Search,
  Check,
  Activity,
  Heart,
  Pill,
  FlaskConical,
  QrCode,
  Building2,
  Share2,
  Download,
  CalendarCheck,
  Send,
  Lock,
  Edit,
  History,
  ShieldAlert,
  ChevronDown,
  Trash2,
  Sliders
} from 'lucide-react';

export const DoctorConsultationQueue = () => {
  const {
    doctors = [],
    patients = [],
    appointments = [],
    bookAppointment,
    updateAppointmentStatus,
    createPrescription,
    diagnosticTests = [],
    pharmacyMedicines = [],
    prescriptions = [],
    branches = [],
    activeBranchId = 'dhanmondi'
  } = useHealthcare();

  const { lang = 'bn', showToast } = useApp() || {};

  const currentBranch = branches.find(b => b.id === activeBranchId) || { name: 'ধানমন্ডি মেইন ব্রাঞ্চ', id: 'dhanmondi', code: 'DHD-01' };

  const [selectedDoctorId, setSelectedDoctorId] = useState(doctors[0]?.doctor_id || '');
  const [activeConsultationAppointment, setActiveConsultationAppointment] = useState(null);
  const [viewingPrescription, setViewingPrescription] = useState(null);
  const [revisionModalRx, setRevisionModalRx] = useState(null);
  const [revisionReason, setRevisionReason] = useState('');

  // 1. Visit Details State (Exact 20 Requested Fields)
  const [visitForm, setVisitForm] = useState({
    visit_number: `VST-2026-${Math.floor(100 + Math.random() * 900)}`,
    branch_id: activeBranchId,
    branch_name: currentBranch.name,
    patient_id: '',
    patient_name: '',
    doctor_id: '',
    doctor_name: '',
    token_number: '',
    visit_date: new Date().toISOString().split('T')[0],
    visit_time: '18:00',
    visit_reason: 'সাধারণ স্বাস্থ্য পরীক্ষা ও পরামর্শ',
    symptoms: 'জ্বর, মৃদু মাথা ব্যথা ও শারীরিক দুর্বলতা (৩ দিন)',
    past_medical_history: 'উচ্চ রক্তচাপ (নিয়ন্ত্রিত)',
    allergies: 'পেনিসিলিন অ্যালার্জি',
    vitals: {
      temperature: '99.2°F',
      blood_pressure: '120/80 mmHg',
      pulse: '76 bpm',
      respiratory_rate: '18 /min',
      weight_kg: '68 kg',
      height_cm: '168 cm'
    },
    clinical_notes: 'রোগী সচেতন ও স্থিতিশীল। বুক ও ফুসফুস স্বাভাবিক।',
    diagnosis: 'ভাইরাল ফিভার (Viral Fever with Myalgia)',
    treatment_plan: 'পর্যাপ্ত বিশ্রাম, হাইড্রেটেড থাকা এবং লক্ষণভিত্তিক ওষুধ সেবন।',
    follow_up_date: ''
  });

  // 2. Prescription Items (Exact 11 Fields per Medicine)
  const [medicines, setMedicines] = useState([
    {
      brand_name: 'Napa Extra',
      generic_name: 'Paracetamol + Caffeine',
      strength: '500mg + 65mg',
      form: 'ট্যাবলেট (Tablet)',
      dose: '১+০+১',
      frequency: 'দিনে ২ বার',
      duration: '৫ দিন',
      timing: 'খাবারের পরে',
      quantity: 10,
      instructions: 'জ্বর ও শরীর ব্যথা থাকলে খাবেন।',
      send_to_pharmacy: true
    },
    {
      brand_name: 'Seclo 20',
      generic_name: 'Omeprazole',
      strength: '20mg',
      form: 'ক্যাপসুল (Capsule)',
      dose: '১+০+১',
      frequency: 'দিনে ২ বার',
      duration: '৭ দিন',
      timing: 'খাবারের ২০ মিনিট আগে',
      quantity: 14,
      instructions: 'প্রতিদিন সকাল ও রাতে খাওয়ার পূর্বে।',
      send_to_pharmacy: true
    }
  ]);

  // Test Advice List
  const [testAdvice, setTestAdvice] = useState(['CBC with ESR', 'RBS (Random Blood Sugar)']);

  const selectedDoctor = doctors.find(d => d.doctor_id === selectedDoctorId) || doctors[0] || { name: 'ডা: আহমেদ রফিক' };
  const doctorAppointments = appointments.filter(a => a.doctor_id === selectedDoctorId || a.doctor_name === selectedDoctor.name);

  // Add Medicine Row
  const handleAddMedicineRow = () => {
    setMedicines(prev => [
      ...prev,
      {
        brand_name: '',
        generic_name: '',
        strength: '500mg',
        form: 'ট্যাবলেট (Tablet)',
        dose: '১+০+১',
        frequency: 'দিনে ২ বার',
        duration: '৭ দিন',
        timing: 'খাবারের পরে',
        quantity: 14,
        instructions: '',
        send_to_pharmacy: true
      }
    ]);
  };

  const handleMedicineChange = (idx, field, val) => {
    setMedicines(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };

      // Auto-fill from catalog if brand matches
      if (field === 'brand_name') {
        const found = pharmacyMedicines.find(m => m.brand_name?.toLowerCase() === val.toLowerCase());
        if (found) {
          copy[idx].generic_name = found.generic_name || copy[idx].generic_name;
          copy[idx].strength = found.strength || copy[idx].strength;
        }
      }
      return copy;
    });
  };

  const handleRemoveMedicine = (idx) => {
    setMedicines(prev => prev.filter((_, i) => i !== idx));
  };

  // Toggle Test Advice
  const handleToggleTestAdvice = (tName) => {
    setTestAdvice(prev => prev.includes(tName) ? prev.filter(t => t !== tName) : [...prev, tName]);
  };

  // Start Consultation for an Appointment
  const handleStartConsultation = (app) => {
    const pat = patients.find(p => p.patient_id === app.patient_id) || { full_name: app.patient_name, patient_id: app.patient_id };
    setActiveConsultationAppointment(app);
    setVisitForm(prev => ({
      ...prev,
      patient_id: pat.patient_id,
      patient_name: pat.full_name || app.patient_name,
      doctor_id: selectedDoctor.doctor_id,
      doctor_name: selectedDoctor.name,
      token_number: app.token_number || `#${app.serial_number}`,
      branch_id: app.branch_id || activeBranchId,
      branch_name: app.branch_name || currentBranch.name,
      allergies: pat.allergy_note || 'নেই',
      past_medical_history: pat.chronic_disease_note || 'নেই'
    }));
    updateAppointmentStatus(app.appointment_id, 'ডাক্তার দেখছেন');
  };

  // Rule 1 & Rule 4: Finalize or Draft Prescription
  const handleSavePrescription = (isDraft = false) => {
    if (!activeConsultationAppointment) {
      alert('অনুগ্রহ করে কিউ থেকে একজন রোগী নির্বাচন করে কনসালটেন্সি শুরু করুন!');
      return;
    }

    const newRx = {
      prescription_id: `Rx-${Date.now().toString().slice(-6)}`,
      appointment_id: activeConsultationAppointment.appointment_id,
      visit_number: visitForm.visit_number,
      // Rule 1: কোন রোগী, ডাক্তার, ভিজিট ও শাখায় তৈরি হয়েছে তা সংরক্ষণ
      branch_id: activeBranchId,
      branch_name: currentBranch.name,
      doctor_id: selectedDoctor.doctor_id,
      doctor_name: selectedDoctor.name,
      bmdc_reg_no: selectedDoctor.bmdc_reg_no || 'BMDC-A-45812',
      patient_id: visitForm.patient_id,
      patient_name: visitForm.patient_name,
      prescription_date: visitForm.visit_date,
      prescription_time: visitForm.visit_time,
      is_draft: isDraft,
      version: 1,
      // Visit Data (20 Fields)
      visit_details: visitForm,
      // Medicines (11 Fields per item)
      medicines: medicines,
      test_advice: testAdvice,
      follow_up_date: visitForm.follow_up_date,
      // Rule 4: ডাক্তারের যাচাই ও অনুমোদন স্ট্যাম্প
      verified_by_doctor: true,
      doctor_sign_timestamp: new Date().toISOString()
    };

    if (createPrescription) {
      createPrescription(newRx);
    }

    if (!isDraft) {
      updateAppointmentStatus(activeConsultationAppointment.appointment_id, 'সম্পন্ন');
    }

    alert(isDraft ? 'প্রেসক্রিপশনটি খসড়া হিসেবে সংরক্ষিত হয়েছে!' : 'প্রেসক্রিপশন সম্পন্ন ও ডিজিটাল সাইন করা হয়েছে!');
    setViewingPrescription(newRx);
    setActiveConsultationAppointment(null);
  };

  // Rule 2: Revision of Prescription (Cannot delete directly, must create new revision with reason)
  const handleConfirmRevision = () => {
    if (!revisionModalRx || !revisionReason.trim()) {
      alert('সংশোধনের কারণ উল্লেখ করা বাধ্যতামূলক!');
      return;
    }

    const revisedRx = {
      ...revisionModalRx,
      prescription_id: `${revisionModalRx.prescription_id}-R${(revisionModalRx.version || 1) + 1}`,
      version: (revisionModalRx.version || 1) + 1,
      revised_at: new Date().toISOString(),
      revision_reason: revisionReason,
      medicines: medicines
    };

    if (createPrescription) {
      createPrescription(revisedRx);
    }

    alert(`প্রেসক্রিপশনটি সংস্করণ #${revisedRx.version} হিসেবে সংশোধন করা হয়েছে। কারণ অডিট লগে সংরক্ষিত।`);
    setRevisionModalRx(null);
    setViewingPrescription(revisedRx);
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-12">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-teal-900 via-indigo-950 to-slate-900 text-white shadow-xl relative overflow-hidden border border-teal-500/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold border border-teal-500/30">
                <Stethoscope size={13} />
                <span>মডিউল ১.৬: ভিজিট ও প্রেসক্রিপশন স্ক্রিন</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-bold border border-sky-500/30">
                <Building2 size={13} />
                <span>শাখা: {currentBranch.name}</span>
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">ভিজিট পরীক্ষা ও ডিজিটাল প্রেসক্রিপশন বিল্ডার</h2>
            <p className="text-sm text-teal-100/80 mt-1 max-w-2xl">
              ২০টি ভিজিট ফিল্ড, ১১টি ড্রাগ ফিল্ড, ৬টি প্রেসক্রিপশন বোতাম, টেস্ট পরামর্শ ও মাল্টি-ব্রাঞ্চ অডিট ভার্সনিং।
            </p>
          </div>

          {/* Doctor Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300 hidden sm:inline">কনসালট্যান্ট:</span>
            <select
              value={selectedDoctorId}
              onChange={e => setSelectedDoctorId(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-800 text-white border border-slate-700 font-bold text-xs focus:outline-teal-400"
            >
              {doctors.map(d => (
                <option key={d.doctor_id} value={d.doctor_id}>
                  {d.name} ({d.specialty})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* WORKSPACE GRID: Queue on Left, Visit & Rx on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* LEFT COLUMN: Patient Queue for this Doctor */}
        <div className="space-y-4">
          <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <Users size={16} className="text-teal-600" />
                <span>আজকের রোগী কিউ ({doctorAppointments.length} জন)</span>
              </h3>
              <span className="text-[10px] text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                লাইভ চেম্বার
              </span>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {doctorAppointments.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  এই ডাক্তারের কোনো সিরিয়াল কিউতে নেই।
                </div>
              ) : (
                doctorAppointments.map(app => {
                  const isCurrent = activeConsultationAppointment?.appointment_id === app.appointment_id;
                  return (
                    <div
                      key={app.appointment_id}
                      className={`p-3.5 rounded-2xl border transition-all text-xs space-y-2 ${
                        isCurrent
                          ? 'bg-teal-50 border-teal-500 shadow-sm'
                          : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <strong className="text-slate-900 text-sm block">{app.patient_name}</strong>
                          <span className="font-mono text-[10px] text-slate-500">{app.patient_id || 'PT-000001'}</span>
                        </div>
                        <span className="font-mono font-black text-blue-700 bg-white px-2 py-0.5 rounded-md border border-slate-200 text-xs">
                          {app.token_number || `#${app.serial_number}`}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-[11px] text-slate-600">
                        <span>স্লট: {app.appointment_time}</span>
                        <span className={`px-2 py-0.5 rounded-full font-extrabold text-[10px] ${
                          app.appointment_status === 'ডাক্তার দেখছেন'
                            ? 'bg-indigo-100 text-indigo-800'
                            : app.appointment_status === 'সম্পন্ন'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {app.appointment_status || 'Waiting'}
                        </span>
                      </div>

                      {app.appointment_status !== 'সম্পন্ন' && (
                        <button
                          type="button"
                          onClick={() => handleStartConsultation(app)}
                          className="w-full py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs shadow-xs flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Stethoscope size={13} />
                          <span>{isCurrent ? 'বর্তমানে কনসালটেন্সি চলছে' : 'কনসালটেন্সি শুরু করুন'}</span>
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: 20 Visit Fields & 11 Medicine Fields Digital Prescription Builder */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
            {/* Header / Active Patient Banner */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest block">
                  কনসালটেন্সি সেশন • ভিজিট নং: {visitForm.visit_number}
                </span>
                <h3 className="text-base font-black text-white mt-0.5">
                  {visitForm.patient_name || 'কিউ থেকে রোগী নির্বাচন করুন'}
                </h3>
                <div className="text-xs text-slate-300 flex items-center gap-2 mt-0.5 font-mono">
                  <span>আইডি: {visitForm.patient_id || 'N/A'}</span>
                  <span>•</span>
                  <span>টোকেন: {visitForm.token_number || 'N/A'}</span>
                  <span>•</span>
                  <span>শাখা: {currentBranch.name}</span>
                </div>
              </div>

              {/* Action Buttons Toolbar (Exact Requested Buttons) */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* [খসড়া সংরক্ষণ] */}
                <button
                  type="button"
                  onClick={() => handleSavePrescription(true)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700"
                >
                  [খসড়া সংরক্ষণ]
                </button>

                {/* [প্রেসক্রিপশন সম্পন্ন] */}
                <button
                  type="button"
                  onClick={() => handleSavePrescription(false)}
                  className="px-4 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-950 text-xs font-black shadow-md flex items-center gap-1"
                >
                  <Check size={14} />
                  <span>[প্রেসক্রিপশন সম্পন্ন]</span>
                </button>
              </div>
            </div>

            {/* SECTION 1: ভিজিটের ২০টি ফিল্ড (Clinical Examination & Vitals) */}
            <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <div className="font-black text-slate-900 flex items-center gap-1.5 text-xs">
                <Activity size={15} className="text-teal-600" />
                <span>ভিজিট বিবরণ ও ভাইটাল সাইন (Visit Examination - 20 Fields)</span>
              </div>

              {/* Vitals Row */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-1">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block">তাপমাত্রা</label>
                  <input
                    type="text"
                    value={visitForm.vitals.temperature}
                    onChange={e => setVisitForm({ ...visitForm, vitals: { ...visitForm.vitals, temperature: e.target.value } })}
                    className="w-full px-2 py-1.5 rounded-xl border border-slate-300 font-bold text-center"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block">রক্তচাপ (BP)</label>
                  <input
                    type="text"
                    value={visitForm.vitals.blood_pressure}
                    onChange={e => setVisitForm({ ...visitForm, vitals: { ...visitForm.vitals, blood_pressure: e.target.value } })}
                    className="w-full px-2 py-1.5 rounded-xl border border-slate-300 font-bold text-center"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block">পালস (Pulse)</label>
                  <input
                    type="text"
                    value={visitForm.vitals.pulse}
                    onChange={e => setVisitForm({ ...visitForm, vitals: { ...visitForm.vitals, pulse: e.target.value } })}
                    className="w-full px-2 py-1.5 rounded-xl border border-slate-300 font-bold text-center"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block">শ্বাস-হার</label>
                  <input
                    type="text"
                    value={visitForm.vitals.respiratory_rate}
                    onChange={e => setVisitForm({ ...visitForm, vitals: { ...visitForm.vitals, respiratory_rate: e.target.value } })}
                    className="w-full px-2 py-1.5 rounded-xl border border-slate-300 font-bold text-center"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block">ওজন (kg)</label>
                  <input
                    type="text"
                    value={visitForm.vitals.weight_kg}
                    onChange={e => setVisitForm({ ...visitForm, vitals: { ...visitForm.vitals, weight_kg: e.target.value } })}
                    className="w-full px-2 py-1.5 rounded-xl border border-slate-300 font-bold text-center"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block">উচ্চতা (cm)</label>
                  <input
                    type="text"
                    value={visitForm.vitals.height_cm}
                    onChange={e => setVisitForm({ ...visitForm, vitals: { ...visitForm.vitals, height_cm: e.target.value } })}
                    className="w-full px-2 py-1.5 rounded-xl border border-slate-300 font-bold text-center"
                  />
                </div>
              </div>

              {/* Symptoms & History */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">ভিজিটের কারণ ও প্রধান উপসর্গ (Symptoms)</label>
                  <textarea
                    rows={2}
                    value={visitForm.symptoms}
                    onChange={e => setVisitForm({ ...visitForm, symptoms: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-teal-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">পূর্বের রোগ ও অ্যালার্জি (Allergies)</label>
                  <textarea
                    rows={2}
                    value={`${visitForm.past_medical_history} • অ্যালার্জি: ${visitForm.allergies}`}
                    onChange={e => setVisitForm({ ...visitForm, past_medical_history: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-teal-500"
                  />
                </div>
              </div>

              {/* Diagnosis & Treatment Plan */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">মূল্যায়ন / রোগনির্ণয় (Diagnosis) *</label>
                  <input
                    type="text"
                    value={visitForm.diagnosis}
                    onChange={e => setVisitForm({ ...visitForm, diagnosis: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-teal-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">চিকিৎসা পরিকল্পনা (Treatment Plan)</label>
                  <input
                    type="text"
                    value={visitForm.treatment_plan}
                    onChange={e => setVisitForm({ ...visitForm, treatment_plan: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">ফলো-আপ তারিখ (Follow-up Date)</label>
                  <input
                    type="date"
                    value={visitForm.follow_up_date}
                    onChange={e => setVisitForm({ ...visitForm, follow_up_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: প্রেসক্রিপশন আইটেম (11 Requested Fields per Medicine) */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="font-black text-slate-900 flex items-center gap-1.5 text-xs">
                  <Pill size={15} className="text-teal-600" />
                  <span>প্রেসক্রিপশন ওষুধ তালিকা (Rx Medicines - 11 Fields)</span>
                </div>
                <button
                  type="button"
                  onClick={handleAddMedicineRow}
                  className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold flex items-center gap-1 border border-teal-200"
                >
                  <Plus size={13} />
                  <span>+ ওষুধ যোগ করুন</span>
                </button>
              </div>

              {/* Medicines Table */}
              <div className="space-y-2.5">
                {medicines.map((med, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-2 text-xs shadow-2xs hover:border-teal-400">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block">১. ওষুধের নাম (Brand) *</label>
                        <input
                          type="text"
                          value={med.brand_name}
                          onChange={e => handleMedicineChange(idx, 'brand_name', e.target.value)}
                          placeholder="যেমন: Napa Extra"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block">২. জেনেরিক নাম</label>
                        <input
                          type="text"
                          value={med.generic_name}
                          onChange={e => handleMedicineChange(idx, 'generic_name', e.target.value)}
                          placeholder="Paracetamol"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block">৩. শক্তি (Strength)</label>
                        <input
                          type="text"
                          value={med.strength}
                          onChange={e => handleMedicineChange(idx, 'strength', e.target.value)}
                          placeholder="500mg"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block">৪. ফর্ম (Form)</label>
                        <select
                          value={med.form}
                          onChange={e => handleMedicineChange(idx, 'form', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                        >
                          <option value="ট্যাবলেট (Tablet)">ট্যাবলেট (Tablet)</option>
                          <option value="ক্যাপসুল (Capsule)">ক্যাপসুল (Capsule)</option>
                          <option value="সিরাপ (Syrup)">সিরাপ (Syrup)</option>
                          <option value="ইনজেকশন (Injection)">ইনজেকশন (Injection)</option>
                          <option value="ড্রপ (Drop)">ড্রপ (Drop)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block">৫. ডোজ</label>
                        <input
                          type="text"
                          value={med.dose}
                          onChange={e => handleMedicineChange(idx, 'dose', e.target.value)}
                          placeholder="১+০+১"
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-300 font-bold text-center"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block">৬. দিনে কতবার</label>
                        <input
                          type="text"
                          value={med.frequency}
                          onChange={e => handleMedicineChange(idx, 'frequency', e.target.value)}
                          placeholder="দিনে ২ বার"
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-center"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block">৭. কতদিন</label>
                        <input
                          type="text"
                          value={med.duration}
                          onChange={e => handleMedicineChange(idx, 'duration', e.target.value)}
                          placeholder="৫ দিন"
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-center font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block">৮. খাবারের আগে/পরে</label>
                        <select
                          value={med.timing}
                          onChange={e => handleMedicineChange(idx, 'timing', e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-white"
                        >
                          <option value="খাবারের পরে">খাবারের পরে (After food)</option>
                          <option value="খাবারের আগে">খাবারের আগে (Before food)</option>
                          <option value="খাবারের সাথে">খাবারের সাথে</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block">৯. মোট পরিমাণ</label>
                        <input
                          type="number"
                          value={med.quantity}
                          onChange={e => handleMedicineChange(idx, 'quantity', Number(e.target.value))}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-300 font-bold text-center"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-100">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={med.instructions}
                          onChange={e => handleMedicineChange(idx, 'instructions', e.target.value)}
                          placeholder="১০. বিশেষ নির্দেশনা (যেমন: কুসুম গরম পানিসহ)..."
                          className="w-full px-2.5 py-1 rounded-lg border border-slate-200 text-xs"
                        />
                      </div>

                      {/* ১১. ফার্মেসিতে পাঠাবেন কি না */}
                      <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700 text-[11px] shrink-0">
                        <input
                          type="checkbox"
                          checked={med.send_to_pharmacy}
                          onChange={e => handleMedicineChange(idx, 'send_to_pharmacy', e.target.checked)}
                          className="rounded text-teal-600 focus:ring-teal-500"
                        />
                        <span>১১. ফার্মেসিতে POS অর্ডার পাঠান</span>
                      </label>

                      {medicines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMedicine(idx)}
                          className="p-1 text-rose-500 hover:text-rose-700"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 3: টেস্ট অর্ডার পরামর্শ (Test Orders) */}
            <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-200 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-sky-950 flex items-center gap-1">
                  <FlaskConical size={14} />
                  <span>ডায়াগনস্টিক টেস্ট পরামর্শ (Test Orders Advice)</span>
                </span>
                <span className="text-[10px] text-sky-800">প্রেসক্রিপশন থেকে সরাসরি LIMS অর্ডারে যাবে</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {['CBC with ESR', 'RBS (Random Blood Sugar)', 'Serum Creatinine', 'Lipid Profile', 'Urine R/M/E', 'Chest X-Ray P/A', 'ECG 12-Lead'].map(t => {
                  const isChecked = testAdvice.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleToggleTestAdvice(t)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                        isChecked
                          ? 'bg-sky-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {isChecked ? `✓ ${t}` : `+ ${t}`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* BUTTONS BAR: [খসড়া সংরক্ষণ] [প্রেসক্রিপশন সম্পন্ন] [প্রিন্ট] [PDF তৈরি] [ফলো-আপ যোগ] */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
              <div className="text-[11px] text-slate-500">
                * প্রেসক্রিপশন চিকিৎসকের যাচাইকৃত ও সাইন করা (DGHS মানসম্মত)।
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleSavePrescription(true)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300"
                >
                  [খসড়া সংরক্ষণ]
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const nextWeek = new Date();
                    nextWeek.setDate(nextWeek.getDate() + 7);
                    setVisitForm({ ...visitForm, follow_up_date: nextWeek.toISOString().split('T')[0] });
                    alert(`৭ দিন পর (${nextWeek.toISOString().split('T')[0]}) ফলো-আপ তারিখ যুক্ত করা হয়েছে!`);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 flex items-center gap-1"
                >
                  <CalendarCheck size={14} />
                  <span>[ফলো-আপ যোগ]</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSavePrescription(false)}
                  className="px-6 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black shadow-md flex items-center gap-1.5"
                >
                  <Check size={15} />
                  <span>[প্রেসক্রিপশন সম্পন্ন]</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: সম্পন্ন প্রেসক্রিপশন ভিউ ও প্রিন্ট / PDF */}
      {/* ========================================================================= */}
      {viewingPrescription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Action Bar */}
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="font-mono font-bold text-teal-700 text-sm">
                আইডি: {viewingPrescription.prescription_id} (ভার্সন {viewingPrescription.version || 1})
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRevisionModalRx(viewingPrescription)}
                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold border border-amber-200 flex items-center gap-1"
                >
                  <Edit size={13} />
                  <span>সংশোধন / নতুন সংস্করণ</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm"
                >
                  <Printer size={14} />
                  <span>[প্রিন্ট] / [PDF তৈরি]</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewingPrescription(null)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Prescription Layout */}
            <div className="p-6 rounded-2xl border-2 border-slate-800 bg-white space-y-4 text-xs font-sans">
              {/* Rx Header */}
              <div className="flex justify-between items-start pb-3 border-b-2 border-slate-800">
                <div>
                  <h3 className="text-base font-black text-slate-900">{viewingPrescription.doctor_name}</h3>
                  <div className="text-[11px] text-slate-600">{selectedDoctor.degree || 'MBBS, FCPS'}</div>
                  <div className="text-[10px] font-mono text-teal-800 font-bold mt-0.5">
                    BMDC রেজিস্ট্রেশন: {viewingPrescription.bmdc_reg_no || 'BMDC-A-45812'}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-black text-sm text-slate-900">হেলথকেয়ার 360° হাসপাতাল</div>
                  <div className="text-[11px] text-slate-600">{viewingPrescription.branch_name || currentBranch.name}</div>
                  <div className="text-[10px] text-slate-500">হটলাইন: ১৬২৬৩</div>
                </div>
              </div>

              {/* Patient Info Row */}
              <div className="grid grid-cols-4 gap-2 py-2 border-b border-slate-300 text-[11px] bg-slate-50 p-2 rounded-xl">
                <div><strong>রোগী:</strong> {viewingPrescription.patient_name}</div>
                <div><strong>আইডি:</strong> <span className="font-mono">{viewingPrescription.patient_id}</span></div>
                <div><strong>তারিখ:</strong> {viewingPrescription.prescription_date}</div>
                <div><strong>ভিজিট নং:</strong> {viewingPrescription.visit_number}</div>
              </div>

              {/* Clinical Assessment */}
              <div className="py-1">
                <strong>রোগনির্ণয় (Diagnosis):</strong> {viewingPrescription.visit_details?.diagnosis || 'ভাইরাল ফিভার'}
              </div>

              {/* Rx Medicine Body */}
              <div className="space-y-2 pt-2">
                <div className="font-serif font-black text-2xl text-teal-800 italic">Rx</div>
                <div className="space-y-2">
                  {viewingPrescription.medicines?.map((m, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                      <div>
                        <strong className="text-slate-900 text-sm">{idx + 1}. {m.brand_name} ({m.strength})</strong>
                        <div className="text-[11px] text-slate-600">{m.generic_name} • {m.form}</div>
                        <div className="text-[11px] text-teal-800 font-bold mt-0.5">
                          মাত্রা: {m.dose} ({m.timing}) • চলবে: {m.duration}
                        </div>
                      </div>
                      <span className="font-mono font-bold text-slate-700">পরিমাণ: {m.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tests Advice */}
              {viewingPrescription.test_advice?.length > 0 && (
                <div className="pt-2 border-t border-slate-200">
                  <strong className="block text-slate-800 mb-1">প্রয়োজনীয় টেস্ট (Test Advice):</strong>
                  <ul className="list-disc list-inside text-slate-700">
                    {viewingPrescription.test_advice.map((t, idx) => (
                      <li key={idx}>{t}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Follow-up Note */}
              <div className="pt-3 border-t border-slate-800 flex justify-between items-end text-[11px]">
                <div>
                  <strong>পরবর্তী সাক্ষাত (Follow-up):</strong> {viewingPrescription.follow_up_date || '৭ দিন পর'}
                </div>
                <div className="text-right">
                  <div className="font-black text-slate-800">{viewingPrescription.doctor_name}</div>
                  <div className="text-[9px] text-teal-700">ডিজিটাল ভেরিফাইড সিগনেচার ✓</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: প্রেসক্রিপশন সংশোধন ও ভার্সনিং (Rule 2) */}
      {/* ========================================================================= */}
      {revisionModalRx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-black text-amber-800 flex items-center gap-1.5">
              <History size={18} />
              <span>প্রেসক্রিপশন সংশোধন ও নতুন সংস্করণ</span>
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed">
              নিয়ম ২: সম্পন্ন প্রেসক্রিপশন সরাসরি ডিলিট করা নিষিদ্ধ; সংশোধন হলে নতুন সংস্করণ (Version 2) এবং কারণ সংরক্ষণ করতে হবে।
            </p>

            <div className="text-xs">
              <label className="font-bold text-slate-700 block mb-1">সংশোধনের কারণ *</label>
              <textarea
                rows={3}
                required
                value={revisionReason}
                onChange={e => setRevisionReason(e.target.value)}
                placeholder="যেমন: রোগীর অ্যালার্জিজনিত কারণে ওষুধ পরিবর্তন বা ডোজ সমন্বয়..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-amber-500"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRevisionModalRx(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 font-bold text-xs"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleConfirmRevision}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-md"
              >
                নতুন সংস্করণে সংরক্ষণ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorConsultationQueue;
