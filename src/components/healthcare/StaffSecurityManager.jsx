import React, { useState, useMemo } from 'react';
import { useHealthcare } from '../../context/HealthcareContext';
import {
  ShieldCheck,
  Users,
  Lock,
  Unlock,
  Key,
  History,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  Plus,
  ArrowRight,
  Stethoscope,
  FlaskConical,
  Pill,
  CreditCard,
  Building,
  Calendar,
  Truck,
  RotateCcw,
  Sparkles,
  ClipboardList,
  Sliders,
  DollarSign,
  Percent,
  Check,
  Ban,
  FileSpreadsheet,
  Download,
  Share2,
  Database,
  ExternalLink,
  Milestone,
  CheckSquare,
  Clock,
  Laptop
} from 'lucide-react';

export const StaffSecurityManager = () => {
  const {
    branches = [],
    activeBranchId = 'dhanmondi',
    doctors = [],
    patients = [],
    appointments = [],
    labOrders = [],
    pharmacyMedicines = []
  } = useHealthcare();

  // Subtabs:
  // 'workflows' | 'rbac' | 'cash_closing' | 'audit_trail' | 'fhir_interop' | 'release_roadmap'
  const [activeSubTab, setActiveSubTab] = useState('workflows');

  // Active workflow selector: 'patient_to_test' | 'rx_pharmacy' | 'stock_transfer' | 'cash_closing'
  const [selectedWorkflow, setSelectedWorkflow] = useState('patient_to_test');

  // Maker-Checker Separation of Duties Toggle
  const [makerCheckerEnforced, setMakerCheckerEnforced] = useState(true);

  // 12 Staff Roles Definition
  const [rolesList] = useState([
    {
      id: 'owner',
      title: 'প্রতিষ্ঠান মালিক (Institution Owner)',
      scope: 'অনুমতি অনুযায়ী সব শাখা',
      accessibleModules: 'সব মডিউল, সারাংশ, ড্যাশবোর্ড, হিসাব, রিপোর্ট ও সেটিংস',
      actionLevel: 'পূর্ণ নিয়ন্ত্রণ ও পর্যবেক্ষণ',
      discountLimit: 50000,
      refundLimit: 50000,
      canDeleteLogs: false
    },
    {
      id: 'admin',
      title: 'প্রতিষ্ঠান অ্যাডমিন (Institution Admin)',
      scope: 'সব শাখা ও কনফিগারেশন',
      accessibleModules: 'শাখা, কর্মী, কনফিগারেশন, রোলস ও সিস্টেম অনুমতি পরিচালনা',
      actionLevel: 'সিস্টেম অ্যাডমিনিস্ট্রেশন ও কনফিগারেশন',
      discountLimit: 20000,
      refundLimit: 20000,
      canDeleteLogs: false
    },
    {
      id: 'branch_manager',
      title: 'শাখা ম্যানেজার (Branch Manager)',
      scope: 'নির্দিষ্ট শাখা ও অনুমোদিত অতিরিক্ত শাখা',
      accessibleModules: 'শাখার কর্মী, দৈনিক কাজ, স্টক অনুমোদন, বিলিং ও রিপোর্ট',
      actionLevel: 'শাখাভিত্তিক তৈরি, সম্পাদনা ও অনুমোদন',
      discountLimit: 5000,
      refundLimit: 5000,
      canDeleteLogs: false
    },
    {
      id: 'receptionist',
      title: 'রিসেপশনিস্ট (Receptionist)',
      scope: 'নির্দিষ্ট শাখা',
      accessibleModules: 'রোগী নিবন্ধন, সিরিয়াল, অ্যাপয়েন্টমেন্ট ও সাধারণ তথ্য',
      actionLevel: 'নিবন্ধন ও বুকিং তৈরি/সম্পাদনা',
      discountLimit: 0,
      refundLimit: 0,
      canDeleteLogs: false
    },
    {
      id: 'doctor',
      title: 'ডাক্তার (Doctor)',
      scope: 'অনুমোদিত শাখা ও নিজস্ব চেম্বার',
      accessibleModules: 'নিজের রোগী, ভিজিট হিস্ট্রি, ক্লিনিক্যাল নোট, প্রেসক্রিপশন ও টেস্ট অর্ডার',
      actionLevel: 'ক্লিনিক্যাল ডকুমেন্টেশন ও অর্ডার তৈরি',
      discountLimit: 1000,
      refundLimit: 0,
      canDeleteLogs: false
    },
    {
      id: 'lab_tech',
      title: 'ল্যাব টেকনিশিয়ান (Lab Technician)',
      scope: 'অনুমতিপ্রাপ্ত ল্যাব শাখা',
      accessibleModules: 'নমুনা সংগ্রহ, বারকোড ট্র্যাকিং ও টেস্ট ফলাফল ইনপুট',
      actionLevel: 'ফলাফল প্রবেশ (Maker)',
      discountLimit: 0,
      refundLimit: 0,
      canDeleteLogs: false
    },
    {
      id: 'report_verifier',
      title: 'রিপোর্ট ভেরিফায়ার (Report Verifier / Pathologist)',
      scope: 'অনুমতিপ্রাপ্ত ল্যাব শাখা',
      accessibleModules: 'ল্যাব ফলাফল পর্যালোচনা, সংশোধন ও চূড়ান্ত অনুমোদন',
      actionLevel: 'রিপোর্ট যাচাই ও অনুমোদন (Checker)',
      discountLimit: 0,
      refundLimit: 0,
      canDeleteLogs: false
    },
    {
      id: 'pharmacist',
      title: 'ফার্মাসিস্ট (A-Category Pharmacist)',
      scope: 'অনুমতিপ্রাপ্ত ফার্মেসি শাখা',
      accessibleModules: 'ওষুধ ক্যাটালগ, প্রেসক্রিপশন বিক্রি, FEFO ব্যাচ, স্টক ও ট্রান্সফার',
      actionLevel: 'ডিসপেন্সিং, স্টক সমন্বয় ও ট্রান্সফার অনুমোদন',
      discountLimit: 1000,
      refundLimit: 2000,
      canDeleteLogs: false
    },
    {
      id: 'pharmacy_seller',
      title: 'ফার্মেসি বিক্রেতা (Pharmacy Seller)',
      scope: 'নির্দিষ্ট কাউন্টার',
      accessibleModules: 'কাউন্টার বিক্রি ও রসিদ তৈরি',
      actionLevel: 'সীমিত বিক্রি ও বিল তৈরি',
      discountLimit: 200,
      refundLimit: 0,
      canDeleteLogs: false
    },
    {
      id: 'cashier',
      title: 'ক্যাশিয়ার (Billing Cashier)',
      scope: 'নির্দিষ্ট শাখা ও কাউন্টার',
      accessibleModules: 'বিল তৈরি, পেমেন্ট গ্রহণ, আংশিক কিস্তি ও দৈনিক ক্যাশ ক্লোজিং',
      actionLevel: 'আদায় ও ক্লোজিং সাবমিশন',
      discountLimit: 300,
      refundLimit: 500,
      canDeleteLogs: false
    },
    {
      id: 'accountant',
      title: 'হিসাবরক্ষক (Accountant)',
      scope: 'অনুমোদিত শাখাসমূহ',
      accessibleModules: 'আয়-ব্যয়, পেমেন্ট খতিয়ান, সরবরাহকারী দেনা ও আর্থিক রিপোর্ট',
      actionLevel: 'হিসাব নিরীক্ষা ও ভাউচার সমন্বয়',
      discountLimit: 0,
      refundLimit: 0,
      canDeleteLogs: false
    },
    {
      id: 'auditor',
      title: 'অডিটর / ভিউয়ার (Auditor / Viewer)',
      scope: 'অনুমতিপ্রাপ্ত শাখা',
      accessibleModules: 'অনুমতিপ্রাপ্ত তথ্য শুধু দেখা ও অডিট রিপোর্ট ডাউনলোড',
      actionLevel: 'শুধুমাত্র রিড-অনলি (Read Only)',
      discountLimit: 0,
      refundLimit: 0,
      canDeleteLogs: false
    }
  ]);

  // Employee Database (With 4 Mandatory Specification Criteria)
  const [employees, setEmployees] = useState([
    {
      id: 'EMP-001',
      name: 'মো: সাজ্জাদ হোসেন',
      role: 'মালিক / চিফ অ্যাডমিন',
      roleId: 'owner',
      assignedBranch: 'সব শাখা (সকল শাখার অনুমতিপ্রাপ্ত)',
      accessibleModules: ['সব মডিউল', 'হিসাব', 'রিপোর্ট', 'সেটিংস'],
      permissions: ['তৈরি', 'সম্পাদনা', 'অনুমোদন', 'সিস্টেম কনফিগারেশন'],
      financialLimits: { maxDiscount: 50000, maxRefund: 50000, maxCancel: 100000 },
      status: 'Active',
      makerCheckerSeparation: true
    },
    {
      id: 'EMP-002',
      name: 'ডা: রফিকুল ইসলাম',
      role: 'ডাক্তার (কনসালটেন্ট মেডিসিন)',
      roleId: 'doctor',
      assignedBranch: 'ধানমন্ডি মেইন ব্রাঞ্চ',
      accessibleModules: ['ডাক্তার চেম্বার', 'প্রেসক্রিপশন', 'ল্যাব অর্ডার', 'রোগী প্রোফাইল'],
      permissions: ['ভিজিট নোট', 'প্রেসক্রিপশন প্রদান', 'টেস্ট অর্ডার তৈরি'],
      financialLimits: { maxDiscount: 1000, maxRefund: 0, maxCancel: 0 },
      status: 'Active',
      makerCheckerSeparation: false
    },
    {
      id: 'EMP-003',
      name: 'ডা: তানভীর আহমেদ (বায়োকেমিস্ট)',
      role: 'রিপোর্ট ভেরিফায়ার (ল্যাব চিফ)',
      roleId: 'report_verifier',
      assignedBranch: 'ধানমন্ডি মেইন ব্রাঞ্চ',
      accessibleModules: ['ল্যাব ওয়ার্কলিস্ট', 'রিপোর্ট যাচাই', 'টেস্ট ক্যাটালগ'],
      permissions: ['রিপোর্ট অনুমোদন', 'ক্রিটিক্যাল অ্যালার্ট যাচাই', 'সংশোধন অনুমোদন'],
      financialLimits: { maxDiscount: 0, maxRefund: 0, maxCancel: 0 },
      status: 'Active',
      makerCheckerSeparation: true
    },
    {
      id: 'EMP-004',
      name: 'ফার্মাসিস্ট কামরুল হাসান',
      role: 'ফার্মাসিস্ট (A-Category)',
      roleId: 'pharmacist',
      assignedBranch: 'ধানমন্ডি মেইন ব্রাঞ্চ',
      accessibleModules: ['ফার্মেসি POS', 'ওষুধ ক্যাটালগ', 'FEFO ব্যাচ', 'স্টক ট্রান্সফার'],
      permissions: ['ওষুধ ডিসপেন্স', 'বিক্রয় ফেরত অনুমোদন', 'স্টক সমন্বয়'],
      financialLimits: { maxDiscount: 1000, maxRefund: 2000, maxCancel: 5000 },
      status: 'Active',
      makerCheckerSeparation: false
    },
    {
      id: 'EMP-005',
      name: 'মো: আবুল কালাম',
      role: 'ক্যাশিয়ার (প্রধান ক্যাশিয়ার)',
      roleId: 'cashier',
      assignedBranch: 'ধানমন্ডি মেইন ব্রাঞ্চ',
      accessibleModules: ['বিল ও পেমেন্ট', 'বকেয়া আদায়', 'দৈনিক ক্যাশ ক্লোজিং'],
      permissions: ['বিল তৈরি', 'পেমেন্ট গ্রহণ', 'ক্লোজিং সাবমিট'],
      financialLimits: { maxDiscount: 300, maxRefund: 500, maxCancel: 2000 },
      status: 'Active',
      makerCheckerSeparation: false
    },
    {
      id: 'EMP-006',
      name: 'আরিফুল ইসলাম',
      role: 'শাখা ম্যানেজার',
      roleId: 'branch_manager',
      assignedBranch: 'মিরপুর শাখা',
      accessibleModules: ['মিরপুর শাখা ড্যাশবোর্ড', 'স্টক ট্রান্সফার রিসিভ', 'কর্মী পরিচালনা', 'রিপোর্ট'],
      permissions: ['ট্রান্সফার অনুমোদন', 'ক্যাশ ক্লোজিং অনুমোদন', 'রিপোর্ট দর্শন'],
      financialLimits: { maxDiscount: 5000, maxRefund: 5000, maxCancel: 10000 },
      status: 'Active',
      makerCheckerSeparation: true
    }
  ]);

  // Employee Modal State
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  const [newEmpForm, setNewEmpForm] = useState({
    name: '',
    roleId: 'receptionist',
    assignedBranch: 'ধানমন্ডি মেইন ব্রাঞ্চ',
    maxDiscount: 200,
    maxRefund: 0,
    maxCancel: 0
  });

  // Daily Cash Closing Wizard State (7 Steps)
  const [cashClosingForm, setCashClosingForm] = useState({
    branch: 'ধানমন্ডি মেইন ব্রাঞ্চ',
    shift: 'শিফট-১ (সকাল ৮টা - বিকাল ৪টা)',
    cashierName: 'মো: আবুল কালাম (প্রধান ক্যাশিয়ার)',
    systemCash: 109200,
    physicalCash: 109200,
    systemDigital: 147000,
    systemDue: 1300,
    shortageReason: '',
    supervisorNote: 'সকল লেনদেন ও ভাউচার ক্রস-চেক সম্পন্ন',
    status: 'অনুমোদিত ও ক্লোজড (Manager Verified)'
  });

  const cashDiscrepancy = (Number(cashClosingForm.physicalCash) || 0) - (Number(cashClosingForm.systemCash) || 0);

  // Immutable Audit Trail Logs (With 11 Transaction Identity Attributes)
  const [auditLogs] = useState([
    {
      logId: 'AUD-2026-9001',
      orgId: 'ORG-HK360-01',
      branchId: 'BR-DHAN-01',
      branchName: 'ধানমন্ডি মেইন ব্রাঞ্চ',
      recordNo: 'BILL-2026-1001',
      patientId: 'UHID-2026-001',
      createdBy: 'EMP-005 (আবুল কালাম)',
      approvedBy: 'EMP-006 (ম্যানেজার আরিফ)',
      sourceModule: 'বিল ও পেমেন্ট (Billing)',
      actionType: 'পেমেন্ট গ্রহণ ও রসিদ তৈরি',
      oldValue: 'বকেয়া: ৳১,২০০',
      newValue: 'পরিশোধিত: ৳১,২০০ (নগদ)',
      timestamp: '2026-10-10 11:30:15 AM',
      deviceInfo: 'POS-Terminal-01 (IP: 192.168.1.15)',
      reason: 'নিয়মিত কনসালটেন্সি ও ল্যাব বিল নিষ্পত্তি'
    },
    {
      logId: 'AUD-2026-9002',
      orgId: 'ORG-HK360-01',
      branchId: 'BR-DHAN-01',
      branchName: 'ধানমন্ডি মেইন ব্রাঞ্চ',
      recordNo: 'CONTRA-2026-801',
      patientId: 'UHID-2026-015',
      createdBy: 'EMP-005 (ক্যাশিয়ার)',
      approvedBy: 'EMP-001 (মালিক সাজ্জাদ হোসেন - PIN 1234)',
      sourceModule: 'রিফান্ড ও সমন্বয় (Refund Ledger)',
      actionType: 'বিপরীত সমন্বয় এন্ট্রি (Contra-Entry)',
      oldValue: 'মূল বিল: ৳১,৪৫০',
      newValue: 'রিফান্ড ক্রেডিট: -৳১,৪৫০ (নগদ ফেরত)',
      timestamp: '2026-10-10 10:45:22 AM',
      deviceInfo: 'Counter-02 (IP: 192.168.1.18)',
      reason: 'রোগী অন্য হাসপাতালে ট্রান্সফার হওয়ায় টেস্ট বাতিল'
    },
    {
      logId: 'AUD-2026-9003',
      orgId: 'ORG-HK360-01',
      branchId: 'BR-MIRP-02',
      branchName: 'মিরপুর শাখা',
      recordNo: 'TRF-2026-101',
      patientId: 'প্রযোজ্য নয়',
      createdBy: 'EMP-004 (ফার্মাসিস্ট কামরুল)',
      approvedBy: 'EMP-006 (শাখা ম্যানেজার)',
      sourceModule: 'শাখা স্টক ট্রান্সফার (Stock Transfer)',
      actionType: 'স্টক রিসিভিং ও দ্বিপাক্ষিক লেজার আপডেট',
      oldValue: 'ধানমন্ডি স্টক: ৮২০ | মিরপুর স্টক: ০',
      newValue: 'ধানমন্ডি স্টক: ৩২০ | মিরপুর স্টক: ৫০০',
      timestamp: '2026-10-10 01:15:40 PM',
      deviceInfo: 'Pharm-PC-01 (IP: 192.168.2.10)',
      reason: 'জরুরি গ্যাস্ট্রিক মেডিসিন স্টক পূরণ চালান'
    },
    {
      logId: 'AUD-2026-9004',
      orgId: 'ORG-HK360-01',
      branchId: 'BR-DHAN-01',
      branchName: 'ধানমন্ডি মেইন ব্রাঞ্চ',
      recordNo: 'REP-2026-8841',
      patientId: 'UHID-2026-003',
      createdBy: 'EMP-007 (টেকনিশিয়ান সুমন)',
      approvedBy: 'EMP-003 (বায়োকেমিস্ট ডা: তানভীর - Maker-Checker)',
      sourceModule: 'ডায়াগনস্টিক ল্যাব (LIMS Verification)',
      actionType: 'ল্যাব রিপোর্ট অনুমোদন ও ডিজিটাল সাইন',
      oldValue: 'স্ট্যাটাস: অপেক্ষমাণ (Draft Result)',
      newValue: 'স্ট্যাটাস: অনুমোদিত ও ডেলিভার্ড (v1.0 Verified)',
      timestamp: '2026-10-10 02:20:10 PM',
      deviceInfo: 'Lab-Workstation-03 (IP: 192.168.1.44)',
      reason: 'মাননিয়ন্ত্রণ রেজাল্ট সীমা যাচাইকরণ সম্পন্ন'
    }
  ]);

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Master Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30 flex items-center gap-1.5">
                <ShieldCheck size={14} />
                <span>মডিউল ১৪ ও ১৫: ভূমিকাভিত্তিক কর্মী অনুমতি, কাজের ধাপ ও অডিট ট্রেইল</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-black border border-emerald-500/30">
                অপরিবর্তনীয় অডিট লগ (Immutable Ledger)
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight">
              সম্পূর্ণ কাজের ধাপ, কর্মী অনুমতি (RBAC) ও নিরাপত্তা অডিট
            </h2>
            <p className="text-sm text-indigo-100/80 mt-1 max-w-3xl">
              রোগী থেকে ডাক্তার ও টেস্টের ১৩ ধাপ • ফার্মেসি বিক্রির ৯ ধাপ • স্টক ট্রান্সফারের ৮ ধাপ • দৈনিক ক্যাশ ক্লোজিং • ১২টি ভূমিকাভিত্তিক অনুমতি ও ৪টি মানদণ্ড।
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveSubTab('workflows')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === 'workflows' ? 'bg-white text-slate-900 shadow-md' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              সম্পূর্ণ কাজের ধাপ
            </button>
            <button
              onClick={() => setActiveSubTab('rbac')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === 'rbac' ? 'bg-white text-slate-900 shadow-md' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              কর্মী অনুমতি (RBAC)
            </button>
            <button
              onClick={() => setActiveSubTab('cash_closing')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === 'cash_closing' ? 'bg-white text-slate-900 shadow-md' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              দৈনিক ক্যাশ ক্লোজিং
            </button>
            <button
              onClick={() => setActiveSubTab('audit_trail')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === 'audit_trail' ? 'bg-white text-slate-900 shadow-md' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              অডিট লগ
            </button>
            <button
              onClick={() => setActiveSubTab('fhir_interop')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === 'fhir_interop' ? 'bg-white text-slate-900 shadow-md' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              HL7 FHIR বহিঃসংযোগ
            </button>
            <button
              onClick={() => setActiveSubTab('release_roadmap')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === 'release_roadmap' ? 'bg-white text-slate-900 shadow-md' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              রিলিজ রোডম্যাপ
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1. END-TO-END WORKFLOW TRACERS (সম্পূর্ণ কাজের ধাপ) */}
      {/* ============================================================== */}
      {activeSubTab === 'workflows' && (
        <div className="space-y-4">
          <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setSelectedWorkflow('patient_to_test')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  selectedWorkflow === 'patient_to_test' ? 'bg-teal-700 text-white shadow-md' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Stethoscope size={15} />
                <span>১. রোগী থেকে ডাক্তার ও টেস্ট (১৩ ধাপ)</span>
              </button>
              <button
                onClick={() => setSelectedWorkflow('rx_pharmacy')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  selectedWorkflow === 'rx_pharmacy' ? 'bg-emerald-700 text-white shadow-md' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Pill size={15} />
                <span>২. প্রেসক্রিপশন থেকে ফার্মেসি বিক্রি (৯ ধাপ)</span>
              </button>
              <button
                onClick={() => setSelectedWorkflow('stock_transfer')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  selectedWorkflow === 'stock_transfer' ? 'bg-blue-700 text-white shadow-md' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Truck size={15} />
                <span>৩. শাখার মধ্যে স্টক ট্রান্সফার (৮ ধাপ)</span>
              </button>
              <button
                onClick={() => setSelectedWorkflow('cash_closing_wf')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  selectedWorkflow === 'cash_closing_wf' ? 'bg-purple-700 text-white shadow-md' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <CreditCard size={15} />
                <span>৪. দৈনিক ক্যাশ ক্লোজিং (৭ ধাপ)</span>
              </button>
            </div>
            <span className="text-xs text-slate-500 font-bold">লাইভ ওয়ার্কফ্লো ট্রেসার</span>
          </div>

          {/* Workflow 1: Patient to Doctor and Test (13 Steps) */}
          {selectedWorkflow === 'patient_to_test' && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Stethoscope size={18} className="text-teal-600" />
                    <span>রোগী থেকে ডাক্তার ও টেস্টের সম্পূর্ণ ১৩টি ধাপ</span>
                  </h3>
                  <p className="text-xs text-slate-500">নিবন্ধন, সিরিয়াল, ভিজিট নোট, ল্যাব অর্ডার, রেজাল্ট এন্ট্রি ও ডেলিভারি ট্রেইল</p>
                </div>
                <span className="px-3 py-1 bg-teal-100 text-teal-800 rounded-xl text-xs font-bold">১৩টি পদক্ষেপ</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { step: 1, title: 'সক্রিয় শাখা নির্বাচন', desc: 'কর্মী উপরের ড্রপডাউন থেকে অনুমতি অনুযায়ী সক্রিয় শাখা নির্বাচন করবেন।', actor: 'কর্মী / ব্যবহারকারী', status: 'সম্পন্ন' },
                  { step: 2, title: 'রোগী অনুসন্ধান ও নিবন্ধন', desc: 'রোগী খুঁজবেন; না থাকলে মোবাইল/এনআইডি দিয়ে ডুপ্লিকেট যাচাই করে নতুন রোগী নিবন্ধন করবেন।', actor: 'রিসেপশনিস্ট', status: 'সম্পন্ন' },
                  { step: 3, title: 'অ্যাপয়েন্টমেন্ট বুকিং', desc: 'রোগীকে ডাক্তারের সময়সূচি ও রোস্টারে স্লট অনুযায়ী অ্যাপয়েন্টমেন্ট দেবেন।', actor: 'রিসেপশন', status: 'সম্পন্ন' },
                  { step: 4, title: 'চেক-ইন ও সিরিয়াল', desc: 'রোগী উপস্থিত হলে চেক-ইন করে ডাক্তারের অপেক্ষমাণ সিরিয়ালে পাঠাবেন।', actor: 'রিসেপশন', status: 'সম্পন্ন' },
                  { step: 5, title: 'ইতিহাস ও অ্যালার্জি পর্যালোচনা', desc: 'ডাক্তার রোগীর পূর্বের ভিজিট, টেস্ট ইতিহাস ও ড্রাগ অ্যালার্জি পর্যালোচনা করবেন।', actor: 'ডাক্তার', status: 'সম্পন্ন' },
                  { step: 6, title: 'ভিজিট নোট ও প্রেসক্রিপশন', desc: 'ডাক্তার ক্লিনিক্যাল পর্যবেক্ষণ, ভাইটালস, রোগ নির্ণয় ও ডিজিটাল প্রেসক্রিপশন তৈরি করবেন।', actor: 'ডাক্তার', status: 'সম্পন্ন' },
                  { step: 7, title: 'ডায়াগনস্টিক অর্ডার সৃষ্টি', desc: 'ডাক্তার প্রেসক্রিপশনে টেস্ট দিলে স্বয়ংক্রিয়ভাবে ডায়াগনস্টিক ল্যাব অর্ডার তৈরি হবে।', actor: 'ডাক্তার / সিস্টেম', status: 'সম্পন্ন' },
                  { step: 8, title: 'বিল ও পেমেন্ট গ্রহণ', desc: 'রিসেপশন/ক্যাশিয়ার বিল করবে, ছাড় সমন্বয় করবে এবং পেমেন্ট গ্রহণ করে রসিদ দেবে।', actor: 'ক্যাশিয়ার', status: 'সম্পন্ন' },
                  { step: 9, title: 'নমুনা সংগ্রহ ও বারকোড', desc: 'ফ্লেবোটোমিস্ট নির্দেশিকা মেনে নমুনা সংগ্রহ করে বারকোড লেবেল সংযুক্ত করবেন।', actor: 'নমুনা সংগ্রহকারী', status: 'সম্পন্ন' },
                  { step: 10, title: 'ল্যাব ফলাফল ইনপুট (Maker)', desc: 'ল্যাব টেকনিশিয়ান টেস্ট সম্পন্ন করে পরীক্ষার ফলাফল ও রেফারেন্স ভ্যালু প্রবেশ করাবেন।', actor: 'ল্যাব কর্মী', status: 'সম্পন্ন' },
                  { step: 11, title: 'রিপোর্ট যাচাই ও অনুমোদন (Checker)', desc: 'অনুমোদিত প্যাথলজিস্ট/বায়োকেমিস্ট রেজাল্ট পরীক্ষা করে চূড়ান্ত অনুমোদন দেবেন।', actor: 'ভেরিফায়ার', status: 'সম্পন্ন' },
                  { step: 12, title: 'রিপোর্ট ডেলিভারি ও প্রিন্ট', desc: 'অনুমোদিত রিপোর্ট সরাসরি প্রিন্ট বা ডিজিটালি রোগীকে প্রদান করা হবে।', actor: 'ডেলিভারি ডেস্ক', status: 'সম্পন্ন' },
                  { step: 13, title: 'রোগীর প্রোফাইলে একীভূত ইতিহাস', desc: 'ভিজিট, ল্যাব অর্ডার, রিপোর্ট ও বিল রোগীর আজীবন মেডিক্যাল রেকর্ডে যুক্ত হবে।', actor: 'সিস্টেম EMR', status: 'সম্পন্ন' }
                ].map(s => (
                  <div key={s.step} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between gap-2">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="w-6 h-6 rounded-lg bg-teal-800 text-white font-black text-xs flex items-center justify-center">
                          {s.step}
                        </span>
                        <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                          {s.actor}
                        </span>
                      </div>
                      <h4 className="font-black text-slate-900 text-xs">{s.title}</h4>
                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{s.desc}</p>
                    </div>
                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-emerald-700 font-black">
                      <span className="flex items-center gap-1"><CheckCircle2 size={12} /> ভেরিফায়েড ফ্লো</span>
                      <span className="text-slate-400">ধাপ {s.step}/১৩</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Workflow 2: Prescription to Pharmacy (9 Steps) */}
          {selectedWorkflow === 'rx_pharmacy' && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Pill size={18} className="text-emerald-600" />
                    <span>প্রেসক্রিপশন থেকে ফার্মেসি বিক্রির ৯টি ধাপ</span>
                  </h3>
                  <p className="text-xs text-slate-500">স্বাক্ষরিত প্রেসক্রিপশন কিউ, FEFO ব্যাচ নির্বাচন, স্টক সমন্বয় ও রিফান্ড নীতি</p>
                </div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold">৯টি পদক্ষেপ</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { step: 1, title: 'প্রেসক্রিপশন সম্পন্নকরণ', desc: 'ডাক্তার চেম্বারে ডিজিটাল প্রেসক্রিপশন চূড়ান্ত ও স্বাক্ষর করবেন।', actor: 'ডাক্তার' },
                  { step: 2, title: 'প্রেসক্রিপশন অনুসন্ধান', desc: 'ফার্মেসি কর্মী রোগী আইডি বা প্রেসক্রিপশন কিউ থেকে সরাসরি লোড করবেন।', actor: 'ফার্মাসিস্ট' },
                  { step: 3, title: 'ওষুধ ও ডোজ নির্বাচন', desc: 'প্রেসক্রিপশন নির্দেশিকা অনুযায়ী ওষুধের পরিমাণ ও প্যাক সাইজ নির্বাচন।', actor: 'ফার্মাসিস্ট' },
                  { step: 4, title: 'শাখার ব্যাচ ও FEFO স্টক', desc: 'সিস্টেম স্বয়ংক্রিয়ভাবে চলতি শাখার পূর্বে মেয়াদ উত্তীর্ণ হবে এমন ব্যাচ দেখাবে।', actor: 'সিস্টেম FEFO' },
                  { step: 5, title: 'মেয়াদোত্তীর্ণ ব্যাচ ব্লক', desc: 'মেয়াদোত্তীর্ণ কোনো ব্যাচ বিক্রির জন্য নির্বাচন করা সফটওয়্যারে সম্পূর্ণ নিষিদ্ধ।', actor: 'নিরাপত্তা অ্যালগরিদম' },
                  { step: 6, title: 'বিক্রি নিশ্চিত ও পেমেন্ট', desc: 'কর্মী ডিসপেন্সিং নিশ্চিত করবেন এবং রোগীর নিকট থেকে পেমেন্ট গ্রহণ করবেন।', actor: 'কাউন্টার বিক্রেতা' },
                  { step: 7, title: 'ব্যাচ স্টক সমন্বয়', desc: 'বিক্রয় নিশ্চিত হওয়ার সাথে সাথে সংশ্লিষ্ট ব্যাচের ইনভেন্টরি স্টক হ্রাস পাবে।', actor: 'লেজার ইঞ্জিন' },
                  { step: 8, title: 'রসিদ ও প্রোফাইল হিস্ট্রি', desc: 'ক্যাশ মেমো প্রিন্ট হবে এবং বিক্রির তথ্য রোগীর প্রোফাইল ক্রয়ে যুক্ত হবে।', actor: 'প্রিন্টার ও EMR' },
                  { step: 9, title: 'বিক্রয় ফেরত ও রিফান্ড', desc: 'ওষুধ ফেরত এলে অনুমোদিত বিপরীত/সমন্বয় (Contra) এন্ট্রি ও স্টক পুনরায় যোগ হবে।', actor: 'সুপারভাইজার' }
                ].map(s => (
                  <div key={s.step} className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200 flex flex-col justify-between gap-2">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="w-6 h-6 rounded-lg bg-emerald-800 text-white font-black text-xs flex items-center justify-center">{s.step}</span>
                        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">{s.actor}</span>
                      </div>
                      <h4 className="font-black text-slate-900 text-xs">{s.title}</h4>
                      <p className="text-[11px] text-slate-600 mt-1">{s.desc}</p>
                    </div>
                    <div className="text-[10px] text-emerald-800 font-bold pt-2 border-t border-emerald-200">✓ ফার্মেসি বিধিমালা প্রযোজ্য</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Workflow 3: Branch Stock Transfer (8 Steps) */}
          {selectedWorkflow === 'stock_transfer' && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Truck size={18} className="text-blue-600" />
                    <span>শাখার মধ্যে স্টক ট্রান্সফারের ৮টি ধারাবাহিক ধাপ</span>
                  </h3>
                  <p className="text-xs text-slate-500">প্রেরণ ও গ্রহণ উভয় পক্ষের ভেরিফিকেশন এবং অ-বাণিজ্যিক সমন্বয়</p>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-xl text-xs font-bold">৮টি পদক্ষেপ</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {[
                  { step: 1, title: 'ট্রান্সফার অনুরোধ তৈরি', desc: 'পাঠানো শাখা ট্রান্সফার স্লিপ তৈরি করবে।' },
                  { step: 2, title: 'অনুমোদন যাচাই', desc: 'অনুমোদিত সুপারভাইজার ট্রান্সফারটি অনুমোদন করবেন।' },
                  { step: 3, title: 'পণ্য ও ব্যাচ নিশ্চিতকরণ', desc: 'প্রেরক শাখা ব্যাচ নম্বর ও মেয়াদ নিশ্চিত করবে।' },
                  { step: 4, title: 'চালান প্রেরণ (In Transit)', desc: 'ট্রান্সফার পাঠানো হলে স্টকের স্ট্যাটাস বদলাবে।' },
                  { step: 5, title: 'প্রাপক শাখায় যাচাই', desc: 'গ্রহণকারী শাখা ব্যাচ ও শারীরিক পরিমাণ যাচাই করবে।' },
                  { step: 6, title: 'পূর্ণ বা আংশিক গ্রহণ', desc: 'যাচাই সাপেক্ষে সম্পূর্ণ বা আংশিক গ্রহণ নিশ্চিত হবে।' },
                  { step: 7, title: 'দ্বিপাক্ষিক লেজার আপডেট', desc: 'দুই শাখার স্টক ব্যালেন্স আলাদা সমন্বয় হবে।' },
                  { step: 8, title: 'অডিট লগে সংরক্ষণ', desc: 'অ-বাণিজ্যিক রেকর্ড হিসেবে অডিট লগে সংরক্ষিত থাকবে।' }
                ].map(s => (
                  <div key={s.step} className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-200 flex flex-col justify-between">
                    <div>
                      <div className="w-6 h-6 rounded-lg bg-blue-800 text-white font-black text-xs flex items-center justify-center mb-1">{s.step}</div>
                      <h4 className="font-black text-slate-900 text-xs">{s.title}</h4>
                      <p className="text-[11px] text-slate-600 mt-1">{s.desc}</p>
                    </div>
                    <div className="text-[10px] text-blue-800 font-bold pt-2 border-t border-blue-200 mt-2">✓ অ-বাণিজ্যিক ট্রান্সফার</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Workflow 4: Daily Cash Closing (7 Steps) */}
          {selectedWorkflow === 'cash_closing_wf' && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <CreditCard size={18} className="text-purple-600" />
                    <span>দৈনিক ক্যাশ ক্লোজিং ও রিকনসিলিয়েশনের ৭টি ধাপ</span>
                  </h3>
                  <p className="text-xs text-slate-500">শিফটের লেনদেন নিরীক্ষা, ড্রয়ার ক্যাশ গণনা, অমিল ব্যাখ্যা ও ম্যানেজার অনুমোদন</p>
                </div>
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-xl text-xs font-bold">৭টি পদক্ষেপ</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { step: 1, title: 'শিফট ও কাউন্টার লেনদেন দেখা', desc: 'ক্যাশিয়ার নিজের শিফট/কাউন্টারের মোট বিল ও আদায় দেখবেন।' },
                  { step: 2, title: 'পেমেন্ট মেথডভিত্তিক বিভাজন', desc: 'নগদ, কার্ড, বিকাশ, নগদ, ব্যাংক ও বকেয়া আলাদা হিসাব হবে।' },
                  { step: 3, title: 'সিস্টেম বনাম হাতে থাকা নগদ', desc: 'সিস্টেমের সফটওয়্যার হিসাবের সাথে ড্রয়ারের নগদ ক্যাশ গণনা মিলানো।' },
                  { step: 4, title: 'ঘাটতি বা বাড়তির ব্যাখ্যা', desc: 'পার্থক্য থাকলে সুনির্দিষ্ট কারণ লিপিবদ্ধ করতে হবে।' },
                  { step: 5, title: 'ক্লোজিং সাবমিট', desc: 'ক্যাশিয়ার দৈনিক ক্লোজিং স্টেটমেন্ট জমা দেবেন।' },
                  { step: 6, title: 'ম্যানেজার অনুমোদন', desc: 'শাখা ম্যানেজার বা হিসাবরক্ষক ভাউচার যাচাই করে অনুমোদন দেবেন।' },
                  { step: 7, title: 'অপরিবর্তনীয় অডিট লগ', desc: 'ক্লোজিং পরিবর্তনের কোনো সুযোগ নেই; সংশোধনে আলাদা অডিট তৈরি হবে।' }
                ].map(s => (
                  <div key={s.step} className="p-3.5 rounded-2xl bg-purple-50/50 border border-purple-200 flex flex-col justify-between">
                    <div>
                      <div className="w-6 h-6 rounded-lg bg-purple-800 text-white font-black text-xs flex items-center justify-center mb-1">{s.step}</div>
                      <h4 className="font-black text-slate-900 text-xs">{s.title}</h4>
                      <p className="text-[11px] text-slate-600 mt-1">{s.desc}</p>
                    </div>
                    <div className="text-[10px] text-purple-800 font-bold pt-2 border-t border-purple-200 mt-2">✓ ক্লোজিং ভেরিফায়েড</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. ROLE-BASED ACCESS CONTROL (12 ROLES & 4 CRITERIA) */}
      {/* ============================================================== */}
      {activeSubTab === 'rbac' && (
        <div className="space-y-6">
          {/* Policy & Important Rules Callout Banner */}
          <div className="p-5 rounded-3xl bg-amber-50 border border-amber-200 space-y-3">
            <h3 className="text-sm font-black text-amber-950 flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-700" />
              <span>গুরুত্বপূর্ণ অনুমতি নিয়ম ও ৪টি মানদণ্ড</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs text-amber-900 font-medium">
              <div className="p-2.5 rounded-xl bg-white/80 border border-amber-200">
                <strong>১. নির্দিষ্ট শাখা বরাদ্দ:</strong> কর্মী তৈরি করার সময় অন্তত একটি শাখা বরাদ্দ আবশ্যক; অনুমতি ছাড়া কোনো তথ্য দেখা যাবে না।
              </div>
              <div className="p-2.5 rounded-xl bg-white/80 border border-amber-200">
                <strong>২. মডিউল প্রবেশাধিকার:</strong> ভূমিকা অনুযায়ী রিসেপশন, ডাক্তার, ল্যাব, ফার্মেসি ও হিসাব পৃথক।
              </div>
              <div className="p-2.5 rounded-xl bg-white/80 border border-amber-200">
                <strong>৩. মেকার-চেকার বিচ্ছিন্নতা:</strong> ল্যাব রেজাল্ট ইনপুটকারী ও রিপোর্ট অনুমোদনকারী একই ব্যক্তি হতে পারবে না।
              </div>
              <div className="p-2.5 rounded-xl bg-white/80 border border-amber-200">
                <strong>৪. আর্থিক সীমা (Financial Limits):</strong> সর্বোচ্চ ডিসকাউন্ট, রিফান্ড ও বিল বাতিলের আর্থিক সীমা নির্ধারিত।
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-2 border-t border-amber-200/80 text-xs">
              <span className="text-amber-900 font-bold">Maker-Checker Policy Enforcement:</span>
              <button
                onClick={() => setMakerCheckerEnforced(!makerCheckerEnforced)}
                className={`px-3 py-1 rounded-xl font-bold transition-all ${
                  makerCheckerEnforced ? 'bg-amber-800 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {makerCheckerEnforced ? '✓ মেকার-চেকার সক্রিয় (Enforced)' : '✕ শিথিলকৃত (Relaxed)'}
              </button>
            </div>
          </div>

          {/* 12 Role Matrix Table */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b">
              <div>
                <h3 className="text-base font-black text-slate-900">১২টি স্ট্যান্ডার্ড ভূমিকা ও অনুমোদিত কাজের ম্যাট্রিক্স</h3>
                <p className="text-xs text-slate-500">মালিক থেকে অডিটর পর্যন্ত কর্মপরিধি ও আর্থিক ক্ষমতার সীমা</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[11px]">
                  <tr>
                    <th className="p-3">ভূমিকা (Role)</th>
                    <th className="p-3">শাখার পরিধি</th>
                    <th className="p-3">অনুমতিপ্রাপ্ত মডিউলসমূহ</th>
                    <th className="p-3">কাজের ধরন</th>
                    <th className="p-3">ছাড় সীমা</th>
                    <th className="p-3">রিফান্ড সীমা</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {rolesList.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50/60">
                      <td className="p-3 font-bold text-slate-900 flex items-center gap-1.5">
                        <Key size={13} className="text-indigo-600" />
                        <span>{r.title}</span>
                      </td>
                      <td className="p-3 font-semibold text-teal-800">{r.scope}</td>
                      <td className="p-3 text-slate-600 max-w-xs">{r.accessibleModules}</td>
                      <td className="p-3"><span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold">{r.actionLevel}</span></td>
                      <td className="p-3 font-black text-emerald-700">৳{r.discountLimit.toLocaleString()}</td>
                      <td className="p-3 font-black text-amber-700">৳{r.refundLimit.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Employee Directory with 4 Configuration Attributes */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b">
              <div>
                <h3 className="text-base font-black text-slate-900">কর্মীদের তালিকা ও ৪টি সুনির্দিষ্ট মানদণ্ড</h3>
                <p className="text-xs text-slate-500">নির্ধারিত শাখা, অনুমোদিত মডিউল, পারমিশন স্তর ও আর্থিক সীমা</p>
              </div>
              <button
                onClick={() => setShowAddEmpModal(true)}
                className="px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Plus size={14} />
                <span>নতুন কর্মী যোগ করুন</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[11px]">
                  <tr>
                    <th className="p-3">কর্মী আইডি ও নাম</th>
                    <th className="p-3">১. নির্ধারিত শাখা</th>
                    <th className="p-3">২. অনুমোদিত মডিউল</th>
                    <th className="p-3">৩. পারমিশন স্তর</th>
                    <th className="p-3">৪. আর্থিক সীমা (ছাড়/রিফান্ড/বাতিল)</th>
                    <th className="p-3">অবস্থা</th>
                    <th className="p-3">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employees.map(emp => (
                    <tr key={emp.id} className="hover:bg-slate-50/60">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{emp.name}</div>
                        <div className="text-[10px] text-teal-700 font-mono font-bold">{emp.id} • {emp.role}</div>
                      </td>
                      <td className="p-3 font-bold text-teal-900">{emp.assignedBranch}</td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {emp.accessibleModules.map((m, i) => (
                            <span key={i} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">{m}</span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {emp.permissions.map((p, i) => (
                            <span key={i} className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-bold">{p}</span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-800">
                        ছাড়: <span className="text-emerald-700">৳{emp.financialLimits.maxDiscount}</span> | রিফান্ড: <span className="text-amber-700">৳{emp.financialLimits.maxRefund}</span> | বাতিল: <span className="text-rose-700">৳{emp.financialLimits.maxCancel}</span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          emp.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {emp.status === 'Active' ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => {
                            setEmployees(prev => prev.map(e => e.id === emp.id ? { ...e, status: e.status === 'Active' ? 'Inactive' : 'Active' } : e));
                            alert(`কর্মী ${emp.name}-এর স্ট্যাটাস পরিবর্তন করা হয়েছে। অডিট ট্রেইল অপরিবর্তনীয় রাখা হয়েছে।`);
                          }}
                          className="text-[11px] text-slate-500 hover:text-slate-800 font-bold"
                        >
                          {emp.status === 'Active' ? 'নিষ্ক্রিয় করুন' : 'সক্রিয় করুন'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. DAILY CASH CLOSING WIZARD */}
      {/* ============================================================== */}
      {activeSubTab === 'cash_closing' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
          <div className="flex justify-between items-center pb-3 border-b">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <CreditCard size={18} className="text-teal-600" />
                <span>দৈনিক ক্যাশ ক্লোজিং ও রিকনসিলিয়েশন উইজার্ড (Daily Cash Closing)</span>
              </h3>
              <p className="text-xs text-slate-500">শিফটের লেনদেন পরীক্ষা, হাতে থাকা নগদ গণনা ও অমিল নিষ্পত্তির অডিট ট্রেইল</p>
            </div>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-black rounded-xl text-xs">
              ✓ রিকনসিলিয়েশন সম্পন্ন
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200">
              <span className="text-xs font-bold text-teal-800">সিস্টেম নগদ হিসাব (System Cash)</span>
              <div className="text-2xl font-black text-teal-950 mt-1 font-mono">৳{cashClosingForm.systemCash.toLocaleString()}</div>
              <div className="text-[11px] text-teal-700 mt-1">কাউন্টার ক্যাশ ইনভয়েস</div>
            </div>
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
              <span className="text-xs font-bold text-blue-800">ডিজিটাল পেমেন্ট (Card / bKash)</span>
              <div className="text-2xl font-black text-blue-950 mt-1 font-mono">৳{cashClosingForm.systemDigital.toLocaleString()}</div>
              <div className="text-[11px] text-blue-700 mt-1">ব্যাংক ও ওয়ালেট নিষ্পত্তি</div>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
              <span className="text-xs font-bold text-amber-800">অবশিষ্ট বকেয়া (Unpaid Dues)</span>
              <div className="text-2xl font-black text-amber-950 mt-1 font-mono">৳{cashClosingForm.systemDue.toLocaleString()}</div>
              <div className="text-[11px] text-amber-700 mt-1">আজকের বকেয়া খতিয়ান</div>
            </div>
            <div className={`p-4 rounded-2xl border ${cashDiscrepancy === 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
              <span className="text-xs font-bold text-slate-700">ড্রয়ার ভ্যারিয়েন্স (Discrepancy)</span>
              <div className={`text-2xl font-black mt-1 font-mono ${cashDiscrepancy === 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {cashDiscrepancy === 0 ? '৳০ (মিলেছে)' : `৳${cashDiscrepancy}`}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">সিস্টেম বনাম হাতে থাকা নগদ</div>
            </div>
          </div>

          <form onSubmit={e => {
            e.preventDefault();
            alert('দৈনিক ক্যাশ ক্লোজিং সফলভাবে সংরক্ষিত ও ম্যানেজার অডিটে সাক্ষরিত হয়েছে!');
          }} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 text-xs">
            <h4 className="font-black text-slate-900 text-sm">ক্যাশিয়ার ক্লোজিং ফর্ম</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">শাখা</label>
                <input readOnly value={cashClosingForm.branch} className="w-full px-3 py-2 border rounded-xl bg-slate-100 font-semibold" />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">শিফট</label>
                <input readOnly value={cashClosingForm.shift} className="w-full px-3 py-2 border rounded-xl bg-slate-100 font-semibold" />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">ক্যাশিয়ারের নাম</label>
                <input readOnly value={cashClosingForm.cashierName} className="w-full px-3 py-2 border rounded-xl bg-slate-100 font-semibold" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">হাতে গোনা নগদ ক্যাশ (Physical Cash in Drawer)</label>
                <input
                  type="number"
                  value={cashClosingForm.physicalCash}
                  onChange={e => setCashClosingForm({ ...cashClosingForm, physicalCash: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-black text-sm text-teal-800"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">ঘাটতি বা বাড়তির কারণ (যদি থাকে)</label>
                <input
                  placeholder="কোনো অমিল না থাকলে খালি রাখুন"
                  value={cashClosingForm.shortageReason}
                  onChange={e => setCashClosingForm({ ...cashClosingForm, shortageReason: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-medium"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">ম্যানেজার অনুমোদন নোট (Supervisor Audit Note)</label>
              <input
                value={cashClosingForm.supervisorNote}
                onChange={e => setCashClosingForm({ ...cashClosingForm, supervisorNote: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl font-medium"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="submit" className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-xl text-xs flex items-center gap-1.5">
                <CheckCircle2 size={15} />
                <span>দৈনিক ক্যাশ ক্লোজিং জমা ও অনুমোদন করুন</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. IMMUTABLE AUDIT TRAIL LOGS */}
      {/* ============================================================== */}
      {activeSubTab === 'audit_trail' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2 border-b">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <History size={18} className="text-indigo-600" />
                <span>নিরাপত্তা অডিট ট্রেইল ও লেনদেন পরিচয় (Immutable Audit Logs)</span>
              </h3>
              <p className="text-xs text-slate-500">১১টি মেটাডাটা অ্যাট্রিবিউটসহ ডিজিটাল পদচিহ্ন • অ্যাডমিন কর্তৃক মোছা সম্পূর্ণ নিষিদ্ধ</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-1">
                <Lock size={12} /> মোছা সম্পূর্ণ নিষিদ্ধ (Delete Locked)
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[11px]">
                <tr>
                  <th className="p-3">অডিট আইডি</th>
                  <th className="p-3">শাখা ও রেকর্ড নং</th>
                  <th className="p-3">তৈরি ও অনুমোদনকারী</th>
                  <th className="p-3">কাজের ধরন ও মডিউল</th>
                  <th className="p-3">আগের মান বনাম নতুন মান</th>
                  <th className="p-3">সময় ও ডিভাইস/আইপি</th>
                  <th className="p-3">পরিবর্তনের কারণ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map(log => (
                  <tr key={log.logId} className="hover:bg-slate-50/60">
                    <td className="p-3 font-mono font-bold text-indigo-700">{log.logId}</td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{log.branchName}</div>
                      <div className="text-[10px] text-teal-700 font-mono font-bold">রেকর্ড: {log.recordNo}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-800">তৈরি: {log.createdBy}</div>
                      <div className="text-[10px] text-slate-500">অনুমোদন: {log.approvedBy}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{log.actionType}</div>
                      <div className="text-[10px] text-indigo-600 font-semibold">{log.sourceModule}</div>
                    </td>
                    <td className="p-3">
                      <div className="text-rose-700 line-through text-[11px]">{log.oldValue}</div>
                      <div className="text-emerald-700 font-bold text-[11px]">{log.newValue}</div>
                    </td>
                    <td className="p-3">
                      <div className="text-slate-800 font-mono">{log.timestamp}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Laptop size={11} /> {log.deviceInfo}
                      </div>
                    </td>
                    <td className="p-3 text-slate-600 max-w-xs">{log.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. HL7 FHIR INTEROPERABILITY */}
      {/* ============================================================== */}
      {activeSubTab === 'fhir_interop' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2 border-b">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Database size={18} className="text-teal-600" />
                <span>HL7 FHIR R4 তথ্যের মান ও আন্তর্জাতিক বহিঃসংযোগ (FHIR Readiness)</span>
              </h3>
              <p className="text-xs text-slate-500">অন্যান্য সফটওয়্যার ও জাতীয় স্বাস্থ্যসেবা ইন্টারঅপারেবিলিটির জন্য স্ট্যান্ডার্ড কাঠামো</p>
            </div>
            <button
              onClick={() => {
                const sampleFhir = {
                  resourceType: 'Bundle',
                  type: 'collection',
                  entry: [
                    { resourceType: 'Organization', id: 'HISABKITAB-360', name: 'HisabKitab Healthcare' },
                    { resourceType: 'Patient', id: 'UHID-2026-001', name: [{ family: 'ইসলাম', given: ['মো: রফিকুল'] }] },
                    { resourceType: 'DiagnosticReport', id: 'LAB-2026-401', status: 'final', code: { text: 'Complete Blood Count (CBC)' } }
                  ]
                };
                navigator.clipboard.writeText(JSON.stringify(sampleFhir, null, 2));
                alert('HL7 FHIR Bundle JSON ক্লিপবোর্ডে কপি করা হয়েছে!');
              }}
              className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <Download size={14} />
              <span>FHIR JSON এক্সপোর্ট করুন</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200">
              <h4 className="font-black text-teal-950 mb-1">1. Patient & Practitioner Resource</h4>
              <p className="text-teal-900 leading-relaxed">
                UHID ভিত্তিক রোগী ডেমোগ্রাফিক, রক্তের গ্রুপ, জন্মতারিখ এবং চিকিৎসকের BMDC রেজিস্ট্রেশন নম্বর FHIR Practitioner স্কিমা অনুযায়ী ম্যাপ করা।
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200">
              <h4 className="font-black text-indigo-950 mb-1">2. DiagnosticReport & Observation</h4>
              <p className="text-indigo-900 leading-relaxed">
                ল্যাব অর্ডার, নমুনা সংগ্রহ, রেফারেন্স রেঞ্জ এবং প্যাথলজিস্টের ডিজিটাল ভেরিফিকেশন আন্তর্জাতিক LOINC ও FHIR DiagnosticReport কোডে সামঞ্জস্যপূর্ণ।
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
              <h4 className="font-black text-emerald-950 mb-1">3. MedicationRequest & Dispense</h4>
              <p className="text-emerald-900 leading-relaxed">
                DGDA কোড ও ইনভেন্টরি ব্যাচ নম্বরসহ প্রেসক্রিপশন বিতরণ রেকর্ড FHIR MedicationDispense রিসোর্সে স্ট্যান্ডার্ডাইজড।
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto">
            <div className="text-teal-400 font-bold mb-2">// Sample HL7 FHIR R4 DiagnosticReport Snippet</div>
            <pre>{`{
  "resourceType": "DiagnosticReport",
  "id": "REP-2026-8841",
  "status": "final",
  "category": [{ "coding": [{ "system": "http://terminology.hl7.org/CodeSystem/v2-0074", "code": "LAB" }] }],
  "code": { "coding": [{ "system": "http://loinc.org", "code": "58410-2", "display": "Complete Blood Count (CBC)" }] },
  "subject": { "reference": "Patient/UHID-2026-003", "display": "মোসা: সুমি আক্তার" },
  "performer": [{ "reference": "Practitioner/EMP-003", "display": "ডা: তানভীর আহমেদ (বায়োকেমিস্ট)" }],
  "conclusion": "Hb 12.5 g/dL (Normal), ESR 15 mm/hr. No critical findings."
}`}</pre>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. RELEASE ROADMAP (FIRST RELEASE VS FUTURE RELEASES) */}
      {/* ============================================================== */}
      {activeSubTab === 'release_roadmap' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
          <div className="flex justify-between items-center pb-2 border-b">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Milestone size={18} className="text-indigo-600" />
                <span>প্রথম রিলিজ ও পরবর্তী রিলিজ রোডম্যাপ (Release Architecture)</span>
              </h3>
              <p className="text-xs text-slate-500">সম্পূর্ণ কার্যপ্রণালী এবং ধাপে ধাপে চালুর পরিকল্পনা</p>
            </div>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold">
              প্রথম রিলিজ: ১০০% প্রস্তুত
            </span>
          </div>

          {/* First Release Features Checklist */}
          <div className="space-y-3">
            <h4 className="text-sm font-black text-emerald-900 flex items-center gap-1.5">
              <CheckSquare size={16} className="text-emerald-600" />
              <span>প্রথম রিলিজ — অবশ্যই থাকবে (সবগুলো সম্পন্ন ও সক্রিয়)</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
              {[
                { title: 'মাল্টি-ব্রাঞ্চ এন্টারপ্রাইজ', desc: 'প্রতিষ্ঠান, একাধিক শাখা, শাখাভিত্তিক পারমিশন ও সম্মিলিত ড্যাশবোর্ড' },
                { title: 'শাখা স্টক ট্রান্সফার', desc: 'প্রেরণ ও গ্রহণ উভয় পক্ষের ভেরিফিকেশন এবং অ-বাণিজ্যিক সমন্বয়' },
                { title: 'রোগী CRM ও একীভূত ইতিহাস', desc: 'UHID রেজিস্ট্রি, ডুপ্লিকেট শনাক্তকরণ, ভিজিট, ল্যাব ও বিলিং লেজার' },
                { title: 'অ্যাপয়েন্টমেন্ট ও সিরিয়াল', desc: 'ডাক্তার/বিশেষত্ব/শাখাভিত্তিক সময়সূচি, চেক-ইন ও ওয়েটিং কিউ' },
                { title: 'ভিজিট নোট ও ডিজিটাল প্রেসক্রিপশন', desc: 'ক্লিনিক্যাল ভাইটালস, অ্যালার্জি চেক ও প্রেসক্রিপশন টেমপ্লেট' },
                { title: '৭৪+ টেস্ট ক্যাটালগ ও LIMS', desc: 'শাখাভিত্তিক মূল্য, টেস্ট প্যাকেজ, স্যাম্পল ট্র্যাকিং ও রেজাল্ট এন্ট্রি' },
                { title: 'ল্যাব রিপোর্ট অনুমোদন ও অডিট', desc: 'মেকার-চেকার যাচাই, সংস্করণ নিয়ন্ত্রণ (v1->v2) ও রিপোর্ট প্রিন্ট' },
                { title: '১৪-ফিল্ড ওষুধ ক্যাটালগ', desc: 'SKU, বারকোড, শক্তি, ডোজ ফর্ম, কোল্ড-চেইন ও DGDA Rx ফ্ল্যাগ' },
                { title: 'FEFO ফার্মেসি ও মেয়াদোত্তীর্ণ ব্লক', desc: 'আগে মেয়াদ শেষ হবে এমন ব্যাচ অগ্রাধিকার, মেয়াদোত্তীর্ণ ব্লকড' },
                { title: '১৫-ফিল্ড সেন্ট্রাল বিলিং', desc: '৮টি পেমেন্ট মেথড, কিস্তি লেনদেন, রিফান্ড ও বাতিল বিপরীত সমন্বয় (Contra)' },
                { title: '১৪টি সেন্ট্রাল রিপোর্ট হাব', desc: '৯টি সাধারণ ফিল্টারসহ দৈনন্দিন আয়, রোগী, টেস্ট ও স্টক বিশ্লেষণ' },
                { title: '১২টি ভূমিকাভিত্তিক RBAC ও অডিট', desc: 'শাখা, মডিউল, অ্যাকশন ও আর্থিক সীমা সমন্বিত সিকিউরিটি' }
              ].map((f, i) => (
                <div key={i} className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200">
                  <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-700" />
                    <span>{f.title}</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 mt-1 leading-normal">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Future Releases Architecture */}
          <div className="space-y-3 pt-3 border-t">
            <h4 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
              <Clock size={16} className="text-blue-600" />
              <span>পরবর্তী রিলিজ — চিকিৎসা ও পরিচালনা উন্নয়ন (Future Expansions)</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs text-slate-700">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <strong className="text-slate-900 block mb-1">ক্লিনিক্যাল প্রযুক্তি সংযোগ:</strong>
                অনলাইন টেলিমেডিসিন অ্যাপয়েন্টমেন্ট, ল্যাব অটোমেটেড অ্যানালাইজার মেশিন সংযোগ, রেডিওলজি DICOM/PACS ইন্টিগ্রেশন এবং হ্যান্ডহেল্ড বারকোড স্ক্যানিং।
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <strong className="text-slate-900 block mb-1">হাসপাতালের পূর্ণাঙ্গ ইনপেশেন্ট ইকোসিস্টেম (IPD):</strong>
                ওয়ার্ড ও বেড স্থানান্তর, নার্সিং কেয়ার চার্ট, ভর্তি রোগীর দৈনিক ওষুধ চার্টিং, ওটি (OT), ব্লাড ব্যাংক ও চূড়ান্ত ডিসচার্জ সার্টিফিকেট।
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: ADD EMPLOYEE (WITH 4 MANDATORY CRITERIA) */}
      {/* ============================================================== */}
      {showAddEmpModal && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content glass-card" style={{ maxWidth: '520px', width: '95%', padding: '1.5rem', borderRadius: '20px' }}>
            <div className="flex justify-between items-center pb-3 border-b mb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                <Users size={17} className="text-teal-700" />
                <span>নতুন কর্মী নিবন্ধন (৪টি মানদণ্ডসহ)</span>
              </h3>
              <button onClick={() => setShowAddEmpModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={e => {
              e.preventDefault();
              const newEmp = {
                id: `EMP-${Math.floor(100 + Math.random() * 900)}`,
                name: newEmpForm.name,
                role: rolesList.find(r => r.id === newEmpForm.roleId)?.title || 'কর্মী',
                roleId: newEmpForm.roleId,
                assignedBranch: newEmpForm.assignedBranch,
                accessibleModules: ['নির্ধারিত মডিউল'],
                permissions: ['তৈরি', 'সম্পাদনা'],
                financialLimits: {
                  maxDiscount: Number(newEmpForm.maxDiscount) || 0,
                  maxRefund: Number(newEmpForm.maxRefund) || 0,
                  maxCancel: Number(newEmpForm.maxCancel) || 0
                },
                status: 'Active',
                makerCheckerSeparation: true
              };
              setEmployees([...employees, newEmp]);
              alert(`কর্মী ${newEmp.name} সফলভাবে ৪টি মানদণ্ডসহ নিবন্ধিত হয়েছে!`);
              setShowAddEmpModal(false);
            }} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">কর্মীর পুরো নাম</label>
                <input required placeholder="যেমন: মো: আরিফুল ইসলাম" value={newEmpForm.name} onChange={e => setNewEmpForm({ ...newEmpForm, name: e.target.value })} className="input-field w-full px-3 py-2 border rounded-xl" />
              </div>

              <div>
                <label className="font-bold block mb-1">ভূমিকা (Role - ১২টির মধ্যে নির্বাচন)</label>
                <select value={newEmpForm.roleId} onChange={e => setNewEmpForm({ ...newEmpForm, roleId: e.target.value })} className="input-field w-full px-3 py-2 border rounded-xl font-bold">
                  {rolesList.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1">১. নির্ধারিত শাখা (কমপক্ষে একটি শাখা বরাদ্দ আবশ্যক)</label>
                <select value={newEmpForm.assignedBranch} onChange={e => setNewEmpForm({ ...newEmpForm, assignedBranch: e.target.value })} className="input-field w-full px-3 py-2 border rounded-xl font-bold">
                  {branches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold block mb-1">সর্বোচ্চ ছাড় (৳)</label>
                  <input type="number" value={newEmpForm.maxDiscount} onChange={e => setNewEmpForm({ ...newEmpForm, maxDiscount: e.target.value })} className="input-field w-full px-2.5 py-1.5 border rounded-xl font-bold" />
                </div>
                <div>
                  <label className="font-bold block mb-1">সর্বোচ্চ রিফান্ড (৳)</label>
                  <input type="number" value={newEmpForm.maxRefund} onChange={e => setNewEmpForm({ ...newEmpForm, maxRefund: e.target.value })} className="input-field w-full px-2.5 py-1.5 border rounded-xl font-bold" />
                </div>
                <div>
                  <label className="font-bold block mb-1">সর্বোচ্চ বাতিল (৳)</label>
                  <input type="number" value={newEmpForm.maxCancel} onChange={e => setNewEmpForm({ ...newEmpForm, maxCancel: e.target.value })} className="input-field w-full px-2.5 py-1.5 border rounded-xl font-bold" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddEmpModal(false)} className="btn btn-secondary">বাতিল</button>
                <button type="submit" className="btn btn-primary bg-teal-800 text-white font-bold">কর্মী সংরক্ষণ করুন</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffSecurityManager;
