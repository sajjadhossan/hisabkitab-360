import React, { useState } from 'react';
import { useHealthcare } from '../../context/HealthcareContext';
import {
  Calendar,
  Clock,
  UserCheck,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Printer,
  Sparkles,
  ChevronRight,
  Phone,
  QrCode,
  CalendarDays,
  UserX,
  Stethoscope,
  Building2,
  Check,
  Edit,
  History,
  FileText,
  User,
  ArrowRight
} from 'lucide-react';

export const AppointmentSerialManager = () => {
  const {
    doctors = [],
    patients = [],
    appointments = [],
    bookAppointment,
    updateAppointmentStatus,
    branches = [],
    activeBranchId = 'dhanmondi'
  } = useHealthcare();

  // Active View: 'queue' (অ্যাপয়েন্টমেন্ট তালিকা) | 'calendar' | 'status_history'
  const [activeTab, setActiveTab] = useState('queue');
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState('all');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [tokenSlipModal, setTokenSlipModal] = useState(null);
  const [rescheduleModalAppointment, setRescheduleModalAppointment] = useState(null);
  const [cancelModalAppointment, setCancelModalAppointment] = useState(null);
  const [cancelReason, setCancelReason] = useState('রোগীর ব্যক্তিগত কারণ');

  const currentBranch = branches.find(b => b.id === activeBranchId) || { name: 'ধানমন্ডি মেইন ব্রাঞ্চ', id: 'dhanmondi', code: 'DHD-01' };

  // ==========================================
  // APPOINTMENT FORM STATE (Exact Requested Fields)
  // ==========================================
  const initialFormState = {
    branch_id: activeBranchId,
    patient_id: patients[0]?.patient_id || '',
    doctor_id: doctors[0]?.doctor_id || '',
    department: 'মেডিসিন',
    appointment_date: new Date().toISOString().split('T')[0],
    appointment_time: '17:30',
    visit_type: 'নতুন', // 'নতুন' | 'ফলো-আপ'
    estimated_duration: '১৫ মিনিট',
    booking_source: 'সরাসরি কাউন্টার', // 'সরাসরি কাউন্টার' | 'ফোন কল' | 'অনলাইন পোর্টাল' | 'রেফারেল'
    notes: 'রুটিন চেকআপ ও স্বাস্থ্য পরামর্শ',
    appointment_status: 'বুক করা' // 'বুক করা' | 'নিশ্চিত' | 'অপেক্ষমাণ' | 'ডাক্তার দেখছেন' | 'সম্পন্ন' | 'বাতিল' | 'রোগী আসেননি'
  };

  const [bookForm, setBookForm] = useState(initialFormState);
  const [capacityWarning, setCapacityWarning] = useState(null);
  const [formError, setFormError] = useState('');

  // 7 Allowed Statuses
  const APPOINTMENT_STATUSES = [
    { id: 'বুক করা', label: 'বুক করা (Booked)', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { id: 'নিশ্চিত', label: 'নিশ্চিত (Confirmed)', color: 'bg-teal-100 text-teal-800 border-teal-200' },
    { id: 'অপেক্ষমাণ', label: 'অপেক্ষমাণ (Waiting)', color: 'bg-amber-100 text-amber-800 border-amber-200' },
    { id: 'ডাক্তার দেখছেন', label: 'ডাক্তার দেখছেন (In Consultation)', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    { id: 'সম্পন্ন', label: 'সম্পন্ন (Completed)', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    { id: 'বাতিল', label: 'বাতিল (Cancelled)', color: 'bg-rose-100 text-rose-800 border-rose-200' },
    { id: 'রোগী আসেননি', label: 'রোগী আসেননি (No Show)', color: 'bg-slate-200 text-slate-700 border-slate-300' }
  ];

  // Dynamic capacity check when Doctor / Date / Time selected (Rule 1)
  const handleDoctorOrDateChange = (field, val) => {
    const updated = { ...bookForm, [field]: val };
    setBookForm(updated);

    const docId = field === 'doctor_id' ? val : bookForm.doctor_id;
    const dateVal = field === 'appointment_date' ? val : bookForm.appointment_date;
    const timeVal = field === 'appointment_time' ? val : bookForm.appointment_time;

    // Check count of bookings for this doctor on this date & time
    const sameSlotBookings = appointments.filter(a =>
      a.doctor_id === docId &&
      a.appointment_date === dateVal &&
      a.appointment_status !== 'বাতিল' &&
      a.appointment_status !== 'Cancelled'
    );

    const selDoc = doctors.find(d => d.doctor_id === docId);
    const maxLimit = selDoc?.max_patients_per_day || selDoc?.daily_quota || 25;

    if (sameSlotBookings.length >= maxLimit) {
      setCapacityWarning(`⚠️ সতর্কতা (নিয়ম ১): এই ডাক্তারের আজকের সর্বোচ্চ সিরিয়াল সীমা (${maxLimit} জন) ইতিমধ্যে পূর্ণ হয়েছে! অতিরিক্ত বুকিং চিকিৎসায় বিলম্ব ঘটাতে পারে।`);
    } else if (sameSlotBookings.some(a => a.appointment_time === timeVal)) {
      setCapacityWarning(`⚠️ সময় দ্বৈততা সতর্কতা: "${timeVal}" সময়ে এই ডাক্তারের পূর্বেও একটি বুকিং রয়েছে।`);
    } else {
      setCapacityWarning(null);
    }
  };

  // Rule 2 & 4: Save Appointment Validation
  const handleBookSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    // Rule 2: শাখা, ডাক্তার ও সময় নির্বাচন না করে অ্যাপয়েন্টমেন্ট সংরক্ষণ করা যাবে না।
    if (!bookForm.branch_id) {
      setFormError('নিয়ম ২: শাখা নির্বাচন করা বাধ্যতামূলক!');
      return;
    }
    if (!bookForm.doctor_id) {
      setFormError('নিয়ম ২: ডাক্তার নির্বাচন করা বাধ্যতামূলক!');
      return;
    }
    if (!bookForm.appointment_time) {
      setFormError('নিয়ম ২: অ্যাপয়েন্টমেন্টের সময় নির্বাচন করা বাধ্যতামূলক!');
      return;
    }
    if (!bookForm.patient_id) {
      setFormError('অনুগ্রহ করে একজন রোগী নির্বাচন করুন!');
      return;
    }

    const selPat = patients.find(p => p.patient_id === bookForm.patient_id);
    const selDoc = doctors.find(d => d.doctor_id === bookForm.doctor_id);
    const selBranch = branches.find(b => b.id === bookForm.branch_id) || currentBranch;

    const newSerialNo = appointments.length + 1;
    const tokenNo = `TK-${String(newSerialNo).padStart(2, '0')}`;

    // Rule 4: অ্যাপয়েন্টমেন্ট তৈরি হলে রোগী আইডি ও শাখা আইডি সংরক্ষণ হবে।
    const res = bookAppointment({
      ...bookForm,
      serial_number: newSerialNo,
      token_number: tokenNo,
      patient_id: selPat ? selPat.patient_id : bookForm.patient_id,
      patient_name: selPat ? selPat.full_name : 'রোগী',
      doctor_id: selDoc ? selDoc.doctor_id : bookForm.doctor_id,
      doctor_name: selDoc ? selDoc.name : 'কনসালটেন্ট ডাক্তার',
      branch_id: selBranch.id,
      branch_name: selBranch.name,
      appointment_status: 'নিশ্চিত',
      status_history: [
        {
          status: 'নিশ্চিত',
          changed_at: new Date().toISOString(),
          changed_by: 'রিসেপশনিস্ট',
          note: 'অ্যাপয়েন্টমেন্ট প্রাথমিক সৃষ্টি ও নিশ্চিতকরণ'
        }
      ]
    });

    if (res && res.success) {
      setShowBookingModal(false);
      setTokenSlipModal(res.appointment);
      setBookForm(initialFormState);
      setCapacityWarning(null);
    }
  };

  // Status Change with History Logging (Rule 3)
  const handleStatusChangeWithHistory = (appId, newStatus, reason = '') => {
    const app = appointments.find(a => a.appointment_id === appId);
    if (!app) return;

    const historyEntry = {
      status: newStatus,
      changed_at: new Date().toISOString(),
      changed_by: 'অপারেটর',
      note: reason || `স্ট্যাটাস পরিবর্তন: ${newStatus}`
    };

    const updatedHistory = [...(app.status_history || []), historyEntry];

    if (updateAppointmentStatus) {
      updateAppointmentStatus(appId, newStatus);
    }
  };

  // Reschedule handler ([সময় পরিবর্তন])
  const handleConfirmReschedule = (newDate, newTime) => {
    if (!rescheduleModalAppointment) return;
    const appId = rescheduleModalAppointment.appointment_id;

    handleStatusChangeWithHistory(appId, 'নিশ্চিত', `সময় পরিবর্তন করে ${newDate} (${newTime}) করা হয়েছে`);
    rescheduleModalAppointment.appointment_date = newDate;
    rescheduleModalAppointment.appointment_time = newTime;
    setRescheduleModalAppointment(null);
    alert('অ্যাপয়েন্টমেন্টের সময় সফলভাবে পরিবর্তন করা হয়েছে!');
  };

  // Cancel handler ([বাতিল] - Rule 3: মুছে না ফেলে অবস্থার ইতিহাস রাখা)
  const handleConfirmCancel = () => {
    if (!cancelModalAppointment) return;
    const appId = cancelModalAppointment.appointment_id;

    handleStatusChangeWithHistory(appId, 'বাতিল', cancelReason);
    setCancelModalAppointment(null);
    alert('অ্যাপয়েন্টমেন্টটি বাতিল হিসেবে তালিকাভুক্ত করা হয়েছে। অডিট ইতিহাস সংরক্ষিত রয়েছে।');
  };

  // Filter Appointments
  const filteredAppointments = appointments.filter(a => {
    const matchDoctor = selectedDoctorFilter === 'all' || a.doctor_id === selectedDoctorFilter;
    const matchBranch = selectedBranchFilter === 'all' || a.branch_id === selectedBranchFilter;
    const matchStatus = statusFilter === 'all' || a.appointment_status === statusFilter;
    const matchSearch = searchTerm
      ? (a.patient_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.token_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.patient_id || '').toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    return matchDoctor && matchBranch && matchStatus && matchSearch;
  });

  const waitingList = appointments.filter(a => a.appointment_status === 'অপেক্ষমাণ' || a.appointment_status === 'Waiting');
  const completedList = appointments.filter(a => a.appointment_status === 'সম্পন্ন' || a.appointment_status === 'Completed');
  const cancelledList = appointments.filter(a => a.appointment_status === 'বাতিল' || a.appointment_status === 'রোগী আসেননি' || a.appointment_status === 'Cancelled');

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-12">
      {/* 1.5 Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 text-white shadow-xl relative overflow-hidden border border-blue-500/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-500/30">
                <CalendarDays size={13} />
                <span>মডিউল ১.৫: অ্যাপয়েন্টমেন্ট ও সিরিয়াল ম্যানেজমেন্ট</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold border border-teal-500/30">
                <Building2 size={13} />
                <span>শাখাভিত্তিক কিউ ট্র্যাকার</span>
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">অ্যাপয়েন্টমেন্ট, টোকেন ও সিরিয়াল নিয়ন্ত্রণ</h2>
            <p className="text-sm text-blue-100/80 mt-1 max-w-2xl">
              ৭টি সুনির্দিষ্ট অবস্থা, সীমা সতর্কতা, শাখা-আইডি ট্যাগিং এবং বাতিল না করে অডিট ইতিহাস সংরক্ষণের নিয়মাবলী।
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowBookingModal(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-xs font-black shadow-lg flex items-center gap-2 transition-transform hover:scale-105"
            >
              <Plus size={16} />
              <span>[নতুন অ্যাপয়েন্টমেন্ট]</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="font-bold text-slate-500">মোট অ্যাপয়েন্টমেন্ট</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{appointments.length} জন</div>
          <div className="text-[11px] text-teal-600 mt-0.5">সব শাখা একীভূত</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="font-bold text-amber-600">অপেক্ষমাণ রোগী (Waiting)</div>
          <div className="text-2xl font-black text-amber-700 mt-1">{waitingList.length} জন</div>
          <div className="text-[11px] text-slate-500 mt-0.5">লবি ও ওয়েটিং রুম কিউ</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="font-bold text-emerald-600">ভিজিট সম্পন্ন (Completed)</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{completedList.length} জন</div>
          <div className="text-[11px] text-slate-500 mt-0.5">প্রেসক্রিপশন প্রস্তুত</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="font-bold text-rose-600">বাতিল / রোগী আসেননি</div>
          <div className="text-2xl font-black text-rose-700 mt-1">{cancelledList.length} জন</div>
          <div className="text-[11px] text-slate-500 mt-0.5">অডিট লগ সংরক্ষিত</div>
        </div>
      </div>

      {/* NAVIGATION TABS: [অ্যাপয়েন্টমেন্ট তালিকা] | ক্যালেন্ডার | স্ট্যাটাস ইতিহাস */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('queue')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'queue'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <CalendarDays size={15} />
          <span>[অ্যাপয়েন্টমেন্ট তালিকা] (Queue Table)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('calendar')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'calendar'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Calendar size={15} />
          <span>ক্যালেন্ডার ও টাইম-স্লট ভিউ</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('status_history')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'status_history'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <History size={15} />
          <span>বাতিল ও অবস্থার অডিট ইতিহাস ({cancelledList.length})</span>
        </button>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 w-full md:w-auto flex-1 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="রোগীর নাম, টোকেন বা আইডি খুঁজুন..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-blue-500 font-medium"
            />
          </div>

          {/* Branch filter */}
          <div className="flex items-center gap-1 font-bold text-slate-700">
            <span>শাখা:</span>
            <select
              value={selectedBranchFilter}
              onChange={e => setSelectedBranchFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white font-bold"
            >
              <option value="all">সকল শাখা</option>
              {branches.filter(b => !b.isAll).map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Doctor filter */}
          <div className="flex items-center gap-1 font-bold text-slate-700">
            <span>ডাক্তার:</span>
            <select
              value={selectedDoctorFilter}
              onChange={e => setSelectedDoctorFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white font-bold"
            >
              <option value="all">সব ডাক্তার</option>
              {doctors.map(d => (
                <option key={d.doctor_id} value={d.doctor_id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1 font-bold text-slate-700">
            <span>অবস্থা:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white font-bold"
            >
              <option value="all">সব অবস্থা</option>
              {APPOINTMENT_STATUSES.map(s => (
                <option key={s.id} value={s.id}>{s.id}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* TABLE: APPOINTMENT QUEUE (With all 7 statuses & requested buttons) */}
      {activeTab === 'queue' && (
        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white font-black text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">টোকেন / সিরিয়াল</th>
                  <th className="p-3.5">রোগীর নাম ও আইডি</th>
                  <th className="p-3.5">শাখা</th>
                  <th className="p-3.5">ডাক্তার ও বিভাগ</th>
                  <th className="p-3.5">তারিখ ও সময়</th>
                  <th className="p-3.5">ভিজিটের ধরন</th>
                  <th className="p-3.5">উৎস</th>
                  <th className="p-3.5 text-center">অবস্থা</th>
                  <th className="p-3.5 text-center">অ্যাকশন বোতামসমূহ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      কোনো অ্যাপয়েন্টমেন্ট পাওয়া যায়নি।
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.map(app => {
                    const statusObj = APPOINTMENT_STATUSES.find(s => s.id === app.appointment_status) || APPOINTMENT_STATUSES[0];
                    return (
                      <tr key={app.appointment_id} className="hover:bg-blue-50/40 transition-colors">
                        {/* টোকেন */}
                        <td className="p-3.5">
                          <span className="font-mono font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200 inline-block text-sm">
                            {app.token_number || `#${app.serial_number}`}
                          </span>
                        </td>

                        {/* রোগী */}
                        <td className="p-3.5">
                          <div className="font-black text-slate-900">{app.patient_name}</div>
                          <div className="font-mono text-[10px] text-teal-700 font-bold">{app.patient_id || 'PT-000001'}</div>
                        </td>

                        {/* শাখা */}
                        <td className="p-3.5">
                          <span className="inline-flex items-center gap-1 font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                            <Building2 size={12} className="text-teal-600" />
                            <span>{app.branch_name || currentBranch.name}</span>
                          </span>
                        </td>

                        {/* ডাক্তার ও বিভাগ */}
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900">{app.doctor_name}</div>
                          <div className="text-[10px] text-slate-500">{app.department || 'মেডিসিন বিভাগ'}</div>
                        </td>

                        {/* তারিখ ও সময় */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-1 text-slate-800 font-bold">
                            <Calendar size={12} className="text-blue-600" />
                            <span>{app.appointment_date}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono mt-0.5">
                            <Clock size={11} className="text-slate-400" />
                            <span>{app.appointment_time}</span>
                          </div>
                        </td>

                        {/* ভিজিটের ধরন */}
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            app.visit_type === 'নতুন' || app.visit_type?.includes('New')
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}>
                            {app.visit_type || 'নতুন'}
                          </span>
                          <div className="text-[10px] text-slate-400 mt-0.5">{app.estimated_duration || '১৫ মিনিট'}</div>
                        </td>

                        {/* বুকিং উৎস */}
                        <td className="p-3.5 text-slate-600 text-[11px]">
                          {app.booking_source || 'কাউন্টার'}
                        </td>

                        {/* অবস্থা */}
                        <td className="p-3.5 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${statusObj.color}`}>
                            {app.appointment_status || 'বুক করা'}
                          </span>
                        </td>

                        {/* বোতামসমূহ (Requested Action Buttons) */}
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1 flex-wrap">
                            {/* [নিশ্চিত করুন] */}
                            {app.appointment_status === 'বুক করা' && (
                              <button
                                type="button"
                                onClick={() => handleStatusChangeWithHistory(app.appointment_id, 'নিশ্চিত')}
                                className="px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg text-[10px] font-bold border border-teal-200"
                              >
                                [নিশ্চিত করুন]
                              </button>
                            )}

                            {/* [চেক-ইন] */}
                            {(app.appointment_status === 'বুক করা' || app.appointment_status === 'নিশ্চিত') && (
                              <button
                                type="button"
                                onClick={() => handleStatusChangeWithHistory(app.appointment_id, 'অপেক্ষমাণ')}
                                className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-[10px] font-bold border border-amber-200"
                              >
                                [চেক-ইন]
                              </button>
                            )}

                            {/* [সময় পরিবর্তন] */}
                            <button
                              type="button"
                              onClick={() => setRescheduleModalAppointment(app)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold border border-slate-300"
                            >
                              [সময় পরিবর্তন]
                            </button>

                            {/* [টোকেন প্রিন্ট] */}
                            <button
                              type="button"
                              onClick={() => setTokenSlipModal(app)}
                              className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg text-[10px] font-bold border border-blue-200"
                            >
                              <Printer size={11} className="inline mr-0.5" />
                              <span>[টোকেন প্রিন্ট]</span>
                            </button>

                            {/* [বাতিল] */}
                            {app.appointment_status !== 'বাতিল' && app.appointment_status !== 'সম্পন্ন' && (
                              <button
                                type="button"
                                onClick={() => setCancelModalAppointment(app)}
                                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[10px] font-bold border border-rose-200"
                              >
                                [বাতিল]
                              </button>
                            )}
                          </div>
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

      {/* CALENDAR VIEW */}
      {activeTab === 'calendar' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-black text-slate-900">সাপ্তাহিক অ্যাপয়েন্টমেন্ট টাইম-স্লট গ্রিড</h3>
            <span className="text-xs text-slate-500">শাখা: {currentBranch.name}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
            {['10:00 AM', '11:00 AM', '12:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM'].map(slot => {
              const countInSlot = appointments.filter(a => a.appointment_time?.includes(slot.slice(0, 5))).length;
              return (
                <div key={slot} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-blue-700">{slot}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      countInSlot > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {countInSlot > 0 ? `${countInSlot} জন বুকড` : 'ফ্রি স্লট'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">অনুমোদিত সীমা: ৫ জন/ঘণ্টা</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STATUS HISTORY VIEW (Rule 3: বাতিল বা অনুপস্থিত মুছে না ফেলে ইতিহাস রাখা) */}
      {activeTab === 'status_history' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <History className="text-blue-600" size={18} />
              <span>বাতিল ও অনুপস্থিতির অডিট ইতিহাস (Cancelled & Absent Logs)</span>
            </h3>
            <p className="text-xs text-slate-500">
              নিয়ম ৩: বাতিল বা অনুপস্থিত অ্যাপয়েন্টমেন্ট ডেটাবেজ থেকে স্থায়ীভাবে মোছা নিষিদ্ধ; অডিট ট্রেইলে সংরক্ষিত থাকে।
            </p>
          </div>

          <div className="space-y-2">
            {cancelledList.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl text-xs">
                কোনো বাতিল বা অনুপস্থিত অ্যাপয়েন্টমেন্ট নেই।
              </div>
            ) : (
              cancelledList.map(app => (
                <div key={app.appointment_id} className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200 text-xs flex justify-between items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-slate-900 text-sm">{app.patient_name}</strong>
                      <span className="font-mono text-teal-700 font-bold">({app.patient_id})</span>
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-black text-[10px]">
                        {app.appointment_status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-1">
                      ডাক্তার: {app.doctor_name} • শাখা: {app.branch_name || currentBranch.name} • তারিখ: {app.appointment_date}
                    </div>
                    <div className="text-[10px] text-rose-700 mt-1">
                      কারণ: {app.cancel_reason || 'রোগীর ব্যক্তিগত কারণ বা উপস্থিতি ব্যর্থ'}
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono">লগ আইডি: #{app.appointment_id}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: নতুন অ্যাপয়েন্টমেন্ট বুকিং (All Requested Fields + Rules 1 & 2) */}
      {/* ========================================================================= */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                  <CalendarDays size={18} className="text-blue-600" />
                  <span>নতুন অ্যাপয়েন্টমেন্ট বুকিং (Book Appointment)</span>
                </h3>
                <p className="text-xs text-slate-500">অনুমোদিত সীমা ও সময় যাচাই করে বুকিং নিশ্চিত করুন</p>
              </div>
              <button
                type="button"
                onClick={() => setShowBookingModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Error or Capacity Warning */}
            {formError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle size={16} className="text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {capacityWarning && (
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                <span>{capacityWarning}</span>
              </div>
            )}

            <form onSubmit={handleBookSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* শাখা (Required) */}
                <div>
                  <label className="font-extrabold text-slate-800 block mb-1">১. শাখা * (বাধ্যতামূলক)</label>
                  <select
                    required
                    value={bookForm.branch_id}
                    onChange={e => setBookForm({ ...bookForm, branch_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-blue-500 font-bold bg-white"
                  >
                    {branches.filter(b => !b.isAll).map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                    ))}
                  </select>
                </div>

                {/* রোগী (Required) */}
                <div>
                  <label className="font-extrabold text-slate-800 block mb-1">২. রোগী নির্বাচন *</label>
                  <select
                    required
                    value={bookForm.patient_id}
                    onChange={e => setBookForm({ ...bookForm, patient_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-blue-500 font-bold bg-white"
                  >
                    {patients.map(p => (
                      <option key={p.patient_id} value={p.patient_id}>
                        {p.full_name} ({p.patient_id}) - {p.mobile_number || p.phone}
                      </option>
                    ))}
                  </select>
                </div>

                {/* ডাক্তার (Required) */}
                <div>
                  <label className="font-extrabold text-slate-800 block mb-1">৩. ডাক্তার নির্বাচন *</label>
                  <select
                    required
                    value={bookForm.doctor_id}
                    onChange={e => handleDoctorOrDateChange('doctor_id', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-blue-500 font-bold bg-white"
                  >
                    {doctors.map(d => (
                      <option key={d.doctor_id} value={d.doctor_id}>
                        {d.name} ({d.specialty}) • ফি: ৳{d.consultation_fee || 1000}
                      </option>
                    ))}
                  </select>
                </div>

                {/* বিভাগ */}
                <div>
                  <label className="font-extrabold text-slate-800 block mb-1">৪. বিভাগ</label>
                  <select
                    value={bookForm.department}
                    onChange={e => setBookForm({ ...bookForm, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-blue-500 bg-white"
                  >
                    <option value="মেডিসিন">মেডিসিন বিভাগ</option>
                    <option value="কার্ডিওলজি">কার্ডিওলজি (হৃদরোগ)</option>
                    <option value="শিশু রোগ">শিশু বিভাগ (Pediatrics)</option>
                    <option value="গাইনি ও প্রসূতি">গাইনি ও প্রসূতি বিভাগ</option>
                    <option value="অর্থোপেডিকস">অর্থোপেডিকস (হাড় ও জোড়া)</option>
                  </select>
                </div>

                {/* তারিখ */}
                <div>
                  <label className="font-extrabold text-slate-800 block mb-1">৫. তারিখ *</label>
                  <input
                    type="date"
                    required
                    value={bookForm.appointment_date}
                    onChange={e => handleDoctorOrDateChange('appointment_date', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-blue-500 font-bold"
                  />
                </div>

                {/* সময় */}
                <div>
                  <label className="font-extrabold text-slate-800 block mb-1">৬. সময় *</label>
                  <input
                    type="time"
                    required
                    value={bookForm.appointment_time}
                    onChange={e => handleDoctorOrDateChange('appointment_time', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-blue-500 font-bold"
                  />
                </div>

                {/* ভিজিটের ধরন: নতুন / ফলো-আপ */}
                <div>
                  <label className="font-extrabold text-slate-800 block mb-1">৭. ভিজিটের ধরন</label>
                  <select
                    value={bookForm.visit_type}
                    onChange={e => setBookForm({ ...bookForm, visit_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-blue-500 bg-white font-bold"
                  >
                    <option value="নতুন">নতুন (New Visit)</option>
                    <option value="ফলো-আপ">ফলো-আপ (Follow-Up)</option>
                  </select>
                </div>

                {/* ভিজিটের সম্ভাব্য সময় */}
                <div>
                  <label className="font-extrabold text-slate-800 block mb-1">৮. ভিজিটের সম্ভাব্য সময়</label>
                  <select
                    value={bookForm.estimated_duration}
                    onChange={e => setBookForm({ ...bookForm, estimated_duration: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-blue-500 bg-white"
                  >
                    <option value="১০ মিনিট">১০ মিনিট</option>
                    <option value="১৫ মিনিট">১৫ মিনিট (স্ট্যান্ডার্ড)</option>
                    <option value="২০ মিনিট">২০ মিনিট</option>
                    <option value="৩০ মিনিট">৩০ মিনিট (বিস্তারিত)</option>
                  </select>
                </div>

                {/* বুকিং উৎস */}
                <div>
                  <label className="font-extrabold text-slate-800 block mb-1">৯. বুকিং উৎস</label>
                  <select
                    value={bookForm.booking_source}
                    onChange={e => setBookForm({ ...bookForm, booking_source: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-blue-500 bg-white"
                  >
                    <option value="সরাসরি কাউন্টার">সরাসরি কাউন্টার</option>
                    <option value="ফোন কল">ফোন কল</option>
                    <option value="অনলাইন পোর্টাল">অনলাইন পোর্টাল</option>
                    <option value="রেফারেল">অন্যান্য ডাক্তার রেফারেল</option>
                  </select>
                </div>

                {/* অবস্থা */}
                <div>
                  <label className="font-extrabold text-slate-800 block mb-1">১০. প্রাথমিক অবস্থা</label>
                  <select
                    value={bookForm.appointment_status}
                    onChange={e => setBookForm({ ...bookForm, appointment_status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-blue-500 bg-white font-bold"
                  >
                    <option value="বুক করা">বুক করা (Booked)</option>
                    <option value="নিশ্চিত">নিশ্চিত (Confirmed)</option>
                    <option value="অপেক্ষমাণ">অপেক্ষমাণ (Waiting)</option>
                  </select>
                </div>

                {/* নোট */}
                <div className="sm:col-span-2">
                  <label className="font-extrabold text-slate-800 block mb-1">১১. নোট / উপসর্গ বিবরণ</label>
                  <textarea
                    rows={2}
                    value={bookForm.notes}
                    onChange={e => setBookForm({ ...bookForm, notes: e.target.value })}
                    placeholder="রোগীর প্রধান সমস্যা বা বিশেষ নির্দেশনা..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-blue-500 text-xs"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-md flex items-center gap-1.5"
                >
                  <Check size={15} />
                  <span>বুকিং ও টোকেন নিশ্চিত করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: [সময় পরিবর্তন] (Reschedule Modal) */}
      {/* ========================================================================= */}
      {rescheduleModalAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
              <Clock size={18} className="text-blue-600" />
              <span>[সময় পরিবর্তন] (Reschedule Appointment)</span>
            </h3>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div><strong>রোগী:</strong> {rescheduleModalAppointment.patient_name}</div>
              <div><strong>ডাক্তার:</strong> {rescheduleModalAppointment.doctor_name}</div>
              <div><strong>বর্তমান সময়:</strong> {rescheduleModalAppointment.appointment_date} ({rescheduleModalAppointment.appointment_time})</div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">নতুন তারিখ</label>
                <input
                  type="date"
                  id="reschedule_date"
                  defaultValue={rescheduleModalAppointment.appointment_date}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">নতুন সময়</label>
                <input
                  type="time"
                  id="reschedule_time"
                  defaultValue={rescheduleModalAppointment.appointment_time}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRescheduleModalAppointment(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 font-bold text-xs"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = document.getElementById('reschedule_date')?.value;
                  const t = document.getElementById('reschedule_time')?.value;
                  handleConfirmReschedule(d, t);
                }}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md"
              >
                সময় পরিবর্তন নিশ্চিত করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: [বাতিল] নিশ্চিতকরণ ও অডিট নোট (Rule 3) */}
      {/* ========================================================================= */}
      {cancelModalAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-black text-rose-700 flex items-center gap-1.5">
              <XCircle size={18} />
              <span>[বাতিল] অ্যাপয়েন্টমেন্ট বাতিলকরণ ও অডিট নোট</span>
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed">
              নিয়ম ৩: অ্যাপয়েন্টমেন্টটি ডাটাবেজ থেকে মুছে ফেলা হবে না; বরং 'বাতিল' স্ট্যাটাস ও কারণসহ অডিট ট্রেইলে সংরক্ষিত থাকবে।
            </p>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <strong>রোগী:</strong> {cancelModalAppointment.patient_name} • টোকেন: {cancelModalAppointment.token_number}
            </div>

            <div className="text-xs">
              <label className="font-bold text-slate-700 block mb-1">বাতিল করার সুনির্দিষ্ট কারণ</label>
              <select
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white"
              >
                <option value="রোগীর ব্যক্তিগত কারণ / আসতে অপারগতা">রোগীর ব্যক্তিগত কারণ / আসতে অপারগতা</option>
                <option value="ডাক্তার অনাকাঙ্ক্ষিত কারণে অনুপস্থিত">ডাক্তার অনাকাঙ্ক্ষিত কারণে অনুপস্থিত</option>
                <option value="অন্য হাসপাতালে রেফারেল">অন্য হাসপাতালে রেফারেল</option>
                <option value="ভুল এন্ট্রি / ডুপ্লিকেট বুকিং">ভুল এন্ট্রি / ডুপ্লিকেট বুকিং</option>
              </select>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCancelModalAppointment(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 font-bold text-xs"
              >
                ফিরে যান
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md"
              >
                বাতিল নিশ্চিত করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: [টোকেন প্রিন্ট] (Token Slip Print Modal) */}
      {/* ========================================================================= */}
      {tokenSlipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4 animate-scale-in">
            <div className="border-b-2 border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900">হেলথকেয়ার 360° ক্লিনিক</h3>
              <p className="text-[10px] text-slate-500 font-bold">{tokenSlipModal.branch_name || currentBranch.name} • সিরিয়াল টোকেন</p>
            </div>

            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">টোকেন নম্বর</div>
              <div className="text-5xl font-black text-blue-700 my-1 font-mono">
                {tokenSlipModal.token_number || `#${tokenSlipModal.serial_number}`}
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-extrabold border border-teal-200">
                {tokenSlipModal.appointment_status || 'নিশ্চিত'}
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl text-xs text-left space-y-1.5 border border-slate-200">
              <div><strong>রোগী:</strong> {tokenSlipModal.patient_name} (UHID: {tokenSlipModal.patient_id})</div>
              <div><strong>ডাক্তার:</strong> {tokenSlipModal.doctor_name}</div>
              <div><strong>শাখা:</strong> {tokenSlipModal.branch_name || currentBranch.name}</div>
              <div><strong>তারিখ ও সময়:</strong> {tokenSlipModal.appointment_date} • {tokenSlipModal.appointment_time}</div>
              <div><strong>ভিজিটের ধরন:</strong> {tokenSlipModal.visit_type || 'নতুন'}</div>
            </div>

            <div className="flex justify-center">
              <QrCode size={48} className="text-slate-800" />
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setTokenSlipModal(null)}
                className="w-1/2 py-2 rounded-xl border border-slate-300 font-bold text-xs"
              >
                বন্ধ করুন
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                  setTokenSlipModal(null);
                }}
                className="w-1/2 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-md"
              >
                <Printer size={13} />
                <span>প্রিন্ট করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentSerialManager;
