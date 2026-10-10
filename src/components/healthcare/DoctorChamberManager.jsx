import React, { useState } from 'react';
import { useHealthcare } from '../../context/HealthcareContext';
import {
  Stethoscope,
  Users,
  Plus,
  Clock,
  Calendar,
  DollarSign,
  Award,
  Sparkles,
  BarChart3,
  Phone,
  Search,
  CheckCircle2,
  Edit,
  ShieldCheck
} from 'lucide-react';

export const DoctorChamberManager = () => {
  const {
    doctors = [],
    appointments = [],
    branches = [],
    activeBranchId = 'dhanmondi'
  } = useHealthcare();

  const [subTab, setSubTab] = useState('list'); // 'list' | 'schedules' | 'reports'
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [doctorList, setDoctorList] = useState(doctors);

  const [form, setForm] = useState({
    name: '',
    specialty: 'মেডিসিন বিশেষজ্ঞ',
    degree: 'MBBS, FCPS (Medicine)',
    phone: '',
    schedule: 'শনি - বুধ (বিকাল ৫টা - রাত ৯টা)',
    off_day: 'বৃহস্পতিবার ও শুক্রবার',
    consultation_fee: 1000,
    follow_up_fee: 600,
    max_patients_per_day: 30,
    room_number: 'রুম ২০৪',
    status: 'active'
  });

  const filteredDoctors = doctorList.filter(d =>
    d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.specialty?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddDoctor = (e) => {
    e.preventDefault();
    const newDoc = {
      ...form,
      doctor_id: `DOC-2026-${Math.floor(100 + Math.random() * 900)}`,
      total_patients: 0
    };
    setDoctorList([newDoc, ...doctorList]);
    setShowAddDoctorModal(false);
    alert(`ডা: ${newDoc.name} সফলভাবে চেম্বার ডাক্তার তালিকায় যুক্ত হয়েছেন!`);
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-sky-900 via-indigo-950 to-slate-900 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-bold border border-sky-500/30 mb-2">
              <Sparkles size={13} />
              <span>১.৬ ডাক্তার ও চেম্বার ডিরেক্টরি</span>
            </span>
            <h2 className="text-2xl font-black tracking-tight">ডাক্তার তালিকা, বিশেষত্ব, সময়সূচি ও ফি সেটিং</h2>
            <p className="text-sm text-sky-100/80 mt-1">
              চেম্বার সময়সূচি, সাপ্তাহিক ছুটি, কনসালটেন্সি ফি, ফলো-আপ ফি এবং ডাক্তারভিত্তিক পারফরম্যান্স রিপোর্ট।
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSubTab('list')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                subTab === 'list' ? 'bg-white text-slate-900 shadow-md' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              ডাক্তার তালিকা ({doctorList.length})
            </button>
            <button
              onClick={() => setSubTab('schedules')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                subTab === 'schedules' ? 'bg-white text-slate-900 shadow-md' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              চেম্বার সময়সূচি
            </button>
            <button
              onClick={() => setSubTab('reports')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                subTab === 'reports' ? 'bg-white text-slate-900 shadow-md' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              ডাক্তারভিত্তিক রিপোর্ট
            </button>
            <button
              onClick={() => setShowAddDoctorModal(true)}
              className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-slate-950 font-black text-xs shadow-md flex items-center gap-1.5"
            >
              <Plus size={15} />
              <span>নতুন ডাক্তার</span>
            </button>
          </div>
        </div>
      </div>

      {/* SUBTAB 1: DOCTOR LIST & FEES */}
      {subTab === 'list' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="ডাক্তারের নাম বা বিভাগ দিয়ে খুঁজুন..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-sky-500"
              />
            </div>
            <span className="text-xs font-bold text-slate-500">
              মোট চিকিৎসক: <strong className="text-sky-700">{filteredDoctors.length} জন</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDoctors.map(doc => (
              <div
                key={doc.doctor_id}
                className="p-5 rounded-2xl border border-slate-200 hover:border-sky-400 hover:shadow-md transition-all bg-white flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-sky-50 text-sky-700"><Stethoscope size={16} /></span>
                      <span>{doc.name}</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                      সক্রিয়
                    </span>
                  </div>

                  <div className="text-xs font-bold text-sky-800">{doc.specialty}</div>
                  <div className="text-[11px] text-slate-500">{doc.degree || 'MBBS, FCPS'}</div>
                  <div className="text-[11px] text-slate-400 mt-1">কক্ষ: {doc.room_number || 'রুম ২০৪'}</div>

                  <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">পরামর্শ ফি (New):</span>
                      <strong className="text-emerald-700">৳{doc.consultation_fee || 1000}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">ফলো-আপ ফি:</span>
                      <strong className="text-slate-700">৳{doc.follow_up_fee || 600}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">দৈনিক সর্বোচ্চ রোগী:</span>
                      <strong className="text-slate-700">{doc.max_patients_per_day || 30} জন</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-mono text-[10px]">{doc.doctor_id}</span>
                  <span className="text-[11px] font-bold text-sky-700">{doc.phone || '০১৭xxxxxxxx'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 2: CHAMBER SCHEDULES */}
      {subTab === 'schedules' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Clock size={18} className="text-sky-600" />
            <span>সাপ্তাহিক চেম্বার ও রোস্টার সময়সূচি</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[11px]">
                <tr>
                  <th className="p-3">ডাক্তারের নাম</th>
                  <th className="p-3">বিভাগ / স্পেশালিটি</th>
                  <th className="p-3">চেম্বার দিন ও সময়</th>
                  <th className="p-3">সাপ্তাহিক ছুটি</th>
                  <th className="p-3">কক্ষ নং</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {doctorList.map(doc => (
                  <tr key={doc.doctor_id} className="hover:bg-slate-50/70">
                    <td className="p-3 font-bold text-slate-900">{doc.name}</td>
                    <td className="p-3 text-sky-700 font-bold">{doc.specialty}</td>
                    <td className="p-3">{doc.schedule || 'শনি - বুধ (বিকাল ৫টা - রাত ৯টা)'}</td>
                    <td className="p-3 text-rose-600 font-bold">{doc.off_day || 'শুক্রবার'}</td>
                    <td className="p-3">{doc.room_number || 'রুম ২০৪'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 3: DOCTOR-WISE PERFORMANCE REPORTS */}
      {subTab === 'reports' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <BarChart3 size={18} className="text-indigo-600" />
            <span>ডাক্তারভিত্তিক রোগী দেখা ও রাজস্ব রিপোর্ট</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[11px]">
                <tr>
                  <th className="p-3">ডাক্তারের নাম</th>
                  <th className="p-3 text-center">আজকের রোগী</th>
                  <th className="p-3 text-center">চলতি মাসের রোগী</th>
                  <th className="p-3 text-center">প্রেসক্রিপশন ইস্যু</th>
                  <th className="p-3 text-right">মোট ফি আদায় (৳)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {doctorList.map((doc, i) => (
                  <tr key={doc.doctor_id} className="hover:bg-slate-50/70">
                    <td className="p-3 font-bold text-slate-900">{doc.name}</td>
                    <td className="p-3 text-center font-bold text-sky-700">{(i + 1) * 8} জন</td>
                    <td className="p-3 text-center font-bold text-indigo-700">{(i + 1) * 95} জন</td>
                    <td className="p-3 text-center font-bold">{(i + 1) * 92} টি</td>
                    <td className="p-3 text-right font-black text-emerald-700">৳{((i + 1) * 95000).toLocaleString('bn-BD')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* NEW DOCTOR MODAL */}
      {showAddDoctorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-scale-in">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900">নতুন ডাক্তার যোগ করুন</h3>
              <button onClick={() => setShowAddDoctorModal(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>
            </div>

            <form onSubmit={handleAddDoctor} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">ডাক্তারের নাম *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="যেমন: ডা: সাজ্জাদ হোসেন"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-sky-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">বিভাগ / স্পেশালিটি</label>
                  <input
                    type="text"
                    required
                    value={form.specialty}
                    onChange={e => setForm({ ...form, specialty: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-sky-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">ডিগ্রি ও পদবী</label>
                  <input
                    type="text"
                    value={form.degree}
                    onChange={e => setForm({ ...form, degree: e.target.value })}
                    placeholder="MBBS, FCPS"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">পরামর্শ ফি (৳)</label>
                  <input
                    type="number"
                    value={form.consultation_fee}
                    onChange={e => setForm({ ...form, consultation_fee: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-sky-500 font-bold text-emerald-700"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">ফলো-আপ ফি (৳)</label>
                  <input
                    type="number"
                    value={form.follow_up_fee}
                    onChange={e => setForm({ ...form, follow_up_fee: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-sky-500 font-bold text-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">চেম্বার সময়সূচি</label>
                <input
                  type="text"
                  value={form.schedule}
                  onChange={e => setForm({ ...form, schedule: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-sky-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddDoctorModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold shadow-md"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorChamberManager;
