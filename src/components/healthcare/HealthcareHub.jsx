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
  ToggleLeft,
  ToggleRight,
  X,
  HelpCircle,
  ChevronDown,
  ChevronUp
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

  const { setActiveTab, lang = 'bn' } = useApp() || {};

  // Admin modal state for activating
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [adminName, setAdminName] = useState('সুপার অ্যাডমিন / চিফ মেডিকেল ডিরেক্টর');
  const [adminPin, setAdminPin] = useState('1234');
  const [adminNotes, setAdminNotes] = useState('হেলথকেয়ার মাস্টার টেমপ্লেট ৩টি লিংকড মডিউল সহ লাইভ অপারেশনের জন্য অনুমোদিত।');
  const [targetModToToggle, setTargetModToToggle] = useState(null); // 'all' | 'hospital' | 'diagnostic' | 'pharmacy'

  // Subtabs within Linked Apps
  const [hospitalSubTab, setHospitalSubTab] = useState('doctor_queue'); // 'doctor_queue' | 'patient_crm'
  const [diagnosticSubTab, setDiagnosticSubTab] = useState('lims_workstation'); // 'lims_workstation' | 'radiology'

  const [showGuide, setShowGuide] = useState(true);

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
    if (!activeModules[modKey]) {
      setTargetModToToggle(modKey);
      setShowApprovalModal(true);
    } else {
      if (window.confirm('আপনি কি এই মডিউলটি সাময়িকভাবে নিষ্ক্রিয় করতে চান?')) {
        toggleHealthcareModule(modKey);
      }
    }
  };

  return (
    <div className="hc-container animate-fade-in" style={{ padding: '0.75rem 1rem 3rem' }}>
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
                  <span>Smart Healthcare 3-in-1 Ecosystem</span>
                </span>
                <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.35)', padding: '3px 8px', fontSize: '0.7rem', fontWeight: '800' }}>
                  ✓ ৩টি মডিউল সম্পূর্ণ লাইভ ও প্রস্তুত
                </span>
              </div>
              <h1 style={{ fontSize: '1.45rem', fontWeight: '900', color: '#ffffff', margin: '2px 0 4px', letterSpacing: '-0.02em' }}>
                🏥 ফার্মেসি, ডায়াগনস্টিক ও ডক্টর চেম্বার (৩-ইন-১)
              </h1>
              <p style={{ fontSize: '0.8rem', color: '#cbd5e1', margin: 0 }}>
                নিচের যেকোনো ট্যাবে ক্লিক করে সরাসরি সংশ্লিষ্ট কাউন্টারে প্রবেশ করুন। প্রেসক্রিপশন ও বিলিং স্বয়ংক্রিয়ভাবে সংযুক্ত।
              </p>
            </div>

            {/* Quick Guide Toggle Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                <span>{showGuide ? 'গাইড লুকান' : '💡 কোথায় কি এবং কীভাবে কাজ করবেন?'}</span>
                {showGuide ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>
          </div>

          {/* 4 PRIMARY WORKSTATION TABS */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: '8px',
              padding: '6px',
              background: 'rgba(15, 23, 42, 0.75)',
              borderRadius: '14px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(10px)'
            }}
          >
            {/* 1. Pharmacy Tab */}
            <button
              type="button"
              onClick={() => setActiveLinkedApp('pharmacy')}
              className="press-scale"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '10px',
                border: activeLinkedApp === 'pharmacy' ? '2px solid #10b981' : '1px solid transparent',
                background: activeLinkedApp === 'pharmacy' ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(5, 150, 105, 0.35))' : 'rgba(255, 255, 255, 0.04)',
                color: activeLinkedApp === 'pharmacy' ? '#ffffff' : '#94a3b8',
                cursor: 'pointer',
                transition: 'all 0.18s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Pill size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '800', color: activeLinkedApp === 'pharmacy' ? '#10b981' : '#ffffff' }}>
                    💊 ১. ফার্মেসি ও ওষুধ
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                    ওষুধ বিক্রয়, স্টক ও এক্সপায়ারি
                  </div>
                </div>
              </div>
              <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.25)', color: '#34d399', fontSize: '0.7rem', fontWeight: '900' }}>
                {pharmacyMedicines.length} ওষুধ
              </span>
            </button>

            {/* 2. Diagnostic Tab */}
            <button
              type="button"
              onClick={() => setActiveLinkedApp('diagnostic')}
              className="press-scale"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '10px',
                border: activeLinkedApp === 'diagnostic' ? '2px solid #0d9488' : '1px solid transparent',
                background: activeLinkedApp === 'diagnostic' ? 'linear-gradient(135deg, rgba(13, 148, 136, 0.25), rgba(15, 118, 110, 0.35))' : 'rgba(255, 255, 255, 0.04)',
                color: activeLinkedApp === 'diagnostic' ? '#ffffff' : '#94a3b8',
                cursor: 'pointer',
                transition: 'all 0.18s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(13, 148, 136, 0.2)', color: '#2dd4bf', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FlaskConical size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '800', color: activeLinkedApp === 'diagnostic' ? '#2dd4bf' : '#ffffff' }}>
                    🔬 ২. ডায়াগনস্টিক ল্যাব
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                    ল্যাব টেস্ট বিলিং ও রিপোর্ট
                  </div>
                </div>
              </div>
              <span className="badge" style={{ background: 'rgba(13, 148, 136, 0.25)', color: '#2dd4bf', fontSize: '0.7rem', fontWeight: '900' }}>
                {diagnosticTests.length}+ টেস্ট
              </span>
            </button>

            {/* 3. Doctor Chamber Tab */}
            <button
              type="button"
              onClick={() => setActiveLinkedApp('hospital')}
              className="press-scale"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '10px',
                border: activeLinkedApp === 'hospital' ? '2px solid #3b82f6' : '1px solid transparent',
                background: activeLinkedApp === 'hospital' ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(37, 99, 235, 0.35))' : 'rgba(255, 255, 255, 0.04)',
                color: activeLinkedApp === 'hospital' ? '#ffffff' : '#94a3b8',
                cursor: 'pointer',
                transition: 'all 0.18s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Stethoscope size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '800', color: activeLinkedApp === 'hospital' ? '#60a5fa' : '#ffffff' }}>
                    🩺 ৩. ডক্টর চেম্বার
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                    সিরিয়াল ও ডিজিটাল প্রেসক্রিপশন
                  </div>
                </div>
              </div>
              <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.25)', color: '#93c5fd', fontSize: '0.7rem', fontWeight: '900' }}>
                {appointments.filter(a => a.appointment_status === 'Waiting').length} সিরিয়াল
              </span>
            </button>

            {/* 4. Hub Overview Tab */}
            <button
              type="button"
              onClick={() => setActiveLinkedApp('hub')}
              className="press-scale"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '10px',
                border: activeLinkedApp === 'hub' ? '2px solid #8b5cf6' : '1px solid transparent',
                background: activeLinkedApp === 'hub' ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.25), rgba(124, 58, 237, 0.35))' : 'rgba(255, 255, 255, 0.04)',
                color: activeLinkedApp === 'hub' ? '#ffffff' : '#94a3b8',
                cursor: 'pointer',
                transition: 'all 0.18s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.2)', color: '#a78bfa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Activity size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '800', color: activeLinkedApp === 'hub' ? '#a78bfa' : '#ffffff' }}>
                    📊 সার্বিক ওভারভিউ
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                    পেশেন্ট রেজিস্ট্রি ও সিঙ্ক
                  </div>
                </div>
              </div>
              <span className="badge" style={{ background: 'rgba(139, 92, 246, 0.25)', color: '#c4b5fd', fontSize: '0.7rem', fontWeight: '900' }}>
                {patients.length} পেশেন্ট
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. EXPANDABLE QUICK START GUIDE BANNER (WHERE IS WHAT?) */}
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
                কোথায় কি আছে এবং কীভাবে কাজ করবেন? (সচিত্র ব্যবহার নির্দেশিকা)
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
            {/* Guide 1: Pharmacy */}
            <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '10px', padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontWeight: '800', fontSize: '0.84rem', marginBottom: '4px' }}>
                <Pill size={15} />
                <span>💊 ১. ফার্মেসির ওষুধ কোথায়?</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.76rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                ওপরের <strong>"১. ফার্মেসি ও ওষুধ"</strong> ট্যাবে ক্লিক করলেই সমস্ত ওষুধের তালিকা, স্টক, জেনেরিক নাম (যেমন Paracetamol) ও ব্র্যান্ড নাম (Napa, Seclo) দেখতে পাবেন। যেকোনো ওষুধ পাতা (Strip) বা খুচরা পিস (Tablet) হিসেবে বিক্রি করা যাবে। নতুন ওষুধ যোগ করতে <strong>"+ নতুন ওষুধ যোগ"</strong> বাটনে ক্লিক করুন।
              </p>
              <button
                type="button"
                onClick={() => setActiveLinkedApp('pharmacy')}
                style={{ marginTop: '8px', padding: '4px 10px', borderRadius: '6px', background: '#10b981', border: 'none', color: '#fff', fontSize: '0.72rem', fontWeight: '800', cursor: 'pointer' }}
              >
                ফার্মেসিতে যান ➔
              </button>
            </div>

            {/* Guide 2: Diagnostic */}
            <div style={{ background: 'rgba(13, 148, 136, 0.08)', border: '1px solid rgba(13, 148, 136, 0.3)', borderRadius: '10px', padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#2dd4bf', fontWeight: '800', fontSize: '0.84rem', marginBottom: '4px' }}>
                <FlaskConical size={15} />
                <span>🔬 ২. ডায়াগনস্টিক ল্যাব কোথায়?</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.76rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                ওপরের <strong>"২. ডায়াগনস্টিক ল্যাব"</strong> ট্যাবে ক্লিক করলেই রক্ত পরীক্ষা (CBC, Sugar, Lipid Profile), ইউরিন, আল্ট্রা ইত্যাদি ৫০+ টেস্টের ক্যাটালগ পাবেন। রোগীর নাম দিয়ে টেস্ট সিলেক্ট করে ইনভয়েস ও বারকোড স্লিপ প্রিন্ট করুন এবং ল্যাব রেজাল্ট লিখে ভেরিফাইড রিপোর্ট তৈরি করুন।
              </p>
              <button
                type="button"
                onClick={() => setActiveLinkedApp('diagnostic')}
                style={{ marginTop: '8px', padding: '4px 10px', borderRadius: '6px', background: '#0d9488', border: 'none', color: '#fff', fontSize: '0.72rem', fontWeight: '800', cursor: 'pointer' }}
              >
                ডায়াগনস্টিকে যান ➔
              </button>
            </div>

            {/* Guide 3: Doctor Chamber */}
            <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '10px', padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#60a5fa', fontWeight: '800', fontSize: '0.84rem', marginBottom: '4px' }}>
                <Stethoscope size={15} />
                <span>🩺 ৩. ডক্টর চেম্বার কোথায়?</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.76rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                ওপরের <strong>"৩. ডক্টর চেম্বার"</strong> ট্যাবে ক্লিক করলেই চিকিৎসকের সিরিয়াল/টোকেন কিউ পাবেন। রোগী চেম্বারে ঢুকলে <strong>"প্রেসক্রিপশন তৈরি করুন"</strong> চাপুন। ব্লাড প্রেশার (BP), ওজন ইত্যাদি লিখে প্রেসক্রিপশনে প্রয়োজনীয় ওষুধ ও ল্যাব টেস্ট সিলেক্ট করে ১ ক্লিকে প্রিন্ট দিন।
              </p>
              <button
                type="button"
                onClick={() => setActiveLinkedApp('hospital')}
                style={{ marginTop: '8px', padding: '4px 10px', borderRadius: '6px', background: '#2563eb', border: 'none', color: '#fff', fontSize: '0.72rem', fontWeight: '800', cursor: 'pointer' }}
              >
                ডক্টর চেম্বারে যান ➔
              </button>
            </div>

            {/* Guide 4: 3-Way Auto Sync */}
            <div style={{ background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '10px', padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#c4b5fd', fontWeight: '800', fontSize: '0.84rem', marginBottom: '4px' }}>
                <Activity size={15} />
                <span>🔄 ৪. ম্যাজিক অটো-সিঙ্ক (৩-ইন-১)</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.76rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                ডাক্তার চেম্বারে প্রেসক্রিপশন সেভ করা মাত্রই ওষুধগুলো সাথে সাথে <strong>ফার্মেসির লাইভ কিউতে</strong> চলে যায় এবং ল্যাব টেস্টগুলো সরাসরি <strong>ডায়াগনস্টিক সেন্টারের পেন্ডিং টেস্ট অর্ডারে</strong> ভেসে ওঠে! রোগীকে প্রেসক্রিপশন হাতে নিয়ে ঘুরতে হবে না।
              </p>
              <button
                type="button"
                onClick={() => setActiveLinkedApp('hub')}
                style={{ marginTop: '8px', padding: '4px 10px', borderRadius: '6px', background: '#7c3aed', border: 'none', color: '#fff', fontSize: '0.72rem', fontWeight: '800', cursor: 'pointer' }}
              >
                ওভারভিউ দেখুন ➔
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. ACTIVE VIEW WORKSTATION RENDERER */}
      {activeLinkedApp === 'pharmacy' && (
        <div style={{ marginTop: '0.5rem' }}>
          <PharmacyFEFOManager />
        </div>
      )}

      {activeLinkedApp === 'hospital' && (
        <div style={{ marginTop: '0.5rem' }}>
          <div className="hc-subtabs-nav" style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setHospitalSubTab('doctor_queue')}
              className={`hc-tab-btn ${hospitalSubTab === 'doctor_queue' ? 'active-blue' : ''}`}
            >
              <Stethoscope size={15} />
              <span>ডক্টর চেম্বার ও ডিজিটাল প্রেসক্রিপশন</span>
              <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: 'inherit', padding: '1px 6px', fontSize: '0.7rem' }}>
                {appointments.filter(a => a.appointment_status === 'Waiting').length}
              </span>
            </button>
            <button
              onClick={() => setHospitalSubTab('patient_crm')}
              className={`hc-tab-btn ${hospitalSubTab === 'patient_crm' ? 'active-blue' : ''}`}
            >
              <UserCheck size={15} />
              <span>পেশেন্ট মাস্টার রেজিস্ট্রি (PT-ID)</span>
              <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: 'inherit', padding: '1px 6px', fontSize: '0.7rem' }}>
                {patients.length}
              </span>
            </button>
          </div>

          {hospitalSubTab === 'doctor_queue' ? <DoctorConsultationQueue /> : <PatientManager />}
        </div>
      )}

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

      {activeLinkedApp === 'hub' && (
        <div>

      {/* 2. Global Unified Patient Search Dock (Visible when active) */}
      {isAnyModuleActive && (
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

            {/* Live Search Results Dropdown */}
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

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {activeModules.hospital && (
                          <button
                            onClick={() => {
                              setGlobalSelectedPatientId(p.patient_id);
                              setShowSearchResults(false);
                              setActiveLinkedApp('hospital');
                            }}
                            className="btn btn-secondary press-scale"
                            style={{ padding: '4px 8px', fontSize: '0.72rem', color: '#2563eb', borderColor: 'rgba(37, 99, 235, 0.4)' }}
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
                            className="btn btn-secondary press-scale"
                            style={{ padding: '4px 8px', fontSize: '0.72rem', color: '#0d9488', borderColor: 'rgba(13, 148, 136, 0.4)' }}
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
                            className="btn btn-secondary press-scale"
                            style={{ padding: '4px 8px', fontSize: '0.72rem', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.4)' }}
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={18} style={{ color: '#0d9488' }} />
            <span>টেমপ্লেটের ৩টি প্রধান ক্লিনিক্যাল ক্যাটাগরি ও ৩টি লিংকড অ্যাপ</span>
          </h2>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            প্রয়োজন অনুযায়ী প্রতিটি ক্যাটাগরি স্বাধীনভাবে চালু/বন্ধ করুন অথবা সংশ্লিষ্ট ওয়ার্কস্টেশনে প্রবেশ করুন
          </p>
        </div>

        <div className="hc-grid-3">
          {/* ========================================================
              CATEGORY 1: HOSPITAL & CLINIC
             ======================================================== */}
          <div className={`hc-pillar-card ${activeModules.hospital ? 'active-hospital' : ''}`}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Stethoscope size={24} />
                </div>
                <button
                  type="button"
                  onClick={() => handleModuleToggleClick('hospital')}
                  className="press-scale"
                  style={{
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: '800',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    background: activeModules.hospital ? '#2563eb' : 'rgba(255,255,255,0.05)',
                    color: activeModules.hospital ? '#ffffff' : 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {activeModules.hospital ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                  <span>{activeModules.hospital ? 'সক্রিয় (Active)' : 'নিষ্ক্রিয় (Inactive)'}</span>
                </button>
              </div>

              <div>
                <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', fontSize: '0.68rem', fontWeight: '800' }}>
                  ক্যাটাগরি ০১
                </span>
                <h3 style={{ margin: '6px 0 2px', fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  হসপিটাল ও ক্লিনিক ম্যানেজমেন্ট
                </h3>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  লিংকড অ্যাপ: <strong>Doctor Chamber & Consultation Portal</strong>
                </div>
              </div>

              <div style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--border-color)', margin: '12px 0', fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)' }}>
                  <Check size={14} style={{ color: '#2563eb' }} />
                  <span>টোকেন কিউ ও লাইভ সিরিয়াল কলিং</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)' }}>
                  <Check size={14} style={{ color: '#2563eb' }} />
                  <span>ডিজিটাল প্রেসক্রিপশন ও ড্রাগ সাজেশন</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)' }}>
                  <Check size={14} style={{ color: '#2563eb' }} />
                  <span>রোগীর ভাইটালস ও মেডিকেল হিস্ট্রি</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#2563eb', fontWeight: '700' }}>
                  <span>🔗</span>
                  <span>এক ক্লিকে ল্যাব টেস্ট ও ফার্মেসি সিঙ্ক</span>
                </div>
              </div>

              {activeModules.hospital && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                  <div style={{ background: 'var(--bg-secondary)', padding: '8px 10px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: '700' }}>অপেক্ষমাণ রোগী</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#2563eb' }}>
                      {appointments.filter(a => a.appointment_status === 'Waiting').length} জন
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-secondary)', padding: '8px 10px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: '700' }}>রোগী রেজিস্ট্রি</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '900', color: 'var(--text-main)' }}>
                      {patients.length} জন
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
              {activeModules.hospital ? (
                <button
                  type="button"
                  onClick={() => setActiveLinkedApp('hospital')}
                  className="btn btn-primary press-scale"
                  style={{ width: '100%', background: '#2563eb', borderColor: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '8px' }}
                >
                  <Stethoscope size={15} />
                  <span>হসপিটাল অ্যাপে প্রবেশ করুন</span>
                  <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleModuleToggleClick('hospital')}
                  className="btn btn-secondary press-scale"
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px' }}
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
          <div className={`hc-pillar-card ${activeModules.diagnostic ? 'active-diagnostic' : ''}`}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(13, 148, 136, 0.15)', color: '#0d9488', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FlaskConical size={24} />
                </div>
                <button
                  type="button"
                  onClick={() => handleModuleToggleClick('diagnostic')}
                  className="press-scale"
                  style={{
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: '800',
                    border: '1px solid rgba(13, 148, 136, 0.4)',
                    background: activeModules.diagnostic ? '#0d9488' : 'rgba(255,255,255,0.05)',
                    color: activeModules.diagnostic ? '#ffffff' : 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {activeModules.diagnostic ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                  <span>{activeModules.diagnostic ? 'সক্রিয় (Active)' : 'নিষ্ক্রিয় (Inactive)'}</span>
                </button>
              </div>

              <div>
                <span className="badge" style={{ background: 'rgba(13, 148, 136, 0.15)', color: '#0d9488', fontSize: '0.68rem', fontWeight: '800' }}>
                  ক্যাটাগরি ০২
                </span>
                <h3 style={{ margin: '6px 0 2px', fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  ডায়াগনস্টিক সেন্টার ও ল্যাবরেটরি
                </h3>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  লিংকড অ্যাপ: <strong>Diagnostic Lab Workstation & Billing</strong>
                </div>
              </div>

              <div style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--border-color)', margin: '12px 0', fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)' }}>
                  <Check size={14} style={{ color: '#0d9488' }} />
                  <span>৫০টি ক্যাটাগরি ও ৭৮টি টেস্ট বান্ডেল</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)' }}>
                  <Check size={14} style={{ color: '#0d9488' }} />
                  <span>বারকোড স্পেসিমেন ও স্যাম্পল ট্র্যাকিং</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)' }}>
                  <Check size={14} style={{ color: '#0d9488' }} />
                  <span>রেজাল্ট এন্ট্রি ও ভেরিফায়েড রিপোর্ট</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0d9488', fontWeight: '700' }}>
                  <span>🔗</span>
                  <span>ডাক্তারের টেস্ট অর্ডার সরাসরি রিসিভ</span>
                </div>
              </div>

              {activeModules.diagnostic && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                  <div style={{ background: 'var(--bg-secondary)', padding: '8px 10px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: '700' }}>পেন্ডিং টেস্ট অর্ডার</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#0d9488' }}>
                      {labOrders.filter(l => l.order_status === 'Sample Pending' || l.order_status === 'Processing').length} টি
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-secondary)', padding: '8px 10px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: '700' }}>টেস্ট ক্যাটালগ</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '900', color: 'var(--text-main)' }}>
                      {diagnosticTests.length}+ টি
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
              {activeModules.diagnostic ? (
                <button
                  type="button"
                  onClick={() => setActiveLinkedApp('diagnostic')}
                  className="btn btn-primary press-scale"
                  style={{ width: '100%', background: '#0d9488', borderColor: '#0d9488', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '8px' }}
                >
                  <FlaskConical size={15} />
                  <span>ল্যাব ওয়ার্কস্টেশনে প্রবেশ করুন</span>
                  <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleModuleToggleClick('diagnostic')}
                  className="btn btn-secondary press-scale"
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px' }}
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
          <div className={`hc-pillar-card ${activeModules.pharmacy ? 'active-pharmacy' : ''}`}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Pill size={24} />
                </div>
                <button
                  type="button"
                  onClick={() => handleModuleToggleClick('pharmacy')}
                  className="press-scale"
                  style={{
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: '800',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    background: activeModules.pharmacy ? '#10b981' : 'rgba(255,255,255,0.05)',
                    color: activeModules.pharmacy ? '#ffffff' : 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {activeModules.pharmacy ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                  <span>{activeModules.pharmacy ? 'সক্রিয় (Active)' : 'নিষ্ক্রিয় (Inactive)'}</span>
                </button>
              </div>

              <div>
                <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontSize: '0.68rem', fontWeight: '800' }}>
                  ক্যাটাগরি ০৩
                </span>
                <h3 style={{ margin: '6px 0 2px', fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  ফার্মেসি ও মেডিসিন ডিসপেনসারি
                </h3>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  লিংকড অ্যাপ: <strong>Pharmacy POS & FEFO Batch Dispenser</strong>
                </div>
              </div>

              <div style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--border-color)', margin: '12px 0', fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)' }}>
                  <Check size={14} style={{ color: '#10b981' }} />
                  <span>প্রেসক্রিপশন কিউ থেকে সরাসরি সেলস সিঙ্ক</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)' }}>
                  <Check size={14} style={{ color: '#10b981' }} />
                  <span>FEFO (ফার্স্ট-এক্সপায়ারি) অটো ব্যাচ চয়ন</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)' }}>
                  <Check size={14} style={{ color: '#10b981' }} />
                  <span>বক্স টু স্ট্রিপ/ট্যাবলেট অটো হিসাব</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontWeight: '700' }}>
                  <span>🔗</span>
                  <span>মেয়াদোত্তীর্ণ ব্যাচ অটো-লক সুরক্ষা</span>
                </div>
              </div>

              {activeModules.pharmacy && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                  <div style={{ background: 'var(--bg-secondary)', padding: '8px 10px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: '700' }}>ডিসপেন্সের কিউ</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#10b981' }}>
                      {prescriptions.filter(p => p.dispensing_status === 'Sent to Pharmacy').length} টি
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-secondary)', padding: '8px 10px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: '700' }}>ওষুধ আইটেম</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '900', color: 'var(--text-main)' }}>
                      {pharmacyMedicines.length} টি
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
              {activeModules.pharmacy ? (
                <button
                  type="button"
                  onClick={() => setActiveLinkedApp('pharmacy')}
                  className="btn btn-primary press-scale"
                  style={{ width: '100%', background: '#10b981', borderColor: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '8px' }}
                >
                  <Pill size={15} />
                  <span>ফার্মেসি টার্মিনালে প্রবেশ করুন</span>
                  <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleModuleToggleClick('pharmacy')}
                  className="btn btn-secondary press-scale"
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px' }}
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
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem', borderRadius: '18px' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={18} style={{ color: '#0d9488' }} />
          <span>৩টি লিংকড অ্যাপ্লিকেশনের সার্বক্ষণিক ইন্টার-কানেকশন ম্যাট্রিক্স (Workflow Sync)</span>
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
          <div style={{ background: 'var(--bg-secondary)', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#2563eb', fontWeight: '800', fontSize: '0.8rem', marginBottom: '4px' }}>
              <Stethoscope size={15} />
              <span>ডক্টর চেম্বার ➔ ডায়াগনস্টিক ল্যাব</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              ডাক্তার প্রেসক্রিপশনে কোনো প্যাথলজি বা রেডিওলজি টেস্ট অ্যাড করলে রোগীর ফাইল থেকে সরাসরি ল্যাব অর্ডারে চলে যায়। ল্যাব কর্মী কেবল বারকোড প্রিন্ট করে কাজ শুরু করতে পারেন।
            </p>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontWeight: '800', fontSize: '0.8rem', marginBottom: '4px' }}>
              <Pill size={15} />
              <span>ডক্টর চেম্বার ➔ ফার্মেসি পিওএস</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              ডাক্তার প্রেসক্রিপশন সেভ করা মাত্র ফার্মেসি কাউন্টারের লাইভ কিউতে রোগীর প্রেসক্রিপশন ভেসে ওঠে। ফার্মাসিস্ট দ্রুত FEFO ব্যাচ চয়ন করে বিল তৈরি করতে পারেন।
            </p>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0d9488', fontWeight: '800', fontSize: '0.8rem', marginBottom: '4px' }}>
              <FlaskConical size={15} />
              <span>ডায়াগনস্টিক ল্যাব ➔ ডক্টর হিস্ট্রি</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              প্যাথলজিস্ট কর্তৃক ল্যাব রিপোর্ট ভেরিফাই ও সাইন হওয়ার সাথে সাথে তা সেন্ট্রাল পেশেন্ট আইডি (<strong style={{ color: '#0d9488', fontFamily: 'var(--font-mono)' }}>PT-ID</strong>)-তে যুক্ত হয়ে ডাক্তারের ডিসপ্লেতে দৃশ্যমান হয়।
            </p>
          </div>
        </div>
      </div>

      {/* 5. Auxiliary Suite & Analytics */}
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem', borderRadius: '18px' }}>
        <h3 style={{ margin: '0 0 10px', fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={18} style={{ color: '#0d9488' }} />
          <span>সহায়ক সেবা ও কমপ্লায়েন্স মডিউল (Auxiliary Clinical Services)</span>
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
          <button
            type="button"
            onClick={() => setActiveHealthcareTab('dashboard')}
            className={`hc-tab-btn ${activeHealthcareTab === 'dashboard' ? 'active-dark' : ''}`}
            style={{ border: '1px solid var(--border-color)' }}
          >
            <Activity size={14} />
            <span>হেলথকেয়ার অ্যানালিটিক্স</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveHealthcareTab('home_service')}
            className={`hc-tab-btn ${activeHealthcareTab === 'home_service' ? 'active-dark' : ''}`}
            style={{ border: '1px solid var(--border-color)' }}
          >
            <Layers size={14} />
            <span>হোম স্যাম্পল কালেকশন ও রেফারেল</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveHealthcareTab('compliance_suite')}
            className={`hc-tab-btn ${activeHealthcareTab === 'compliance_suite' ? 'active-dark' : ''}`}
            style={{ border: '1px solid var(--border-color)' }}
          >
            <ShieldCheck size={14} />
            <span>সেকশন ২৪: কোয়ালিটি ও কমপ্লায়েন্স সুইট (LQMS & ISO)</span>
          </button>
        </div>

        <div>
          {activeHealthcareTab === 'dashboard' && <HealthcareDashboard />}
          {activeHealthcareTab === 'home_service' && <HomeServicesReferral />}
          {activeHealthcareTab === 'compliance_suite' && <AdvancedComplianceSuite />}
        </div>
      </div>
    </div>
  )}

      {/* 6. Admin Approval Security Modal (Clean Glassmorphic Modal) */}
      {showApprovalModal && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content glass-card" style={{ maxWidth: '520px', width: '95%', padding: '1.5rem', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)' }}>
                    অ্যাডমিন মডিউল অনুমোদন
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
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
                type="button"
                onClick={() => setShowApprovalModal(false)}
                className="btn-icon"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAdminApprovalConfirm} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '4px' }}>
                  অনুমোদনকারী অ্যাডমিনের নাম:
                </label>
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', fontSize: '0.85rem' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '4px' }}>
                  নিরাপত্তা পিন কোড (Security PIN):
                </label>
                <input
                  type="password"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  placeholder="ডিফল্ট: 1234"
                  className="input-field"
                  style={{ width: '100%', fontSize: '0.85rem', fontFamily: 'var(--font-mono)', letterSpacing: '4px' }}
                  required
                />
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                  * ডেমো পিন: <strong style={{ color: 'var(--text-main)' }}>1234</strong>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '4px' }}>
                  অনুমোদন মন্তব্য ও লাইসেন্স নোট:
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={2}
                  className="input-field"
                  style={{ width: '100%', fontSize: '0.82rem', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowApprovalModal(false)}
                  className="btn btn-secondary"
                  style={{ padding: '8px 14px', fontSize: '0.82rem' }}
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    background: '#10b981',
                    borderColor: '#10b981',
                    padding: '8px 18px',
                    fontSize: '0.82rem',
                    fontWeight: '800',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
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
