import React, { useState } from 'react';
import { useHealthcare } from '../../context/HealthcareContext';
import { useApp } from '../../context/AppContext';
import { PatientManager } from './PatientManager';
import { DoctorConsultationQueue } from './DoctorConsultationQueue';
import { DiagnosticLIMSManager } from './DiagnosticLIMSManager';
import PharmacyFEFOManager from './PharmacyFEFOManager';
import RadiologyImagingManager from './RadiologyImagingManager';
import HomeServicesReferral from './HomeServicesReferral';
import AdvancedComplianceSuite from './AdvancedComplianceSuite';
import { HealthcareDashboard } from './HealthcareDashboard';
import {
  Stethoscope,
  FlaskConical,
  Pill,
  Activity,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Unlock,
  ArrowRight,
  ArrowLeft,
  Search,
  UserCheck,
  Sparkles,
  Layers,
  Check,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Eye,
  Sliders,
  Maximize2
} from 'lucide-react';

export default function HealthcareHub({ embeddedMode = false, onLaunchFullscreen }) {
  const {
    // 3 Modular activations
    activeModules = { hospital: false, diagnostic: false, pharmacy: false },
    isAnyModuleActive,
    toggleHealthcareModule,
    activateAllHealthcareModules,
    deactivateAllHealthcareModules,
    isHealthcareApproved,
    healthcareApprovalRecord,
    // Active app state
    activeLinkedApp,
    setActiveLinkedApp,
    globalSelectedPatientId,
    setGlobalSelectedPatientId,
    // Core data
    patients = [],
    doctors = [],
    appointments = [],
    labOrders = [],
    prescriptions = [],
    pharmacyMedicines = [],
    diagnosticTests = [],
    testPackages = [],
    // Context tabs
    activeHealthcareTab,
    setActiveHealthcareTab
  } = useHealthcare();

  const { setActiveTab } = useApp() || {};

  // Admin modal state for activating
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [adminName, setAdminName] = useState('সুপার অ্যাডমিন / চিফ মেডিকেল ডিরেক্টর');
  const [adminPin, setAdminPin] = useState('1234');
  const [adminNotes, setAdminNotes] = useState('হেলথকেয়ার মাস্টার টেমপ্লেট ৩টি লিংকড মডিউল সহ লাইভ অপারেশনের জন্য অনুমোদিত।');
  const [targetModToToggle, setTargetModToToggle] = useState(null); // 'all' | 'hospital' | 'diagnostic' | 'pharmacy'

  // Subtabs within Linked Apps
  const [hospitalSubTab, setHospitalSubTab] = useState('doctor_queue'); // 'doctor_queue' | 'patient_crm'
  const [diagnosticSubTab, setDiagnosticSubTab] = useState('lims_workstation'); // 'lims_workstation' | 'radiology'

  // Global search input
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  const filteredPatients = searchQuery.trim()
    ? patients.filter(
        p =>
          p.patient_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.phone.includes(searchQuery)
      )
    : [];

  const handleAdminApprovalConfirm = (e) => {
    e.preventDefault();
    if (targetModToToggle === 'all') {
      activateAllHealthcareModules(adminName, adminNotes);
    } else if (targetModToToggle) {
      toggleHealthcareModule(targetModToToggle);
    }
    setShowApprovalModal(false);
    setTargetModToToggle(null);
  };

  const handleModuleToggleClick = (modKey) => {
    // If not currently active, ask for admin approval PIN
    if (!activeModules[modKey]) {
      setTargetModToToggle(modKey);
      setShowApprovalModal(true);
    } else {
      // Toggle off directly or confirm
      if (window.confirm(`আপনি কি এই মডিউলটি সাময়িকভাবে নিষ্ক্রিয় করতে চান?`)) {
        toggleHealthcareModule(modKey);
      }
    }
  };

  // ========================================================
  // VIEW: DEDICATED FULL LINKED APP WORKSTATION (When Active)
  // ========================================================
  if (activeLinkedApp !== 'hub') {
    return (
      <div className="space-y-4 font-sans animate-fade-in pb-12">
        {/* Linked App Persistent Executive Top Bar */}
        <div className="bg-slate-950 text-white rounded-2xl p-4 shadow-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveLinkedApp('hub')}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-700 hover:scale-105"
            >
              <ArrowLeft size={14} />
              <span>টেমপ্লেট হাব-এ ফিরুন</span>
            </button>

            <div className="h-6 w-px bg-slate-800 hidden sm:block" />

            <div className="flex items-center gap-2.5">
              {activeLinkedApp === 'hospital' && (
                <>
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold">
                    <Stethoscope size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-black text-white">১. হসপিটাল ও ডক্টর কনসালটেশন পোর্টাল</h2>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/40">
                        🔗 লিংকড অ্যাপ সক্রিয়
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">টোকেন কিউ, রোগী ভাইটালস, ড্রাগ সাজেশন্স ও প্রেসক্রিপশন জেনারেশন</p>
                  </div>
                </>
              )}

              {activeLinkedApp === 'diagnostic' && (
                <>
                  <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center font-bold">
                    <FlaskConical size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-black text-white">২. ডায়াগনস্টিক সেন্টার ও LIMS ল্যাব</h2>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-500/20 text-teal-300 border border-teal-500/40">
                        🔗 লিংকড অ্যাপ সক্রিয়
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">৫০ ক্যাটাগরি, ৭৮ ডিজিজ বান্ডেল, বারকোড স্যাম্পল ও ভেরিফায়েড রিপোর্ট</p>
                  </div>
                </>
              )}

              {activeLinkedApp === 'pharmacy' && (
                <>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
                    <Pill size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-black text-white">৩. ফার্মেসি FEFO পিওএস টার্মিনাল</h2>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        🔗 লিংকড অ্যাপ সক্রিয়
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">প্রেসক্রিপশন কিউ সিঙ্ক, FEFO আর্লিয়েস্ট এক্সপায়ারি ব্যাচ ও ডিসপেন্সিং</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Quick Cross-App Switcher Buttons */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            {activeModules.hospital && (
              <button
                onClick={() => setActiveLinkedApp('hospital')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeLinkedApp === 'hospital'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Stethoscope size={13} />
                <span>হসপিটাল অ্যাপ</span>
              </button>
            )}

            {activeModules.diagnostic && (
              <button
                onClick={() => setActiveLinkedApp('diagnostic')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeLinkedApp === 'diagnostic'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <FlaskConical size={13} />
                <span>ডায়াগনস্টিক ল্যাব</span>
              </button>
            )}

            {activeModules.pharmacy && (
              <button
                onClick={() => setActiveLinkedApp('pharmacy')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeLinkedApp === 'pharmacy'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Pill size={13} />
                <span>ফার্মেসি টার্মিনাল</span>
              </button>
            )}
          </div>
        </div>

        {/* Sub-Tabs Navigation for Hospital App */}
        {activeLinkedApp === 'hospital' && (
          <div className="bg-white rounded-xl p-2 border border-slate-200 shadow-sm flex items-center gap-2">
            <button
              onClick={() => setHospitalSubTab('doctor_queue')}
              className={`px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-2 ${
                hospitalSubTab === 'doctor_queue'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Stethoscope size={14} />
              <span>ডক্টর চেম্বার ও ডিজিটাল প্রেসক্রিপশন</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 text-white">
                {appointments.filter(a => a.appointment_status === 'Waiting').length}
              </span>
            </button>
            <button
              onClick={() => setHospitalSubTab('patient_crm')}
              className={`px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-2 ${
                hospitalSubTab === 'patient_crm'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <UserCheck size={14} />
              <span>পেশেন্ট মাস্টার রেজিস্ট্রি (PT-ID)</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700">
                {patients.length}
              </span>
            </button>
          </div>
        )}

        {/* Sub-Tabs Navigation for Diagnostic App */}
        {activeLinkedApp === 'diagnostic' && (
          <div className="bg-white rounded-xl p-2 border border-slate-200 shadow-sm flex items-center gap-2">
            <button
              onClick={() => setDiagnosticSubTab('lims_workstation')}
              className={`px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-2 ${
                diagnosticSubTab === 'lims_workstation'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FlaskConical size={14} />
              <span>LIMS ল্যাব টেস্ট বিলিং ও রেজাল্ট এন্ট্রি</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 text-white">
                {labOrders.length}
              </span>
            </button>
            <button
              onClick={() => setDiagnosticSubTab('radiology')}
              className={`px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-2 ${
                diagnosticSubTab === 'radiology'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Layers size={14} />
              <span>রেডিওলজি, সিটি ও আল্ট্রাসনোগ্রাফি ডেস্ক</span>
            </button>
          </div>
        )}

        {/* Content Container */}
        <div>
          {activeLinkedApp === 'hospital' && (
            hospitalSubTab === 'doctor_queue' ? <DoctorConsultationQueue /> : <PatientManager />
          )}

          {activeLinkedApp === 'diagnostic' && (
            diagnosticSubTab === 'lims_workstation' ? <DiagnosticLIMSManager /> : <RadiologyImagingManager />
          )}

          {activeLinkedApp === 'pharmacy' && <PharmacyFEFOManager />}
        </div>
      </div>
    );
  }

  // ========================================================
  // VIEW: MASTER HEALTHCARE 3-IN-1 TEMPLATE DASHBOARD
  // ========================================================
  return (
    <div className="space-y-6 font-sans animate-fade-in pb-12">
      {/* 1. Header Banner */}
      <div className="relative rounded-3xl overflow-hidden p-6 md:p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 text-white border border-teal-500/20 shadow-2xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-teal-500/20 text-teal-300 border border-teal-500/40 rounded-full text-xs font-black tracking-wider uppercase flex items-center gap-1.5 shadow-sm">
                <Sparkles size={13} className="text-teal-400" />
                Master Healthcare 3-in-1 Template
              </span>
              <span className="px-3 py-1 bg-white/10 text-slate-300 rounded-full text-xs font-semibold backdrop-blur-md">
                Hospital + Diagnostic + Pharmacy Linked Suite
              </span>
              {isAnyModuleActive ? (
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 rounded-full text-xs font-black flex items-center gap-1.5 shadow-inner">
                  <CheckCircle2 size={13} className="text-emerald-400" />
                  সিস্টেম সক্রিয়
                </span>
              ) : (
                <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/50 rounded-full text-xs font-black flex items-center gap-1.5 shadow-inner">
                  <Lock size={13} className="text-amber-400" />
                  টেমপ্লেট মোড (নিষ্ক্রিয়)
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white">
              হেলথকেয়ার ও ক্লিনিক্যাল ইকোসিস্টেম টেমপ্লেট
            </h1>
            <p className="text-slate-300 text-xs md:text-sm max-w-3xl leading-relaxed">
              একটি কেন্দ্রীয় টেমপ্লেট যার অধীনে ৩টি বিশেষায়িত ক্যাটাগরি ও ৩টি সংযুক্ত লিংকড অ্যাপ রয়েছে। এডমিন প্রয়োজন অনুযায়ী প্রতিটি মডিউল একক বা একসাথে সক্রিয় করতে পারবেন।
            </p>
          </div>

          {/* Master Activation Controls */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {isAnyModuleActive ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (window.confirm('আপনি কি সবকটি হেলথকেয়ার মডিউল নিষ্ক্রিয় করে পুনরায় টেমপ্লেট মোডে নিতে চান?')) {
                      deactivateAllHealthcareModules();
                    }
                  }}
                  className="px-3.5 py-2.5 bg-slate-800/80 hover:bg-rose-950/80 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/50 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Lock size={14} />
                  <span>পুনরায় টেমপ্লেট করুন</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setTargetModToToggle('all');
                  setShowApprovalModal(true);
                }}
                className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-2xl text-xs md:text-sm shadow-xl shadow-emerald-500/25 transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
              >
                <Unlock size={17} />
                <span>🛡️ অ্যাডমিন অনুমোদন ও ৩টি মডিউল সক্রিয় করুন</span>
              </button>
            )}
          </div>
        </div>

        {/* Ambient glows */}
        <div className="absolute right-0 top-0 -translate-y-12 translate-x-12 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 translate-y-12 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 2. Global Unified Patient Search Dock (Visible when active) */}
      {isAnyModuleActive && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Search size={16} className="text-teal-600" />
                <span>সেন্ট্রাল পেশেন্ট আইডি সার্চ ও ক্রস-অ্যাপ সিঙ্ক</span>
              </h3>
              <p className="text-xs text-slate-500">
                পেশেন্ট আইডি (<code className="text-teal-700 font-mono font-bold">PT-XXXXXX</code>), নাম বা মোবাইল নম্বর দিয়ে খুঁজুন
              </p>
            </div>
          </div>

          <div className="relative">
            <Search size={17} className="absolute left-4 top-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
              placeholder="পেশেন্ট আইডি (যেমন: PT-000001), মোবাইল বা রোগীর নাম দিয়ে খুঁজুন..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 focus:bg-white border border-slate-200 focus:border-teal-500 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-4 focus:ring-teal-500/10 transition-all"
            />

            {/* Live Search Results */}
            {showSearchResults && searchQuery.trim() !== '' && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {filteredPatients.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    কোনো রোগী পাওয়া যায়নি।
                  </div>
                ) : (
                  filteredPatients.map(p => (
                    <div
                      key={p.patient_id}
                      className="p-3.5 hover:bg-slate-50 transition-colors flex flex-wrap items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 text-xs sm:text-sm">{p.full_name}</span>
                          <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-teal-50 text-teal-800 font-bold border border-teal-200">
                            {p.patient_id}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {p.age} বছর, {p.gender}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">ফোন: {p.phone}</div>
                      </div>

                      {/* Quick jump actions based on active modules */}
                      <div className="flex items-center gap-2">
                        {activeModules.hospital && (
                          <button
                            onClick={() => {
                              setGlobalSelectedPatientId(p.patient_id);
                              setShowSearchResults(false);
                              setActiveLinkedApp('hospital');
                            }}
                            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold border border-blue-200 flex items-center gap-1"
                          >
                            <Stethoscope size={13} />
                            <span>ডক্টর চেম্বার</span>
                          </button>
                        )}

                        {activeModules.diagnostic && (
                          <button
                            onClick={() => {
                              setGlobalSelectedPatientId(p.patient_id);
                              setShowSearchResults(false);
                              setActiveLinkedApp('diagnostic');
                            }}
                            className="px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg text-xs font-bold border border-teal-200 flex items-center gap-1"
                          >
                            <FlaskConical size={13} />
                            <span>ল্যাব টেস্ট দিন</span>
                          </button>
                        )}

                        {activeModules.pharmacy && (
                          <button
                            onClick={() => {
                              setGlobalSelectedPatientId(p.patient_id);
                              setShowSearchResults(false);
                              setActiveLinkedApp('pharmacy');
                            }}
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-200 flex items-center gap-1"
                          >
                            <Pill size={13} />
                            <span>ওষুধ ডিসপেন্স</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. The 3 Master Categories & Linked Apps Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Layers className="text-teal-600" size={20} />
              <span>টেমপ্লেটের ৩টি প্রধান ক্যাটাগরি ও ৩টি লিংকড অ্যাপ</span>
            </h2>
            <p className="text-xs text-slate-500">
              এডমিন প্রতিটি ক্যাটাগরি স্বাধীনভাবে সক্রিয়/নিষ্ক্রিয় করতে পারবেন
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* ========================================================
              CATEGORY 1: HOSPITAL & CLINIC
             ======================================================== */}
          <div className={`bg-white rounded-3xl p-6 border-2 transition-all duration-300 flex flex-col justify-between ${
            activeModules.hospital
              ? 'border-blue-500 shadow-xl shadow-blue-500/5'
              : 'border-slate-200 shadow-sm opacity-90'
          }`}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl">
                  <Stethoscope size={24} />
                </div>
                <button
                  onClick={() => handleModuleToggleClick('hospital')}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeModules.hospital
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {activeModules.hospital ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                  <span>{activeModules.hospital ? 'সক্রিয় (Active)' : 'নিষ্ক্রিয় (Inactive)'}</span>
                </button>
              </div>

              <div>
                <span className="text-[10px] font-black tracking-wider uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                  ক্যাটাগরি ০১
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  হসপিটাল ও ক্লিনিক ম্যানেজমেন্ট
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  লিংকড অ্যাপ: <strong>Doctor Chamber & Consultation Portal</strong>
                </p>
              </div>

              <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Check size={13} className="text-blue-600" />
                  <span>টোকেন কিউ ও লাইভ সিরিয়াল কলিং</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={13} className="text-blue-600" />
                  <span>ডিজিটাল প্রেসক্রিপশন ও ড্রাগ সাজেশন</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={13} className="text-blue-600" />
                  <span>রোগীর ভাইটালস ও মেডিকেল হিস্ট্রি</span>
                </div>
                <div className="flex items-center gap-2 text-blue-800 font-semibold">
                  <span className="text-blue-600">🔗</span>
                  <span>এক ক্লিকে ল্যাব টেস্ট ও ফার্মেসি সিঙ্ক</span>
                </div>
              </div>

              {activeModules.hospital && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <div className="text-[10px] text-slate-500 font-bold">অপেক্ষমাণ রোগী</div>
                    <div className="text-base font-black text-blue-700">
                      {appointments.filter(a => a.appointment_status === 'Waiting').length} জন
                    </div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <div className="text-[10px] text-slate-500 font-bold">রোগী রেজিস্ট্রি</div>
                    <div className="text-base font-black text-slate-800">
                      {patients.length} জন
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              {activeModules.hospital ? (
                <button
                  onClick={() => setActiveLinkedApp('hospital')}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Stethoscope size={15} />
                  <span>হসপিটাল অ্যাপে প্রবেশ করুন</span>
                  <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  onClick={() => handleModuleToggleClick('hospital')}
                  className="w-full py-2.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <Unlock size={14} />
                  <span>এডমিন সক্রিয় করুন</span>
                </button>
              )}
            </div>
          </div>

          {/* ========================================================
              CATEGORY 2: DIAGNOSTIC & LAB
             ======================================================== */}
          <div className={`bg-white rounded-3xl p-6 border-2 transition-all duration-300 flex flex-col justify-between ${
            activeModules.diagnostic
              ? 'border-teal-500 shadow-xl shadow-teal-500/5'
              : 'border-slate-200 shadow-sm opacity-90'
          }`}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-xl">
                  <FlaskConical size={24} />
                </div>
                <button
                  onClick={() => handleModuleToggleClick('diagnostic')}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeModules.diagnostic
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {activeModules.diagnostic ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                  <span>{activeModules.diagnostic ? 'সক্রিয় (Active)' : 'নিষ্ক্রিয় (Inactive)'}</span>
                </button>
              </div>

              <div>
                <span className="text-[10px] font-black tracking-wider uppercase text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md">
                  ক্যাটাগরি ০২
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  ডায়াগনস্টিক সেন্টার ও ল্যাবরেটরি
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  লিংকড অ্যাপ: <strong>Diagnostic Lab Workstation & Billing</strong>
                </p>
              </div>

              <div className="p-3 bg-teal-50/50 rounded-2xl border border-teal-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Check size={13} className="text-teal-600" />
                  <span>৫০টি ক্যাটাগরি ও ৭৮টি টেস্ট বান্ডেল</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={13} className="text-teal-600" />
                  <span>বারকোড স্পেসিমেন ও স্যাম্পল ট্র্যাকিং</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={13} className="text-teal-600" />
                  <span>রেজাল্ট এন্ট্রি ও ভেরিফায়েড রিপোর্ট</span>
                </div>
                <div className="flex items-center gap-2 text-teal-800 font-semibold">
                  <span className="text-teal-600">🔗</span>
                  <span>ডাক্তারের টেস্ট অর্ডার সরাসরি রিসিভ</span>
                </div>
              </div>

              {activeModules.diagnostic && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <div className="text-[10px] text-slate-500 font-bold">পেন্ডিং টেস্ট অর্ডার</div>
                    <div className="text-base font-black text-teal-700">
                      {labOrders.filter(l => l.order_status === 'Sample Pending' || l.order_status === 'Processing').length} টি
                    </div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <div className="text-[10px] text-slate-500 font-bold">টেস্ট ক্যাটালগ</div>
                    <div className="text-base font-black text-slate-800">
                      {diagnosticTests.length}+ টি
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              {activeModules.diagnostic ? (
                <button
                  onClick={() => setActiveLinkedApp('diagnostic')}
                  className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <FlaskConical size={15} />
                  <span>ল্যাব ওয়ার্কস্টেশনে প্রবেশ করুন</span>
                  <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  onClick={() => handleModuleToggleClick('diagnostic')}
                  className="w-full py-2.5 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <Unlock size={14} />
                  <span>এডমিন সক্রিয় করুন</span>
                </button>
              )}
            </div>
          </div>

          {/* ========================================================
              CATEGORY 3: PHARMACY POS
             ======================================================== */}
          <div className={`bg-white rounded-3xl p-6 border-2 transition-all duration-300 flex flex-col justify-between ${
            activeModules.pharmacy
              ? 'border-emerald-500 shadow-xl shadow-emerald-500/5'
              : 'border-slate-200 shadow-sm opacity-90'
          }`}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl">
                  <Pill size={24} />
                </div>
                <button
                  onClick={() => handleModuleToggleClick('pharmacy')}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeModules.pharmacy
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {activeModules.pharmacy ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                  <span>{activeModules.pharmacy ? 'সক্রিয় (Active)' : 'নিষ্ক্রিয় (Inactive)'}</span>
                </button>
              </div>

              <div>
                <span className="text-[10px] font-black tracking-wider uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                  ক্যাটাগরি ০৩
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  ফার্মেসি ও মেডিসিন ডিসপেনসারি
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  লিংকড অ্যাপ: <strong>Pharmacy POS & FEFO Batch Dispenser</strong>
                </p>
              </div>

              <div className="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Check size={13} className="text-emerald-600" />
                  <span>প্রেসক্রিপশন কিউ থেকে সরাসরি সেলস সিঙ্ক</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={13} className="text-emerald-600" />
                  <span>FEFO (ফার্স্ট-এক্সপায়ারি) অটো ব্যাচ চয়ন</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={13} className="text-emerald-600" />
                  <span>বক্স টু স্ট্রিপ/ট্যাবলেট অটো হিসাব</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                  <span className="text-emerald-600">🔗</span>
                  <span>মেয়াদোত্তীর্ণ ব্যাচ অটো-লক সুরক্ষা</span>
                </div>
              </div>

              {activeModules.pharmacy && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <div className="text-[10px] text-slate-500 font-bold">ডিসপেন্সের কিউ</div>
                    <div className="text-base font-black text-emerald-700">
                      {prescriptions.filter(p => p.dispensing_status === 'Sent to Pharmacy').length} টি
                    </div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <div className="text-[10px] text-slate-500 font-bold">ওষুধ আইটেম</div>
                    <div className="text-base font-black text-slate-800">
                      {pharmacyMedicines.length} টি
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              {activeModules.pharmacy ? (
                <button
                  onClick={() => setActiveLinkedApp('pharmacy')}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Pill size={15} />
                  <span>ফার্মেসি টার্মিনালে প্রবেশ করুন</span>
                  <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  onClick={() => handleModuleToggleClick('pharmacy')}
                  className="w-full py-2.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <Unlock size={14} />
                  <span>এডমিন সক্রিয় করুন</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Live Inter-Connection Matrix (3-Way Linkup Explanation) */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-base font-black text-white flex items-center gap-2">
          <Activity className="text-teal-400" size={18} />
          <span>৩টি লিংকড অ্যাপ্লিকেশনের সার্বক্ষণিক ইন্টার-কানেকশন ম্যাট্রিক্স</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-2">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
              <Stethoscope size={15} />
              <span>ডক্টর চেম্বার ➔ ডায়াগনস্টিক ল্যাব</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              ডাক্তার প্রেসক্রিপশনে কোনো প্যাথলজি বা রেডিওলজি টেস্ট অ্যাড করলে রোগীর ফাইল থেকে সরাসরি ল্যাব অর্ডারে চলে যায়। ল্যাব কর্মী কেবল বারকোড প্রিন্ট করে কাজ শুরু করতে পারেন।
            </p>
          </div>

          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
              <Pill size={15} />
              <span>ডক্টর চেম্বার ➔ ফার্মেসি পিওএস</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              ডাক্তার প্রেসক্রিপশন সেভ করা মাত্র ফার্মেসি কাউন্টারের লাইভ কিউতে রোগীর প্রেসক্রিপশন ভেসে ওঠে। ফার্মাসিস্ট দ্রুত FEFO ব্যাচ চয়ন করে বিল তৈরি করতে পারেন।
            </p>
          </div>

          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-2">
            <div className="flex items-center gap-2 text-teal-400 font-bold text-xs">
              <FlaskConical size={15} />
              <span>ডায়াগনস্টিক ল্যাব ➔ ডক্টর হিস্ট্রি</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              প্যাথলজিস্ট কর্তৃক ল্যাব রিপোর্ট ভেরিফাই ও ডিজিটাল সাইন হওয়ার সাথে সাথে তা সেন্ট্রাল পেশেন্ট আইডি (<strong className="text-teal-300 font-mono">PT-ID</strong>)-তে সংযুক্ত হয়ে যায়।
            </p>
          </div>
        </div>
      </div>

      {/* 5. Auxiliary Suite & Analytics Drawer */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <ShieldCheck className="text-teal-600" size={17} />
          <span>সহায়ক সেবা ও কমপ্লায়েন্স মডিউল (Auxiliary Services)</span>
        </h3>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setActiveHealthcareTab('dashboard')}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
              activeHealthcareTab === 'dashboard'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Activity size={14} />
            <span>হেলথকেয়ার অ্যানালিটিক্স</span>
          </button>

          <button
            onClick={() => setActiveHealthcareTab('home_service')}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
              activeHealthcareTab === 'home_service'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Layers size={14} />
            <span>হোম স্যাম্পল কালেকশন ও রেফারেল</span>
          </button>

          <button
            onClick={() => setActiveHealthcareTab('compliance_suite')}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
              activeHealthcareTab === 'compliance_suite'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ShieldCheck size={14} />
            <span>সেকশন ২৪: কোয়ালিটি ও কমপ্লায়েন্স সুইট (LQMS & ISO)</span>
          </button>
        </div>

        <div className="pt-2">
          {activeHealthcareTab === 'dashboard' && <HealthcareDashboard />}
          {activeHealthcareTab === 'home_service' && <HomeServicesReferral />}
          {activeHealthcareTab === 'compliance_suite' && <AdvancedComplianceSuite />}
        </div>
      </div>

      {/* 6. Admin Approval Security Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-slate-200 space-y-6 relative">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    অ্যাডমিন মডিউল অনুমোদন
                  </h3>
                  <p className="text-xs text-slate-500">
                    {targetModToToggle === 'all'
                      ? '৩টি লিংকড হেলথকেয়ার মডিউল একসাথে সক্রিয়করণ'
                      : targetModToToggle === 'hospital'
                      ? 'হসপিটাল ও ডক্টর কনসালটেশন মডিউল সক্রিয়করণ'
                      : targetModToToggle === 'diagnostic'
                      ? 'ডায়াগনস্টিক ল্যাব ও LIMS মডিউল সক্রিয়করণ'
                      : 'ফার্মেসি FEFO পিওএস মডিউল সক্রিয়করণ'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowApprovalModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdminApprovalConfirm} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  অনুমোদনকারী অ্যাডমিনের নাম
                </label>
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  নিরাপত্তা পিন কোড (Security PIN)
                </label>
                <input
                  type="password"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  placeholder="ডিফল্ট: 1234"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono tracking-widest focus:outline-none focus:border-teal-500"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  * ডেমো পিন: <strong className="text-slate-600">1234</strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  অনুমোদন মন্তব্য ও লাইসেন্স নোট
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-teal-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApprovalModal(false)}
                  className="px-4 py-2.5 text-slate-600 hover:text-slate-800 font-bold text-xs rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2"
                >
                  <CheckCircle2 size={16} />
                  <span>অনুমোদন কনফার্ম ও সক্রিয় করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
