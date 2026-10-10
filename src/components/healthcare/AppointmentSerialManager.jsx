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
  Printer,
  Sparkles,
  ChevronRight,
  Phone,
  QrCode,
  CalendarDays,
  UserX,
  Stethoscope
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

  // Active View: 'queue' (দৈনিক সিরিয়াল) | 'calendar' (ক্যালেন্ডার ভিউ) | 'cancelled' (বাতিল / অনুপস্থিত)
  const [activeTab, setActiveTab] = useState('queue');
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'Waiting' | 'In Consultation' | 'Completed'
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [tokenSlipModal, setTokenSlipModal] = useState(null);

  const currentBranch = branches.find(b => b.id === activeBranchId) || { name: 'ধানমন্ডি মেইন ব্রাঞ্চ' };

  // New Appointment Form State
  const [bookForm, setBookForm] = useState({
    patient_id: patients[0]?.patient_id || '',
    patient_name: patients[0]?.full_name || '',
    doctor_id: doctors[0]?.doctor_id || '',
    department: 'মেডিসিন',
    appointment_date: new Date().toISOString().split('T')[0],
    appointment_time: '18:00',
    visit_type: 'নতুন রোগী (New Visit)',
    consultation_fee: 1000,
    paid_amount: 1000,
    notes: 'স্বাভাবিক পরামর্শ ও ফলো-আপ'
  });

  // Filter Appointments
  const filteredAppointments = appointments.filter(a => {
    const matchDoctor = selectedDoctorFilter === 'all' || a.doctor_id === selectedDoctorFilter;
    const matchStatus = statusFilter === 'all' || a.appointment_status === statusFilter;
    return matchDoctor && matchStatus;
  });

  const waitingList = appointments.filter(a => a.appointment_status === 'Waiting');
  const completedList = appointments.filter(a => a.appointment_status === 'Completed');
  const cancelledList = appointments.filter(a => a.appointment_status === 'Cancelled' || a.appointment_status === 'Absent');

  const handleBookSubmit = (e) => {
    e.preventDefault();
    const selPat = patients.find(p => p.patient_id === bookForm.patient_id);
    const selDoc = doctors.find(d => d.doctor_id === bookForm.doctor_id);

    const newSerialNo = appointments.length + 1;
    const res = bookAppointment({
      ...bookForm,
      serial_number: newSerialNo,
      patient_name: selPat ? selPat.full_name : bookForm.patient_name,
      doctor_name: selDoc ? selDoc.name : 'কনসালটেন্ট ডাক্তার',
      branch_name: currentBranch.name
    });

    if (res && res.success) {
      alert(`সিরিয়াল #${res.appointment.serial_number} টোকেন বুকিং সম্পন্ন হয়েছে!`);
      setShowBookingModal(false);
      setTokenSlipModal(res.appointment);
    }
  };

  const handleStatusChange = (appId, newStatus) => {
    updateAppointmentStatus(appId, newStatus);
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* 1.5 Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-500/30 mb-2">
              <Sparkles size={13} />
              <span>১.৫ অ্যাপয়েন্টমেন্ট ও সিরিয়াল ম্যানেজমেন্ট</span>
            </span>
            <h2 className="text-2xl font-black tracking-tight">দৈনিক সিরিয়াল, কিউ ট্র্যাকার ও টোকেন প্রিন্ট</h2>
            <p className="text-sm text-blue-100/80 mt-1">
              ডাক্তারভিত্তিক সিরিয়াল বুকিং, অপেক্ষমাণ টোকেন কিউ, ক্যালেন্ডার এবং রোগী উপস্থিতি স্ট্যাটাস।
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('queue')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'queue' ? 'bg-white text-slate-900 shadow-md' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              দৈনিক সিরিয়াল কিউ
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'calendar' ? 'bg-white text-slate-900 shadow-md' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              ক্যালেন্ডার ভিউ
            </button>
            <button
              onClick={() => setActiveTab('cancelled')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'cancelled' ? 'bg-white text-slate-900 shadow-md' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              বাতিল / অনুপস্থিত ({cancelledList.length})
            </button>
            <button
              onClick={() => setShowBookingModal(true)}
              className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-black text-xs shadow-md flex items-center gap-1.5"
            >
              <Plus size={15} />
              <span>নতুন অ্যাপয়েন্টমেন্ট</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-500">আজকের মোট সিরিয়াল</div>
          <div className="text-2xl font-black text-slate-900 mt-0.5">{appointments.length} জন</div>
        </div>
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 shadow-sm">
          <div className="text-xs font-bold text-amber-700">অপেক্ষমাণ রোগী (Waiting)</div>
          <div className="text-2xl font-black text-amber-800 mt-0.5">{waitingList.length} জন</div>
        </div>
        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 shadow-sm">
          <div className="text-xs font-bold text-emerald-700">ভিজিট সম্পন্ন (Completed)</div>
          <div className="text-2xl font-black text-emerald-800 mt-0.5">{completedList.length} জন</div>
        </div>
        <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 shadow-sm">
          <div className="text-xs font-bold text-rose-700">বাতিল / অনুপস্থিত</div>
          <div className="text-2xl font-black text-rose-800 mt-0.5">{cancelledList.length} জন</div>
        </div>
      </div>

      {/* SUBTAB 1: DAILY SERIALS QUEUE */}
      {activeTab === 'queue' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Doctor filter */}
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                <span>ডাক্তার:</span>
                <select
                  value={selectedDoctorFilter}
                  onChange={e => setSelectedDoctorFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-blue-500"
                >
                  <option value="all">সব ডাক্তার ({doctors.length} জন)</option>
                  {doctors.map(d => (
                    <option key={d.doctor_id} value={d.doctor_id}>{d.name} ({d.specialty})</option>
                  ))}
                </select>
              </div>

              {/* Status filter */}
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                <span>স্ট্যাটাস:</span>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-blue-500"
                >
                  <option value="all">সকল অবস্থা</option>
                  <option value="Waiting">অপেক্ষমাণ (Waiting)</option>
                  <option value="In Consultation">ডাক্তার দেখছেন</option>
                  <option value="Completed">সম্পন্ন (Completed)</option>
                </select>
              </div>
            </div>

            <span className="text-xs text-slate-500 font-bold">
              সক্রিয় শাখা: <strong className="text-blue-700">{currentBranch.name}</strong>
            </span>
          </div>

          {/* Appointments Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[11px]">
                <tr>
                  <th className="p-3 text-center">টোকেন নং</th>
                  <th className="p-3">রোগীর নাম ও UHID</th>
                  <th className="p-3">ডাক্তার ও বিভাগ</th>
                  <th className="p-3">সময়সূচি</th>
                  <th className="p-3">ভিজিটের ধরন</th>
                  <th className="p-3">ফি ও পেমেন্ট</th>
                  <th className="p-3">বর্তমান অবস্থা</th>
                  <th className="p-3 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredAppointments.map(app => (
                  <tr key={app.appointment_id} className="hover:bg-slate-50/70">
                    <td className="p-3 text-center">
                      <span className="w-8 h-8 rounded-xl bg-blue-100 text-blue-900 font-black flex items-center justify-center mx-auto text-sm">
                        #{app.serial_number}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{app.patient_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">UHID: {app.patient_id}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-800">{app.doctor_name}</div>
                      <div className="text-[10px] text-slate-400">{app.department || 'মেডিসিন'}</div>
                    </td>
                    <td className="p-3 font-mono">
                      <div>{app.appointment_date}</div>
                      <div className="text-[10px] text-slate-500">{app.appointment_time}</div>
                    </td>
                    <td className="p-3">{app.visit_type}</td>
                    <td className="p-3 font-bold text-emerald-700">৳{app.consultation_fee}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          app.appointment_status === 'Waiting'
                            ? 'bg-amber-100 text-amber-800'
                            : app.appointment_status === 'In Consultation'
                            ? 'bg-blue-100 text-blue-800'
                            : app.appointment_status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {app.appointment_status}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-1">
                      {app.appointment_status === 'Waiting' && (
                        <button
                          onClick={() => handleStatusChange(app.appointment_id, 'In Consultation')}
                          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold"
                          title="রোগী চেম্বারে প্রবেশ করেছেন"
                        >
                          কল করুন ➔
                        </button>
                      )}
                      {app.appointment_status === 'In Consultation' && (
                        <button
                          onClick={() => handleStatusChange(app.appointment_id, 'Completed')}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold"
                        >
                          সম্পন্ন ✓
                        </button>
                      )}
                      <button
                        onClick={() => setTokenSlipModal(app)}
                        className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
                        title="টোকেন প্রিন্ট"
                      >
                        <Printer size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 2: CALENDAR SCHEDULE GRID */}
      {activeTab === 'calendar' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <CalendarDays className="text-blue-600" size={18} />
              <span>মাসিক / সাপ্তাহিক ক্যালেন্ডার শিডিউল</span>
            </h3>
            <span className="text-xs text-slate-500 font-bold">অক্টোবর ২০২৬</span>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs">
            {['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'].map((day, idx) => (
              <div key={idx} className="p-2 font-black text-slate-400 uppercase text-[10px]">
                {day}
              </div>
            ))}
            {[8, 9, 10, 11, 12, 13, 14].map((date, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-2xl border min-h-[90px] text-left flex flex-col justify-between ${
                  date === 10
                    ? 'bg-blue-50/70 border-blue-400 font-bold'
                    : 'bg-slate-50/50 border-slate-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className={`text-xs font-black ${date === 10 ? 'text-blue-700' : 'text-slate-700'}`}>
                    {date} অক্টো
                  </span>
                  {date === 10 && <span className="text-[9px] bg-blue-600 text-white px-1.5 py-0.2 rounded-full">আজ</span>}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  {date === 10 ? `${appointments.length} অ্যাপয়েন্টমেন্ট` : `${Math.floor(date * 1.5)} বুকিং`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 3: CANCELLED / ABSENT */}
      {activeTab === 'cancelled' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-base font-black text-rose-900 flex items-center gap-2">
            <UserX size={18} className="text-rose-600" />
            <span>বাতিল ও অনুপস্থিত রোগীর তালিকা</span>
          </h3>
          <p className="text-xs text-slate-500">রোগী উপস্থিত না থাকলে বা অ্যাপয়েন্টমেন্ট বাতিল হলে এখানে সংরক্ষিত থাকে।</p>
          <div className="p-6 bg-rose-50/50 rounded-2xl border border-rose-200 text-xs text-rose-800 text-center font-bold">
            বর্তমানে কোনো বাতিল বা অনুপস্থিত রোগী নেই।
          </div>
        </div>
      )}

      {/* NEW APPOINTMENT BOOKING MODAL */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-scale-in">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900">নতুন সিরিয়াল বুকিং (New Appointment)</h3>
                <p className="text-xs text-slate-500">শাখা: {currentBranch.name}</p>
              </div>
              <button onClick={() => setShowBookingModal(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>
            </div>

            <form onSubmit={handleBookSubmit} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">রোগী নির্বাচন</label>
                <select
                  value={bookForm.patient_id}
                  onChange={e => {
                    const p = patients.find(item => item.patient_id === e.target.value);
                    setBookForm({
                      ...bookForm,
                      patient_id: e.target.value,
                      patient_name: p ? p.full_name : ''
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-blue-500 font-bold"
                >
                  {patients.map(p => (
                    <option key={p.patient_id} value={p.patient_id}>
                      {p.full_name} ({p.patient_id}) • {p.mobile_number || p.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">ডাক্তার ও বিভাগ নির্বাচন</label>
                <select
                  value={bookForm.doctor_id}
                  onChange={e => {
                    const d = doctors.find(item => item.doctor_id === e.target.value);
                    setBookForm({
                      ...bookForm,
                      doctor_id: e.target.value,
                      consultation_fee: d?.consultation_fee || 1000,
                      department: d?.specialty || 'মেডিসিন'
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-blue-500 font-bold"
                >
                  {doctors.map(d => (
                    <option key={d.doctor_id} value={d.doctor_id}>
                      {d.name} ({d.specialty}) • ফি: ৳{d.consultation_fee || 1000}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">তারিখ</label>
                  <input
                    type="date"
                    value={bookForm.appointment_date}
                    onChange={e => setBookForm({ ...bookForm, appointment_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-blue-500 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">সময়</label>
                  <input
                    type="time"
                    value={bookForm.appointment_time}
                    onChange={e => setBookForm({ ...bookForm, appointment_time: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-blue-500 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">ভিজিটের ধরন</label>
                  <select
                    value={bookForm.visit_type}
                    onChange={e => setBookForm({ ...bookForm, visit_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-blue-500"
                  >
                    <option value="নতুন রোগী (New Visit)">নতুন রোগী (New Visit)</option>
                    <option value="ফলো-আপ (Follow-Up)">ফলো-আপ (Follow-Up)</option>
                    <option value="রিপোর্ট দেখানো (Report Review)">রিপোর্ট দেখানো</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">পরামর্শ ফি (৳)</label>
                  <input
                    type="number"
                    value={bookForm.consultation_fee}
                    onChange={e => setBookForm({ ...bookForm, consultation_fee: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-blue-500 font-black text-emerald-700"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md"
                >
                  বুকিং ও টোকেন নিশ্চিত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOKEN PRINT PREVIEW MODAL */}
      {tokenSlipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4 animate-scale-in">
            <div className="border-b-2 border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900">হেলথকেয়ার 360° ক্লিনিক</h3>
              <p className="text-[10px] text-slate-500">{currentBranch.name} • সিরিয়াল টোকেন স্লিপ</p>
            </div>

            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">টোকেন নম্বর</div>
              <div className="text-5xl font-black text-blue-700 my-1">
                #{tokenSlipModal.serial_number}
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold">
                {tokenSlipModal.appointment_status || 'Waiting'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl text-xs text-left space-y-1">
              <div><strong>রোগী:</strong> {tokenSlipModal.patient_name}</div>
              <div><strong>ডাক্তার:</strong> {tokenSlipModal.doctor_name}</div>
              <div><strong>তারিখ:</strong> {tokenSlipModal.appointment_date} • {tokenSlipModal.appointment_time}</div>
              <div><strong>ফি:</strong> ৳{tokenSlipModal.consultation_fee} (পরিশোধিত)</div>
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
