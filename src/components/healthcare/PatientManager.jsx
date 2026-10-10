import React, { useState } from 'react';
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
  ChevronRight
} from 'lucide-react';
import { calculateAgeFromDOB } from '../../services/healthcareIdService';

export const PatientManager = () => {
  const {
    patients = [],
    addPatient,
    updatePatient,
    appointments = [],
    prescriptions = [],
    labOrders = [],
    branches = [],
    activeBranchId = 'dhanmondi'
  } = useHealthcare();

  const { lang = 'bn', showToast } = useApp() || {};

  // Active Subtab: 'list' | 'duplicate_check'
  const [subTab, setSubTab] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatientProfile, setSelectedPatientProfile] = useState(null);
  const [profileTab, setProfileTab] = useState('overview'); // 'overview' | 'visits' | 'prescriptions' | 'tests' | 'pharmacy' | 'billing'
  const [showAddModal, setShowAddModal] = useState(false);

  // Duplicate Check Form State
  const [dupSearchPhone, setDupSearchPhone] = useState('');
  const [dupSearchResults, setDupSearchResults] = useState(null);

  // Form State for New Patient
  const [form, setForm] = useState({
    full_name: '',
    mobile_number: '',
    date_of_birth: '',
    gender: 'male',
    blood_group: 'B+',
    address: '',
    national_id: '',
    emergency_contact_name: '',
    emergency_contact_mobile: '',
    chronic_disease_note: '',
    allergy_note: '',
    outstanding_due: 0
  });

  const [duplicateWarning, setDuplicateWarning] = useState(null);

  const currentBranch = branches.find(b => b.id === activeBranchId) || { name: 'ধানমন্ডি মেইন ব্রাঞ্চ' };

  // Search filter
  const filteredPatients = patients.filter(p => {
    const q = searchTerm.toLowerCase();
    return (
      (p.full_name || '').toLowerCase().includes(q) ||
      (p.mobile_number || p.phone || '').includes(q) ||
      (p.patient_id || '').toLowerCase().includes(q) ||
      (p.national_id || '').toLowerCase().includes(q)
    );
  });

  // Real-time Duplicate Check as user types mobile number
  const handleMobileChange = (e) => {
    const phone = e.target.value;
    setForm(prev => ({ ...prev, mobile_number: phone }));
    if (phone.length >= 10) {
      const match = patients.find(p => (p.mobile_number || p.phone) === phone);
      if (match) {
        setDuplicateWarning(`সাবধান! এই মোবাইল নম্বরে (${match.patient_id} - ${match.full_name}) পূর্বেই একজন রোগী নিবন্ধিত আছেন।`);
      } else {
        setDuplicateWarning(null);
      }
    } else {
      setDuplicateWarning(null);
    }
  };

  const handleDuplicateSearch = (e) => {
    e.preventDefault();
    if (!dupSearchPhone.trim()) return;
    const matches = patients.filter(p =>
      (p.mobile_number || p.phone || '').includes(dupSearchPhone.trim()) ||
      (p.full_name || '').toLowerCase().includes(dupSearchPhone.trim().toLowerCase())
    );
    setDupSearchResults(matches);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.mobile_number.trim()) {
      alert('রোগীর নাম ও মোবাইল নম্বর আবশ্যক');
      return;
    }

    const ageCalc = calculateAgeFromDOB(form.date_of_birth);

    const res = addPatient({
      ...form,
      calculated_age: ageCalc.age,
      age_unit: ageCalc.unit,
      registered_branch: currentBranch.name
    });

    if (res && res.success) {
      alert(`রোগী ${res.patient.patient_id} সফলভাবে নিবন্ধিত হয়েছে!`);
      setShowAddModal(false);
      setForm({
        full_name: '',
        mobile_number: '',
        date_of_birth: '',
        gender: 'male',
        blood_group: 'B+',
        address: '',
        national_id: '',
        emergency_contact_name: '',
        emergency_contact_mobile: '',
        chronic_disease_note: '',
        allergy_note: '',
        outstanding_due: 0
      });
      setDuplicateWarning(null);
    }
  };

  // Helper getters for patient profile sub-tabs
  const getPatientVisits = (pid) => appointments.filter(a => a.patient_id === pid);
  const getPatientPrescriptions = (pid) => prescriptions.filter(p => p.patient_id === pid);
  const getPatientLabOrders = (pid) => labOrders.filter(l => l.patient_id === pid);

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* 1.4 Top Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-teal-900 via-slate-900 to-sky-950 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold border border-teal-500/30 mb-2">
              <Sparkles size={13} />
              <span>১.৪ রোগী ব্যবস্থাপনা ও ডিজিটাল মাস্টার প্রোফাইল</span>
            </span>
            <h2 className="text-2xl font-black tracking-tight">রোগী নিবন্ধন, প্রোফাইল ও সম্পূর্ণ ইতিহাস</h2>
            <p className="text-sm text-teal-100/80 mt-1">
              UHID রেজিস্ট্রি, ডুপ্লিকেট সনাক্তকরণ, ভিজিট ইতিহাস, প্রেসক্রিপশন, ল্যাব টেস্ট ও পেমেন্ট রেকর্ড।
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSubTab('list')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                subTab === 'list' ? 'bg-white text-slate-900 shadow-md' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              রোগীর তালিকা ({patients.length})
            </button>
            <button
              onClick={() => setSubTab('duplicate_check')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                subTab === 'duplicate_check' ? 'bg-white text-slate-900 shadow-md' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              ডুপ্লিকেট যাচাই
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-950 font-black text-xs shadow-md flex items-center gap-1.5"
            >
              <Plus size={15} />
              <span>নতুন রোগী</span>
            </button>
          </div>
        </div>
      </div>

      {/* SUBTAB 1: PATIENTS LIST & LIVE SEARCH */}
      {subTab === 'list' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          {/* Search Box */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="রোগী খুঁজুন (নাম, মোবাইল নম্বর, UHID বা NID)..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-teal-500"
              />
            </div>
            <div className="text-xs text-slate-500 font-bold">
              মোট নিবন্ধিত রোগী: <span className="text-teal-700 font-black">{filteredPatients.length} জন</span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[11px]">
                <tr>
                  <th className="p-3">রোগীর আইডি / UHID</th>
                  <th className="p-3">রোগীর নাম ও ঠিকানা</th>
                  <th className="p-3">মোবাইল নম্বর</th>
                  <th className="p-3">বয়স ও লিঙ্গ</th>
                  <th className="p-3">রক্তের গ্রুপ</th>
                  <th className="p-3">অ্যালার্জি / সতর্কতা</th>
                  <th className="p-3 text-right">বকেয়া</th>
                  <th className="p-3 text-center">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredPatients.map(p => (
                  <tr key={p.patient_id} className="hover:bg-slate-50/70">
                    <td className="p-3 font-mono font-bold text-teal-700">{p.patient_id}</td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{p.full_name}</div>
                      <div className="text-[10px] text-slate-400">{p.address || 'ঠিকানা দেওয়া নেই'}</div>
                    </td>
                    <td className="p-3 font-mono">{p.mobile_number || p.phone}</td>
                    <td className="p-3">{p.calculated_age || p.age || 'N/A'} বছর ({p.gender})</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                        {p.blood_group || 'N/A'}
                      </span>
                    </td>
                    <td className="p-3">
                      {p.allergy_note ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
                          ⚠️ {p.allergy_note}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">- নেই -</span>
                      )}
                    </td>
                    <td className="p-3 text-right font-black text-slate-900">
                      {p.outstanding_due > 0 ? (
                        <span className="text-rose-600">৳{p.outstanding_due}</span>
                      ) : (
                        <span className="text-emerald-700">৳০</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => {
                          setSelectedPatientProfile(p);
                          setProfileTab('overview');
                        }}
                        className="px-3 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg text-[11px] font-bold transition-colors inline-flex items-center gap-1"
                      >
                        <UserCheck size={13} />
                        <span>প্রোফাইল ও ইতিহাস</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 2: DUPLICATE PATIENT CHECKER */}
      {subTab === 'duplicate_check' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-black text-slate-900">ডুপ্লিকেট রোগী যাচাই (Duplicate Detection)</h3>
            <p className="text-xs text-slate-500">
              রোগীর নাম বা মোবাইল নম্বর দিয়ে একই ব্যক্তির একাধিকবার রেজিস্ট্রেশন হয়েছে কি না তা সহজেই পরীক্ষা করুন।
            </p>
          </div>

          <form onSubmit={handleDuplicateSearch} className="flex gap-2 max-w-md">
            <input
              type="text"
              value={dupSearchPhone}
              onChange={e => setDupSearchPhone(e.target.value)}
              placeholder="মোবাইল নম্বর বা নাম লিখুন..."
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-teal-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              যাচাই করুন
            </button>
          </form>

          {dupSearchResults && (
            <div className="pt-2">
              <h4 className="text-xs font-bold text-slate-700 mb-2">
                মিল পাওয়া গেছে: {dupSearchResults.length} জন
              </h4>
              {dupSearchResults.length === 0 ? (
                <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold">
                  ✓ কোনো ডুপ্লিকেট রেকর্ড পাওয়া যায়নি। এই রোগীটি সম্পূর্ণ নতুন।
                </div>
              ) : (
                <div className="space-y-2">
                  {dupSearchResults.map(match => (
                    <div key={match.patient_id} className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs flex justify-between items-center">
                      <div>
                        <strong className="text-amber-950">{match.full_name}</strong> (UHID: {match.patient_id})
                        <div className="text-[11px] text-amber-800 mt-0.5">মোবাইল: {match.mobile_number || match.phone} • ঠিকানা: {match.address || 'N/A'}</div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedPatientProfile(match);
                          setSubTab('list');
                        }}
                        className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px]"
                      >
                        প্রোফাইল খুলুন
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* PATIENT PROFILE & COMPLETE HISTORY MODAL */}
      {selectedPatientProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-4 animate-scale-in">
            {/* Header */}
            <div className="flex justify-between items-start pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-700 flex items-center justify-center font-black text-lg">
                  {selectedPatientProfile.full_name[0]}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">{selectedPatientProfile.full_name}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span className="font-mono text-teal-700 font-bold">{selectedPatientProfile.patient_id}</span>
                    <span>•</span>
                    <span>{selectedPatientProfile.calculated_age || selectedPatientProfile.age} বছর, {selectedPatientProfile.gender}</span>
                    <span>•</span>
                    <span>রক্তের গ্রুপ: <strong className="text-rose-600">{selectedPatientProfile.blood_group}</strong></span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedPatientProfile(null)} className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1">
                ✕
              </button>
            </div>

            {/* Profile Subtabs */}
            <div className="flex gap-2 border-b border-slate-100 pb-2 overflow-x-auto text-xs font-bold">
              <button
                onClick={() => setProfileTab('overview')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  profileTab === 'overview' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                ব্যক্তিগত তথ্য
              </button>
              <button
                onClick={() => setProfileTab('visits')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  profileTab === 'visits' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                ভিজিট ইতিহাস ({getPatientVisits(selectedPatientProfile.patient_id).length})
              </button>
              <button
                onClick={() => setProfileTab('prescriptions')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  profileTab === 'prescriptions' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                প্রেসক্রিপশন ইতিহাস ({getPatientPrescriptions(selectedPatientProfile.patient_id).length})
              </button>
              <button
                onClick={() => setProfileTab('tests')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  profileTab === 'tests' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                টেস্ট ও রিপোর্ট ইতিহাস ({getPatientLabOrders(selectedPatientProfile.patient_id).length})
              </button>
              <button
                onClick={() => setProfileTab('pharmacy')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  profileTab === 'pharmacy' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                ফার্মেসি ক্রয় ইতিহাস
              </button>
              <button
                onClick={() => setProfileTab('billing')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  profileTab === 'billing' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                বিল ও পেমেন্ট ইতিহাস
              </button>
            </div>

            {/* TAB: OVERVIEW */}
            {profileTab === 'overview' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="text-slate-400 font-bold">যোগাযোগ ও ঠিকানা</div>
                  <div><strong>মোবাইল:</strong> {selectedPatientProfile.mobile_number || selectedPatientProfile.phone}</div>
                  <div><strong>জরুরি নম্বর:</strong> {selectedPatientProfile.emergency_contact_mobile || 'দেওয়া নেই'}</div>
                  <div><strong>ঠিকানা:</strong> {selectedPatientProfile.address || 'দেওয়া নেই'}</div>
                  <div><strong>এনআইডি:</strong> {selectedPatientProfile.national_id || 'দেওয়া নেই'}</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="text-slate-400 font-bold">ক্লিনিক্যাল হিস্ট্রি</div>
                  <div><strong>অ্যালার্জি:</strong> {selectedPatientProfile.allergy_note || 'নেই'}</div>
                  <div><strong>দীর্ঘমেয়াদী রোগ:</strong> {selectedPatientProfile.chronic_disease_note || 'নেই'}</div>
                  <div><strong>বকেয়া ব্যালেন্স:</strong> ৳{selectedPatientProfile.outstanding_due || 0}</div>
                  <div><strong>নিবন্ধন শাখা:</strong> {selectedPatientProfile.registered_branch || currentBranch.name}</div>
                </div>
              </div>
            )}

            {/* TAB: VISITS */}
            {profileTab === 'visits' && (
              <div className="space-y-2 text-xs">
                {getPatientVisits(selectedPatientProfile.patient_id).length === 0 ? (
                  <div className="p-6 text-center text-slate-400">কোনো ভিজিটের রেকর্ড নেই।</div>
                ) : (
                  getPatientVisits(selectedPatientProfile.patient_id).map((v, i) => (
                    <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center">
                      <div>
                        <strong>{v.appointment_date}</strong> • {v.appointment_time}
                        <div className="text-slate-500">ডাক্তার: {v.doctor_name || 'কনসালটেন্ট'} • ধরন: {v.visit_type}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">
                        {v.appointment_status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB: PRESCRIPTIONS */}
            {profileTab === 'prescriptions' && (
              <div className="space-y-2 text-xs">
                {getPatientPrescriptions(selectedPatientProfile.patient_id).length === 0 ? (
                  <div className="p-6 text-center text-slate-400">কোনো প্রেসক্রিপশনের ইতিহাস পাওয়া যায়নি।</div>
                ) : (
                  getPatientPrescriptions(selectedPatientProfile.patient_id).map((p, i) => (
                    <div key={i} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <div className="flex justify-between font-bold">
                        <span>তারিখ: {p.prescription_date}</span>
                        <span className="text-teal-700">Rx ID: {p.prescription_id}</span>
                      </div>
                      <div className="text-slate-600">ডাক্তার: {p.doctor_name}</div>
                      <div className="text-slate-500">চিফ কমপ্লেইন্টস: {p.chief_complaint}</div>
                      <div className="font-bold text-slate-800 pt-1">ওষুধসমূহ: {p.medicines?.map(m => m.brand_name).join(', ')}</div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB: TESTS */}
            {profileTab === 'tests' && (
              <div className="space-y-2 text-xs">
                {getPatientLabOrders(selectedPatientProfile.patient_id).length === 0 ? (
                  <div className="p-6 text-center text-slate-400">কোনো ল্যাব টেস্টের ইতিহাস নেই।</div>
                ) : (
                  getPatientLabOrders(selectedPatientProfile.patient_id).map((l, i) => (
                    <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center">
                      <div>
                        <strong>{l.order_number}</strong> • তারিখ: {l.order_date}
                        <div className="text-slate-500">টেস্ট: {l.test_name}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold text-[10px]">
                        {l.order_status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB: PHARMACY */}
            {profileTab === 'pharmacy' && (
              <div className="p-4 bg-slate-50 rounded-xl text-xs space-y-2">
                <div className="font-bold text-slate-800">ফার্মেসি ড্রাগস ট্রানজ্যাকশন:</div>
                <div className="p-2.5 bg-white border border-slate-200 rounded-lg flex justify-between">
                  <div>Tab. Napa Extra 500mg (১০ পিস) • ব্যাচ B-982</div>
                  <span className="font-bold text-emerald-700">৳৪০ (পরিশোধিত)</span>
                </div>
              </div>
            )}

            {/* TAB: BILLING */}
            {profileTab === 'billing' && (
              <div className="p-4 bg-slate-50 rounded-xl text-xs space-y-2">
                <div className="font-bold text-slate-800">মোট বিল ও লেনদেন হিস্ট্রি:</div>
                <div className="p-2.5 bg-white border border-slate-200 rounded-lg flex justify-between">
                  <div>INV-2026-1001 (ডক্টর ফি + সিবিসি টেস্ট)</div>
                  <span className="font-bold text-emerald-700">৳১,২০০ (পরিশোধিত)</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* NEW PATIENT REGISTRATION MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-scale-in">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900">নতুন রোগী নিবন্ধন (Patient Registration)</h3>
                <p className="text-xs text-slate-500">নিবন্ধন শাখা: {currentBranch.name}</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 mt-4 text-xs">
              {duplicateWarning && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl font-bold flex items-center gap-2">
                  <AlertTriangle size={15} className="text-rose-600 shrink-0" />
                  <span>{duplicateWarning}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">রোগীর পূর্ণ নাম *</label>
                  <input
                    type="text"
                    required
                    value={form.full_name}
                    onChange={e => setForm({ ...form, full_name: e.target.value })}
                    placeholder="নাম লিখুন"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-teal-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">মোবাইল নম্বর *</label>
                  <input
                    type="tel"
                    required
                    value={form.mobile_number}
                    onChange={handleMobileChange}
                    placeholder="017xxxxxxxx"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-teal-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">জন্ম তারিখ</label>
                  <input
                    type="date"
                    value={form.date_of_birth}
                    onChange={e => setForm({ ...form, date_of_birth: e.target.value })}
                    className="w-full px-2 py-1.5 rounded-xl border border-slate-300 focus:outline-teal-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">লিঙ্গ</label>
                  <select
                    value={form.gender}
                    onChange={e => setForm({ ...form, gender: e.target.value })}
                    className="w-full px-2 py-1.5 rounded-xl border border-slate-300 focus:outline-teal-500 font-bold"
                  >
                    <option value="male">পুরুষ</option>
                    <option value="female">মহিলা</option>
                    <option value="other">অন্যান্য</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">রক্তের গ্রুপ</label>
                  <select
                    value={form.blood_group}
                    onChange={e => setForm({ ...form, blood_group: e.target.value })}
                    className="w-full px-2 py-1.5 rounded-xl border border-slate-300 focus:outline-teal-500 font-bold text-rose-700"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">ঠিকানা</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                  placeholder="এলাকা, থানা, জেলা"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">অ্যালার্জি নোট (⚠️)</label>
                  <input
                    type="text"
                    value={form.allergy_note}
                    onChange={e => setForm({ ...form, allergy_note: e.target.value })}
                    placeholder="পেনিসিলিন, ডাস্ট ইত্যাদি"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-teal-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">দীর্ঘমেয়াদী রোগ</label>
                  <input
                    type="text"
                    value={form.chronic_disease_note}
                    onChange={e => setForm({ ...form, chronic_disease_note: e.target.value })}
                    placeholder="ডায়াবেটিস, প্রেশার ইত্যাদি"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-teal-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-md"
                >
                  নিবন্ধন নিশ্চিত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientManager;
