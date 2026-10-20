import React, { useState, useEffect } from 'react';
import { useHealthcare } from '../../context/HealthcareContext';
import { useApp } from '../../context/AppContext';
import { PatientManager } from './PatientManager';
import { DoctorConsultationQueue } from './DoctorConsultationQueue';
import { AppointmentSerialManager } from './AppointmentSerialManager';
import { DoctorChamberManager } from './DoctorChamberManager';
import { DiagnosticLIMSManager } from './DiagnosticLIMSManager';
import PharmacyFEFOManager from './PharmacyFEFOManager';
import RadiologyImagingManager from './RadiologyImagingManager';
import HomeServicesReferral from './HomeServicesReferral';
import AdvancedComplianceSuite from './AdvancedComplianceSuite';
import { HealthcareDashboard } from './HealthcareDashboard';
import InpatientBedManager from './InpatientBedManager';
import HealthcareBillingManager from './HealthcareBillingManager';
import StaffSecurityManager from './StaffSecurityManager';
import PrintCenterManager from './PrintCenterManager';
import HealthcareSettingsManager from './HealthcareSettingsManager';
import BranchSelectorBar from './BranchSelectorBar';

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
  ToggleLeft,
  ToggleRight,
  X,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Bed,
  CreditCard,
  Printer,
  Settings,
  Building,
  Calendar,
  Users,
  Grid,
  ClipboardList
} from 'lucide-react';

export default function HealthcareHub({ embeddedMode = false, onLaunchFullscreen }) {
  const {
    // 3 Modular activations
    activeModules = { hospital: true, diagnostic: true, pharmacy: true },
    isAnyModuleActive,
    toggleHealthcareModule,
    activateAllHealthcareModules,
    deactivateAllHealthcareModules,
    isHealthcareApproved,
    healthcareApprovalRecord,
    // Active app state
    activeLinkedApp = 'hub',
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

  const { setActiveTab, lang = 'bn', businessSettings } = useApp() || {};

  // Organization Type state
  const [instType, setInstType] = useState(() => {
    try {
      return localStorage.getItem('hisabkitab_hc_inst_type') || 'hospital_diag_pharmacy';
    } catch {
      return 'hospital_diag_pharmacy';
    }
  });

  const getInstTypeLabel = (type) => {
    switch (type) {
      case 'doctor_chamber': return 'ডাক্তার চেম্বার';
      case 'diagnostic_center': return 'ডায়াগনস্টিক সেন্টার';
      case 'pharmacy': return 'ফার্মেসি';
      case 'clinic': return 'ক্লিনিক / ছোট হাসপাতাল';
      case 'hospital_diag_pharmacy': return 'হাসপাতাল + ডায়াগনস্টিক + ফার্মেসি (360°)';
      case 'multi_branch': return 'একাধিক শাখার প্রতিষ্ঠান';
      default: return 'হাসপাতাল + ডায়াগনস্টিক + ফার্মেসি (360°)';
    }
  };

  // Subtabs within Linked Apps (১.৪, ১.৫, ১.৬)
  const [hospitalSubTab, setHospitalSubTab] = useState('patient_crm'); // 'patient_crm' | 'appointment_serial' | 'doctor_chamber' | 'doctor_queue'
  const [diagnosticSubTab, setDiagnosticSubTab] = useState('lims_workstation'); // 'lims_workstation' | 'radiology'

  const [showGuide, setShowGuide] = useState(false);
  const [showAllModulesGrid, setShowAllModulesGrid] = useState(false);

  // Global search input
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  const filteredPatients = searchQuery.trim()
    ? patients.filter(
        p =>
          (p.patient_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          ((p.mobile_number || p.phone || '')).includes(searchQuery)
      )
    : [];

  // All 18 Modules Catalog
  const all18Modules = [
    { num: 1, title: '১.১-১.৩ ড্যাশবোর্ড', desc: 'আজকের রোগী, টেস্ট, ওষুধ বিক্রি, শাখা তুলনা ও ফিল্টার', key: 'hub', icon: '📊', color: '#6366f1' },
    { num: 2, title: '১.৪ রোগী ব্যবস্থাপনা', desc: 'UHID রেজিস্ট্রি, নতুন রোগী, ডুপ্লিকেট চেকার ও পূর্ণাঙ্গ হিস্ট্রি', key: 'patient_crm', icon: '👤', color: '#0d9488' },
    { num: 3, title: '১.৫ অ্যাপয়েন্টমেন্ট ও সিরিয়াল', desc: 'দৈনিক সিরিয়াল, ক্যালেন্ডার, অপেক্ষমাণ তালিকা ও টোকেন প্রিন্ট', key: 'appointment_serial', icon: '📅', color: '#2563eb' },
    { num: 4, title: '১.৬ ডাক্তার ও চেম্বার', desc: 'ডাক্তার তালিকা, বিভাগ/বিশেষত্ব, চেম্বার শিডিউল, ফি ও রিপোর্ট', key: 'doctor_chamber', icon: '🩺', color: '#0284c7' },
    { num: 5, title: '১.৬ ভিজিট ও প্রেসক্রিপশন', desc: 'রোগী দেখার তালিকা, ভাইটালস, ডাক্তারি নোট, Rx ও টেস্ট অর্ডার', key: 'doctor_queue', icon: '℞', color: '#3b82f6' },
    { num: 6, title: 'ডায়াগনস্টিক ও টেস্ট অর্ডার', desc: '১০টি স্ট্যাটাস লাইফসাইকেল ও বারকোড স্যাম্পল কালেকশন', key: 'diagnostic', icon: '🧪', color: '#0d9488' },
    { num: 7, title: 'ল্যাব রিপোর্ট', desc: 'রেফারেন্স রেঞ্জ, High/Low অ্যালার্ট, ভেরিফাই ও প্রিন্ট', key: 'diagnostic', icon: '🔬', color: '#14b8a6' },
    { num: 8, title: 'রেডিওলজি ও ইমেজিং', desc: 'X-ray, USG, ECG ও ডিজিটাল ইমেজ সংযুক্তি', key: 'radiology', icon: '🩻', color: '#06b6d4' },
    { num: 9, title: 'ফার্মেসি ও ওষুধের তালিকা', desc: 'FEFO এক্সপায়ারি, স্ট্রিপ টু পিস বিক্রি ও রি-অর্ডার', key: 'pharmacy', icon: '💊', color: '#10b981' },
    { num: 10, title: 'হাসপাতাল / ভর্তি রোগী (IPD)', desc: 'ওয়ার্ড/কেবিন বেড ট্র্যাকিং, ভর্তি ও ছাড়পত্র ফরম', key: 'inpatient', icon: '🛏️', color: '#059669' },
    { num: 11, title: 'বিলিং ও পেমেন্ট', desc: 'সমন্বিত বিল, নগদ/কার্ড/বিকাশ পেমেন্ট ও ক্যাশ ক্লোজিং', key: 'billing', icon: '💳', color: '#16a34a' },
    { num: 12, title: 'সরবরাহকারী, ক্রয় ও খরচ', desc: 'সাপ্লায়ার বাকি, ওষুধ ক্রয় চালান ও ডেইলি খরচের হিসাব', key: 'pharmacy', icon: '📦', color: '#84cc16' },
    { num: 13, title: 'রিপোর্ট ও ব্যবসার হিসাব', desc: 'মাসিক আয়-ব্যয়, ল্যাব বিক্রি ও ডাক্তারভিত্তিক রিপোর্ট', key: 'hub', icon: '📈', color: '#eab308' },
    { num: 14, title: 'কর্মী ও অনুমতি (RBAC)', desc: 'ডাক্তার, ফার্মাসিস্ট, ক্যাশিয়ার পারমিশন ও সীমা', key: 'staff', icon: '🔑', color: '#f97316' },
    { num: 15, title: 'নিরাপত্তা ও অডিট লগ', desc: 'কে লগইন করেছে, কে বিল বা প্রেসক্রিপশন বদলেছে তার ট্রেইল', key: 'staff', icon: '🛡️', color: '#ef4444' },
    { num: 16, title: 'প্রিন্ট ও কাগজপত্র', desc: 'প্রেসক্রিপশন প্যাড, মানি রিসিট, টোকেন ও ল্যাব রিপোর্ট প্রিন্ট', key: 'print', icon: '🖨️', color: '#8b5cf6' },
    { num: 17, title: 'সেটিংস ও প্রতিষ্ঠানের ধরন', desc: 'নাম, লোগো, স্লিপ সাইজ, শাখা ও প্রতিষ্ঠানের প্রোফাইল', key: 'settings', icon: '⚙️', color: '#6b7280' },
    { num: 18, title: 'সিস্টেম ফিচার রোডম্যাপ', desc: 'লাইভ ফিচারসমূহ ও ভবিষ্যৎ আপগ্রেড ট্র্যাকার', key: 'hub', icon: '🚀', color: '#ec4899' }
  ];

  const handleLaunchModule = (modKey) => {
    if (modKey === 'patient_crm') {
      setActiveLinkedApp('hospital');
      setHospitalSubTab('patient_crm');
    } else if (modKey === 'appointment_serial') {
      setActiveLinkedApp('hospital');
      setHospitalSubTab('appointment_serial');
    } else if (modKey === 'doctor_chamber') {
      setActiveLinkedApp('hospital');
      setHospitalSubTab('doctor_chamber');
    } else if (modKey === 'doctor_queue') {
      setActiveLinkedApp('hospital');
      setHospitalSubTab('doctor_queue');
    } else if (modKey === 'radiology') {
      setActiveLinkedApp('diagnostic');
      setDiagnosticSubTab('radiology');
    } else {
      setActiveLinkedApp(modKey);
    }
    setShowAllModulesGrid(false);
  };

  return (
    <div className="hc-container animate-fade-in" style={{ padding: '0.75rem 1rem 3rem' }}>
      {/* 1.2 MULTI-BRANCH SELECTOR & ROLE PERMISSIONS BAR */}
      <BranchSelectorBar />

      {/* 1. TOP MASTER HEADER & WORKSTATION TABS */}
      <div className="hc-banner" style={{ marginBottom: '1rem' }}>
        <div className="hc-banner-glow" />
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {/* Title Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                <span className="badge" style={{ background: 'rgba(13, 148, 136, 0.25)', color: '#2dd4bf', border: '1px solid rgba(45, 212, 191, 0.4)', padding: '3px 9px', fontSize: '0.72rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Sparkles size={13} />
                  <span>হেলথকেয়ার 360° এন্টারপ্রাইজ সিস্টেম</span>
                </span>
                
                {/* Institution Profile Indicator */}
                <button
                  type="button"
                  onClick={() => setActiveLinkedApp('settings')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: 'rgba(59, 130, 246, 0.2)',
                    color: '#93c5fd',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    padding: '3px 8px',
                    borderRadius: '20px',
                    fontSize: '0.7rem',
                    fontWeight: '800',
                    cursor: 'pointer'
                  }}
                  title="প্রতিষ্ঠানের ধরন পরিবর্তন করতে ক্লিক করুন"
                >
                  <Building size={12} />
                  <span>ধরন: {getInstTypeLabel(instType)}</span>
                  <Settings size={11} style={{ opacity: 0.8 }} />
                </button>

                <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.35)', padding: '3px 8px', fontSize: '0.7rem', fontWeight: '800' }}>
                  ✓ ১৮টি মডিউল অন্তর্ভুক্ত
                </span>
              </div>
              <h1 style={{ fontSize: '1.45rem', fontWeight: '900', color: '#ffffff', margin: '2px 0 4px', letterSpacing: '-0.02em' }}>
                {businessSettings?.companyName ? `🏥 ${businessSettings.companyName}` : '🏥 হেলথকেয়ার 360° — হাসপাতাল, ডায়াগনস্টিক, ডাক্তার চেম্বার ও ফার্মেসি'}
              </h1>
              <p style={{ fontSize: '0.8rem', color: '#cbd5e1', margin: 0 }}>
                {businessSettings?.tagline || 'নিচের যে কোনো কাউন্টারে সরাসরি প্রবেশ করুন। প্রেসক্রিপশন, ল্যাব টেস্ট, ড্রাগ স্টক ও বিলিং স্বয়ংক্রিয়ভাবে সিঙ্কড।'}
              </p>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setShowAllModulesGrid(!showAllModulesGrid)}
                className="btn btn-secondary press-scale"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  borderRadius: '10px',
                  background: showAllModulesGrid ? 'rgba(13, 148, 136, 0.4)' : 'rgba(255, 255, 255, 0.1)',
                  borderColor: showAllModulesGrid ? '#2dd4bf' : 'rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  fontSize: '0.78rem',
                  fontWeight: '800'
                }}
              >
                <Grid size={15} />
                <span>১৮টি মডিউল সূচি</span>
              </button>

              <button
                type="button"
                onClick={() => setShowGuide(!showGuide)}
                className="btn btn-secondary press-scale"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  borderRadius: '10px',
                  background: showGuide ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.1)',
                  borderColor: showGuide ? '#818cf8' : 'rgba(255, 255, 255, 0.2)',
                  color: showGuide ? '#c7d2fe' : '#ffffff',
                  fontSize: '0.78rem',
                  fontWeight: '800'
                }}
              >
                <HelpCircle size={15} />
                <span>{showGuide ? 'গাইড লুকান' : '💡 ব্যবহার নির্দেশিকা'}</span>
              </button>
            </div>
          </div>

          {/* PRIMARY WORKSTATION COMMAND TABS */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '6px',
              padding: '6px',
              background: 'rgba(15, 23, 42, 0.75)',
              borderRadius: '14px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(10px)'
            }}
          >
            {/* 1. Dashboard Tab */}
            <button
              type="button"
              onClick={() => setActiveLinkedApp('hub')}
              className="press-scale"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: '10px',
                border: activeLinkedApp === 'hub' ? '2px solid #818cf8' : '1px solid transparent',
                background: activeLinkedApp === 'hub' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255, 255, 255, 0.04)',
                color: activeLinkedApp === 'hub' ? '#ffffff' : '#94a3b8',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: '800',
                transition: 'all 0.18s ease'
              }}
            >
              <Activity size={16} className="text-indigo-400" />
              <span>১. ড্যাশবোর্ড</span>
            </button>

            {/* 2. Pharmacy Tab */}
            <button
              type="button"
              onClick={() => setActiveLinkedApp('pharmacy')}
              className="press-scale"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: '10px',
                border: activeLinkedApp === 'pharmacy' ? '2px solid #10b981' : '1px solid transparent',
                background: activeLinkedApp === 'pharmacy' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.04)',
                color: activeLinkedApp === 'pharmacy' ? '#ffffff' : '#94a3b8',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: '800',
                transition: 'all 0.18s ease'
              }}
            >
              <Pill size={16} className="text-emerald-400" />
              <span>২. ফার্মেসি (১.৮)</span>
            </button>

            {/* 3. Diagnostic Tab */}
            <button
              type="button"
              onClick={() => setActiveLinkedApp('diagnostic')}
              className="press-scale"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: '10px',
                border: activeLinkedApp === 'diagnostic' ? '2px solid #0d9488' : '1px solid transparent',
                background: activeLinkedApp === 'diagnostic' ? 'rgba(13, 148, 136, 0.3)' : 'rgba(255, 255, 255, 0.04)',
                color: activeLinkedApp === 'diagnostic' ? '#ffffff' : '#94a3b8',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: '800',
                transition: 'all 0.18s ease'
              }}
            >
              <FlaskConical size={16} className="text-teal-400" />
              <span>৩. ডায়াগনস্টিক ল্যাব (১.৭)</span>
            </button>

            {/* 4. Doctor Chamber Tab */}
            <button
              type="button"
              onClick={() => setActiveLinkedApp('hospital')}
              className="press-scale"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: '10px',
                border: activeLinkedApp === 'hospital' ? '2px solid #3b82f6' : '1px solid transparent',
                background: activeLinkedApp === 'hospital' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.04)',
                color: activeLinkedApp === 'hospital' ? '#ffffff' : '#94a3b8',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: '800',
                transition: 'all 0.18s ease'
              }}
            >
              <Stethoscope size={16} className="text-blue-400" />
              <span>৪. ডাক্তার ও ওপিডি (১.৪-১.৬)</span>
            </button>

            {/* 5. Inpatient IPD Bed Tab */}
            <button
              type="button"
              onClick={() => setActiveLinkedApp('inpatient')}
              className="press-scale"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: '10px',
                border: activeLinkedApp === 'inpatient' ? '2px solid #059669' : '1px solid transparent',
                background: activeLinkedApp === 'inpatient' ? 'rgba(5, 150, 105, 0.3)' : 'rgba(255, 255, 255, 0.04)',
                color: activeLinkedApp === 'inpatient' ? '#ffffff' : '#94a3b8',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: '800',
                transition: 'all 0.18s ease'
              }}
            >
              <Bed size={16} className="text-emerald-400" />
              <span>৫. ভর্তি ও বেড (IPD)</span>
            </button>

            {/* 6. Central Billing Tab */}
            <button
              type="button"
              onClick={() => setActiveLinkedApp('billing')}
              className="press-scale"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: '10px',
                border: activeLinkedApp === 'billing' ? '2px solid #16a34a' : '1px solid transparent',
                background: activeLinkedApp === 'billing' ? 'rgba(22, 163, 74, 0.3)' : 'rgba(255, 255, 255, 0.04)',
                color: activeLinkedApp === 'billing' ? '#ffffff' : '#94a3b8',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: '800',
                transition: 'all 0.18s ease'
              }}
            >
              <CreditCard size={16} className="text-green-400" />
              <span>৬. বিল, হিসাব ও রিপোর্ট (১.৯)</span>
            </button>

            {/* 7. Print Center Tab */}
            <button
              type="button"
              onClick={() => setActiveLinkedApp('print')}
              className="press-scale"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: '10px',
                border: activeLinkedApp === 'print' ? '2px solid #8b5cf6' : '1px solid transparent',
                background: activeLinkedApp === 'print' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255, 255, 255, 0.04)',
                color: activeLinkedApp === 'print' ? '#ffffff' : '#94a3b8',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: '800',
                transition: 'all 0.18s ease'
              }}
            >
              <Printer size={16} className="text-purple-400" />
              <span>৭. প্রিন্ট ও ডকুমেন্টস</span>
            </button>

            {/* 8. Staff / Security Tab */}
            <button
              type="button"
              onClick={() => setActiveLinkedApp('staff')}
              className="press-scale"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: '10px',
                border: activeLinkedApp === 'staff' ? '2px solid #f97316' : '1px solid transparent',
                background: activeLinkedApp === 'staff' ? 'rgba(249, 115, 22, 0.3)' : 'rgba(255, 255, 255, 0.04)',
                color: activeLinkedApp === 'staff' ? '#ffffff' : '#94a3b8',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: '800',
                transition: 'all 0.18s ease'
              }}
            >
              <ShieldCheck size={16} className="text-orange-400" />
              <span>৮. কাজের ধাপ, কর্মী ও অডিট লগ</span>
            </button>

            {/* 9. Settings Tab */}
            <button
              type="button"
              onClick={() => setActiveLinkedApp('settings')}
              className="press-scale"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: '10px',
                border: activeLinkedApp === 'settings' ? '2px solid #64748b' : '1px solid transparent',
                background: activeLinkedApp === 'settings' ? 'rgba(100, 116, 139, 0.3)' : 'rgba(255, 255, 255, 0.04)',
                color: activeLinkedApp === 'settings' ? '#ffffff' : '#94a3b8',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: '800',
                transition: 'all 0.18s ease'
              }}
            >
              <Settings size={16} className="text-slate-300" />
              <span>৯. সেটিংস</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. ALL 18 MODULES MASTER DIRECTORY MODAL/DRAWER */}
      {showAllModulesGrid && (
        <div
          className="p-6 rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl mb-4 animate-scale-in text-white"
          style={{ backdropFilter: 'blur(16px)' }}
        >
          <div className="flex justify-between items-center pb-4 border-b border-slate-800 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-lg bg-teal-500/20 text-teal-400 font-bold text-xs">
                  Enterprise Architecture
                </span>
                <h3 className="text-lg font-black text-white">১৮টি মডিউলের সম্পূর্ণ স্থাপত্য সূচি (All 18 Modules Navigator)</h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">যেকোনো মডিউলে ১ ক্লিকে সরাসরি জাম্প করুন</p>
            </div>
            <button
              onClick={() => setShowAllModulesGrid(false)}
              className="text-slate-400 hover:text-white text-lg font-bold p-1"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {all18Modules.map(mod => (
              <div
                key={mod.num}
                onClick={() => handleLaunchModule(mod.key)}
                className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 hover:border-teal-400 hover:bg-slate-800 cursor-pointer transition-all flex items-start gap-3 group"
              >
                <div className="text-2xl p-2 rounded-xl bg-slate-700/60 group-hover:scale-110 transition-transform">
                  {mod.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-700 text-teal-300">
                      মডিউল {mod.num}
                    </span>
                    <h4 className="text-xs font-black text-white group-hover:text-teal-300 transition-colors">
                      {mod.title}
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">{mod.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. EXPANDABLE QUICK START GUIDE BANNER */}
      {showGuide && (
        <div
          className="glass-card animate-fade-in"
          style={{
            marginBottom: '1rem',
            padding: '1rem 1.25rem',
            borderRadius: '14px',
            border: '1.5px solid rgba(99, 102, 241, 0.35)',
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.85), rgba(15, 23, 42, 0.95))'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.1rem' }}>💡</span>
              <strong style={{ fontSize: '0.92rem', color: '#ffffff' }}>
                কোথায় কি আছে এবং কীভাবে কাজ করবেন? (সচিত্র নির্দেশিকা)
              </strong>
            </div>
            <button
              type="button"
              onClick={() => setShowGuide(false)}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '700' }}
            >
              ✕ বন্ধ করুন
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
            {/* Guide 1 */}
            <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '10px', padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontWeight: '800', fontSize: '0.84rem', marginBottom: '4px' }}>
                <Pill size={15} />
                <span>💊 ফার্মেসি ও ওষুধ</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.76rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                ওষুধ বিক্রয়, পাতা ভেঙে পিস বিক্রি, FEFO ব্যাচ চয়ন এবং মেয়াদ শেষের অ্যালার্ট।
              </p>
              <button
                type="button"
                onClick={() => setActiveLinkedApp('pharmacy')}
                style={{ marginTop: '8px', padding: '4px 10px', borderRadius: '6px', background: '#10b981', border: 'none', color: '#fff', fontSize: '0.72rem', fontWeight: '800', cursor: 'pointer' }}
              >
                ফার্মেসিতে যান ➔
              </button>
            </div>

            {/* Guide 2 */}
            <div style={{ background: 'rgba(13, 148, 136, 0.08)', border: '1px solid rgba(13, 148, 136, 0.3)', borderRadius: '10px', padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#2dd4bf', fontWeight: '800', fontSize: '0.84rem', marginBottom: '4px' }}>
                <FlaskConical size={15} />
                <span>🔬 ডায়াগনস্টিক ল্যাব</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.76rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                ৭৪+ টেস্ট ক্যাটালগ, বারকোড স্যাম্পল কালেকশন, রেজাল্ট এন্ট্রি ও ভেরিফায়েড রিপোর্ট প্রিন্ট।
              </p>
              <button
                type="button"
                onClick={() => setActiveLinkedApp('diagnostic')}
                style={{ marginTop: '8px', padding: '4px 10px', borderRadius: '6px', background: '#0d9488', border: 'none', color: '#fff', fontSize: '0.72rem', fontWeight: '800', cursor: 'pointer' }}
              >
                ডায়াগনস্টিকে যান ➔
              </button>
            </div>

            {/* Guide 3 */}
            <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '10px', padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#60a5fa', fontWeight: '800', fontSize: '0.84rem', marginBottom: '4px' }}>
                <Stethoscope size={15} />
                <span>🩺 ডক্টর চেম্বার</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.76rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                সিরিয়াল কিউ, রোগীর ভাইটালস (BP, Pulse) ও ৩-মুখী অটো-সিঙ্ক সহ ডিজিটাল প্রেসক্রিপশন।
              </p>
              <button
                type="button"
                onClick={() => setActiveLinkedApp('hospital')}
                style={{ marginTop: '8px', padding: '4px 10px', borderRadius: '6px', background: '#2563eb', border: 'none', color: '#fff', fontSize: '0.72rem', fontWeight: '800', cursor: 'pointer' }}
              >
                ডক্টর চেম্বারে যান ➔
              </button>
            </div>

            {/* Guide 4 */}
            <div style={{ background: 'rgba(5, 150, 105, 0.08)', border: '1px solid rgba(5, 150, 105, 0.3)', borderRadius: '10px', padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399', fontWeight: '800', fontSize: '0.84rem', marginBottom: '4px' }}>
                <Bed size={15} />
                <span>🛏️ ভর্তি রোগী (IPD)</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.76rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                কেবিন ও ওয়ার্ড বেড বরাদ্দ, অগ্রিম জমা এবং ছাড়পত্র ফরম পরিচালনা।
              </p>
              <button
                type="button"
                onClick={() => setActiveLinkedApp('inpatient')}
                style={{ marginTop: '8px', padding: '4px 10px', borderRadius: '6px', background: '#059669', border: 'none', color: '#fff', fontSize: '0.72rem', fontWeight: '800', cursor: 'pointer' }}
              >
                বেড বোর্ডে যান ➔
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. ACTIVE WORKSTATION VIEW RENDERER */}
      {/* 1. Pharmacy POS Workstation */}
      {activeLinkedApp === 'pharmacy' && (
        <div style={{ marginTop: '0.5rem' }}>
          <PharmacyFEFOManager />
        </div>
      )}

      {/* 2. Doctor Chamber, Patients & Appointments Workstation (১.৪, ১.৫, ১.৬) */}
      {activeLinkedApp === 'hospital' && (
        <div style={{ marginTop: '0.5rem' }}>
          <div className="hc-subtabs-nav" style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
            {/* 1.4 Patient CRM */}
            <button
              onClick={() => setHospitalSubTab('patient_crm')}
              className={`hc-tab-btn ${hospitalSubTab === 'patient_crm' ? 'active-blue' : ''}`}
            >
              <UserCheck size={15} />
              <span>১.৪ রোগী রেজিস্ট্রি ও প্রোফাইল</span>
              <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: 'inherit', padding: '1px 6px', fontSize: '0.7rem' }}>
                {patients.length}
              </span>
            </button>

            {/* 1.5 Appointments & Serials */}
            <button
              onClick={() => setHospitalSubTab('appointment_serial')}
              className={`hc-tab-btn ${hospitalSubTab === 'appointment_serial' ? 'active-blue' : ''}`}
            >
              <Calendar size={15} />
              <span>১.৫ অ্যাপয়েন্টমেন্ট ও সিরিয়াল</span>
              <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: 'inherit', padding: '1px 6px', fontSize: '0.7rem' }}>
                {appointments.filter(a => a.appointment_status === 'Waiting').length} অপেক্ষমাণ
              </span>
            </button>

            {/* 1.6 Doctor & Chamber Management */}
            <button
              onClick={() => setHospitalSubTab('doctor_chamber')}
              className={`hc-tab-btn ${hospitalSubTab === 'doctor_chamber' ? 'active-blue' : ''}`}
            >
              <Building size={15} />
              <span>১.৬ ডাক্তার ও চেম্বার</span>
              <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: 'inherit', padding: '1px 6px', fontSize: '0.7rem' }}>
                {doctors.length}
              </span>
            </button>

            {/* 1.6 Doctor Visits & Digital Prescription */}
            <button
              onClick={() => setHospitalSubTab('doctor_queue')}
              className={`hc-tab-btn ${hospitalSubTab === 'doctor_queue' ? 'active-blue' : ''}`}
            >
              <Stethoscope size={15} />
              <span>১.৬ ভিজিট ও ডিজিটাল প্রেসক্রিপশন</span>
            </button>
          </div>

          {hospitalSubTab === 'patient_crm' && <PatientManager />}
          {hospitalSubTab === 'appointment_serial' && <AppointmentSerialManager />}
          {hospitalSubTab === 'doctor_chamber' && <DoctorChamberManager />}
          {hospitalSubTab === 'doctor_queue' && <DoctorConsultationQueue />}
        </div>
      )}

      {/* 3. Diagnostic & Radiology Workstation */}
      {activeLinkedApp === 'diagnostic' && (
        <div style={{ marginTop: '0.5rem' }}>
          <div className="hc-subtabs-nav" style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setDiagnosticSubTab('lims_workstation')}
              className={`hc-tab-btn ${diagnosticSubTab === 'lims_workstation' ? 'active-teal' : ''}`}
            >
              <FlaskConical size={15} />
              <span>LIMS ল্যাব টেস্ট বিলিং ও রেজাল্ট এন্ট্রি</span>
              <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: 'inherit', padding: '1px 6px', fontSize: '0.7rem' }}>
                {labOrders.length}
              </span>
            </button>
            <button
              onClick={() => setDiagnosticSubTab('radiology')}
              className={`hc-tab-btn ${diagnosticSubTab === 'radiology' ? 'active-teal' : ''}`}
            >
              <Layers size={15} />
              <span>রেডিওলজি, সিটি ও আল্ট্রাসনোগ্রাফি ডেস্ক</span>
            </button>
          </div>

          {diagnosticSubTab === 'lims_workstation' ? <DiagnosticLIMSManager /> : <RadiologyImagingManager />}
        </div>
      )}

      {/* 4. Inpatient IPD Workstation */}
      {activeLinkedApp === 'inpatient' && (
        <div style={{ marginTop: '0.5rem' }}>
          <InpatientBedManager />
        </div>
      )}

      {/* 5. Central Billing & Cashier Workstation */}
      {activeLinkedApp === 'billing' && (
        <div style={{ marginTop: '0.5rem' }}>
          <HealthcareBillingManager />
        </div>
      )}

      {/* 6. Print Center Workstation */}
      {activeLinkedApp === 'print' && (
        <div style={{ marginTop: '0.5rem' }}>
          <PrintCenterManager />
        </div>
      )}

      {/* 7. Staff & Security Audit Workstation */}
      {activeLinkedApp === 'staff' && (
        <div style={{ marginTop: '0.5rem' }}>
          <StaffSecurityManager />
        </div>
      )}

      {/* 8. Settings Workstation */}
      {activeLinkedApp === 'settings' && (
        <div style={{ marginTop: '0.5rem' }}>
          <HealthcareSettingsManager onInstitutionTypeChange={(type) => setInstType(type)} />
        </div>
      )}

      {/* 9. Hub Overview & Executive Analytics Dashboard */}
      {activeLinkedApp === 'hub' && (
        <div className="space-y-6">
          {/* Executive Dashboard KPI Metrics */}
          <HealthcareDashboard />

          {/* Central PT-ID Search Dock */}
          <div className="hc-search-dock">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Search size={16} style={{ color: '#0d9488' }} />
                  <span>সেন্ট্রাল পেশেন্ট আইডি সার্চ ও ক্রস-অ্যাপ সিঙ্ক (Central PT-ID Lookup)</span>
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  পেশেন্ট আইডি (<code style={{ color: '#0d9488', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>PT-XXXXXX</code>), নাম বা মোবাইল নম্বর দিয়ে দ্রুত রোগী নির্বাচন করুন
                </p>
              </div>
            </div>

            <div style={{ position: 'relative' }}>
              <Search size={17} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(true);
                }}
                onFocus={() => setShowSearchResults(true)}
                placeholder="পেশেন্ট আইডি (যেমন: PT-000001), মোবাইল বা রোগীর নাম দিয়ে খুঁজুন..."
                className="input-field"
                style={{ width: '100%', paddingLeft: '38px', paddingRight: '12px', fontSize: '0.85rem' }}
              />

              {showSearchResults && searchQuery.trim() !== '' && (
                <div
                  className="glass-card"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    right: 0,
                    zIndex: 40,
                    maxHeight: '300px',
                    overflowY: 'auto',
                    borderRadius: '12px',
                    padding: '6px',
                    boxShadow: 'var(--shadow-lg)'
                  }}
                >
                  {filteredPatients.length === 0 ? (
                    <div style={{ padding: '12px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      কোনো রোগী পাওয়া যায়নি।
                    </div>
                  ) : (
                    filteredPatients.map(p => (
                      <div
                        key={p.patient_id}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '10px',
                          borderBottom: '1px solid var(--border-color)',
                          flexWrap: 'wrap'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <strong style={{ fontSize: '0.86rem', color: 'var(--text-main)' }}>{p.full_name}</strong>
                            <span className="badge" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', background: 'rgba(13, 148, 136, 0.15)', color: '#0d9488' }}>
                              {p.patient_id}
                            </span>
                            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                              {p.calculated_age || p.age || 'N/A'} বছর | {p.gender}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            ফোন: {p.mobile_number || p.phone || 'N/A'}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setGlobalSelectedPatientId(p.patient_id);
                            setShowSearchResults(false);
                            setActiveLinkedApp('hospital');
                          }}
                          className="btn btn-primary"
                          style={{ padding: '4px 10px', fontSize: '0.75rem', background: '#0d9488', border: 'none' }}
                        >
                          সিলেক্ট করুন
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 3 Pillars Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            {/* Card 1: Hospital */}
            <div className="hc-pillar-card active-hospital">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600">
                  <Stethoscope size={22} />
                </span>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  {appointments.filter(a => a.appointment_status === 'Waiting').length} জন অপেক্ষমাণ
                </span>
              </div>
              <h3 className="text-base font-black text-slate-900">ডাক্তার চেম্বার ও কনসালটেন্সি</h3>
              <p className="text-xs text-slate-500 mt-1">রোগীর ভাইটালস, প্রেসক্রিপশন ও অটো-সিঙ্ক ল্যাব অর্ডার।</p>
              <button
                onClick={() => setActiveLinkedApp('hospital')}
                className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <span>ডক্টর চেম্বারে যান</span>
                <ArrowRight size={13} />
              </button>
            </div>

            {/* Card 2: Diagnostic */}
            <div className="hc-pillar-card active-diagnostic">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600">
                  <FlaskConical size={22} />
                </span>
                <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                  {labOrders.length} টি টেস্ট
                </span>
              </div>
              <h3 className="text-base font-black text-slate-900">ডায়াগনস্টিক ল্যাব ও LIMS</h3>
              <p className="text-xs text-slate-500 mt-1">৭৪+ টেস্ট ক্যাটালগ, বারকোড স্যাম্পল ও ভেরিফায়েড রিপোর্ট।</p>
              <button
                onClick={() => setActiveLinkedApp('diagnostic')}
                className="mt-4 w-full py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <span>ল্যাব ওয়ার্কস্টেশনে যান</span>
                <ArrowRight size={13} />
              </button>
            </div>

            {/* Card 3: Pharmacy */}
            <div className="hc-pillar-card active-pharmacy">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600">
                  <Pill size={22} />
                </span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {pharmacyMedicines.length} প্রকারের ড্রাগস
                </span>
              </div>
              <h3 className="text-base font-black text-slate-900">ফার্মেসি ও মেডিসিন POS</h3>
              <p className="text-xs text-slate-500 mt-1">FEFO ফার্স্ট-এক্সপায়ারি, স্ট্রিপ টু পিস বিক্রি ও প্রেসক্রিপশন কিউ।</p>
              <button
                onClick={() => setActiveLinkedApp('pharmacy')}
                className="mt-4 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <span>ফার্মেসি কাউন্টারে যান</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* Auxiliary Compliance & Home Services */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <ShieldCheck className="text-teal-600" size={18} />
              <span>কোয়ালিটি ও কমপ্লায়েন্স সুইট (LQMS & ISO 15189)</span>
            </h3>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveHealthcareTab('home_service')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeHealthcareTab === 'home_service' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                হোম স্যাম্পল কালেকশন
              </button>
              <button
                type="button"
                onClick={() => setActiveHealthcareTab('compliance_suite')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeHealthcareTab === 'compliance_suite' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                DGHS / ISO অডিট ও কমপ্লায়েন্স
              </button>
            </div>

            {activeHealthcareTab === 'home_service' && <HomeServicesReferral />}
            {activeHealthcareTab === 'compliance_suite' && <AdvancedComplianceSuite />}
          </div>
        </div>
      )}
    </div>
  );
}
