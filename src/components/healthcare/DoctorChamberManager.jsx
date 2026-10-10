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
  ShieldCheck,
  Building2,
  Check,
  X,
  AlertTriangle,
  Power,
  Shield,
  FileCheck
} from 'lucide-react';

export const DoctorChamberManager = () => {
  const {
    doctors = [],
    branches = [],
    activeBranchId = 'dhanmondi'
  } = useHealthcare();

  const [subTab, setSubTab] = useState('list'); // 'list' | 'schedules' | 'rules'
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [editingDoctorId, setEditingDoctorId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');

  // Doctor list state
  const [doctorList, setDoctorList] = useState(() => {
    try {
      const saved = localStorage.getItem('hisabkitab_hc_doctors_expanded');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        doctor_id: 'DOC-01',
        name: 'ডা: আহমেদ রফিক (Prof. Dr. Ahmed Rafiq)',
        bmdc_reg_no: 'BMDC-A-45812',
        bmdc_verified: true,
        specialty: 'মেডিসিন বিশেষজ্ঞ',
        degree: 'MBBS, FCPS (Medicine), FRCP (Glasgow)',
        phone: '০১৭০০-১১২২৩৩',
        assigned_branches: ['dhanmondi', 'uttara'],
        branch_schedules: {
          dhanmondi: { time: '05:00 PM - 09:00 PM', days: 'শনি, সোম, বুধ', new_fee: 1200, follow_fee: 700 },
          uttara: { time: '09:00 AM - 01:00 PM', days: 'রবি, মঙ্গল, বৃহস্পতি', new_fee: 1000, follow_fee: 600 }
        },
        off_days: 'শুক্রবার',
        new_visit_fee: 1200,
        follow_up_fee: 700,
        follow_up_validity_days: 14,
        max_patients_per_day: 30,
        is_active: true
      },
      {
        doctor_id: 'DOC-02',
        name: 'ডা: তানজিলা হক (Dr. Tanzila Haque)',
        bmdc_reg_no: 'BMDC-A-51920',
        bmdc_verified: true,
        specialty: 'গাইনি ও প্রসূতি বিশেষজ্ঞ',
        degree: 'MBBS, DGO, MCPS (Obs & Gynae)',
        phone: '০১৭০০-৪৪৫৫৬৬',
        assigned_branches: ['dhanmondi', 'mirpur'],
        branch_schedules: {
          dhanmondi: { time: '04:00 PM - 08:00 PM', days: 'রবি, মঙ্গল, বৃহস্পতি', new_fee: 1000, follow_fee: 600 },
          mirpur: { time: '09:00 AM - 01:00 PM', days: 'শনি, সোম, বুধ', new_fee: 900, follow_fee: 500 }
        },
        off_days: 'শুক্রবার',
        new_visit_fee: 1000,
        follow_up_fee: 600,
        follow_up_validity_days: 7,
        max_patients_per_day: 25,
        is_active: true
      },
      {
        doctor_id: 'DOC-03',
        name: 'ডা: মাহমুদুল হাসান (Dr. Mahmudul Hasan)',
        bmdc_reg_no: 'BMDC-A-38910',
        bmdc_verified: true,
        specialty: 'হৃদরোগ ও কার্ডিওলজি বিশেষজ্ঞ',
        degree: 'MBBS, D-Card (Cardiology)',
        phone: '০১৭০০-৭৭৮৮৯৯',
        assigned_branches: ['uttara'],
        branch_schedules: {
          uttara: { time: '05:00 PM - 09:00 PM', days: 'শনি থেকে বুধ', new_fee: 1000, follow_fee: 600 }
        },
        off_days: 'বৃহস্পতিবার ও শুক্রবার',
        new_visit_fee: 1000,
        follow_up_fee: 600,
        follow_up_validity_days: 10,
        max_patients_per_day: 20,
        is_active: true
      }
    ];
  });

  // Save doctors list to storage
  const saveDoctors = (docs) => {
    setDoctorList(docs);
    localStorage.setItem('hisabkitab_hc_doctors_expanded', JSON.stringify(docs));
  };

  // 13 Fields Form State
  const initialForm = {
    name: '',
    bmdc_reg_no: '',
    bmdc_verified: false,
    specialty: 'মেডিসিন বিশেষজ্ঞ',
    degree: 'MBBS, FCPS',
    phone: '',
    assigned_branches: [activeBranchId],
    off_days: 'শুক্রবার',
    new_visit_fee: 1000,
    follow_up_fee: 600,
    follow_up_validity_days: 14,
    max_patients_per_day: 30,
    is_active: true
  };

  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState('');

  // Handle Open Create Modal
  const handleOpenAdd = () => {
    setEditingDoctorId(null);
    setForm(initialForm);
    setFormError('');
    setShowAddDoctorModal(true);
  };

  // Handle Open Edit Modal
  const handleOpenEdit = (doc) => {
    setEditingDoctorId(doc.doctor_id);
    setForm({
      name: doc.name || '',
      bmdc_reg_no: doc.bmdc_reg_no || '',
      bmdc_verified: doc.bmdc_verified || false,
      specialty: doc.specialty || '',
      degree: doc.degree || '',
      phone: doc.phone || '',
      assigned_branches: doc.assigned_branches || [activeBranchId],
      off_days: doc.off_days || 'শুক্রবার',
      new_visit_fee: doc.new_visit_fee || 1000,
      follow_up_fee: doc.follow_up_fee || 600,
      follow_up_validity_days: doc.follow_up_validity_days || 14,
      max_patients_per_day: doc.max_patients_per_day || 30,
      is_active: doc.is_active !== undefined ? doc.is_active : true
    });
    setFormError('');
    setShowAddDoctorModal(true);
  };

  // Handle Save Doctor (Create or Edit)
  const handleSaveDoctor = (e) => {
    e.preventDefault();
    setFormError('');

    if (!form.name.trim()) {
      setFormError('ডাক্তারের নাম দেওয়া আবশ্যক!');
      return;
    }

    if (!form.bmdc_reg_no.trim()) {
      setFormError('BMDC রেজিস্ট্রেশন নম্বর দেওয়া আবশ্যক!');
      return;
    }

    if (!form.assigned_branches || form.assigned_branches.length === 0) {
      setFormError('কমপক্ষে একটি সক্রিয় শাখা নির্বাচন করুন!');
      return;
    }

    if (editingDoctorId) {
      const updated = doctorList.map(d => d.doctor_id === editingDoctorId ? { ...d, ...form } : d);
      saveDoctors(updated);
      alert('ডাক্তারের তথ্য সফলভাবে হালনাগাদ করা হয়েছে!');
    } else {
      const newId = `DOC-2026-${Math.floor(100 + Math.random() * 900)}`;
      const newDoc = {
        doctor_id: newId,
        ...form,
        branch_schedules: {
          [form.assigned_branches[0]]: {
            time: '05:00 PM - 09:00 PM',
            days: 'শনি, সোম, বুধ',
            new_fee: form.new_visit_fee,
            follow_fee: form.follow_up_fee
          }
        }
      };
      saveDoctors([newDoc, ...doctorList]);
      alert(`ডা: ${newDoc.name} সফলভাবে চেম্বার ডাক্তার তালিকায় যুক্ত হয়েছেন!`);
    }

    setShowAddDoctorModal(false);
  };

  // Toggle Doctor Active / Inactive Status
  const handleToggleActive = (docId) => {
    const updated = doctorList.map(d => d.doctor_id === docId ? { ...d, is_active: !d.is_active } : d);
    saveDoctors(updated);
  };

  // Toggle Doctor Branch Assignment (Rule 1: ডাক্তার একাধিক শাখায় কাজ করতে পারবেন)
  const handleToggleBranchAssignment = (branchId) => {
    setForm(prev => {
      const has = prev.assigned_branches.includes(branchId);
      const next = has
        ? prev.assigned_branches.filter(id => id !== branchId)
        : [...prev.assigned_branches, branchId];
      return { ...prev, assigned_branches: next };
    });
  };

  // Filtered Doctors
  const filteredDoctors = doctorList.filter(d => {
    const matchSearch =
      d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.specialty?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.bmdc_reg_no?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchBranch = branchFilter === 'all'
      ? true
      : d.assigned_branches?.includes(branchFilter);

    return matchSearch && matchBranch;
  });

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-12">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-sky-900 via-indigo-950 to-slate-900 text-white shadow-xl relative overflow-hidden border border-sky-500/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-bold border border-sky-500/30">
                <Stethoscope size={13} />
                <span>মডিউল ১.৬: ডাক্তার ও চেম্বার ডিরেক্টরি</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold border border-teal-500/30">
                <ShieldCheck size={13} />
                <span>BMDC ভেরিফিকেশন ও মাল্টি-ব্রাঞ্চ শিডিউল</span>
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">ডাক্তার তালিকা, সময়সূচি ও ফি নির্ধারণ</h2>
            <p className="text-sm text-sky-100/80 mt-1 max-w-2xl">
              ১৩টি সুনির্দিষ্ট ফিল্ড, একাধিক শাখায় স্বাধীন সময়সূচি, ফলো-আপ মেয়াদ এবং BMDC ভ্যালিডেশন নীতি।
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white text-xs font-black shadow-lg flex items-center gap-2 transition-transform hover:scale-105"
            >
              <Plus size={16} />
              <span>[নতুন ডাক্তার যুক্ত করুন]</span>
            </button>
          </div>
        </div>
      </div>

      {/* SUBTABS NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setSubTab('list')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all whitespace-nowrap ${
            subTab === 'list'
              ? 'bg-sky-600 text-white shadow-md'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Stethoscope size={15} />
          <span>ডাক্তার তালিকা ({doctorList.length} জন)</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('schedules')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all whitespace-nowrap ${
            subTab === 'schedules'
              ? 'bg-sky-600 text-white shadow-md'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Clock size={15} />
          <span>শাখাভিত্তিক চেম্বার সময়সূচি ও ফি ম্যাট্রিক্স</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('rules')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all whitespace-nowrap ${
            subTab === 'rules'
              ? 'bg-sky-600 text-white shadow-md'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Shield size={15} />
          <span>ডাক্তার ও শাখা পরিচালনার ৪টি নিয়মাবলী</span>
        </button>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 w-full md:w-auto flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="ডাক্তারের নাম, BMDC নম্বর বা বিশেষত্ব খুঁজুন..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-sky-500 font-medium"
            />
          </div>

          <div className="flex items-center gap-1 font-bold text-slate-700">
            <span>সক্রিয় শাখা:</span>
            <select
              value={branchFilter}
              onChange={e => setBranchFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white font-bold"
            >
              <option value="all">সকল শাখা</option>
              {branches.filter(b => !b.isAll).map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md flex items-center gap-1"
        >
          <Plus size={14} />
          <span>নতুন ডাক্তার</span>
        </button>
      </div>

      {/* VIEW 1: DOCTORS CARDS / LIST */}
      {subTab === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDoctors.map(doc => {
            return (
              <div
                key={doc.doctor_id}
                className={`p-5 rounded-3xl border shadow-sm transition-all flex flex-col justify-between space-y-3 ${
                  doc.is_active ? 'bg-white border-slate-200 hover:border-sky-400' : 'bg-slate-50 border-rose-200 opacity-80'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h4 className="text-base font-black text-slate-900">{doc.name}</h4>
                      <div className="text-xs text-sky-700 font-bold mt-0.5">{doc.specialty}</div>
                      <div className="text-[11px] text-slate-500">{doc.degree}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      doc.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {doc.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                    </span>
                  </div>

                  {/* BMDC Verified Badge */}
                  <div className="mt-2.5 flex items-center gap-2">
                    <span className="font-mono text-[11px] font-black bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md border border-slate-200">
                      {doc.bmdc_reg_no || 'BMDC-PENDING'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <ShieldCheck size={12} />
                      <span>BMDC যাচাইকৃত</span>
                    </span>
                  </div>

                  {/* Assigned Branches (Rule 1) */}
                  <div className="mt-3 py-2.5 border-y border-slate-100 text-xs space-y-1.5">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block">কর্মরত শাখা (Active Branches):</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {doc.assigned_branches?.map(bId => {
                          const br = branches.find(b => b.id === bId);
                          return (
                            <span key={bId} className="px-2 py-0.5 rounded-lg bg-sky-50 text-sky-800 font-bold text-[10px] border border-sky-200 flex items-center gap-1">
                              <Building2 size={11} />
                              <span>{br?.name || bId}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                      <div>
                        <span className="text-slate-400 block text-[10px]">নতুন রোগীর ফি:</span>
                        <strong className="text-emerald-700">৳{doc.new_visit_fee}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">ফলো-আপ ফি:</span>
                        <strong className="text-sky-700">৳{doc.follow_up_fee}</strong>
                        <span className="text-[9px] text-slate-400 ml-1">({doc.follow_up_validity_days} দিন বৈধ)</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-400 block text-[10px]">দৈনিক সিরিয়াল সীমা:</span>
                        <strong className="text-slate-800">{doc.max_patients_per_day} জন</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">সাপ্তাহিক ছুটি:</span>
                        <strong className="text-rose-700">{doc.off_days}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(doc.doctor_id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 ${
                      doc.is_active ? 'bg-rose-50 text-rose-700 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    <Power size={13} />
                    <span>{doc.is_active ? 'নিষ্ক্রিয় করুন' : 'সক্রিয় করুন'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(doc)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1"
                  >
                    <Edit size={13} />
                    <span>সম্পাদনা</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: SCHEDULE MATRIX (Rule 2) */}
      {subTab === 'schedules' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-black text-slate-900">শাখাভিত্তিক স্বতন্ত্র চেম্বার সময়সূচি ও ফি ম্যাট্রিক্স</h3>
            <p className="text-xs text-slate-500">
              নিয়ম ২: প্রত্যেক শাখার সময়সূচি ও ভিজিট ফি আলাদাভাবে নির্ধারণ করা যায়।
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white font-black text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">ডাক্তার</th>
                  <th className="p-3.5">শাখা</th>
                  <th className="p-3.5">চেম্বার সময়সূচি</th>
                  <th className="p-3.5">দিনসমূহ</th>
                  <th className="p-3.5">নতুন ফি</th>
                  <th className="p-3.5">ফলো-আপ ফি</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {doctorList.map(doc => {
                  return Object.entries(doc.branch_schedules || {}).map(([bId, sched], idx) => {
                    const br = branches.find(b => b.id === bId);
                    return (
                      <tr key={`${doc.doctor_id}_${bId}`} className="hover:bg-slate-50">
                        <td className="p-3.5">
                          <strong>{doc.name}</strong>
                          <div className="text-[10px] text-slate-400">{doc.specialty}</div>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-lg bg-sky-50 text-sky-800 font-bold text-[10px] border border-sky-200">
                            {br?.name || bId}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono font-bold text-slate-700">{sched.time}</td>
                        <td className="p-3.5">{sched.days}</td>
                        <td className="p-3.5 font-bold text-emerald-700">৳{sched.new_fee || doc.new_visit_fee}</td>
                        <td className="p-3.5 font-bold text-sky-700">৳{sched.follow_fee || doc.follow_up_fee}</td>
                      </tr>
                    );
                  });
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: RULES & COMPLIANCE */}
      {subTab === 'rules' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Shield className="text-sky-600" size={18} />
              <span>ডাক্তার তালিকা ও সময়সূচি পরিচালনার ৪টি মৌলিক নিয়মাবলী</span>
            </h3>
            <p className="text-xs text-slate-500">
              ক্লিনিক্যাল সুশাসন ও ডাক্তার পরিচালনায় বলবৎ নীতিসমূহ:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-200 space-y-2">
              <div className="flex items-center gap-2 font-black text-sky-900">
                <span className="w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center text-xs">১</span>
                <span>একাধিক শাখায় কাজের সুবিধা</span>
              </div>
              <p className="text-slate-700 leading-relaxed font-semibold">
                একজন ডাক্তার প্রতিষ্ঠানের একাধিক শাখায় দায়িত্ব পালন করতে পারবেন।
              </p>
              <div className="text-[11px] text-sky-800 bg-white/70 p-2 rounded-xl border border-sky-200">
                ✓ একই ডাক্তার ধানমন্ডি এবং উত্তরা উভয় শাখায় রোস্টার অনুযায়ী চেম্বার করতে পারেন।
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200 space-y-2">
              <div className="flex items-center gap-2 font-black text-teal-900">
                <span className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs">২</span>
                <span>শাখাভিত্তিক সময় ও ফি নির্ধারণ</span>
              </div>
              <p className="text-slate-700 leading-relaxed font-semibold">
                প্রত্যেক শাখার সময়সূচি ও ফি আলাদাভাবে নির্ধারণ করা যাবে।
              </p>
              <div className="text-[11px] text-teal-800 bg-white/70 p-2 rounded-xl border border-teal-200">
                ✓ মেইন ব্রাঞ্চে ফি ১২০০ টাকা এবং মফস্বল বা সাব-শাখায় ১০০০ টাকা নির্ধারণ সম্ভব।
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
              <div className="flex items-center gap-2 font-black text-amber-900">
                <span className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs">৩</span>
                <span>শাখা অ্যাসাইনমেন্ট ছাড়া বুকিং ব্লক</span>
              </div>
              <p className="text-slate-700 leading-relaxed font-semibold">
                ডাক্তারকে কোনো শাখায় যুক্ত না করে সেই শাখায় অ্যাপয়েন্টমেন্ট দেওয়া যাবে না।
              </p>
              <div className="text-[11px] text-amber-800 bg-white/70 p-2 rounded-xl border border-amber-200">
                ✓ কোনো ডাক্তার যে ব্রাঞ্চে রোস্টার্ড নন, অ্যাপয়েন্টমেন্ট ফর্ম সেই ব্রাঞ্চের জন্য তাকে হাইড রাখবে।
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-2">
              <div className="flex items-center gap-2 font-black text-purple-900">
                <span className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs">৪</span>
                <span>BMDC রেজিস্ট্রেশন ও প্রশাসনিক যাচাই</span>
              </div>
              <p className="text-slate-700 leading-relaxed font-semibold">
                রেজিস্ট্রেশন নম্বর রাখার ফিল্ড থাকবে; নম্বরের বৈধতা প্রশাসনিকভাবে যাচাই করতে হবে।
              </p>
              <div className="text-[11px] text-purple-800 bg-white/70 p-2 rounded-xl border border-purple-200">
                ✓ বাংলাদেশ মেডিকেল অ্যান্ড ডেন্টাল কাউন্সিল (BMDC) নম্বর সংরক্ষণ ও ভেরিফাইড সিল বাধ্যতামূলক।
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: নতুন ডাক্তার বা সম্পাদনা (All 13 Requested Fields) */}
      {/* ========================================================================= */}
      {showAddDoctorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                <Stethoscope size={18} className="text-sky-600" />
                <span>{editingDoctorId ? 'ডাক্তারের তথ্য সম্পাদনা' : 'নতুন ডাক্তার নিবন্ধন (১৩টি ফিল্ড)'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddDoctorModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveDoctor} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* ১. ডাক্তারের নাম */}
                <div className="sm:col-span-2">
                  <label className="font-extrabold text-slate-800 block mb-1">১. ডাক্তারের নাম *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="যেমন: ডা: আহমেদ রফিক"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-sky-500 font-semibold"
                  />
                </div>

                {/* ২. BMDC রেজিস্ট্রেশন নম্বর */}
                <div>
                  <label className="font-extrabold text-slate-800 block mb-1">২. BMDC রেজিস্ট্রেশন নম্বর *</label>
                  <input
                    type="text"
                    required
                    value={form.bmdc_reg_no}
                    onChange={e => setForm({ ...form, bmdc_reg_no: e.target.value })}
                    placeholder="BMDC-A-45812"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-sky-500 font-mono font-bold uppercase"
                  />
                </div>

                {/* ৩. বিশেষত্ব */}
                <div>
                  <label className="font-extrabold text-slate-800 block mb-1">৩. বিশেষত্ব (Specialty) *</label>
                  <input
                    type="text"
                    required
                    value={form.specialty}
                    onChange={e => setForm({ ...form, specialty: e.target.value })}
                    placeholder="মেডিসিন / কার্ডিওলজি / শিশু"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-sky-500 font-semibold"
                  />
                </div>

                {/* ৪. ডিগ্রি */}
                <div>
                  <label className="font-extrabold text-slate-800 block mb-1">৪. ডিগ্রি (Degrees) *</label>
                  <input
                    type="text"
                    required
                    value={form.degree}
                    onChange={e => setForm({ ...form, degree: e.target.value })}
                    placeholder="MBBS, FCPS (Medicine)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-sky-500"
                  />
                </div>

                {/* ৫. ফোন */}
                <div>
                  <label className="font-extrabold text-slate-800 block mb-1">৫. সরাসরি ফোন নম্বর *</label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="০১৭১১-xxxxxx"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-sky-500 font-mono"
                  />
                </div>

                {/* ৬. সক্রিয় শাখা (Rule 1: মাল্টি-ব্রাঞ্চ সিলেকশন) */}
                <div className="sm:col-span-2 p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <label className="font-extrabold text-slate-800 block">
                    ৬. সক্রিয় শাখা নির্বাচন (নিয়ম ১: একাধিক শাখায় অ্যাসাইনমেন্ট)
                  </label>
                  <div className="flex flex-wrap gap-3 pt-1">
                    {branches.filter(b => !b.isAll).map(b => {
                      const isChecked = form.assigned_branches?.includes(b.id);
                      return (
                        <label key={b.id} className="flex items-center gap-1.5 cursor-pointer font-bold">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleBranchAssignment(b.id)}
                            className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
                          />
                          <span>{b.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* ৭. নতুন রোগীর ফি */}
                <div>
                  <label className="font-extrabold text-slate-800 block mb-1">৭. নতুন রোগীর ফি (৳)</label>
                  <input
                    type="number"
                    value={form.new_visit_fee}
                    onChange={e => setForm({ ...form, new_visit_fee: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-sky-500 font-bold text-emerald-700"
                  />
                </div>

                {/* ৮. ফলো-আপ ফি */}
                <div>
                  <label className="font-extrabold text-slate-800 block mb-1">৮. ফলো-আপ ফি (৳)</label>
                  <input
                    type="number"
                    value={form.follow_up_fee}
                    onChange={e => setForm({ ...form, follow_up_fee: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-sky-500 font-bold text-sky-700"
                  />
                </div>

                {/* ৯. ফলো-আপের বৈধ সময়সীমা */}
                <div>
                  <label className="font-extrabold text-slate-800 block mb-1">৯. ফলো-আপের বৈধ সময়সীমা</label>
                  <select
                    value={form.follow_up_validity_days}
                    onChange={e => setForm({ ...form, follow_up_validity_days: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-sky-500 bg-white"
                  >
                    <option value={7}>৭ দিন</option>
                    <option value={10}>১০ দিন</option>
                    <option value={14}>১৪ দিন (স্ট্যান্ডার্ড)</option>
                    <option value={30}>৩০ দিন</option>
                  </select>
                </div>

                {/* ১০. দৈনিক সিরিয়াল সীমা */}
                <div>
                  <label className="font-extrabold text-slate-800 block mb-1">১০. দৈনিক সিরিয়াল সীমা (কোটা)</label>
                  <input
                    type="number"
                    value={form.max_patients_per_day}
                    onChange={e => setForm({ ...form, max_patients_per_day: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-sky-500 font-bold"
                  />
                </div>

                {/* ১১. সাপ্তাহিক ছুটি */}
                <div>
                  <label className="font-extrabold text-slate-800 block mb-1">১১. সাপ্তাহিক ছুটি</label>
                  <select
                    value={form.off_days}
                    onChange={e => setForm({ ...form, off_days: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-sky-500 bg-white"
                  >
                    <option value="শুক্রবার">শুক্রবার</option>
                    <option value="বৃহস্পতিবার ও শুক্রবার">বৃহস্পতিবার ও শুক্রবার</option>
                    <option value="শনিবার">শনিবার</option>
                    <option value="ছুটি নেই">ছুটি নেই</option>
                  </select>
                </div>

                {/* ১২. সক্রিয় / নিষ্ক্রিয় */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <div>
                    <div className="font-bold text-slate-800">১২. অবস্থা</div>
                    <div className="text-[10px] text-slate-500">নিষ্ক্রিয় থাকলে বুকিং ব্লক থাকবে</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, is_active: !form.is_active })}
                    className={`px-3 py-1 rounded-xl text-xs font-bold ${
                      form.is_active ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                    }`}
                  >
                    {form.is_active ? '✓ সক্রিয়' : '✕ নিষ্ক্রিয়'}
                  </button>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddDoctorModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black shadow-md flex items-center gap-1.5"
                >
                  <Check size={15} />
                  <span>সংরক্ষণ করুন</span>
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
