import React, { useState } from 'react';
import { useHealthcare } from '../../context/HealthcareContext';
import {
  Bed,
  UserPlus,
  Users,
  Activity,
  Calendar,
  Clock,
  Plus,
  CheckCircle2,
  AlertCircle,
  FileText,
  Printer,
  Search,
  DollarSign,
  ChevronRight,
  LogOut,
  Sparkles,
  ShieldAlert
} from 'lucide-react';

export const InpatientBedManager = () => {
  const { patients = [], doctors = [] } = useHealthcare();

  // Beds state
  const [beds, setBeds] = useState([
    { id: 'B-101', ward: 'পুরুষ জেনারেল ওয়ার্ড', type: 'সাধারণ বেড', charge: 800, status: 'occupied', patientName: 'মো: রফিকুল ইসলাম', uhid: 'UHID-2026-001', admitDate: '2026-10-08', doctor: 'ডা: রফিকুল ইসলাম (মেডিসিন)' },
    { id: 'B-102', ward: 'পুরুষ জেনারেল ওয়ার্ড', type: 'সাধারণ বেড', charge: 800, status: 'available', patientName: null, uhid: null, admitDate: null, doctor: null },
    { id: 'B-103', ward: 'মহিলা জেনারেল ওয়ার্ড', type: 'সাধারণ বেড', charge: 800, status: 'occupied', patientName: 'মোসা: সুমি আক্তার', uhid: 'UHID-2026-003', admitDate: '2026-10-09', doctor: 'ডা: সুলতানা রেজিয়া (গাইনী)' },
    { id: 'B-104', ward: 'মহিলা জেনারেল ওয়ার্ড', type: 'সাধারণ বেড', charge: 800, status: 'cleaning', patientName: null, uhid: null, admitDate: null, doctor: null },
    { id: 'C-201', ward: 'ভিআইপি কেবিন (এসি)', type: 'ভিআইপি কেবিন', charge: 3500, status: 'occupied', patientName: 'আলহাজ্ব মো: আব্দুল করিম', uhid: 'UHID-2026-002', admitDate: '2026-10-07', doctor: 'ডা: মোস্তাফিজুর রহমান (কার্ডিওলজি)' },
    { id: 'C-202', ward: 'ডিলাক্স কেবিন (নন-এসি)', type: 'ডিলাক্স কেবিন', charge: 2200, status: 'available', patientName: null, uhid: null, admitDate: null, doctor: null },
    { id: 'ICU-01', ward: 'আইসিইউ (ICU)', type: 'আইসিইউ বেড', charge: 6500, status: 'occupied', patientName: 'তারেক মাহমুদ', uhid: 'UHID-2026-005', admitDate: '2026-10-10', doctor: 'ডা: মোস্তাফিজুর রহমান (কার্ডিওলজি)' },
    { id: 'ICU-02', ward: 'আইসিইউ (ICU)', type: 'আইসিইউ বেড', charge: 6500, status: 'available', patientName: null, uhid: null, admitDate: null, doctor: null }
  ]);

  // Admission Modal State
  const [showAdmitModal, setShowAdmitModal] = useState(false);
  const [selectedBedForAdmit, setSelectedBedForAdmit] = useState(null);
  const [admitForm, setAdmitForm] = useState({
    patientId: '',
    patientName: '',
    doctorId: '',
    doctorName: '',
    diagnosis: '',
    advancePaid: 3000,
    emergencyContact: ''
  });

  // Discharge Modal State
  const [showDischargeModal, setShowDischargeModal] = useState(false);
  const [selectedBedForDischarge, setSelectedBedForDischarge] = useState(null);
  const [dischargeForm, setDischargeForm] = useState({
    summary: 'রোগীর অবস্থা স্থিতিশীল ও উন্নতিজনক। ব্যবস্থাপত্র অনুযায়ী নিয়মিত ওষুধ সেবন করবেন।',
    followUpDate: '2026-10-17',
    dischargeDoctor: ''
  });

  const availableBeds = beds.filter(b => b.status === 'available');
  const occupiedBeds = beds.filter(b => b.status === 'occupied');
  const cleaningBeds = beds.filter(b => b.status === 'cleaning');

  const handleOpenAdmitModal = (bed) => {
    setSelectedBedForAdmit(bed);
    setAdmitForm({
      patientId: patients[0]?.patient_id || '',
      patientName: patients[0]?.full_name || '',
      doctorId: doctors[0]?.doctor_id || '',
      doctorName: doctors[0]?.name || '',
      diagnosis: 'তীব্র জ্বর ও শ্বাসকষ্ট (Observation)',
      advancePaid: 3000,
      emergencyContact: '01711223344'
    });
    setShowAdmitModal(true);
  };

  const handleConfirmAdmission = (e) => {
    e.preventDefault();
    if (!selectedBedForAdmit) return;

    setBeds(prev =>
      prev.map(b =>
        b.id === selectedBedForAdmit.id
          ? {
              ...b,
              status: 'occupied',
              patientName: admitForm.patientName,
              uhid: admitForm.patientId || 'UHID-' + Date.now().toString().slice(-4),
              admitDate: new Date().toISOString().split('T')[0],
              doctor: admitForm.doctorName
            }
          : b
      )
    );
    setShowAdmitModal(false);
    alert(`সফলভাবে বেড নং ${selectedBedForAdmit.id}-এ রোগী ভর্তি সম্পন্ন হয়েছে!`);
  };

  const handleOpenDischargeModal = (bed) => {
    setSelectedBedForDischarge(bed);
    setDischargeForm({
      summary: 'চিকিৎসা সম্পন্ন। রোগীর অবস্থা সন্তোষজনক। ৭ দিন পর আউটডোরে ফলো-আপ করবেন।',
      followUpDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      dischargeDoctor: bed.doctor || 'কনসালটেন্ট ডাক্তার'
    });
    setShowDischargeModal(true);
  };

  const handleConfirmDischarge = (e) => {
    e.preventDefault();
    if (!selectedBedForDischarge) return;

    setBeds(prev =>
      prev.map(b =>
        b.id === selectedBedForDischarge.id
          ? {
              ...b,
              status: 'cleaning',
              patientName: null,
              uhid: null,
              admitDate: null,
              doctor: null
            }
          : b
      )
    );
    setShowDischargeModal(false);
    alert(`রোগীর ছাড়পত্র (Discharge) অনুমোদন হয়েছে। বেড ${selectedBedForDischarge.id} পরিচ্ছন্নতার জন্য প্রস্তুত হচ্ছে।`);
  };

  const handleMarkCleaned = (bedId) => {
    setBeds(prev =>
      prev.map(b => (b.id === bedId ? { ...b, status: 'available' } : b))
    );
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-cyan-900 via-teal-900 to-slate-900 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold border border-cyan-500/30 mb-2">
              <Sparkles size={13} />
              <span>মডিউল ১০: ইনপেশেন্ট (IPD) ও ওয়ার্ড/কেবিন বেড ম্যানেজমেন্ট</span>
            </span>
            <h2 className="text-2xl font-black tracking-tight">হাসপাতাল ভর্তি রোগী ও বেড ট্র্যাকিং</h2>
            <p className="text-sm text-cyan-100/80 mt-1">
              রিয়েলটাইম বেড স্ট্যাটাস, ওয়ার্ড/কেবিন বরাদ্দ, ভর্তি ফরম, দৈনিক বেড চার্জ ও ডিসচার্জ সামারি।
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const firstAvailable = beds.find(b => b.status === 'available');
                if (firstAvailable) handleOpenAdmitModal(firstAvailable);
                else alert('বর্তমানে কোনো খালি বেড নেই!');
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-slate-950 font-bold text-sm shadow-lg flex items-center gap-2 transition-all transform active:scale-95"
            >
              <UserPlus size={16} />
              <span>নতুন রোগী ভর্তি (Admit)</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500">মোট বেড সংখ্যা</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{beds.length} টি</div>
          </div>
          <span className="p-2.5 bg-slate-100 text-slate-700 rounded-xl">
            <Bed size={20} />
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-emerald-700">খালি বেড (Available)</div>
            <div className="text-2xl font-black text-emerald-800 mt-0.5">{availableBeds.length} টি</div>
          </div>
          <span className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
            <CheckCircle2 size={20} />
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-rose-700">ভর্তি রোগী (Occupied)</div>
            <div className="text-2xl font-black text-rose-800 mt-0.5">{occupiedBeds.length} জন</div>
          </div>
          <span className="p-2.5 bg-rose-100 text-rose-700 rounded-xl">
            <Users size={20} />
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-amber-700">পরিচ্ছন্ন হচ্ছে (Cleaning)</div>
            <div className="text-2xl font-black text-amber-800 mt-0.5">{cleaningBeds.length} টি</div>
          </div>
          <span className="p-2.5 bg-amber-100 text-amber-700 rounded-xl">
            <Clock size={20} />
          </span>
        </div>
      </div>

      {/* Bed Grid Matrix */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Bed className="text-cyan-600" size={20} />
              <span>ওয়ার্ড ও কেবিন লাইভ ম্যাট্রিক্স (Live Bed Board)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">সবুজ = খালি, লাল = রোগী ভর্তি, হলুদ = স্যানিটাইজেশন চলছে</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> খালি
            </span>
            <span className="flex items-center gap-1.5 text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span> ভর্তি
            </span>
            <span className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> ক্লিনিং
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {beds.map(bed => {
            const isAvail = bed.status === 'available';
            const isOcc = bed.status === 'occupied';
            const isClean = bed.status === 'cleaning';

            return (
              <div
                key={bed.id}
                className={`p-4 rounded-2xl border transition-all relative flex flex-col justify-between ${
                  isAvail
                    ? 'bg-emerald-50/40 border-emerald-200 hover:border-emerald-400 hover:shadow-md'
                    : isOcc
                    ? 'bg-rose-50/40 border-rose-200 hover:border-rose-400 hover:shadow-md'
                    : 'bg-amber-50/40 border-amber-200'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-black text-slate-900 px-2.5 py-0.5 rounded-lg bg-white border border-slate-200 shadow-xs">
                      {bed.id}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        isAvail
                          ? 'bg-emerald-100 text-emerald-800'
                          : isOcc
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {isAvail ? 'খালি' : isOcc ? 'ভর্তি আছে' : 'ক্লিনিং'}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-slate-800">{bed.ward}</div>
                  <div className="text-[11px] text-slate-500 mb-2">{bed.type} • ৳{bed.charge}/দিন</div>

                  {isOcc && (
                    <div className="p-2.5 rounded-xl bg-white/80 border border-rose-100 text-xs space-y-1 mb-3">
                      <div className="font-bold text-slate-900 flex items-center gap-1">
                        <span>👤 {bed.patientName}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">আইডি: {bed.uhid}</div>
                      <div className="text-[10px] text-slate-500">ভর্তি: {bed.admitDate}</div>
                      <div className="text-[10px] text-slate-700 font-medium">🩺 {bed.doctor}</div>
                    </div>
                  )}

                  {isClean && (
                    <div className="p-2.5 rounded-xl bg-white/80 border border-amber-100 text-xs text-amber-800 mb-3 text-center">
                      🧹 বেড জীবাণুমুক্ত করা হচ্ছে
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  {isAvail && (
                    <button
                      onClick={() => handleOpenAdmitModal(bed)}
                      className="w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs transition-all"
                    >
                      <UserPlus size={13} />
                      <span>ভর্তি করান</span>
                    </button>
                  )}

                  {isOcc && (
                    <button
                      onClick={() => handleOpenDischargeModal(bed)}
                      className="w-full py-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs transition-all"
                    >
                      <LogOut size={13} />
                      <span>ছাড়পত্র (Discharge)</span>
                    </button>
                  )}

                  {isClean && (
                    <button
                      onClick={() => handleMarkCleaned(bed.id)}
                      className="w-full py-1.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs transition-all"
                    >
                      <CheckCircle2 size={13} />
                      <span>প্রস্তুত চিহ্নিত করুন</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ADMISSION MODAL */}
      {showAdmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-scale-in">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900">ইনপেশেন্ট ভর্তি ফরম (IPD Admission)</h3>
                <p className="text-xs text-slate-500">বেড নং: {selectedBedForAdmit?.id} ({selectedBedForAdmit?.ward})</p>
              </div>
              <button onClick={() => setShowAdmitModal(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">×</button>
            </div>

            <form onSubmit={handleConfirmAdmission} className="space-y-4 mt-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">রোগী নির্বাচন / নাম</label>
                <input
                  type="text"
                  required
                  value={admitForm.patientName}
                  onChange={e => setAdmitForm({ ...admitForm, patientName: e.target.value })}
                  placeholder="রোগীর নাম লিখুন"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-teal-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">ভর্তি করানো ডাক্তার</label>
                <select
                  value={admitForm.doctorName}
                  onChange={e => setAdmitForm({ ...admitForm, doctorName: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-teal-500"
                >
                  {doctors.map(d => (
                    <option key={d.doctor_id} value={d.name}>{d.name} ({d.specialty})</option>
                  ))}
                  <option value="অন্যান্য কনসালটেন্ট">অন্যান্য কনসালটেন্ট</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">প্রাথমিক রোগ / ডায়াগনসিস</label>
                <input
                  type="text"
                  value={admitForm.diagnosis}
                  onChange={e => setAdmitForm({ ...admitForm, diagnosis: e.target.value })}
                  placeholder="রোগের প্রাথমিক বিবরণ"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">অগ্রিম জমা (Advance ৳)</label>
                  <input
                    type="number"
                    value={admitForm.advancePaid}
                    onChange={e => setAdmitForm({ ...admitForm, advancePaid: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-teal-500 font-bold text-emerald-700"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">জরুরি যোগাযোগ নম্বর</label>
                  <input
                    type="text"
                    value={admitForm.emergencyContact}
                    onChange={e => setAdmitForm({ ...admitForm, emergencyContact: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-teal-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdmitModal(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-300 hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-md"
                >
                  ভর্তি নিশ্চিত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DISCHARGE MODAL */}
      {showDischargeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-scale-in">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-rose-900">রোগীর ছাড়পত্র ফরম (Discharge Summary)</h3>
                <p className="text-xs text-slate-500">রোগী: {selectedBedForDischarge?.patientName} • বেড: {selectedBedForDischarge?.id}</p>
              </div>
              <button onClick={() => setShowDischargeModal(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">×</button>
            </div>

            <form onSubmit={handleConfirmDischarge} className="space-y-4 mt-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">চিকিৎসার সারসংক্ষেপ ও ছাড়পত্রের নির্দেশনা</label>
                <textarea
                  rows="3"
                  value={dischargeForm.summary}
                  onChange={e => setDischargeForm({ ...dischargeForm, summary: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">পরবর্তী ফলো-আপ তারিখ</label>
                  <input
                    type="date"
                    value={dischargeForm.followUpDate}
                    onChange={e => setDischargeForm({ ...dischargeForm, followUpDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-rose-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">ছাড়পত্র অনুমোদনকারী ডাক্তার</label>
                  <input
                    type="text"
                    value={dischargeForm.dischargeDoctor}
                    onChange={e => setDischargeForm({ ...dischargeForm, dischargeDoctor: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-rose-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <span>ছাড়পত্র ইস্যু করার পর সেন্ট্রাল ক্যাশিয়ার থেকে ফাইনাল বিল পরিশোধ করা হবে।</span>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDischargeModal(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-300 hover:bg-slate-50"
                >
                  ফিরে যান
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md flex items-center gap-1.5"
                >
                  <Printer size={14} />
                  <span>ছাড়পত্র ও বিল সম্পন্ন করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InpatientBedManager;
