import React, { useState, useEffect } from 'react';
import { useHealthcare } from '../../context/HealthcareContext';
import { useApp } from '../../context/AppContext';
import {
  Users,
  Search,
  Plus,
  UserCheck,
  AlertTriangle,
  Clock,
  Phone,
  Calendar,
  Heart,
  ShieldAlert,
  FileText,
  X,
  Check,
  Edit,
  Activity,
  History,
  Pill,
  FlaskConical,
  CreditCard,
  Printer,
  Copy,
  UserX,
  Sparkles,
  ChevronRight,
  Building2,
  Building,
  Shield,
  Lock,
  Unlock,
  CheckCircle2,
  GitMerge,
  Filter,
  Eye,
  Camera,
  QrCode,
  Save,
  CalendarCheck,
  HelpCircle,
  Tag
} from 'lucide-react';
import { calculateAgeFromDOB } from '../../services/healthcareIdService';

export const PatientManager = ({ onNavigateToAppointment }) => {
  const {
    patients = [],
    addPatient,
    updatePatient,
    mergePatients,
    patientMergeAuditLogs = [],
    appointments = [],
    prescriptions = [],
    labOrders = [],
    branches = [],
    activeBranchId = 'dhanmondi',
    currentStaffRole = 'admin',
    bookAppointment
  } = useHealthcare();

  const { lang = 'bn' } = useApp() || {};

  // Active Main SubTab: 'list' | 'duplicate_check' | 'merge_audit' | 'rules'
  const [subTab, setSubTab] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState('all'); // 'all' or branch id

  // Modals & Drawers
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPatientProfile, setSelectedPatientProfile] = useState(null);
  const [profileTab, setProfileTab] = useState('overview'); // 'overview' | 'visits' | 'prescriptions' | 'tests' | 'pharmacy' | 'billing'
  const [visitHistoryModalPatient, setVisitHistoryModalPatient] = useState(null);
  const [printCardModalPatient, setPrintCardModalPatient] = useState(null);
  const [appointmentBookingPatient, setAppointmentBookingPatient] = useState(null);

  // Duplicate Check & Merge Tool State
  const [dupSearchPhone, setDupSearchPhone] = useState('');
  const [dupSearchResults, setDupSearchResults] = useState(null);
  const [mergeSourcePatient, setMergeSourcePatient] = useState(null);
  const [mergeTargetPatient, setMergeTargetPatient] = useState(null);
  const [mergeReason, setMergeReason] = useState('একই ব্যক্তির দুটি ফোন নম্বরে খোলা অ্যাকাউন্ট একীভূতকরণ');
  const [mergeSuccessNotice, setMergeSuccessNotice] = useState(null);

  // Sensitive record view unlock state (Rule 4)
  const [sensitiveUnlocked, setSensitiveUnlocked] = useState(false);

  // Current Branch reference
  const currentBranch = branches.find(b => b.id === activeBranchId) || { name: 'ধানমন্ডি মেইন ব্রাঞ্চ', code: 'DHD-01' };

  // ==========================================
  // REGISTRATION FORM STATE (Exact Requested Fields)
  // ==========================================
  const initialFormState = {
    // আবশ্যিক
    full_name: '',
    mobile_number: '',
    alt_identity: '', // বিকল্প পরিচয়
    gender: 'পুরুষ', // 'পুরুষ' | 'মহিলা' | 'অন্যান্য'
    date_of_birth: '',
    age: '',
    // ঐচ্ছিক
    photo_url: '',
    address: '',
    blood_group: 'B+',
    emergency_contact_name: '',
    emergency_contact_mobile: '',
    national_id: '',
    allergy_note: '',
    chronic_disease_note: '',
    guardian_name: '',
    guardian_relation: 'পিতা',
    clinical_notes: '',
    outstanding_due: 0,
    patient_status: 'সক্রিয়'
  };

  const [form, setForm] = useState(initialFormState);
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  // Dynamic Age / DOB calculation
  const handleDOBChange = (e) => {
    const dob = e.target.value;
    setForm(prev => {
      if (!dob) return { ...prev, date_of_birth: dob };
      const calculated = calculateAgeFromDOB(dob);
      return { ...prev, date_of_birth: dob, age: calculated.age };
    });
  };

  const handleAgeChange = (e) => {
    const val = e.target.value;
    setForm(prev => ({ ...prev, age: val }));
  };

  // Real-time Duplicate Check as user types mobile number or NID (Rule 3)
  const handleMobileOrIdentityChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));

    if (value.trim().length >= 8) {
      const match = patients.find(p =>
        (p.mobile_number && p.mobile_number.includes(value.trim())) ||
        (p.national_id && p.national_id === value.trim()) ||
        (p.alt_identity && p.alt_identity.includes(value.trim()))
      );

      if (match) {
        setDuplicateWarning({
          message: `সাবধান! "${value}" তথ্যের সঙ্গে পূর্বেই একজন রোগী নিবন্ধিত আছেন (${match.patient_id} - ${match.full_name})।`,
          patient: match
        });
      } else {
        setDuplicateWarning(null);
      }
    } else {
      setDuplicateWarning(null);
    }
  };

  // Quick Photo Sample picker
  const handleSetSamplePhoto = () => {
    const samples = [
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100'
    ];
    setForm(prev => ({ ...prev, photo_url: samples[Math.floor(Math.random() * samples.length)] }));
  };

  // Handle Save Patient (Rule 1 & Rule 2 applied)
  const handleSavePatient = (andBookAppointment = false) => {
    if (!form.full_name.trim()) {
      alert('রোগীর পূর্ণ নাম প্রদান করা আবশ্যিক!');
      return;
    }

    if (!form.mobile_number.trim() && !form.alt_identity.trim()) {
      alert('মোবাইল নম্বর অথবা বিকল্প পরিচয় প্রদান করা আবশ্যিক!');
      return;
    }

    if (!form.date_of_birth && !form.age) {
      alert('জন্মতারিখ অথবা আনুমানিক বয়স প্রদান করা আবশ্যিক!');
      return;
    }

    const calculatedAge = form.age || (form.date_of_birth ? calculateAgeFromDOB(form.date_of_birth).age : 'N/A');

    const res = addPatient({
      ...form,
      age: calculatedAge,
      calculated_age: calculatedAge,
      // Rule 1: রোগীর মূল প্রোফাইল প্রতিষ্ঠানের অধীনে থাকবে (Global Enterprise Patient)
      is_global_patient: true,
      // Rule 2: প্রথম ভিজিট/রেজিস্ট্রেশন শাখা ট্যাগ
      registered_branch_id: activeBranchId,
      registered_branch_name: currentBranch.name,
      last_visit_branch: currentBranch.name,
      last_visit_branch_id: activeBranchId,
      last_visit_date: new Date().toISOString().split('T')[0],
      outstanding_due: Number(form.outstanding_due) || 0,
      patient_status: form.patient_status || 'সক্রিয়'
    });

    if (res && res.success) {
      setShowAddModal(false);
      setForm(initialFormState);
      setDuplicateWarning(null);

      if (andBookAppointment) {
        // [সংরক্ষণ করে অ্যাপয়েন্টমেন্ট]
        setAppointmentBookingPatient(res.patient);
      } else {
        alert(`রোগী "${res.patient.full_name}" (আইডি: ${res.patient.patient_id}) সফলভাবে নিবন্ধিত হয়েছে!`);
      }
    }
  };

  // Handle Quick Appointment Booking from Patient
  const handleConfirmQuickAppointment = (doctorName, slotTime) => {
    if (!appointmentBookingPatient) return;
    if (bookAppointment) {
      bookAppointment({
        patient_id: appointmentBookingPatient.patient_id,
        patient_name: appointmentBookingPatient.full_name,
        doctor_name: doctorName || 'ডা: আহমেদ রফিক (এমবিবিএস, এফসিপিএস)',
        doctor_id: 'DOC-01',
        appointment_date: new Date().toISOString().split('T')[0],
        appointment_time: slotTime || '10:30 AM',
        branch_id: activeBranchId,
        branch_name: currentBranch.name,
        fee: 800,
        appointment_status: 'Confirmed'
      });
    }
    alert(`অ্যাপয়েন্টমেন্ট সফলভাবে কনফার্ম করা হয়েছে!\nরোগী: ${appointmentBookingPatient.full_name}\nশাখা: ${currentBranch.name}`);
    setAppointmentBookingPatient(null);
  };

  // Duplicate Search Handler
  const handleDuplicateSearch = (e) => {
    e.preventDefault();
    if (!dupSearchPhone.trim()) return;
    const q = dupSearchPhone.trim().toLowerCase();
    const matches = patients.filter(p =>
      (p.mobile_number || '').includes(q) ||
      (p.full_name || '').toLowerCase().includes(q) ||
      (p.national_id || '').includes(q) ||
      (p.patient_id || '').toLowerCase().includes(q)
    );
    setDupSearchResults(matches);
  };

  // Execute Merge (Rule 5)
  const handleExecuteMerge = () => {
    if (!mergeTargetPatient || !mergeSourcePatient) {
      alert('অনুগ্রহ করে প্রধান রোগী (Target) এবং একীভূত করার রোগী (Source) উভয়ই নির্বাচন করুন!');
      return;
    }

    if (mergeTargetPatient.patient_id === mergeSourcePatient.patient_id) {
      alert('একই রোগী নিজের সঙ্গে একীভূত করা সম্ভব নয়!');
      return;
    }

    const res = mergePatients(
      mergeTargetPatient.patient_id,
      mergeSourcePatient.patient_id,
      mergeReason,
      'সুপার অ্যাডমিন ইউজার'
    );

    if (res && res.success) {
      setMergeSuccessNotice(`সফলভাবে "${mergeSourcePatient.full_name}" (${mergeSourcePatient.patient_id}) রেকর্ডটি "${mergeTargetPatient.full_name}" (${mergeTargetPatient.patient_id})-এর সঙ্গে একীভূত করা হয়েছে! অডিট লগ সুরক্ষিত রয়েছে।`);
      setMergeSourcePatient(null);
      setMergeTargetPatient(null);
      setTimeout(() => setMergeSuccessNotice(null), 5000);
    }
  };

  // Filtered Patients List
  const filteredPatients = patients.filter(p => {
    // Exclude merged secondary profiles from primary view unless searched
    if (p.patient_status === 'একীভূত (Merged)' && !searchTerm) return false;

    if (branchFilter !== 'all') {
      const pBranch = p.last_visit_branch_id || p.registered_branch_id;
      if (pBranch && pBranch !== branchFilter) return false;
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        (p.full_name || '').toLowerCase().includes(q) ||
        (p.mobile_number || '').includes(q) ||
        (p.patient_id || '').toLowerCase().includes(q) ||
        (p.patient_code || '').toLowerCase().includes(q) ||
        (p.national_id || '').includes(q)
      );
    }
    return true;
  });

  // Helpers for patient history records
  const getPatientVisits = (pid) => appointments.filter(a => a.patient_id === pid);
  const getPatientPrescriptions = (pid) => prescriptions.filter(p => p.patient_id === pid);
  const getPatientLabOrders = (pid) => labOrders.filter(l => l.patient_id === pid);

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-12">
      {/* ========================================================================= */}
      {/* 1. HERO BANNER */}
      {/* ========================================================================= */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-teal-900 via-slate-900 to-sky-950 text-white shadow-xl relative overflow-hidden border border-teal-500/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold border border-teal-500/30">
                <Users size={13} />
                <span>মডিউল ১.৪: রোগী তালিকা ও ডিজিটাল নিবন্ধন</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-bold border border-sky-500/30">
                <Building2 size={13} />
                <span>মাল্টি-ব্রাঞ্চ সেন্ট্রাল রেজিস্ট্রি</span>
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">রোগী তালিকা ও নিবন্ধন (Patient CRM & UHID)</h2>
            <p className="text-sm text-teal-100/80 mt-1 max-w-2xl">
              প্রতিষ্ঠানের অধীনে সেন্ট্রাল প্রোফাইল, ১০টি টেবিল কলাম, আবশ্যিক ও ঐচ্ছিক ফিল্ড, ডুপ্লিকেট সনাক্তকরণ এবং একীভূতকরণ অডিট লগ।
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white text-xs font-black shadow-lg flex items-center gap-2 transition-transform hover:scale-105"
            >
              <Plus size={16} />
              <span>[নতুন রোগী] (New Patient)</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TOP SUBTABS NAVIGATION */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setSubTab('list')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all whitespace-nowrap ${
            subTab === 'list'
              ? 'bg-teal-600 text-white shadow-md'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Users size={15} />
          <span>রোগী তালিকা ({patients.length} জন)</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('duplicate_check')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all whitespace-nowrap ${
            subTab === 'duplicate_check'
              ? 'bg-teal-600 text-white shadow-md'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <GitMerge size={15} />
          <span>ডুপ্লিকেট যাচাই ও একীভূতকরণ (Merge)</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('merge_audit')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all whitespace-nowrap ${
            subTab === 'merge_audit'
              ? 'bg-teal-600 text-white shadow-md'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <History size={15} />
          <span>একীভূতকরণ অডিট লগ ({patientMergeAuditLogs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('rules')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all whitespace-nowrap ${
            subTab === 'rules'
              ? 'bg-teal-600 text-white shadow-md'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Shield size={15} />
          <span>মাল্টি-ব্রাঞ্চ ৫টি নিয়মাবলী</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUBTAB 1: রোগী তালিকা (10 Exact Requested Columns) */}
      {/* ========================================================================= */}
      {subTab === 'list' && (
        <div className="space-y-4">
          {/* Search, Filter & Quick Stats Bar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full md:w-auto flex-1">
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="রোগী আইডি (PT-000001), নাম, মোবাইল বা NID খুঁজুন..."
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-teal-500 font-medium"
                />
              </div>

              {/* Branch Selector Filter (Rule 1: Enterprise search, filterable by branch) */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-400 font-bold hidden sm:inline">শাখা:</span>
                <select
                  value={branchFilter}
                  onChange={e => setBranchFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-700 focus:outline-teal-500 text-xs"
                >
                  <option value="all">সকল শাখা (একীভূত রূপ)</option>
                  {branches.filter(b => !b.isAll).map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto">
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5"
              >
                <Plus size={15} />
                <span>[নতুন রোগী]</span>
              </button>
            </div>
          </div>

          {/* TABLE: 10 Requested Columns */}
          <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-white uppercase font-black text-[11px] tracking-wider">
                  <tr>
                    <th className="p-3.5">১. রোগী আইডি</th>
                    <th className="p-3.5">২. রোগীর নাম</th>
                    <th className="p-3.5">৩. মোবাইল</th>
                    <th className="p-3.5">৪. বয়স</th>
                    <th className="p-3.5">৫. লিঙ্গ</th>
                    <th className="p-3.5">৬. সর্বশেষ ভিজিট</th>
                    <th className="p-3.5">৭. সর্বশেষ ভিজিটের শাখা</th>
                    <th className="p-3.5 text-right">৮. বকেয়া</th>
                    <th className="p-3.5 text-center">৯. অবস্থা</th>
                    <th className="p-3.5 text-center">১০. অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {filteredPatients.map(p => {
                    const lastVisitBranchName = p.last_visit_branch || p.registered_branch_name || 'ধানমন্ডি মেইন ব্রাঞ্চ';
                    const lastVisitDate = p.last_visit_date || '১০ অক্টো ২০২৬';
                    const isDue = (Number(p.outstanding_due) || 0) > 0;

                    return (
                      <tr key={p.patient_id} className="hover:bg-teal-50/40 transition-colors">
                        {/* ১. রোগী আইডি */}
                        <td className="p-3.5">
                          <span className="font-mono font-black text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 inline-block">
                            {p.patient_id}
                          </span>
                          {p.patient_code && (
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">{p.patient_code}</div>
                          )}
                        </td>

                        {/* ২. রোগীর নাম */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            {p.photo_url ? (
                              <img src={p.photo_url} alt="" className="w-8 h-8 rounded-full object-cover border border-teal-200" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-sky-600 text-white font-black flex items-center justify-center text-xs shrink-0">
                                {p.full_name ? p.full_name[0] : 'P'}
                              </div>
                            )}
                            <div>
                              <div className="font-black text-slate-900 text-xs hover:text-teal-600 cursor-pointer" onClick={() => setSelectedPatientProfile(p)}>
                                {p.full_name}
                              </div>
                              <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                {p.blood_group && <span className="font-bold text-rose-600">[{p.blood_group}]</span>}
                                {p.address ? <span className="truncate max-w-[120px]">{p.address}</span> : <span>ঠিকানা নেই</span>}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* ৩. মোবাইল */}
                        <td className="p-3.5">
                          <div className="font-mono font-bold text-slate-800">{p.mobile_number || p.phone || 'N/A'}</div>
                          {p.alt_identity && (
                            <div className="text-[10px] text-slate-400 truncate max-w-[110px]">বিকল্প: {p.alt_identity}</div>
                          )}
                        </td>

                        {/* ৪. বয়স */}
                        <td className="p-3.5">
                          <span className="font-bold text-slate-700">
                            {p.calculated_age || p.age || 'N/A'} বছর
                          </span>
                        </td>

                        {/* ৫. লিঙ্গ */}
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            p.gender === 'মহিলা' || p.gender === 'female'
                              ? 'bg-pink-100 text-pink-700'
                              : 'bg-sky-100 text-sky-700'
                          }`}>
                            {p.gender === 'female' ? 'মহিলা' : p.gender === 'male' ? 'পুরুষ' : p.gender || 'পুরুষ'}
                          </span>
                        </td>

                        {/* ৬. সর্বশেষ ভিজিট */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-1 text-slate-700 font-semibold">
                            <Clock size={12} className="text-teal-600" />
                            <span>{lastVisitDate}</span>
                          </div>
                        </td>

                        {/* ৭. সর্বশেষ ভিজিটের শাখা */}
                        <td className="p-3.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 font-bold text-[11px] border border-slate-200">
                            <Building2 size={12} className="text-teal-600" />
                            <span>{lastVisitBranchName}</span>
                          </span>
                        </td>

                        {/* ৮. বকেয়া */}
                        <td className="p-3.5 text-right">
                          {isDue ? (
                            <span className="font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                              ৳{p.outstanding_due}
                            </span>
                          ) : (
                            <span className="font-black text-emerald-700">৳০</span>
                          )}
                        </td>

                        {/* ৯. অবস্থা */}
                        <td className="p-3.5 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                            p.patient_status === 'Active' || p.patient_status === 'সক্রিয়'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : p.patient_status === 'একীভূত (Merged)'
                              ? 'bg-purple-100 text-purple-800 border border-purple-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}>
                            {p.patient_status || 'সক্রিয়'}
                          </span>
                        </td>

                        {/* ১০. অ্যাকশন (Requested Action Buttons) */}
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1 flex-wrap">
                            {/* [প্রোফাইল দেখুন] */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPatientProfile(p);
                                setProfileTab('overview');
                              }}
                              className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg text-[10px] font-bold border border-teal-200 flex items-center gap-1"
                              title="সম্পূর্ণ প্রোফাইল দেখুন"
                            >
                              <UserCheck size={12} />
                              <span>[প্রোফাইল দেখুন]</span>
                            </button>

                            {/* [ভিজিট ইতিহাস] */}
                            <button
                              type="button"
                              onClick={() => setVisitHistoryModalPatient(p)}
                              className="px-2 py-1 bg-sky-50 hover:bg-sky-100 text-sky-800 rounded-lg text-[10px] font-bold border border-sky-200 flex items-center gap-1"
                              title="শাখাভিত্তিক ভিজিট টাইমলাইন"
                            >
                              <History size={12} />
                              <span>[ভিজিট ইতিহাস]</span>
                            </button>

                            {/* [প্রিন্ট] */}
                            <button
                              type="button"
                              onClick={() => setPrintCardModalPatient(p)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold border border-slate-300 flex items-center gap-1"
                              title="ডিজিটাল স্মার্ট কার্ড প্রিন্ট"
                            >
                              <Printer size={12} />
                              <span>[প্রিন্ট]</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: ডুপ্লিকেট যাচাই ও একীভূতকরণ (Duplicate Check & Merge Tool - Rule 3 & 5) */}
      {/* ========================================================================= */}
      {subTab === 'duplicate_check' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <GitMerge className="text-teal-600" size={18} />
              <span>ডুপ্লিকেট রোগী সনাক্তকরণ ও রেকর্ড একীভূতকরণ (Duplicate & Record Merge)</span>
            </h3>
            <p className="text-xs text-slate-500">
              নিয়ম ৩ ও ৫: মোবাইল নম্বর বা এনআইডি মিলিয়ে ডুপ্লিকেট রেকর্ড খুঁজুন এবং নির্ভুলভাবে একীভূত করুন।
            </p>
          </div>

          {mergeSuccessNotice && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>{mergeSuccessNotice}</span>
            </div>
          )}

          {/* Search Form */}
          <form onSubmit={handleDuplicateSearch} className="flex gap-2 max-w-xl">
            <input
              type="text"
              value={dupSearchPhone}
              onChange={e => setDupSearchPhone(e.target.value)}
              placeholder="মোবাইল নম্বর, রোগী আইডি বা নাম লিখুন..."
              className="flex-1 px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-teal-500 font-semibold"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-black text-xs rounded-xl shadow-md"
            >
              ডুপ্লিকেট খুঁজুন
            </button>
          </form>

          {/* Results & Merge Selector */}
          {dupSearchResults && (
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700">
                  মিল পাওয়া গেছে: <strong className="text-teal-700">{dupSearchResults.length} টি রেকর্ড</strong>
                </h4>
              </div>

              {dupSearchResults.length === 0 ? (
                <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl text-xs font-bold border border-emerald-200">
                  ✓ কোনো ডুপ্লিকেট রেকর্ড পাওয়া যায়নি! এই রোগীর তথ্য সম্পূর্ণ অনন্য।
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {dupSearchResults.map(match => (
                    <div
                      key={match.patient_id}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2 relative hover:border-teal-400"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <strong className="text-slate-900 text-sm">{match.full_name}</strong>
                          <div className="font-mono text-teal-700 font-bold">{match.patient_id}</div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px]">
                          {match.gender || 'N/A'} • {match.calculated_age || match.age} বছর
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-600">
                        <div>মোবাইল: <strong>{match.mobile_number || match.phone}</strong></div>
                        <div>ঠিকানা: {match.address || 'তথ্য নেই'}</div>
                        <div>মোট ভিজিট: {match.total_visits || 1} • বকেয়া: ৳{match.outstanding_due || 0}</div>
                      </div>

                      <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setMergeTargetPatient(match)}
                          className={`px-3 py-1 rounded-lg text-[10px] font-bold border ${
                            mergeTargetPatient?.patient_id === match.patient_id
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50'
                          }`}
                        >
                          {mergeTargetPatient?.patient_id === match.patient_id ? '✓ প্রধান টার্গেট নির্বাচিত' : 'টার্গেট (মূল প্রোফাইল) বানান'}
                        </button>

                        <button
                          type="button"
                          onClick={() => setMergeSourcePatient(match)}
                          className={`px-3 py-1 rounded-lg text-[10px] font-bold border ${
                            mergeSourcePatient?.patient_id === match.patient_id
                              ? 'bg-purple-600 text-white border-purple-600'
                              : 'bg-white text-purple-700 border-purple-300 hover:bg-purple-50'
                          }`}
                        >
                          {mergeSourcePatient?.patient_id === match.patient_id ? '✓ সোর্স (মার্জযোগ্য) নির্বাচিত' : 'সোর্স (মার্জ হবে) বানান'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Merge Execution Box */}
          {mergeTargetPatient && mergeSourcePatient && (
            <div className="p-5 rounded-3xl bg-purple-50/80 border border-purple-200 space-y-4 animate-scale-in">
              <div className="flex items-center gap-2 font-black text-purple-900 text-sm">
                <GitMerge size={18} />
                <span>রেকর্ড একীভূতকরণ নিশ্চিতকরণ (Confirm Patient Record Merge)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white border border-purple-200">
                  <span className="text-[10px] font-bold text-slate-400 block">সোর্স রেকর্ড (যা মুছে/একীভূত হবে):</span>
                  <strong className="text-rose-700 text-sm">{mergeSourcePatient.full_name}</strong>
                  <div className="font-mono text-slate-600">{mergeSourcePatient.patient_id}</div>
                  <div className="text-[11px] text-slate-500 mt-1">সব প্রেসক্রিপশন ও টেস্ট টার্গেটে স্থানান্তরিত হবে</div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-purple-200">
                  <span className="text-[10px] font-bold text-slate-400 block">টার্গেট রেকর্ড (মূল বহাল থাকবে):</span>
                  <strong className="text-emerald-700 text-sm">{mergeTargetPatient.full_name}</strong>
                  <div className="font-mono text-slate-600">{mergeTargetPatient.patient_id}</div>
                  <div className="text-[11px] text-slate-500 mt-1">এই আইডিতে সমস্ত হিস্ট্রি একত্রিত হবে</div>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1 text-xs">একীভূত করার কারণ / নোট (অডিট লগের জন্য):</label>
                <input
                  type="text"
                  value={mergeReason}
                  onChange={e => setMergeReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMergeSourcePatient(null);
                    setMergeTargetPatient(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleExecuteMerge}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black shadow-md flex items-center gap-1.5"
                >
                  <GitMerge size={14} />
                  <span>হ্যাঁ, রেকর্ড দুটি একীভূত করুন (Execute Merge)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 3: একীভূতকরণ অডিট লগ (Merge Audit Logs - Rule 5) */}
      {/* ========================================================================= */}
      {subTab === 'merge_audit' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <History className="text-teal-600" size={18} />
              <span>রোগীর রেকর্ড একীভূতকরণ অডিট লগ (Patient Merge Audit Trail)</span>
            </h3>
            <p className="text-xs text-slate-500">
              নিয়ম ৫: রোগীর রেকর্ড একীভূত করলে কে, কখন, কোন রেকর্ড একীভূত করেছে তা এই অডিট ট্রেইলে অপরিবর্তনযোগ্যভাবে সংরক্ষিত থাকে।
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white font-black text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">অডিট আইডি</th>
                  <th className="p-3.5">একীভূতকারী কর্মকর্তা</th>
                  <th className="p-3.5">সময় ও তারিখ</th>
                  <th className="p-3.5">সোর্স রোগী (Source)</th>
                  <th className="p-3.5">টার্গেট রোগী (Target)</th>
                  <th className="p-3.5">কারণ / মন্তব্য</th>
                  <th className="p-3.5 text-center">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {patientMergeAuditLogs.map(log => (
                  <tr key={log.auditId} className="hover:bg-slate-50">
                    <td className="p-3.5 font-mono font-bold text-purple-700">{log.auditId}</td>
                    <td className="p-3.5 font-bold text-slate-900">{log.mergedBy}</td>
                    <td className="p-3.5 text-slate-600 font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString('bn-BD')}
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-rose-600">{log.sourceName}</span>
                      <div className="font-mono text-[10px] text-slate-400">({log.sourcePatientId})</div>
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-emerald-700">{log.targetName}</span>
                      <div className="font-mono text-[10px] text-slate-400">({log.targetPatientId})</div>
                    </td>
                    <td className="p-3.5 text-slate-700">{log.reason}</td>
                    <td className="p-3.5 text-center">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        ✓ একীভূত সম্পন্ন
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 4: মাল্টি-ব্রাঞ্চ ৫টি নিয়মাবলী (Multi-Branch Rules Guideline) */}
      {/* ========================================================================= */}
      {subTab === 'rules' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Shield className="text-teal-600" size={18} />
              <span>রোগী ব্যবস্থাপনার ৫টি মাল্টি-ব্রাঞ্চ মৌলিক নীতিমালা</span>
            </h3>
            <p className="text-xs text-slate-500">
              সেন্ট্রাল ইকোসিস্টেমে বিভিন্ন ব্রাঞ্চের রোগী পরিচালনা ও ডেটা গভর্নেন্সের নিয়মাবলী:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200 space-y-2">
              <div className="flex items-center gap-2 font-black text-teal-900">
                <span className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs">১</span>
                <span>প্রতিষ্ঠানের অধীনে সেন্ট্রাল প্রোফাইল</span>
              </div>
              <p className="text-slate-700 leading-relaxed font-semibold">
                রোগীর মূল প্রোফাইল প্রতিষ্ঠানের অধীনে থাকবে, একটি একক শাখার অধীনে নয়।
              </p>
              <div className="text-[11px] text-teal-800 bg-white/70 p-2 rounded-xl border border-teal-200">
                ✓ রোগী ধানমন্ডিতে রেজিস্ট্রেশন করলেও উত্তরা বা চট্টগ্রামের যেকোনো শাখায় একই UHID দিয়ে সব সেবা গ্রহণ করতে পারবেন।
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-200 space-y-2">
              <div className="flex items-center gap-2 font-black text-sky-900">
                <span className="w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center text-xs">২</span>
                <span>শাখা ট্যাগিং নিয়ম</span>
              </div>
              <p className="text-slate-700 leading-relaxed font-semibold">
                রোগীর প্রতিটি ভিজিট, অর্ডার, রিপোর্ট, বিক্রি ও বিলের সঙ্গে সংশ্লিষ্ট শাখা থাকবে।
              </p>
              <div className="text-[11px] text-sky-800 bg-white/70 p-2 rounded-xl border border-sky-200">
                ✓ কোনো সেবা ব্রাঞ্চহীন রাখা যাবে না। প্রতি প্রেসক্রিপশন ও ইনভয়েসে শাখা কোড (যেমন DHD-01) স্থায়ীভাবে লক থাকবে।
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
              <div className="flex items-center gap-2 font-black text-amber-900">
                <span className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs">৩</span>
                <span>ডুপ্লিকেট সতর্কীকরণ</span>
              </div>
              <p className="text-slate-700 leading-relaxed font-semibold">
                একই ফোন/পরিচয় দিয়ে নতুন রেকর্ড করতে গেলে সম্ভাব্য ডুপ্লিকেট দেখাতে হবে।
              </p>
              <div className="text-[11px] text-amber-800 bg-white/70 p-2 rounded-xl border border-amber-200">
                ✓ রিসেপশনিস্ট নম্বর টাইপ করার সাথে সাথে পূর্ববর্তী বিদ্যমান রোগীর বিবরণ ও প্রোফাইল খোলার বাটন স্ক্রিনে আসবে।
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-2">
              <div className="flex items-center gap-2 font-black text-purple-900">
                <span className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs">৪</span>
                <span>সংবেদনশীল তথ্যের অনুমতি</span>
              </div>
              <p className="text-slate-700 leading-relaxed font-semibold">
                রোগীর একাধিক শাখায় যাওয়ার ইতিহাস দেখা যাবে, তবে সংবেদনশীল তথ্য দেখতে আলাদা অনুমতি প্রযোজ্য।
              </p>
              <div className="text-[11px] text-purple-800 bg-white/70 p-2 rounded-xl border border-purple-200">
                ✓ ভিন্ন শাখার সাধারণ ভিজিট হিস্ট্রি দেখা গেলেও সংবেদনশীল সাইকিয়াট্রিক বা স্পেশাল নোট দেখতে বিশেষ অনুমতি লাগবে।
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 space-y-2">
              <div className="flex items-center gap-2 font-black text-rose-900">
                <span className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs">৫</span>
                <span>একীভূতকরণ অডিট লগ</span>
              </div>
              <p className="text-slate-700 leading-relaxed font-semibold">
                রোগীর রেকর্ড একীভূত করলে কে, কখন, কোন রেকর্ড একীভূত করেছে তা অডিট লগে থাকবে।
              </p>
              <div className="text-[11px] text-rose-800 bg-white/70 p-2 rounded-xl border border-rose-200">
                ✓ আইনি ও ক্লিনিক্যাল সেফটির স্বার্থে মার্জ অপারেশন স্থায়ীভাবে লগ ফাইলে রেকর্ড থাকবে।
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: নতুন রোগী নিবন্ধন (Patient Registration Modal - All Requested Fields) */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Users size={18} className="text-teal-600" />
                  <span>নতুন রোগী নিবন্ধন (Patient Registration)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  নিবন্ধন শাখা: <strong>{currentBranch.name}</strong> • রোগীর প্রোফাইল প্রতিষ্ঠানের সেন্ট্রাল রেজিস্ট্রিভুক্ত হবে
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Live Duplicate Warning Banner (Rule 3) */}
            {duplicateWarning && (
              <div className="p-3 bg-amber-50 border border-amber-300 text-amber-900 rounded-2xl text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                  <span>{duplicateWarning.message}</span>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPatientProfile(duplicateWarning.patient);
                      setShowAddModal(false);
                    }}
                    className="px-3 py-1 bg-amber-600 text-white rounded-lg text-[11px] font-bold"
                  >
                    বিদ্যমান রোগীর প্রোফাইল খুলুন
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={e => e.preventDefault()} className="space-y-4 text-xs">
              {/* SECTION: আবশ্যিক ফিল্ডসমূহ */}
              <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-200 space-y-3">
                <div className="font-black text-teal-900 flex items-center gap-1.5 text-xs">
                  <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                  <span>আবশ্যিক ফিল্ডসমূহ (Mandatory Fields)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* রোগীর নাম */}
                  <div className="sm:col-span-2">
                    <label className="font-extrabold text-slate-800 block mb-1">১. রোগীর নাম *</label>
                    <input
                      type="text"
                      required
                      value={form.full_name}
                      onChange={e => setForm({ ...form, full_name: e.target.value })}
                      placeholder="যেমন: মোঃ জাহিদ হাসান"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-teal-500 font-semibold"
                    />
                  </div>

                  {/* মোবাইল নম্বর */}
                  <div>
                    <label className="font-extrabold text-slate-800 block mb-1">২. মোবাইল নম্বর *</label>
                    <input
                      type="tel"
                      value={form.mobile_number}
                      onChange={e => handleMobileOrIdentityChange('mobile_number', e.target.value)}
                      placeholder="০১৭১১-২২৩৩৪৪"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-teal-500 font-mono font-bold"
                    />
                  </div>

                  {/* বিকল্প পরিচয় */}
                  <div>
                    <label className="font-extrabold text-slate-800 block mb-1">বিকল্প পরিচয় (ফোন না থাকলে)</label>
                    <input
                      type="text"
                      value={form.alt_identity}
                      onChange={e => handleMobileOrIdentityChange('alt_identity', e.target.value)}
                      placeholder="অভিভাবকের নম্বর / ইমেইল"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-teal-500"
                    />
                  </div>

                  {/* লিঙ্গ */}
                  <div>
                    <label className="font-extrabold text-slate-800 block mb-1">৩. লিঙ্গ *</label>
                    <select
                      value={form.gender}
                      onChange={e => setForm({ ...form, gender: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-teal-500 font-bold bg-white"
                    >
                      <option value="পুরুষ">পুরুষ (Male)</option>
                      <option value="মহিলা">মহিলা (Female)</option>
                      <option value="অন্যান্য">অন্যান্য (Other)</option>
                    </select>
                  </div>

                  {/* জন্মতারিখ অথবা আনুমানিক বয়স */}
                  <div>
                    <label className="font-extrabold text-slate-800 block mb-1">
                      ৪. জন্মতারিখ অথবা বয়স *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={form.date_of_birth}
                        onChange={handleDOBChange}
                        className="flex-1 px-2.5 py-1.5 rounded-xl border border-slate-300 focus:outline-teal-500 text-xs"
                      />
                      <input
                        type="number"
                        value={form.age}
                        onChange={handleAgeChange}
                        placeholder="বয়স"
                        className="w-20 px-2 py-1.5 rounded-xl border border-slate-300 focus:outline-teal-500 font-bold text-center"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION: ঐচ্ছিক ফিল্ডসমূহ */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="font-black text-slate-700 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                    <span>ঐচ্ছিক ফিল্ডসমূহ (Optional Details)</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleSetSamplePhoto}
                    className="text-[11px] text-teal-600 hover:underline font-bold"
                  >
                    + স্যাম্পল ছবি যোগ করুন
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* রোগীর ছবি URL */}
                  <div className="sm:col-span-2">
                    <label className="font-bold text-slate-700 block mb-1">রোগীর ছবি (Photo URL / Web Cam)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={form.photo_url}
                        onChange={e => setForm({ ...form, photo_url: e.target.value })}
                        placeholder="https://... অথবা স্যাম্পল বেছে নিন"
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-300 focus:outline-teal-500"
                      />
                      {form.photo_url && (
                        <img src={form.photo_url} alt="" className="w-8 h-8 rounded-full object-cover border" />
                      )}
                    </div>
                  </div>

                  {/* ঠিকানা */}
                  <div className="sm:col-span-2">
                    <label className="font-bold text-slate-700 block mb-1">ঠিকানা</label>
                    <input
                      type="text"
                      value={form.address}
                      onChange={e => setForm({ ...form, address: e.target.value })}
                      placeholder="বাড়ি, রোড, থানা, জেলা"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-teal-500"
                    />
                  </div>

                  {/* রক্তের গ্রুপ */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">রক্তের গ্রুপ</label>
                    <select
                      value={form.blood_group}
                      onChange={e => setForm({ ...form, blood_group: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-teal-500 font-bold text-rose-700 bg-white"
                    >
                      <option value="A+">A+ (A Positive)</option>
                      <option value="A-">A- (A Negative)</option>
                      <option value="B+">B+ (B Positive)</option>
                      <option value="B-">B- (B Negative)</option>
                      <option value="O+">O+ (O Positive)</option>
                      <option value="O-">O- (O Negative)</option>
                      <option value="AB+">AB+ (AB Positive)</option>
                      <option value="AB-">AB- (AB Negative)</option>
                    </select>
                  </div>

                  {/* জাতীয় পরিচয়পত্র / অন্যান্য পরিচয় */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">জাতীয় পরিচয়পত্র / জন্ম সনদ / পাসপোর্ট</label>
                    <input
                      type="text"
                      value={form.national_id}
                      onChange={e => handleMobileOrIdentityChange('national_id', e.target.value)}
                      placeholder="NID / BRC নম্বর"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-teal-500 font-mono"
                    />
                  </div>

                  {/* জরুরি যোগাযোগ */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">জরুরি যোগাযোগের নাম</label>
                    <input
                      type="text"
                      value={form.emergency_contact_name}
                      onChange={e => setForm({ ...form, emergency_contact_name: e.target.value })}
                      placeholder="নাম ও সম্পর্ক (যেমন: স্ত্রী)"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-teal-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">জরুরি যোগাযোগের মোবাইল নম্বর</label>
                    <input
                      type="tel"
                      value={form.emergency_contact_mobile}
                      onChange={e => setForm({ ...form, emergency_contact_mobile: e.target.value })}
                      placeholder="০১৭১১-xxxxxx"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-teal-500 font-mono"
                    />
                  </div>

                  {/* অ্যালার্জি */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">অ্যালার্জি (⚠️)</label>
                    <input
                      type="text"
                      value={form.allergy_note}
                      onChange={e => setForm({ ...form, allergy_note: e.target.value })}
                      placeholder="পেনিসিলিন, ডাস্ট, সি-ফুড ইত্যাদি"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-teal-500"
                    />
                  </div>

                  {/* পূর্বের রোগ */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">পূর্বের রোগ (Chronic Conditions)</label>
                    <input
                      type="text"
                      value={form.chronic_disease_note}
                      onChange={e => setForm({ ...form, chronic_disease_note: e.target.value })}
                      placeholder="ডায়াবেটিস, উচ্চ রক্তচাপ ইত্যাদি"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-teal-500"
                    />
                  </div>

                  {/* অভিভাবক / প্রতিনিধি */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">অভিভাবক / প্রতিনিধি</label>
                    <input
                      type="text"
                      value={form.guardian_name}
                      onChange={e => setForm({ ...form, guardian_name: e.target.value })}
                      placeholder="পিতা/মাতা/স্বামীর নাম"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-teal-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">সম্পর্ক</label>
                    <select
                      value={form.guardian_relation}
                      onChange={e => setForm({ ...form, guardian_relation: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-teal-500 bg-white"
                    >
                      <option value="পিতা">পিতা</option>
                      <option value="মাতা">মাতা</option>
                      <option value="স্বামী">স্বামী</option>
                      <option value="স্ত্রী">স্ত্রী</option>
                      <option value="ভাই/বোন">ভাই / বোন</option>
                      <option value="অন্যান্য">অন্যান্য</option>
                    </select>
                  </div>

                  {/* নোট */}
                  <div className="sm:col-span-2">
                    <label className="font-bold text-slate-700 block mb-1">ক্লিনিক্যাল নোট / বিশেষ নির্দেশনা</label>
                    <textarea
                      rows={2}
                      value={form.clinical_notes}
                      onChange={e => setForm({ ...form, clinical_notes: e.target.value })}
                      placeholder="বিশেষ কোনো নির্দেশনা থাকলে লিখুন..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-teal-500 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS (Requested Buttons: [সংরক্ষণ], [সংরক্ষণ করে অ্যাপয়েন্টমেন্ট]) */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50"
                >
                  বাতিল
                </button>

                {/* [সংরক্ষণ করে অ্যাপয়েন্টমেন্ট] বোতাম */}
                <button
                  type="button"
                  onClick={() => handleSavePatient(true)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black shadow-md flex items-center justify-center gap-1.5"
                >
                  <CalendarCheck size={15} />
                  <span>[সংরক্ষণ করে অ্যাপয়েন্টমেন্ট]</span>
                </button>

                {/* [সংরক্ষণ] বোতাম */}
                <button
                  type="button"
                  onClick={() => handleSavePatient(false)}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black shadow-md flex items-center justify-center gap-1.5"
                >
                  <Save size={15} />
                  <span>[সংরক্ষণ]</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: [প্রোফাইল দেখুন] (Comprehensive Master Profile - Rule 4 Enforced) */}
      {/* ========================================================================= */}
      {selectedPatientProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-4 animate-scale-in">
            {/* Header */}
            <div className="flex justify-between items-start pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                {selectedPatientProfile.photo_url ? (
                  <img src={selectedPatientProfile.photo_url} alt="" className="w-14 h-14 rounded-2xl object-cover border-2 border-teal-500" />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-teal-500/10 text-teal-700 flex items-center justify-center font-black text-xl">
                    {selectedPatientProfile.full_name ? selectedPatientProfile.full_name[0] : 'P'}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-900">{selectedPatientProfile.full_name}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-extrabold">
                      সেন্ট্রাল UHID
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 flex-wrap">
                    <span className="font-mono text-teal-700 font-black">{selectedPatientProfile.patient_id}</span>
                    <span>•</span>
                    <span>{selectedPatientProfile.calculated_age || selectedPatientProfile.age} বছর ({selectedPatientProfile.gender})</span>
                    <span>•</span>
                    <span>রক্তের গ্রুপ: <strong className="text-rose-600">{selectedPatientProfile.blood_group}</strong></span>
                    <span>•</span>
                    <span>নিবন্ধন শাখা: <strong>{selectedPatientProfile.registered_branch_name || selectedPatientProfile.registered_branch || 'ধানমন্ডি মেইন'}</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPrintCardModalPatient(selectedPatientProfile)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1"
                >
                  <Printer size={13} />
                  <span>[প্রিন্ট]</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPatientProfile(null)}
                  className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Profile Subtabs Navigation */}
            <div className="flex gap-2 border-b border-slate-100 pb-2 overflow-x-auto text-xs font-bold">
              <button
                type="button"
                onClick={() => setProfileTab('overview')}
                className={`px-3.5 py-1.5 rounded-xl transition-all ${
                  profileTab === 'overview' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                ব্যক্তিগত ও জরুরি তথ্য
              </button>
              <button
                type="button"
                onClick={() => setProfileTab('visits')}
                className={`px-3.5 py-1.5 rounded-xl transition-all ${
                  profileTab === 'visits' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                শাখাভিত্তিক ভিজিট ইতিহাস ({getPatientVisits(selectedPatientProfile.patient_id).length})
              </button>
              <button
                type="button"
                onClick={() => setProfileTab('prescriptions')}
                className={`px-3.5 py-1.5 rounded-xl transition-all ${
                  profileTab === 'prescriptions' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                প্রেসক্রিপশন ইতিহাস ({getPatientPrescriptions(selectedPatientProfile.patient_id).length})
              </button>
              <button
                type="button"
                onClick={() => setProfileTab('tests')}
                className={`px-3.5 py-1.5 rounded-xl transition-all ${
                  profileTab === 'tests' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                টেস্ট ও রিপোর্ট ইতিহাস ({getPatientLabOrders(selectedPatientProfile.patient_id).length})
              </button>
              <button
                type="button"
                onClick={() => setProfileTab('billing')}
                className={`px-3.5 py-1.5 rounded-xl transition-all ${
                  profileTab === 'billing' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                বিল ও বকেয়া হিসাব
              </button>
            </div>

            {/* TAB: OVERVIEW */}
            {profileTab === 'overview' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">যোগাযোগ ও পরিচিতি</div>
                  <div><strong>মোবাইল:</strong> {selectedPatientProfile.mobile_number || selectedPatientProfile.phone}</div>
                  <div><strong>বিকল্প পরিচয়:</strong> {selectedPatientProfile.alt_identity || 'নেই'}</div>
                  <div><strong>ঠিকানা:</strong> {selectedPatientProfile.address || 'দেওয়া নেই'}</div>
                  <div><strong>জাতীয় পরিচয়পত্র (NID):</strong> {selectedPatientProfile.national_id || 'দেওয়া নেই'}</div>
                  <div><strong>অভিভাবক:</strong> {selectedPatientProfile.guardian_name || 'N/A'} ({selectedPatientProfile.guardian_relation || 'অভিভাবক'})</div>
                  <div><strong>জরুরি যোগাযোগ:</strong> {selectedPatientProfile.emergency_contact_name || 'N/A'} - {selectedPatientProfile.emergency_contact_mobile || ''}</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">ক্লিনিক্যাল প্রোফাইল</div>
                  <div><strong>রক্তের গ্রুপ:</strong> <span className="font-black text-rose-600">{selectedPatientProfile.blood_group}</span></div>
                  <div><strong>অ্যালার্জি সতর্কতা:</strong> {selectedPatientProfile.allergy_note ? <span className="text-amber-700 font-bold">⚠️ {selectedPatientProfile.allergy_note}</span> : 'নেই'}</div>
                  <div><strong>দীর্ঘমেয়াদী রোগ:</strong> {selectedPatientProfile.chronic_disease_note || 'নেই'}</div>
                  <div><strong>বকেয়া টাকা:</strong> <span className="font-bold text-rose-600">৳{selectedPatientProfile.outstanding_due || 0}</span></div>
                  <div><strong>নোট:</strong> {selectedPatientProfile.clinical_notes || 'বিশেষ কোনো নোট নেই'}</div>
                </div>
              </div>
            )}

            {/* TAB: VISITS WITH RULE 4 SENSITIVE GUARD */}
            {profileTab === 'visits' && (
              <div className="space-y-3 text-xs">
                {/* Rule 4 Permission Notice Banner */}
                <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield size={16} className="text-purple-600 shrink-0" />
                    <span>
                      <strong>নিয়ম ৪ এনফোর্সড:</strong> একাধিক শাখার ভিজিট ও সাধারণ রেকর্ড মুক্ত; তবে সংবেদনশীল সাইকিয়াট্রিক/গাইনি নোট দেখতে স্পেশাল অ্যাক্সেস প্রয়োজন।
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSensitiveUnlocked(!sensitiveUnlocked)}
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-[10px] flex items-center gap-1 shrink-0"
                  >
                    {sensitiveUnlocked ? <Unlock size={11} /> : <Lock size={11} />}
                    <span>{sensitiveUnlocked ? 'সংবেদনশীল লক করুন' : 'অনুমতি আনলক করুন'}</span>
                  </button>
                </div>

                {getPatientVisits(selectedPatientProfile.patient_id).length === 0 ? (
                  <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl">
                    কোনো ভিজিটের রেকর্ড পাওয়া যায়নি।
                  </div>
                ) : (
                  <div className="space-y-2">
                    {getPatientVisits(selectedPatientProfile.patient_id).map(v => (
                      <div key={v.appointment_id} className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <strong className="text-slate-900">{v.doctor_name}</strong>
                            <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold text-[10px]">
                              {v.branch_name || currentBranch.name}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            তারিখ: {v.appointment_date} • সময়: {v.appointment_time} • ফি: ৳{v.fee || 800}
                          </div>
                          {sensitiveUnlocked ? (
                            <div className="text-[10px] text-purple-700 font-bold mt-1 bg-purple-50/80 p-1.5 rounded-lg border border-purple-200">
                              🔓 সংবেদনশীল ক্লিনিক্যাল নোট: রুটিন চেকআপ সম্পন্ন। রক্তচাপ ও ব্লাড সুগার টেস্ট প্রেসক্রাইবড।
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                              <Lock size={10} />
                              <span>সংবেদনশীল ক্লিনিক্যাল বিবরণ এনক্রিপ্টেড (আনলক করুন)</span>
                            </div>
                          )}
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          {v.appointment_status || 'সম্পন্ন'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: PRESCRIPTIONS */}
            {profileTab === 'prescriptions' && (
              <div className="space-y-2 text-xs">
                {getPatientPrescriptions(selectedPatientProfile.patient_id).length === 0 ? (
                  <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl">
                    কোনো প্রেসক্রিপশনের রেকর্ড পাওয়া যায়নি।
                  </div>
                ) : (
                  getPatientPrescriptions(selectedPatientProfile.patient_id).map(rx => (
                    <div key={rx.prescription_id} className="p-3.5 rounded-2xl bg-white border border-slate-200 flex justify-between items-center">
                      <div>
                        <div className="font-bold text-slate-900">{rx.prescription_id} — {rx.doctor_name}</div>
                        <div className="text-[11px] text-slate-500">তারিখ: {rx.prescription_date} • শাখা: {rx.branch_name || currentBranch.name}</div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 font-bold text-[10px] border border-teal-200">
                        ডিজিটাল Rx
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB: TESTS */}
            {profileTab === 'tests' && (
              <div className="space-y-2 text-xs">
                {getPatientLabOrders(selectedPatientProfile.patient_id).length === 0 ? (
                  <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl">
                    কোনো ল্যাব টেস্টের অর্ডার পাওয়া যায়নি।
                  </div>
                ) : (
                  getPatientLabOrders(selectedPatientProfile.patient_id).map(order => (
                    <div key={order.order_id} className="p-3.5 rounded-2xl bg-white border border-slate-200 flex justify-between items-center">
                      <div>
                        <div className="font-bold text-slate-900">{order.order_id} — {order.test_name}</div>
                        <div className="text-[11px] text-slate-500">স্যাম্পল: {order.sample_type} • শাখা: {order.branch_name || currentBranch.name}</div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        {order.order_status || 'Verified'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB: BILLING */}
            {profileTab === 'billing' && (
              <div className="p-4 bg-slate-50 rounded-2xl text-xs space-y-3">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="font-bold text-slate-700">বকেয়া স্ট্যাটাস:</span>
                  <span className="font-black text-rose-600 text-sm">৳{selectedPatientProfile.outstanding_due || 0}</span>
                </div>
                <div className="space-y-2">
                  <div className="p-3 bg-white border border-slate-200 rounded-xl flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-800">INV-2026-1001 (কনসালটেশন ও সিবিসি টেস্ট)</div>
                      <div className="text-[10px] text-slate-400">শাখা: {currentBranch.name}</div>
                    </div>
                    <span className="font-bold text-emerald-700">৳১,২০০ (পরিশোধিত)</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: [ভিজিট ইতিহাস] (Multi-Branch Visit Timeline Drawer) */}
      {/* ========================================================================= */}
      {visitHistoryModalPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <History size={18} className="text-teal-600" />
                  <span>[ভিজিট ইতিহাস] - {visitHistoryModalPatient.full_name}</span>
                </h3>
                <p className="text-xs text-slate-500 font-mono">UHID: {visitHistoryModalPatient.patient_id}</p>
              </div>
              <button
                type="button"
                onClick={() => setVisitHistoryModalPatient(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {/* Sample Timeline entries with branches */}
              <div className="p-3.5 rounded-2xl bg-teal-50/60 border border-teal-200 text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-black text-slate-900">ভিজিট #১ (ডাক্তার কনসালটেন্সি)</span>
                  <span className="px-2 py-0.5 rounded-full bg-teal-600 text-white font-bold text-[10px]">
                    ধানমন্ডি মেইন ব্রাঞ্চ (DHD-01)
                  </span>
                </div>
                <div className="text-[11px] text-slate-600">ডা: আহমেদ রফিক • ১০ অক্টো ২০২৬</div>
                <div className="text-[10px] text-teal-800 mt-1">প্রেসক্রিপশন: Rx-2026-901 • বিল: INV-2026-1001</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-sky-50/60 border border-sky-200 text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-black text-slate-900">ভিজিট #২ (ডায়াগনস্টিক ল্যাব টেস্ট)</span>
                  <span className="px-2 py-0.5 rounded-full bg-sky-600 text-white font-bold text-[10px]">
                    উত্তরা শাখা (UTT-02)
                  </span>
                </div>
                <div className="text-[11px] text-slate-600">সিবিসি ও আরবিএস টেস্ট • ০৮ অক্টো ২০২৬</div>
                <div className="text-[10px] text-sky-800 mt-1">স্যাম্পল আইডি: SMP-7712 • রেজাল্ট ভেরিফাইড</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-200 text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-black text-slate-900">ভিজিট #৩ (ফার্মেসি ওষুধ ক্রয়)</span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white font-bold text-[10px]">
                    মিরপুর শাখা (MIR-03)
                  </span>
                </div>
                <div className="text-[11px] text-slate-600">প্রেসক্রিপশন অনুযায়ী ওষুধ সরবরাহ • ০৫ অক্টো ২০২৬</div>
                <div className="text-[10px] text-purple-800 mt-1">ইনভয়েস: PHARM-2026-44 • FEFO ব্যাচ ট্র্যাকিং</div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setVisitHistoryModalPatient(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: [প্রিন্ট] (Digital UHID Patient Smart Card Print Preview) */}
      {/* ========================================================================= */}
      {printCardModalPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <Printer size={16} className="text-teal-600" />
                <span>ডিজিটাল স্মার্ট রোগী কার্ড (Print Preview)</span>
              </h3>
              <button
                type="button"
                onClick={() => setPrintCardModalPatient(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Print Card Design (A6 / ID Card Format) */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white shadow-xl border border-teal-500/30 space-y-3 relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-[10px] font-bold text-teal-300 uppercase tracking-wider">
                    হেলথকেয়ার 360° • সেন্ট্রাল হেলথ কার্ড
                  </div>
                  <h4 className="text-base font-black text-white mt-0.5">{printCardModalPatient.full_name}</h4>
                  <div className="text-[11px] text-teal-200 font-mono font-bold mt-0.5">
                    UHID: {printCardModalPatient.patient_id}
                  </div>
                </div>

                <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-teal-300">
                  <QrCode size={30} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-white/10 text-slate-300">
                <div>
                  <span className="text-[9px] text-slate-400 block">বয়স ও লিঙ্গ:</span>
                  <strong>{printCardModalPatient.calculated_age || printCardModalPatient.age} বছর ({printCardModalPatient.gender})</strong>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block">রক্তের গ্রুপ:</span>
                  <strong className="text-rose-400">{printCardModalPatient.blood_group}</strong>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block">মোবাইল:</span>
                  <span className="font-mono">{printCardModalPatient.mobile_number || printCardModalPatient.phone}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block">জরুরি যোগাযোগ:</span>
                  <span className="font-mono">{printCardModalPatient.emergency_contact_mobile || '১৬২৬৩'}</span>
                </div>
              </div>

              <div className="text-[9px] text-teal-300/80 pt-2 border-t border-white/10 flex justify-between items-center">
                <span>সকল শাখায় গ্রহণযোগ্য • DGHS Ready</span>
                <span>হেল্পলাইন: ১৬২৬৩</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPrintCardModalPatient(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black shadow-md flex items-center gap-1.5"
              >
                <Printer size={14} />
                <span>প্রিন্ট করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: [সংরক্ষণ করে অ্যাপয়েন্টমেন্ট] (Quick Appointment Booking) */}
      {/* ========================================================================= */}
      {appointmentBookingPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                <CalendarCheck size={18} className="text-teal-600" />
                <span>তাত্ক্ষণিক অ্যাপয়েন্টমেন্ট শিডিউলিং</span>
              </h3>
              <button
                type="button"
                onClick={() => setAppointmentBookingPatient(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-teal-50 border border-teal-200 text-xs space-y-1">
              <div><strong>রোগী:</strong> {appointmentBookingPatient.full_name}</div>
              <div className="font-mono text-teal-800">আইডি: {appointmentBookingPatient.patient_id}</div>
              <div><strong>শাখা:</strong> {currentBranch.name}</div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">ডাক্তার নির্বাচন করুন</label>
                <select
                  id="quick_doc_select"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white"
                >
                  <option value="ডা: আহমেদ রফিক (এমবিবিএস, এফসিপিএস - মেডিসিন)">ডা: আহমেদ রফিক (এমবিবিএস, এফসিপিএস - মেডিসিন)</option>
                  <option value="ডা: তানজিলা হক (এমবিবিএস, ডিজিও - গাইনি)">ডা: তানজিলা হক (এমবিবিএস, ডিজিও - গাইনি)</option>
                  <option value="ডা: মাহমুদুল হাসান (এমবিবিএস, ডি-কার্ড - কার্ডিওলজি)">ডা: মাহমুদুল হাসান (এমবিবিএস, ডি-কার্ড - কার্ডিওলজি)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">সময় স্লট</label>
                <select
                  id="quick_slot_select"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white"
                >
                  <option value="10:00 AM - 10:30 AM">10:00 AM - 10:30 AM (সকাল)</option>
                  <option value="11:00 AM - 11:30 AM">11:00 AM - 11:30 AM (সকাল)</option>
                  <option value="05:00 PM - 05:30 PM">05:00 PM - 05:30 PM (বিকাল)</option>
                  <option value="07:00 PM - 07:30 PM">07:00 PM - 07:30 PM (সন্ধ্যা)</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAppointmentBookingPatient(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold"
              >
                পরে করব
              </button>
              <button
                type="button"
                onClick={() => {
                  const doc = document.getElementById('quick_doc_select')?.value;
                  const slot = document.getElementById('quick_slot_select')?.value;
                  handleConfirmQuickAppointment(doc, slot);
                }}
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black shadow-md flex items-center gap-1.5"
              >
                <CalendarCheck size={14} />
                <span>অ্যাপয়েন্টমেন্ট নিশ্চিত করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientManager;
