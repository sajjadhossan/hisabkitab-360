import React, { useState, useMemo, useEffect } from 'react';
import { useHealthcare } from '../../context/HealthcareContext';
import { useApp } from '../../context/AppContext';
import {
  FlaskConical,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  X,
  Check,
  AlertTriangle,
  FileText,
  DollarSign,
  UserCheck,
  Barcode,
  Layers,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  Filter,
  Info,
  Send,
  Droplet,
  Edit2,
  Building2,
  CheckSquare,
  Square,
  RefreshCw,
  Eye,
  Sliders,
  History,
  ShieldCheck,
  Share2,
  Download,
  AlertCircle
} from 'lucide-react';
import QRCode from 'qrcode';
import { CANCER_SAFETY_DISCLAIMER } from '../../data/diagnosticCatalogData';
import { PhlebotomyBarcodeModal } from './PhlebotomyBarcodeModal';

// Automated evaluation of reference ranges (High / Low / Normal)
export function evaluateResultStatus(value, refStr) {
  if (!value || isNaN(Number(value))) return null;
  const num = Number(value);
  if (!refStr) return null;
  const rangeMatch = refStr.match(/([\d\.]+)\s*-\s*([\d\.]+)/);
  if (rangeMatch) {
    const min = parseFloat(rangeMatch[1]);
    const max = parseFloat(rangeMatch[2]);
    if (num < min) return { status: 'LOW', label: '▼ Low (কম)', color: '#2563eb', bg: 'rgba(37, 99, 235, 0.12)' };
    if (num > max) return { status: 'HIGH', label: '▲ High (বেশি)', color: '#dc2626', bg: 'rgba(220, 38, 38, 0.12)' };
    return { status: 'NORMAL', label: '✓ Normal (স্বাভাবিক)', color: '#059669', bg: 'rgba(5, 150, 105, 0.12)' };
  }
  const lessMatch = refStr.match(/<\s*([\d\.]+)/);
  if (lessMatch) {
    const max = parseFloat(lessMatch[1]);
    if (num > max) return { status: 'HIGH', label: '▲ High (অতিরিক্ত)', color: '#dc2626', bg: 'rgba(220, 38, 38, 0.12)' };
    return { status: 'NORMAL', label: '✓ Normal', color: '#059669', bg: 'rgba(5, 150, 105, 0.12)' };
  }
  return null;
}

// Critical Panic Value Detector for lab parameters
export function isPanicValue(paramName = '', value = '') {
  if (!value || isNaN(Number(value))) return false;
  const num = Number(value);
  const name = paramName.toLowerCase();

  if (name.includes('troponin') && num > 0.04) return true;
  if (name.includes('glucose') && (num > 25 || num < 2.8)) return true;
  if (name.includes('creatinine') && num > 5.0) return true;
  if (name.includes('potassium') && (num > 6.2 || num < 2.5)) return true;
  if (name.includes('hemoglobin') && num < 6.0) return true;
  if (name.includes('platelet') && num < 25000) return true;
  return false;
}

// 12 ORDER STATUSES SPECIFICATION
export const LAB_ORDER_STATUSES = [
  { id: 'অর্ডার হয়েছে', label: 'অর্ডার হয়েছে', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.12)', step: 1 },
  { id: 'পেমেন্ট অপেক্ষমাণ', label: 'পেমেন্ট অপেক্ষমাণ', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', step: 2 },
  { id: 'নমুনা সংগ্রহ বাকি', label: 'নমুনা সংগ্রহ বাকি', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)', step: 3 },
  { id: 'নমুনা সংগ্রহ হয়েছে', label: 'নমুনা সংগ্রহ হয়েছে', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.12)', step: 4 },
  { id: 'নমুনা গ্রহণ হয়েছে', label: 'নমুনা গ্রহণ হয়েছে', color: '#0284c7', bg: 'rgba(2, 132, 199, 0.12)', step: 5 },
  { id: 'ল্যাবে পাঠানো হয়েছে', label: 'ল্যাবে পাঠানো হয়েছে', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)', step: 6 },
  { id: 'পরীক্ষা চলছে', label: 'পরীক্ষা চলছে', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.12)', step: 7 },
  { id: 'রিপোর্ট খসড়া', label: 'রিপোর্ট খসড়া', color: '#eab308', bg: 'rgba(234, 179, 8, 0.12)', step: 8 },
  { id: 'যাচাই অপেক্ষমাণ', label: 'যাচাই অপেক্ষমাণ', color: '#f97316', bg: 'rgba(249, 115, 22, 0.12)', step: 9 },
  { id: 'অনুমোদিত', label: 'অনুমোদিত', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', step: 10 },
  { id: 'রোগীকে দেওয়া হয়েছে', label: 'রোগীকে দেওয়া হয়েছে', color: '#059669', bg: 'rgba(5, 150, 105, 0.18)', step: 11 },
  { id: 'বাতিল', label: 'বাতিল', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', step: 0 }
];

// 5 REPORT STATUSES SPECIFICATION
export const REPORT_STATUSES = [
  { id: 'খসড়া', label: 'খসড়া (Draft)', color: '#64748b', bg: 'rgba(100, 116, 139, 0.12)' },
  { id: 'যাচাই অপেক্ষমাণ', label: 'যাচাই অপেক্ষমাণ', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
  { id: 'সংশোধন প্রয়োজন', label: 'সংশোধন প্রয়োজন', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' },
  { id: 'অনুমোদিত', label: 'অনুমোদিত (Approved)', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
  { id: 'রোগীকে দেওয়া হয়েছে', label: 'রোগীকে দেওয়া হয়েছে', color: '#059669', bg: 'rgba(5, 150, 105, 0.18)' }
];

export const DiagnosticLIMSManager = () => {
  const {
    diagnosticTests: contextTests,
    testPackages,
    diagnosticCategories,
    labOrders,
    patients,
    createLabOrder,
    updateLabSampleStatus,
    enterLabResults,
    verifyLabOrderReport,
    branches = [
      { id: 'dhanmondi', name: 'ধানমন্ডি মেইন ব্রাঞ্চ', code: 'DHD-01' },
      { id: 'uttara', name: 'উত্তরা শাখা', code: 'UTT-02' },
      { id: 'mirpur', name: 'মিরপুর শাখা', code: 'MIR-03' },
      { id: 'chattogram', name: 'চট্টগ্রাম শাখা', code: 'CTG-04' }
    ],
    activeBranchId = 'dhanmondi',
    activeBranch = { id: 'dhanmondi', name: 'ধানমন্ডি মেইন ব্রাঞ্চ', code: 'DHD-01' }
  } = useHealthcare();

  const { lang, showToast } = useApp();

  // Primary Workspace Tabs:
  // 'test_catalog' | 'orders_samples' | 'diagnostic_reports' | 'test_packages'
  const [activeTab, setActiveTab] = useState('orders_samples');

  // Local state for tests to support rich editing, branch overrides and new tests
  const [catalogList, setCatalogList] = useState(() => {
    try {
      const saved = localStorage.getItem('hisabkitab_hc_diagnostic_tests_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return (contextTests || []).map(t => ({
      ...t,
      allowed_branches: t.allowed_branches || ['dhanmondi', 'uttara', 'mirpur', 'chattogram'],
      branch_overrides: t.branch_overrides || {
        dhanmondi: { price: t.regular_price, emergency_price: t.emergency_price || (t.regular_price * 1.4), tat: t.report_turnaround_time || '4 Hours', active: true, equipment: 'Sysmex XN-550' },
        uttara: { price: t.regular_price, emergency_price: t.emergency_price || (t.regular_price * 1.4), tat: t.report_turnaround_time || '5 Hours', active: true, equipment: 'Mindray BC-5150' },
        mirpur: { price: t.regular_price, emergency_price: t.emergency_price || (t.regular_price * 1.4), tat: t.report_turnaround_time || '6 Hours', active: true, equipment: 'Mindray BS-240' },
        chattogram: { price: t.regular_price, emergency_price: t.emergency_price || (t.regular_price * 1.4), tat: t.report_turnaround_time || '8 Hours', active: true, equipment: 'Beckman Coulter AU480' }
      },
      is_external_lab: t.is_external_lab || false,
      external_lab_name: t.external_lab_name || '',
      preparation_instructions: t.preparation_instructions || (t.fasting_requirement ? '১০-১২ ঘণ্টা খালি পেটে থাকতে হবে' : 'কোনো বিশেষ প্রস্তুতির প্রয়োজন নেই'),
      result_type: t.result_type || 'Quantitative (সংখ্যাগত ও রেঞ্জ)',
      reference_info: t.reference_info || 'বয়স ও লিঙ্গভিত্তিক অনুমোদিত ক্লিনিক্যাল রেফারেন্স রেঞ্জ',
      active: t.active !== false
    }));
  });

  const saveCatalogList = (updated) => {
    setCatalogList(updated);
    try {
      localStorage.setItem('hisabkitab_hc_diagnostic_tests_v2', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Local state for orders & reports with 12 order statuses & 5 report statuses
  const [ordersList, setOrdersList] = useState(() => {
    try {
      const saved = localStorage.getItem('hisabkitab_hc_lab_orders_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return (labOrders || []).map(o => ({
      ...o,
      branch_id: o.branch_id || 'dhanmondi',
      branch_name: o.branch_name || 'ধানমন্ডি মেইন ব্রাঞ্চ',
      priority: o.priority || 'সাধারণ',
      collection_location: o.collection_location || 'ইন-হাউস ল্যাব',
      payment_status: o.payment_status || (o.due_amount > 0 ? 'আংশিক' : 'পরিশোধিত'),
      order_status: o.order_status || 'অর্ডার হয়েছে',
      order_notes: o.order_notes || '',
      samples: o.samples || (o.tests || []).map((t, idx) => ({
        sample_id: t.sample_id || `SMP-${Date.now().toString().slice(-4)}-${idx + 1}`,
        sample_type: t.sample_type || 'রক্ত (EDTA/Serum)',
        barcode_label: `BAR-${Date.now().toString().slice(-4)}-${t.test_code || 'LAB'}`,
        collection_datetime: o.order_date || new Date().toLocaleString('bn-BD'),
        collector_staff: 'মোঃ রফিকুল ইসলাম (ফ্লেবোটোমিস্ট)',
        receiver_staff: 'নাজমিন আক্তার (ল্যাব টেকনোলজিস্ট)',
        sample_status: 'গৃহীত',
        rejection_reason: '',
        resample_info: ''
      })),
      report_data: o.report_data || {
        report_number: `REP-${o.lab_order_id?.replace('ORD-', '') || Date.now().toString().slice(-5)}`,
        report_status: o.order_status === 'অনুমোদিত' ? 'অনুমোদিত' : 'খসড়া',
        report_version: 1,
        technologist_name: 'মোঃ আলমগীর হোসেন (সিনিয়র মেডিকেল টেকনোলজিস্ট)',
        verifier_name: 'ডাঃ নাসরিন সুলতানা (মেডিকেল অফিসার, প্যাথলজি)',
        approver_name: o.verified_by || 'ডাঃ কামরুল হাসান (এমবিবিএস, এমডি - চিফ কনসালট্যান্ট প্যাথলজিস্ট)',
        report_datetime: new Date().toLocaleString('bn-BD'),
        clinical_remarks: 'সার্বিক ক্লিনিক্যাল পর্যবেক্ষণ ও রেফারেন্স রেঞ্জের সঙ্গে সংগতিপূর্ণ।',
        revisions: []
      }
    }));
  });

  const saveOrdersList = (updated) => {
    setOrdersList(updated);
    try {
      localStorage.setItem('hisabkitab_hc_lab_orders_v2', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Filters
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [catalogBranchFilter, setCatalogBranchFilter] = useState('ALL');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderBranchFilter, setOrderBranchFilter] = useState('ALL');
  const [reportStatusFilter, setReportStatusFilter] = useState('ALL');
  const [reportSearch, setReportSearch] = useState('');

  // Modals state
  const [showNewTestModal, setShowNewTestModal] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [branchPricingTest, setBranchPricingTest] = useState(null);
  const [branchActivateTest, setBranchActivateTest] = useState(null);
  const [showPackageModal, setShowPackageModal] = useState(false);

  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [sampleCollectionOrder, setSampleCollectionOrder] = useState(null);
  const [selectedOrderForBarcode, setSelectedOrderForBarcode] = useState(null);
  const [cancelOrderTarget, setCancelOrderTarget] = useState(null);
  const [cancelReasonText, setCancelReasonText] = useState('');

  const [activeReportOrder, setActiveReportOrder] = useState(null);
  const [isEditingApprovedReport, setIsEditingApprovedReport] = useState(false);
  const [revisionReasonText, setRevisionReasonText] = useState('');
  const [viewingA4ReportOrder, setViewingA4ReportOrder] = useState(null);

  // Maker-checker separation policy enforcement toggle
  const [enforceMakerChecker, setEnforceMakerChecker] = useState(() => {
    try {
      return localStorage.getItem('hisabkitab_lims_maker_checker') === 'true';
    } catch {
      return true;
    }
  });

  // Filtered Catalog Tests
  const filteredCatalogTests = useMemo(() => {
    return catalogList.filter(t => {
      const matchCat = selectedCategoryFilter === 'ALL' || t.main_category === selectedCategoryFilter || t.department === selectedCategoryFilter;
      const matchBranch = catalogBranchFilter === 'ALL' || (t.allowed_branches && t.allowed_branches.includes(catalogBranchFilter));
      const q = catalogSearch.toLowerCase().trim();
      const matchQuery =
        !q ||
        t.test_code?.toLowerCase().includes(q) ||
        t.test_name_english?.toLowerCase().includes(q) ||
        (t.test_name_bangla && t.test_name_bangla.toLowerCase().includes(q)) ||
        t.main_category?.toLowerCase().includes(q) ||
        t.specimen_type?.toLowerCase().includes(q);
      return matchCat && matchBranch && matchQuery;
    });
  }, [catalogList, selectedCategoryFilter, catalogBranchFilter, catalogSearch]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return ordersList.filter(o => {
      const matchStatus = orderStatusFilter === 'ALL' || o.order_status === orderStatusFilter;
      const matchBranch = orderBranchFilter === 'ALL' || o.branch_id === orderBranchFilter;
      const q = orderSearch.toLowerCase().trim();
      const matchQuery =
        !q ||
        o.lab_order_id?.toLowerCase().includes(q) ||
        o.patient_name?.toLowerCase().includes(q) ||
        o.patient_phone?.includes(q) ||
        o.doctor_name?.toLowerCase().includes(q);
      return matchStatus && matchBranch && matchQuery;
    });
  }, [ordersList, orderStatusFilter, orderBranchFilter, orderSearch]);

  // Filtered Reports
  const filteredReports = useMemo(() => {
    return ordersList.filter(o => {
      const rep = o.report_data || {};
      const matchStatus = reportStatusFilter === 'ALL' || rep.report_status === reportStatusFilter;
      const q = reportSearch.toLowerCase().trim();
      const matchQuery =
        !q ||
        rep.report_number?.toLowerCase().includes(q) ||
        o.lab_order_id?.toLowerCase().includes(q) ||
        o.patient_name?.toLowerCase().includes(q) ||
        rep.approver_name?.toLowerCase().includes(q);
      return matchStatus && matchQuery;
    });
  }, [ordersList, reportStatusFilter, reportSearch]);

  // -------------------------------------------------------------
  // RULE: Historical Order Price Freeze
  // Changing test price in catalog does NOT alter existing orders
  // -------------------------------------------------------------
  const handleSaveTest = (testData) => {
    if (editingTest) {
      const updated = catalogList.map(t => (t.test_id === editingTest.test_id ? { ...t, ...testData } : t));
      saveCatalogList(updated);
      showToast(lang === 'bn' ? `টেস্ট "${testData.test_name_english}" সফলভাবে আপডেট হয়েছে! (ঐতিহাসিক অর্ডারের মূল্য অপরিবর্তিত থাকবে)` : 'Test updated successfully! (Historical orders price frozen)', 'success');
      setEditingTest(null);
    } else {
      const newTest = {
        ...testData,
        test_id: `TEST-${Date.now().toString().slice(-5)}`,
        active: true,
        allowed_branches: testData.allowed_branches || branches.map(b => b.id),
        branch_overrides: testData.branch_overrides || {}
      };
      saveCatalogList([newTest, ...catalogList]);
      showToast(lang === 'bn' ? 'নতুন টেস্ট সফলভাবে ক্যাটালগে যুক্ত হয়েছে!' : 'New test added to catalog!', 'success');
      setShowNewTestModal(false);
    }
  };

  // Branch Activation Toggle
  const handleToggleBranchActive = (testId, branchId) => {
    const updated = catalogList.map(t => {
      if (t.test_id === testId) {
        const currentBranches = t.allowed_branches || [];
        const isPresent = currentBranches.includes(branchId);
        const nextBranches = isPresent ? currentBranches.filter(b => b !== branchId) : [...currentBranches, branchId];
        return { ...t, allowed_branches: nextBranches };
      }
      return t;
    });
    saveCatalogList(updated);
    showToast(lang === 'bn' ? 'শাখায় টেস্টের প্রাপ্যতা আপডেট করা হয়েছে!' : 'Branch test availability updated!', 'info');
  };

  // Branch Price Override Save
  const handleSaveBranchPricing = (testId, branchOverrides) => {
    const updated = catalogList.map(t => {
      if (t.test_id === testId) {
        return { ...t, branch_overrides: branchOverrides };
      }
      return t;
    });
    saveCatalogList(updated);
    showToast(lang === 'bn' ? 'শাখাভিত্তিক মূল্য ও যন্ত্রপাতির কনফিগারেশন সংরক্ষিত হয়েছে!' : 'Branch pricing & equipment saved!', 'success');
    setBranchPricingTest(null);
  };

  // -------------------------------------------------------------
  // SCREEN 2: TEST ORDERS & SAMPLE COLLECTION ACTIONS
  // -------------------------------------------------------------
  const handleCreateNewOrder = (orderPayload) => {
    // Freeze price at time of order creation
    const currentBranchId = orderPayload.branch_id || activeBranchId || 'dhanmondi';
    const branchObj = branches.find(b => b.id === currentBranchId) || branches[0];

    const testsWithFrozenPrice = orderPayload.tests.map(t => {
      const catalogItem = catalogList.find(c => c.test_id === t.test_id) || t;
      const branchOverride = catalogItem.branch_overrides?.[currentBranchId];
      const appliedPrice = orderPayload.priority === 'জরুরি'
        ? (branchOverride?.emergency_price || catalogItem.emergency_price || (catalogItem.regular_price * 1.4))
        : (branchOverride?.price || catalogItem.regular_price || 0);

      return {
        test_id: catalogItem.test_id,
        test_code: catalogItem.test_code,
        test_name: catalogItem.test_name_english,
        test_name_bn: catalogItem.test_name_bangla,
        department: catalogItem.department || catalogItem.main_category,
        frozen_price: Number(appliedPrice),
        sample_type: catalogItem.specimen_type || 'রক্ত (EDTA/Serum)',
        container: catalogItem.container_type || 'স্ট্যান্ডার্ড টেস্ট টিউব',
        parameters: catalogItem.parameters || [
          { id: 'param_main', name: 'Clinical Study Finding', unit: '', ref_male: 'Normal' }
        ],
        results: {}
      };
    });

    const subtotal = testsWithFrozenPrice.reduce((sum, item) => sum + item.frozen_price, 0);
    const discount = Number(orderPayload.discount) || 0;
    const totalAmount = Math.max(0, subtotal - discount);
    const paidAmount = Number(orderPayload.paid_amount) || totalAmount;
    const dueAmount = Math.max(0, totalAmount - paidAmount);

    const newOrderNumber = `ORD-${Date.now().toString().slice(-6)}`;
    const newOrder = {
      lab_order_id: newOrderNumber,
      branch_id: currentBranchId,
      branch_name: branchObj.name,
      patient_id: orderPayload.patient_id,
      patient_name: orderPayload.patient_name,
      patient_phone: orderPayload.patient_phone,
      doctor_name: orderPayload.doctor_name || 'ডাঃ তানভীর আহমেদ (MBBS, FCPS)',
      linked_visit_id: orderPayload.linked_visit_id || `VIS-${Date.now().toString().slice(-4)}`,
      priority: orderPayload.priority || 'সাধারণ',
      order_date: new Date().toLocaleString('bn-BD'),
      collection_location: orderPayload.collection_location || 'ইন-হাউস ল্যাব',
      payment_status: dueAmount === 0 ? 'পরিশোধিত' : (paidAmount > 0 ? 'আংশিক' : 'পেমেন্ট অপেক্ষমাণ'),
      order_status: dueAmount > 0 && paidAmount === 0 ? 'পেমেন্ট অপেক্ষমাণ' : 'নমুনা সংগ্রহ বাকি',
      order_notes: orderPayload.order_notes || '',
      tests: testsWithFrozenPrice,
      total_amount: totalAmount,
      discount: discount,
      paid_amount: paidAmount,
      due_amount: dueAmount,
      samples: testsWithFrozenPrice.map((t, idx) => ({
        sample_id: `SMP-${Date.now().toString().slice(-4)}-${idx + 1}`,
        sample_type: t.sample_type,
        barcode_label: `BAR-${Date.now().toString().slice(-4)}-${t.test_code}`,
        collection_datetime: '',
        collector_staff: '',
        receiver_staff: '',
        sample_status: 'নমুনা সংগ্রহ বাকি',
        rejection_reason: '',
        resample_info: ''
      })),
      report_data: {
        report_number: `REP-${newOrderNumber.replace('ORD-', '')}`,
        report_status: 'খসড়া',
        report_version: 1,
        technologist_name: 'মোঃ আলমগীর হোসেন (সিনিয়র মেডিকেল টেকনোলজিস্ট)',
        verifier_name: 'ডাঃ নাসরিন সুলতana (মেডিকেল অফিসার, প্যাথলজি)',
        approver_name: 'ডাঃ কামরুল হাসান (এমবিবিএস, এমডি - চিফ কনসালট্যান্ট প্যাথলজিস্ট)',
        report_datetime: '',
        clinical_remarks: 'নমুনা বিশ্লেষণ প্রক্রিয়া সম্পন্ন হওয়ার পর বিস্তারিত ফাইন্ডিংস সংযুক্ত করা হবে।',
        revisions: []
      }
    };

    saveOrdersList([newOrder, ...ordersList]);
    showToast(lang === 'bn' ? `নতুন টেস্ট অর্ডার #${newOrder.lab_order_id} সফলভাবে সম্পন্ন হয়েছে!` : `Lab Order created: #${newOrder.lab_order_id}`, 'success');
    setShowNewOrderModal(false);
  };

  // Perform Sample Collection
  const handleSaveSampleCollection = (orderId, sampleData) => {
    const updated = ordersList.map(o => {
      if (o.lab_order_id === orderId) {
        const updatedSamples = (o.samples || []).map(s => ({
          ...s,
          collection_datetime: new Date().toLocaleString('bn-BD'),
          collector_staff: sampleData.collector_staff || 'মোঃ রফিকুল ইসলাম (ফ্লেবোটোমিস্ট)',
          receiver_staff: sampleData.receiver_staff || 'নাজমিন আক্তার (ল্যাব টেকনোলজিস্ট)',
          sample_status: sampleData.sample_status || 'নমুনা সংগ্রহ হয়েছে',
          rejection_reason: sampleData.rejection_reason || '',
          resample_info: sampleData.resample_info || ''
        }));
        return {
          ...o,
          order_status: sampleData.sample_status === 'বাতিল' ? 'বাতিল' : 'নমুনা সংগ্রহ হয়েছে',
          samples: updatedSamples
        };
      }
      return o;
    });
    saveOrdersList(updated);
    showToast(lang === 'bn' ? 'নমুনা সংগ্রহের তথ্য সফলভাবে সংরক্ষিত হয়েছে!' : 'Sample collection recorded!', 'success');
    setSampleCollectionOrder(null);
  };

  // Transition Order Status
  const handleUpdateOrderStatus = (orderId, newStatus) => {
    const updated = ordersList.map(o => {
      if (o.lab_order_id === orderId) {
        return { ...o, order_status: newStatus };
      }
      return o;
    });
    saveOrdersList(updated);
    showToast(lang === 'bn' ? `অর্ডার স্ট্যাটাস "${newStatus}" এ পরিবর্তন করা হয়েছে!` : `Order status changed to ${newStatus}`, 'info');
  };

  // Cancel Order with Reason
  const handleConfirmCancelOrder = () => {
    if (!cancelOrderTarget) return;
    const updated = ordersList.map(o => {
      if (o.lab_order_id === cancelOrderTarget.lab_order_id) {
        return {
          ...o,
          order_status: 'বাতিল',
          cancellation_reason: cancelReasonText || 'প্রশাসনিক/রোগীর অনুরোধে বাতিল',
          cancelled_at: new Date().toLocaleString('bn-BD')
        };
      }
      return o;
    });
    saveOrdersList(updated);
    showToast(lang === 'bn' ? `অর্ডার #${cancelOrderTarget.lab_order_id} বাতিল করা হয়েছে!` : 'Order cancelled', 'warning');
    setCancelOrderTarget(null);
    setCancelReasonText('');
  };

  // -------------------------------------------------------------
  // SCREEN 3: REPORT ACTIONS & VERSION CONTROL SPECIFICATION
  // -------------------------------------------------------------
  const handleSaveReportDraft = (orderId, reportPayload) => {
    const updated = ordersList.map(o => {
      if (o.lab_order_id === orderId) {
        return {
          ...o,
          order_status: 'রিপোর্ট খসড়া',
          report_data: {
            ...o.report_data,
            ...reportPayload,
            report_status: 'খসড়া',
            report_datetime: new Date().toLocaleString('bn-BD')
          }
        };
      }
      return o;
    });
    saveOrdersList(updated);
    showToast(lang === 'bn' ? 'রিপোর্টের খসড়া সফলভাবে সংরক্ষিত হয়েছে!' : 'Report draft saved!', 'success');
    setActiveReportOrder(null);
  };

  const handleSubmitReportForVerification = (orderId) => {
    const updated = ordersList.map(o => {
      if (o.lab_order_id === orderId) {
        return {
          ...o,
          order_status: 'যাচাই অপেক্ষমাণ',
          report_data: {
            ...o.report_data,
            report_status: 'যাচাই অপেক্ষমাণ'
          }
        };
      }
      return o;
    });
    saveOrdersList(updated);
    showToast(lang === 'bn' ? 'রিপোর্টটি যাচাইয়ের জন্য চিফ প্যাথলজিস্টের নিকট পাঠানো হয়েছে!' : 'Report submitted for verification!', 'info');
    setActiveReportOrder(null);
  };

  // Approve Report (Rule: Maker-Checker policy enforcement)
  const handleApproveReport = (orderId, approverName) => {
    const targetOrder = ordersList.find(o => o.lab_order_id === orderId);
    if (enforceMakerChecker && targetOrder?.report_data?.technologist_name === approverName) {
      showToast(lang === 'bn' ? 'প্রতিষ্ঠানের নীতি অনুযায়ী: রিপোর্ট তৈরিকারী এবং অনুমোদনকারী একই ব্যক্তি হতে পারবেন না!' : 'Maker-Checker rule violated: Drafter and Approver cannot be identical!', 'error');
      return;
    }

    const updated = ordersList.map(o => {
      if (o.lab_order_id === orderId) {
        return {
          ...o,
          order_status: 'অনুমোদিত',
          verified_by: approverName,
          report_data: {
            ...o.report_data,
            report_status: 'অনুমোদিত',
            approver_name: approverName,
            report_datetime: new Date().toLocaleString('bn-BD')
          }
        };
      }
      return o;
    });
    saveOrdersList(updated);
    showToast(lang === 'bn' ? 'রিপোর্টটি অনুমোদিত হয়েছে এবং প্রিন্ট/ডেলিভারির জন্য প্রস্তুত!' : 'Report officially approved!', 'success');
    setActiveReportOrder(null);
  };

  // Return for Revision
  const handleReturnReportForRevision = (orderId, note) => {
    const updated = ordersList.map(o => {
      if (o.lab_order_id === orderId) {
        return {
          ...o,
          order_status: 'পরীক্ষা চলছে',
          report_data: {
            ...o.report_data,
            report_status: 'সংশোধন প্রয়োজন',
            revision_feedback: note || 'পুনরায় ক্যালিব্রেশন ও রেজাল্ট যাচাই প্রয়োজন'
          }
        };
      }
      return o;
    });
    saveOrdersList(updated);
    showToast(lang === 'bn' ? 'রিপোর্টটি সংশোধনের জন্য ফেরত পাঠানো হয়েছে!' : 'Report returned for revision!', 'warning');
    setActiveReportOrder(null);
  };

  // Editing Approved Report -> Rule: Bumps Version (v1 -> v2) and Saves Immutable Revision Audit
  const handleSaveRevisedApprovedReport = (orderId, revisedData, reason) => {
    const updated = ordersList.map(o => {
      if (o.lab_order_id === orderId) {
        const prevRep = o.report_data || {};
        const oldVersion = prevRep.report_version || 1;
        const newVersion = oldVersion + 1;

        const auditItem = {
          version: `v${oldVersion}.0`,
          modified_by: 'ডাঃ কামরুল হাসান (চিফ প্যাথলজিস্ট)',
          modified_at: new Date().toLocaleString('bn-BD'),
          reason: reason || 'ক্লিনিক্যাল রি-অ্যাসেসমেন্ট ও ল্যাব সংশোধন',
          previous_remarks: prevRep.clinical_remarks
        };

        return {
          ...o,
          order_status: 'অনুমোদিত',
          report_data: {
            ...prevRep,
            ...revisedData,
            report_version: newVersion,
            report_status: 'অনুমোদিত',
            report_datetime: new Date().toLocaleString('bn-BD'),
            revisions: [auditItem, ...(prevRep.revisions || [])]
          }
        };
      }
      return o;
    });
    saveOrdersList(updated);
    showToast(lang === 'bn' ? `রিপোর্টের নতুন সংস্করণ (v${(ordersList.find(o => o.lab_order_id === orderId)?.report_data?.report_version || 1) + 1}.0) তৈরি হয়েছে ও অডিট লগ সংরক্ষিত হয়েছে!` : 'New report version created with audit log!', 'success');
    setActiveReportOrder(null);
    setIsEditingApprovedReport(false);
    setRevisionReasonText('');
  };

  // Mark Report as Delivered to Patient
  const handleMarkDelivered = (orderId) => {
    const updated = ordersList.map(o => {
      if (o.lab_order_id === orderId) {
        return {
          ...o,
          order_status: 'রোগীকে দেওয়া হয়েছে',
          delivered_at: new Date().toLocaleString('bn-BD'),
          report_data: {
            ...o.report_data,
            report_status: 'রোগীকে দেওয়া হয়েছে'
          }
        };
      }
      return o;
    });
    saveOrdersList(updated);
    showToast(lang === 'bn' ? 'রিপোর্ট সফলভাবে রোগীকে প্রদান হিসেবে চিহ্নিত হয়েছে!' : 'Report marked as delivered!', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-xl">🔬</span>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                ডায়াগনস্টিক ও ল্যাবরেটরি ম্যানেজমেন্ট (LIMS 360°)
              </h1>
              <p className="text-slate-500 text-xs mt-0.5">
                টেস্ট ক্যাটালগ, মাল্টি-ব্রাঞ্চ প্রাইসিং, ১২-ধাপের নমুনা ও অর্ডার ট্র্যাকিং এবং সংস্করণ-নিয়ন্ত্রিত প্যাথলজি রিপোর্ট
              </p>
            </div>
          </div>
        </div>

        {/* 4 Core Workspace Tabs */}
        <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 overflow-x-auto text-xs font-semibold gap-1">
          <button
            type="button"
            className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'test_catalog' ? 'bg-white text-emerald-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => setActiveTab('test_catalog')}
          >
            <span>📚</span>
            <span>টেস্ট ক্যাটালগ ({catalogList.length})</span>
          </button>

          <button
            type="button"
            className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'orders_samples' ? 'bg-white text-emerald-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => setActiveTab('orders_samples')}
          >
            <span>📋</span>
            <span>টেস্ট অর্ডার ও নমুনা সংগ্রহ ({ordersList.length})</span>
          </button>

          <button
            type="button"
            className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'diagnostic_reports' ? 'bg-white text-emerald-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => setActiveTab('diagnostic_reports')}
          >
            <span>📑</span>
            <span>রিপোর্ট স্ক্রিন ({ordersList.filter(o => o.order_status === 'অনুমোদিত' || o.order_status === 'যাচাই অপেক্ষমাণ' || o.order_status === 'রিপোর্ট খসড়া').length})</span>
          </button>

          <button
            type="button"
            className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'test_packages' ? 'bg-white text-emerald-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => setActiveTab('test_packages')}
          >
            <span>🧬</span>
            <span>টেস্ট প্যাকেজ ({testPackages?.length || 0})</span>
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------
          SCREEN 1: টেস্ট ক্যাটালগ (TEST CATALOG)
          ------------------------------------------------------------- */}
      {activeTab === 'test_catalog' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
          {/* Action Header & Filter Bar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <span>🧪 টেস্ট ক্যাটালগ ও শাখাভিত্তিক প্রাপ্যতা</span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  মোট {filteredCatalogTests.length}টি টেস্ট
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                মাল্টি-ব্রাঞ্চ নিয়ম: সব শাখায় সাধারণ নাম এক থাকবে; তবে শাখাভেদে মূল্য, যন্ত্রপাতি ও TAT আলাদা হতে পারবে।
              </p>
            </div>

            {/* 5 Core Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => { setEditingTest(null); setShowNewTestModal(true); }}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-1.5 transition-all"
              >
                <Plus size={14} />
                <span>[নতুন টেস্ট]</span>
              </button>

              <button
                onClick={() => setShowPackageModal(true)}
                className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-1.5 transition-all"
              >
                <Layers size={14} />
                <span>[টেস্ট প্যাকেজ তৈরি]</span>
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="🔍 টেস্ট কোড, নাম বা স্পেসিমেন দিয়ে খুঁজুন..."
                value={catalogSearch}
                onChange={e => setCatalogSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500"
              />
              <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            </div>

            <select
              value={selectedCategoryFilter}
              onChange={e => setSelectedCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="ALL">সকল বিভাগ / ক্যাটাগরি (৫০টি)</option>
              {diagnosticCategories?.map(c => (
                <option key={c.id} value={c.name_en}>{c.name_en} ({c.name_bn})</option>
              ))}
            </select>

            <select
              value={catalogBranchFilter}
              onChange={e => setCatalogBranchFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="ALL">সকল শাখার টেস্ট</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>শাখা: {b.name}</option>
              ))}
            </select>
          </div>

          {/* Catalog Table displaying all 11 fields */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold">
                  <th className="p-3">টেস্ট কোড</th>
                  <th className="p-3">টেস্টের নাম</th>
                  <th className="p-3">বিভাগ</th>
                  <th className="p-3">নমুনার ধরন ও প্রস্তুতি</th>
                  <th className="p-3 text-right">টেস্টের মূল্য (সাধারণ / জরুরি)</th>
                  <th className="p-3">রিপোর্টের সময় (TAT)</th>
                  <th className="p-3">প্রাপ্য শাখা</th>
                  <th className="p-3 text-center">বাহ্যিক ল্যাব</th>
                  <th className="p-3 text-center">অবস্থা</th>
                  <th className="p-3 text-center">অ্যাকশন বোতাম</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCatalogTests.map(test => {
                  const allowed = test.allowed_branches || [];
                  return (
                    <tr key={test.test_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-mono font-bold text-emerald-700">
                        {test.test_code}
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-slate-900">{test.test_name_english}</div>
                        <div className="text-slate-500 text-[11px]">{test.test_name_bangla}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">রেফারেন্স: {test.result_type}</div>
                      </td>

                      <td className="p-3 text-slate-700 font-medium">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px]">
                          {test.department || test.main_category}
                        </span>
                      </td>

                      <td className="p-3">
                        <div className="font-medium text-slate-800">{test.specimen_type}</div>
                        {test.container_type && (
                          <div className="text-[10px] text-slate-500 font-mono">টিউব: {test.container_type}</div>
                        )}
                        <div className="text-[10px] text-amber-700 mt-0.5">
                          প্রস্তুতি: {test.preparation_instructions || (test.fasting_requirement ? 'খালি পেটে' : 'স্বাভাবিক')}
                        </div>
                      </td>

                      <td className="p-3 text-right font-mono">
                        <div className="font-bold text-slate-900 text-sm">৳{test.regular_price}</div>
                        {test.emergency_price && (
                          <div className="text-[10px] text-rose-600 font-semibold">জরুরি: ৳{test.emergency_price}</div>
                        )}
                      </td>

                      <td className="p-3 font-mono text-slate-600">
                        {test.report_turnaround_time || '৪ ঘণ্টা'}
                      </td>

                      <td className="p-3">
                        <div className="flex flex-wrap gap-1 max-w-[140px]">
                          {branches.map(b => (
                            <span
                              key={b.id}
                              className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                                allowed.includes(b.id)
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-400 line-through'
                              }`}
                            >
                              {b.code}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="p-3 text-center">
                        {test.is_external_lab ? (
                          <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded text-[10px] font-bold">
                            হ্যাঁ ({test.external_lab_name || 'রেফারেল'})
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">ইন-হাউস</span>
                        )}
                      </td>

                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          test.active !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {test.active !== false ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                        </span>
                      </td>

                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => { setEditingTest(test); setShowNewTestModal(true); }}
                            className="p-1.5 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                            title="[সম্পাদনা] টেস্টের তথ্য সম্পাদনা করুন"
                          >
                            <Edit2 size={13} />
                          </button>

                          <button
                            onClick={() => setBranchActivateTest(test)}
                            className="p-1.5 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold"
                            title="[শাখায় সক্রিয় করুন] শাখায় অন/অফ করুন"
                          >
                            <Building2 size={13} />
                          </button>

                          <button
                            onClick={() => setBranchPricingTest(test)}
                            className="p-1.5 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold"
                            title="[মূল্য সেট করুন] শাখাভিত্তিক মূল্য ও ইকুইপমেন্ট"
                          >
                            <Sliders size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          SCREEN 2: টেস্ট অর্ডার ও নমুনা সংগ্রহ (TEST ORDERS & PHLEBOTOMY)
          ------------------------------------------------------------- */}
      {activeTab === 'orders_samples' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
          {/* Top Bar with Status Counts */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <span>📋 টেস্ট অর্ডার ও নমুনা সংগ্রহ ওয়ার্কস্টেশন</span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  মোট {filteredOrders.length}টি অর্ডার
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                ১২টি সুনির্দিষ্ট অর্ডার অবস্থা, টিউব বারকোড ট্র্যাকিং, রিজেকশন কারণ ও ল্যাব প্রসেসিং লাইফসাইকেল
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowNewOrderModal(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-1.5"
              >
                <Plus size={14} />
                <span>[নতুন অর্ডার]</span>
              </button>
            </div>
          </div>

          {/* 12 Status Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 text-[11px] font-bold">
            <button
              onClick={() => setOrderStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl border transition-all ${
                orderStatusFilter === 'ALL' ? 'bg-slate-800 text-white border-slate-800 shadow-xs' : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}
            >
              সকল অর্ডার ({ordersList.length})
            </button>
            {LAB_ORDER_STATUSES.map(st => {
              const count = ordersList.filter(o => o.order_status === st.id).length;
              return (
                <button
                  key={st.id}
                  onClick={() => setOrderStatusFilter(st.id)}
                  className={`px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1 shrink-0 ${
                    orderStatusFilter === st.id
                      ? 'border-current font-black shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                  style={{
                    color: st.color,
                    background: orderStatusFilter === st.id ? st.bg : undefined
                  }}
                >
                  <span>{st.label}</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-white/70 border border-current">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search & Branch Filter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="🔍 অর্ডার নম্বর, রোগীর নাম বা মোবাইল দিয়ে খুঁজুন..."
                value={orderSearch}
                onChange={e => setOrderSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
              <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            </div>

            <select
              value={orderBranchFilter}
              onChange={e => setOrderBranchFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="ALL">সকল শাখার অর্ডার</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>শাখা: {b.name}</option>
              ))}
            </select>
          </div>

          {/* Orders Cards / Table */}
          <div className="space-y-3">
            {filteredOrders.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs">
                কোনো টেস্ট অর্ডার পাওয়া যায়নি।
              </div>
            ) : (
              filteredOrders.map(order => {
                const statusMeta = LAB_ORDER_STATUSES.find(s => s.id === order.order_status) || LAB_ORDER_STATUSES[0];
                return (
                  <div
                    key={order.lab_order_id}
                    className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 shadow-xs transition-all space-y-3"
                  >
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-black text-sm text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                          #{order.lab_order_id}
                        </span>
                        <span className="text-xs font-bold text-slate-700">
                          {order.patient_name} ({order.patient_id})
                        </span>
                        <span className="text-xs text-slate-500 font-mono">{order.patient_phone}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                          শাখা: {order.branch_name || order.branch_id}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          order.priority === 'জরুরি' ? 'bg-rose-100 text-rose-800 animate-pulse' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {order.priority || 'সাধারণ'}
                        </span>
                      </div>

                      {/* Status Badge */}
                      <div className="flex items-center gap-2">
                        <span
                          className="px-2.5 py-1 rounded-lg text-xs font-extrabold flex items-center gap-1 border"
                          style={{ color: statusMeta.color, background: statusMeta.bg, borderColor: `${statusMeta.color}40` }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          <span>{order.order_status}</span>
                        </span>
                      </div>
                    </div>

                    {/* Middle Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div>
                        <div className="text-slate-400 text-[10px] font-bold uppercase">রেফারেন্স ও ভিজিট:</div>
                        <div className="font-semibold text-slate-800">{order.doctor_name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">ভিজিট নং: {order.linked_visit_id || 'N/A'}</div>
                        <div className="text-[11px] text-slate-500">তারিখ: {order.order_date}</div>
                        <div className="text-[11px] text-emerald-700 font-medium">স্থান: {order.collection_location}</div>
                      </div>

                      <div>
                        <div className="text-slate-400 text-[10px] font-bold uppercase">অর্ডারের টেস্টসমূহ ({order.tests?.length || 0}):</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {order.tests?.map((t, i) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px] border border-slate-200">
                              {t.test_code}: {t.test_name} (৳{t.frozen_price || t.price})
                            </span>
                          ))}
                        </div>
                        {order.order_notes && (
                          <div className="mt-1.5 text-[11px] text-amber-800 bg-amber-50 p-1.5 rounded border border-amber-200">
                            নোট: {order.order_notes}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col justify-between">
                        <div>
                          <div className="text-slate-400 text-[10px] font-bold uppercase">পেমেন্ট ও স্যাম্পল:</div>
                          <div className="font-mono text-slate-800">মোট: <strong>৳{order.total_amount}</strong> | পরিশোধিত: <strong className="text-emerald-700">৳{order.paid_amount}</strong></div>
                          {order.due_amount > 0 && (
                            <div className="text-rose-600 font-mono font-bold text-[11px]">বকেয়া: ৳{order.due_amount} ({order.payment_status})</div>
                          )}
                          <div className="text-[11px] text-slate-600 mt-0.5">
                            স্যাম্পল সংখ্যা: {order.samples?.length || 1}টি
                          </div>
                        </div>

                        {/* Order Cancellation Info if cancelled */}
                        {order.order_status === 'বাতিল' && order.cancellation_reason && (
                          <div className="mt-1 text-[10px] text-rose-700 bg-rose-50 p-1 rounded border border-rose-200 font-semibold">
                            বাতিলের কারণ: {order.cancellation_reason}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action Buttons (All 6 Buttons) */}
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {/* 1. [নমুনা সংগ্রহ] Button */}
                        <button
                          onClick={() => setSampleCollectionOrder(order)}
                          className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs"
                        >
                          <Droplet size={13} />
                          <span>[নমুনা সংগ্রহ]</span>
                        </button>

                        {/* 2. [বারকোড প্রিন্ট] Button */}
                        <button
                          onClick={() => setSelectedOrderForBarcode(order)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs"
                        >
                          <Barcode size={13} />
                          <span>[বারকোড প্রিন্ট]</span>
                        </button>

                        {/* 3. [ল্যাব ওয়ার্কলিস্টে পাঠান] Button */}
                        <button
                          onClick={() => handleUpdateOrderStatus(order.lab_order_id, 'ল্যাবে পাঠানো হয়েছে')}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs"
                        >
                          <FlaskConical size={13} />
                          <span>[ল্যাব ওয়ার্কলিস্টে পাঠান]</span>
                        </button>

                        {/* Quick Testing in progress step */}
                        <button
                          onClick={() => handleUpdateOrderStatus(order.lab_order_id, 'পরীক্ষা চলছে')}
                          className="px-2.5 py-1.5 bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 rounded-lg text-xs font-semibold"
                        >
                          পরীক্ষা শুরু
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* 4. [রিপোর্ট খুলুন] Button */}
                        <button
                          onClick={() => setActiveReportOrder(order)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs"
                        >
                          <FileText size={13} />
                          <span>[রিপোর্ট খুলুন]</span>
                        </button>

                        {/* 5. [বাতিল] Button */}
                        {order.order_status !== 'বাতিল' && (
                          <button
                            onClick={() => { setCancelOrderTarget(order); setCancelReasonText(''); }}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold"
                          >
                            [বাতিল]
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          SCREEN 3: রিপোর্ট স্ক্রিন (DIAGNOSTIC REPORT CENTER)
          ------------------------------------------------------------- */}
      {activeTab === 'diagnostic_reports' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
          {/* Header & Policy Toggle */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <span>📑 ডায়াগনস্টিক রিপোর্ট ভেরিফিকেশন ও সংস্করণ নিয়ন্ত্রণ</span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800">
                  মোট {filteredReports.length}টি রিপোর্ট
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                ৫টি রিপোর্ট অবস্থা, মেকার-চেকার নীতি (তৈরি ও অনুমোদন পৃথক ব্যক্তি), সংস্করণ সংস্করণ-লগ এবং অফিশিয়াল সিলযুক্ত প্রিন্ট
              </p>
            </div>

            {/* Maker-Checker Separation Rule Toggle */}
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
              <ShieldCheck size={16} className={enforceMakerChecker ? 'text-emerald-600' : 'text-slate-400'} />
              <div className="text-xs">
                <span className="font-bold text-slate-700">মেকার-চেকার পৃথকীকরণ নীতি:</span>
                <button
                  onClick={() => {
                    const nextVal = !enforceMakerChecker;
                    setEnforceMakerChecker(nextVal);
                    localStorage.setItem('hisabkitab_lims_maker_checker', String(nextVal));
                    showToast(lang === 'bn' ? `মেকার-চেকার নীতি ${nextVal ? 'বাধ্যতামূলক করা হয়েছে' : 'শিথিল করা হয়েছে'}` : 'Maker-Checker policy updated', 'info');
                  }}
                  className={`ml-2 px-2 py-0.5 rounded font-extrabold text-[10px] ${
                    enforceMakerChecker ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
                  }`}
                >
                  {enforceMakerChecker ? '✓ বাধ্যতামূলক' : 'ঐচ্ছিক'}
                </button>
              </div>
            </div>
          </div>

          {/* 5 Status Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
            <button
              onClick={() => setReportStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl border transition-all ${
                reportStatusFilter === 'ALL' ? 'bg-slate-800 text-white border-slate-800 shadow-xs' : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}
            >
              সকল রিপোর্ট ({ordersList.length})
            </button>
            {REPORT_STATUSES.map(st => {
              const count = ordersList.filter(o => o.report_data?.report_status === st.id).length;
              return (
                <button
                  key={st.id}
                  onClick={() => setReportStatusFilter(st.id)}
                  className={`px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 shrink-0 ${
                    reportStatusFilter === st.id ? 'border-current font-black shadow-xs' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                  style={{
                    color: st.color,
                    background: reportStatusFilter === st.id ? st.bg : undefined
                  }}
                >
                  <span>{st.label}</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-white/70 border border-current">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="🔍 রিপোর্ট নম্বর, অর্ডার আইডি বা রোগীর নাম..."
              value={reportSearch}
              onChange={e => setReportSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
          </div>

          {/* Reports Table with all 14 fields */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold">
                  <th className="p-3">রিপোর্ট ও অর্ডার নং</th>
                  <th className="p-3">শাখা ও রোগী</th>
                  <th className="p-3">টেস্ট ও ফাইন্ডিংস</th>
                  <th className="p-3">পরীক্ষাকারী ও যাচাইকারী</th>
                  <th className="p-3">অনুমোদনকারী</th>
                  <th className="p-3 text-center">সংস্করণ</th>
                  <th className="p-3 text-center">অবস্থা</th>
                  <th className="p-3 text-center">অ্যাকশন বোতাম</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReports.map(order => {
                  const rep = order.report_data || {};
                  const statusMeta = REPORT_STATUSES.find(s => s.id === rep.report_status) || REPORT_STATUSES[0];
                  return (
                    <tr key={order.lab_order_id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3">
                        <div className="font-mono font-bold text-slate-900">{rep.report_number}</div>
                        <div className="text-[11px] text-emerald-700 font-mono">অর্ডার: #{order.lab_order_id}</div>
                        <div className="text-[10px] text-slate-400">{rep.report_datetime || order.order_date}</div>
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-slate-800">{order.patient_name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{order.patient_id}</div>
                        <div className="text-[10px] text-slate-400">শাখা: {order.branch_name}</div>
                      </td>

                      <td className="p-3 max-w-[200px]">
                        <div className="font-medium text-slate-800 line-clamp-1">
                          {order.tests?.map(t => t.test_name).join(', ')}
                        </div>
                        <div className="text-[11px] text-slate-500 italic line-clamp-1 mt-0.5">
                          "{rep.clinical_remarks || 'স্বাভাবিক পর্যবেক্ষণ'}"
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="text-slate-800 font-semibold">{rep.technologist_name || 'মোঃ আলমগীর হোসেন'}</div>
                        <div className="text-[11px] text-slate-500 font-medium">যাচাই: {rep.verifier_name || 'ডাঃ নাসরিন সুলতানা'}</div>
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-slate-900">{rep.approver_name || 'ডাঃ কামরুল হাসান'}</div>
                        <div className="text-[10px] text-emerald-700 font-mono">চিফ প্যাথলজিস্ট (BMDC A-48291)</div>
                      </td>

                      <td className="p-3 text-center">
                        <span className="font-mono font-bold px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded text-[11px]">
                          v{rep.report_version || 1}.0
                        </span>
                        {rep.revisions?.length > 0 && (
                          <div className="text-[9px] text-slate-400 mt-0.5 font-semibold">
                            {rep.revisions.length}টি সংশোধন
                          </div>
                        )}
                      </td>

                      <td className="p-3 text-center">
                        <span
                          className="px-2.5 py-1 rounded text-[11px] font-extrabold border"
                          style={{ color: statusMeta.color, background: statusMeta.bg, borderColor: `${statusMeta.color}40` }}
                        >
                          {rep.report_status}
                        </span>
                      </td>

                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {/* Open Report Editor / Approver Modal */}
                          <button
                            onClick={() => setActiveReportOrder(order)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold"
                          >
                            সম্পাদনা / অনুমোদন
                          </button>

                          {/* Print / PDF Button */}
                          <button
                            onClick={() => setViewingA4ReportOrder(order)}
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold"
                            title="[PDF / প্রিন্ট] অফিশিয়াল রিপোর্ট প্রিন্ট"
                          >
                            <Printer size={13} />
                          </button>

                          {/* Mark as Delivered Button */}
                          {rep.report_status === 'অনুমোদিত' && (
                            <button
                              onClick={() => handleMarkDelivered(order.lab_order_id)}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-bold"
                              title="[রোগীকে প্রদান হিসেবে চিহ্নিত]"
                            >
                              ডেলিভার করুন
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          TAB 4: টেস্ট প্যাকেজ ও ডিজিজ বান্ডেল (PACKAGES & BUNDLES)
          ------------------------------------------------------------- */}
      {activeTab === 'test_packages' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-800">🧬 টেস্ট প্যাকেজ ও ডিজিজ ওয়ার্কআপ বান্ডেল</h2>
              <p className="text-xs text-slate-500">ক্যান্সার স্ক্রিনিং, ডায়াবেটিস প্যাকেজ, ফুল বডি চেকআপ ও মনিটরিং বান্ডেল</p>
            </div>
            <button
              onClick={() => setShowPackageModal(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs flex items-center gap-1"
            >
              <Plus size={14} />
              <span>[নতুন প্যাকেজ তৈরি করুন]</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(testPackages || []).map(bundle => (
              <div key={bundle.bundle_id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 bg-purple-100 text-purple-800 rounded">
                      {bundle.bundle_code}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {bundle.bundle_type}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm mt-2">
                    {bundle.bundle_name_bangla || bundle.bundle_name_english}
                  </h3>
                  <div className="text-[11px] text-slate-500 mt-1">বিভাগ: <strong>{bundle.disease_group}</strong></div>

                  <div className="mt-2 text-[10px] text-slate-600">
                    অন্তর্ভুক্ত টেস্ট: {bundle.included_tests?.join(', ')}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                  <div>
                    <div className="text-xs text-slate-400 line-through">৳{bundle.individual_price_total}</div>
                    <div className="text-sm font-extrabold text-purple-700">৳{bundle.package_price}</div>
                  </div>
                  <button
                    onClick={() => {
                      showToast(`বান্ডেল "${bundle.bundle_name_english}" সফলভাবে সিলেক্ট করা হয়েছে!`, 'success');
                      setActiveTab('orders_samples');
                      setShowNewOrderModal(true);
                    }}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs"
                  >
                    + অর্ডার করুন
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =============================================================
          MODAL 1: NEW / EDIT TEST MODAL (ALL 11 FIELDS)
          ============================================================= */}
      {showNewTestModal && (
        <TestCatalogEditModal
          test={editingTest}
          categories={diagnosticCategories}
          branches={branches}
          onSave={handleSaveTest}
          onClose={() => { setShowNewTestModal(false); setEditingTest(null); }}
        />
      )}

      {/* =============================================================
          MODAL 2: BRANCH PRICE & EQUIPMENT MATRIX MODAL
          ============================================================= */}
      {branchPricingTest && (
        <BranchPricingModal
          test={branchPricingTest}
          branches={branches}
          onSave={(overrides) => handleSaveBranchPricing(branchPricingTest.test_id, overrides)}
          onClose={() => setBranchPricingTest(null)}
        />
      )}

      {/* =============================================================
          MODAL 3: BRANCH ACTIVATION TOGGLE MODAL
          ============================================================= */}
      {branchActivateTest && (
        <BranchActivationModal
          test={branchActivateTest}
          branches={branches}
          onToggleBranch={(branchId) => handleToggleBranchActive(branchActivateTest.test_id, branchId)}
          onClose={() => setBranchActivateTest(null)}
        />
      )}

      {/* =============================================================
          MODAL 4: CREATE TEST PACKAGE / BUNDLE
          ============================================================= */}
      {showPackageModal && (
        <CreateTestPackageModal
          tests={catalogList}
          onClose={() => setShowPackageModal(false)}
          onSave={(pkg) => {
            showToast(`প্যাকেজ "${pkg.bundle_name_english}" তৈরি হয়েছে!`, 'success');
            setShowPackageModal(false);
          }}
        />
      )}

      {/* =============================================================
          MODAL 5: NEW TEST ORDER MODAL (FROZEN PRICING RULE)
          ============================================================= */}
      {showNewOrderModal && (
        <NewTestOrderModal
          patients={patients}
          catalogTests={catalogList}
          branches={branches}
          activeBranchId={activeBranchId}
          onSave={handleCreateNewOrder}
          onClose={() => setShowNewOrderModal(false)}
        />
      )}

      {/* =============================================================
          MODAL 6: SAMPLE COLLECTION / PHLEBOTOMY MODAL
          ============================================================= */}
      {sampleCollectionOrder && (
        <SampleCollectionModal
          order={sampleCollectionOrder}
          onSave={(sampleData) => handleSaveSampleCollection(sampleCollectionOrder.lab_order_id, sampleData)}
          onClose={() => setSampleCollectionOrder(null)}
        />
      )}

      {/* =============================================================
          MODAL 7: BARCODE TUBE PRINT MODAL
          ============================================================= */}
      {selectedOrderForBarcode && (
        <PhlebotomyBarcodeModal
          isOpen={!!selectedOrderForBarcode}
          onClose={() => setSelectedOrderForBarcode(null)}
          order={selectedOrderForBarcode}
        />
      )}

      {/* =============================================================
          MODAL 8: CANCEL ORDER MODAL WITH REASON
          ============================================================= */}
      {cancelOrderTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-lg">
              <AlertCircle size={20} />
              <h3>টেস্ট অর্ডার বাতিল নিশ্চিতকরণ</h3>
            </div>
            <p className="text-xs text-slate-600">
              আপনি কি নিশ্চিতভাবে অর্ডার <strong>#{cancelOrderTarget.lab_order_id}</strong> বাতিল করতে চান? বাতিলের সুনির্দিষ্ট কারণ লিখুন (অডিটের জন্য সংরক্ষিত থাকবে):
            </p>
            <textarea
              rows={3}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              placeholder="যেমন: রোগীর অনীহা / দ্বৈত বুকিং / ল্যাব মেশিন সমস্যা..."
              value={cancelReasonText}
              onChange={e => setCancelReasonText(e.target.value)}
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setCancelOrderTarget(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                না, ফিরে যান
              </button>
              <button
                onClick={handleConfirmCancelOrder}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs"
              >
                ✓ হ্যাঁ, বাতিল করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =============================================================
          MODAL 9: REPORT VERIFICATION, EDITING & VERSION CONTROL MODAL
          ============================================================= */}
      {activeReportOrder && (
        <ReportEditorModal
          order={activeReportOrder}
          enforceMakerChecker={enforceMakerChecker}
          onSaveDraft={(payload) => handleSaveReportDraft(activeReportOrder.lab_order_id, payload)}
          onSubmitVerification={() => handleSubmitReportForVerification(activeReportOrder.lab_order_id)}
          onApprove={(approverName) => handleApproveReport(activeReportOrder.lab_order_id, approverName)}
          onReturnRevision={(note) => handleReturnReportForRevision(activeReportOrder.lab_order_id, note)}
          onSaveRevisedVersion={(revisedData, reason) => handleSaveRevisedApprovedReport(activeReportOrder.lab_order_id, revisedData, reason)}
          onClose={() => setActiveReportOrder(null)}
        />
      )}

      {/* =============================================================
          MODAL 10: A4 PRINTABLE PATHOLOGY REPORT (OFFICIAL SEAL & QR)
          ============================================================= */}
      {viewingA4ReportOrder && (
        <A4PathologyReportModal
          order={viewingA4ReportOrder}
          onClose={() => setViewingA4ReportOrder(null)}
        />
      )}
    </div>
  );
};

// =========================================================================
// SUB-COMPONENT: TEST CATALOG EDIT MODAL (ALL 11 FIELDS)
// =========================================================================
function TestCatalogEditModal({ test, categories, branches, onSave, onClose }) {
  const [formData, setFormData] = useState({
    test_code: test?.test_code || `TEST-${Date.now().toString().slice(-4)}`,
    test_name_english: test?.test_name_english || '',
    test_name_bangla: test?.test_name_bangla || '',
    department: test?.department || test?.main_category || 'Hematology',
    specimen_type: test?.specimen_type || 'EDTA Whole Blood',
    preparation_instructions: test?.preparation_instructions || 'কোনো প্রস্তুতির প্রয়োজন নেই',
    regular_price: test?.regular_price || 500,
    emergency_price: test?.emergency_price || 700,
    report_turnaround_time: test?.report_turnaround_time || '৪ ঘণ্টা',
    result_type: test?.result_type || 'Quantitative (সংখ্যাগত ও রেঞ্জ)',
    reference_info: test?.reference_info || 'বয়স ও লিঙ্গভিত্তিক স্বাভাবিক রেঞ্জ',
    allowed_branches: test?.allowed_branches || branches.map(b => b.id),
    is_external_lab: test?.is_external_lab || false,
    external_lab_name: test?.external_lab_name || '',
    active: test?.active !== false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.test_name_english) {
      alert('টেস্টের নাম আবশ্যক!');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-3 border-b border-slate-200">
          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <span>🧪</span>
            <span>{test ? 'টেস্ট সম্পাদনা করুন' : 'নতুন ডায়াগনস্টিক টেস্ট তৈরি (১১টি ফিল্ড)'}</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">১. টেস্ট কোড (Test Code):</label>
              <input
                type="text"
                required
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                value={formData.test_code}
                onChange={e => setFormData({ ...formData, test_code: e.target.value })}
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">৩. বিভাগ (Department):</label>
              <select
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                value={formData.department}
                onChange={e => setFormData({ ...formData, department: e.target.value })}
              >
                {categories?.map(c => (
                  <option key={c.id} value={c.name_en}>{c.name_en} ({c.name_bn})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">২. টেস্টের নাম (ইংরেজি):</label>
              <input
                type="text"
                required
                placeholder="যেমন: Complete Blood Count"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                value={formData.test_name_english}
                onChange={e => setFormData({ ...formData, test_name_english: e.target.value })}
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">টেস্টের নাম (বাংলা):</label>
              <input
                type="text"
                placeholder="যেমন: কমপ্লিট ব্লাড কাউন্ট (সিবিসি)"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                value={formData.test_name_bangla}
                onChange={e => setFormData({ ...formData, test_name_bangla: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">৪. নমুনার ধরন (Specimen):</label>
              <input
                type="text"
                placeholder="যেমন: EDTA রক্ত / Serum / Urine"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                value={formData.specimen_type}
                onChange={e => setFormData({ ...formData, specimen_type: e.target.value })}
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">৫. প্রস্তুতির নির্দেশনা (Preparation):</label>
              <input
                type="text"
                placeholder="যেমন: ১০ ঘণ্টা খালি পেটে"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                value={formData.preparation_instructions}
                onChange={e => setFormData({ ...formData, preparation_instructions: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">৬. সাধারণ মূল্য (৳):</label>
              <input
                type="number"
                required
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                value={formData.regular_price}
                onChange={e => setFormData({ ...formData, regular_price: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">জরুরি মূল্য (৳):</label>
              <input
                type="number"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                value={formData.emergency_price}
                onChange={e => setFormData({ ...formData, emergency_price: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">৭. আনুমানিক সময় (TAT):</label>
              <input
                type="text"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                value={formData.report_turnaround_time}
                onChange={e => setFormData({ ...formData, report_turnaround_time: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">৮. ফলাফলের ধরন (Result Type):</label>
              <select
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                value={formData.result_type}
                onChange={e => setFormData({ ...formData, result_type: e.target.value })}
              >
                <option value="Quantitative (সংখ্যাগত ও রেঞ্জ)">Quantitative (সংখ্যাগত ও রেঞ্জ)</option>
                <option value="Qualitative (পজিটিভ/নেগেটিভ)">Qualitative (পজিটিভ/নেগেটিভ)</option>
                <option value="Descriptive (বর্ণনামূলক/ইমেজিং)">Descriptive (বর্ণনামূলক/ইমেজিং)</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">রেফারেন্স রেঞ্জ বিবরণ:</label>
              <input
                type="text"
                placeholder="যেমন: পুরুষ: ১৩.৫-১৭.৫, মহিলা: ১২-১৫.৫"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                value={formData.reference_info}
                onChange={e => setFormData({ ...formData, reference_info: e.target.value })}
              />
            </div>
          </div>

          {/* 9. Allowed Branches Checkboxes */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">৯. কোন কোন শাখায় করা যাবে (Allowed Branches):</label>
            <div className="flex flex-wrap gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
              {branches.map(b => {
                const checked = formData.allowed_branches.includes(b.id);
                return (
                  <label key={b.id} className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        const next = checked ? formData.allowed_branches.filter(id => id !== b.id) : [...formData.allowed_branches, b.id];
                        setFormData({ ...formData, allowed_branches: next });
                      }}
                      className="rounded text-emerald-600"
                    />
                    <span>{b.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* 10. External Lab & 11. Active Toggle */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={formData.is_external_lab}
                  onChange={e => setFormData({ ...formData, is_external_lab: e.target.checked })}
                  className="rounded text-purple-600"
                />
                <span>১০. বাহ্যিক রেফারেন্স ল্যাবে পাঠাতে হবে</span>
              </label>
              {formData.is_external_lab && (
                <input
                  type="text"
                  placeholder="রেফারেল ল্যাবের নাম লিখুন..."
                  className="mt-1.5 w-full p-1.5 bg-white border border-slate-200 rounded text-xs"
                  value={formData.external_lab_name}
                  onChange={e => setFormData({ ...formData, external_lab_name: e.target.value })}
                />
              )}
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={e => setFormData({ ...formData, active: e.target.checked })}
                  className="rounded text-emerald-600"
                />
                <span>১১. সক্রিয় / চালু রয়েছে (Active Status)</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md"
            >
              ✓ সংরক্ষণ করুন
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =========================================================================
// SUB-COMPONENT: BRANCH PRICING & EQUIPMENT MATRIX MODAL
// =========================================================================
function BranchPricingModal({ test, branches, onSave, onClose }) {
  const [overrides, setOverrides] = useState({ ...(test.branch_overrides || {}) });

  const handleUpdate = (branchId, field, val) => {
    setOverrides(prev => ({
      ...prev,
      [branchId]: {
        ...(prev[branchId] || { price: test.regular_price, emergency_price: test.emergency_price, tat: test.report_turnaround_time, active: true }),
        [field]: val
      }
    }));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-200">
          <div>
            <h3 className="font-bold text-base text-slate-900">শাখাভিত্তিক মূল্য ও ইকুইপমেন্ট ম্যাট্রিক্স (Branch Pricing)</h3>
            <p className="text-xs text-slate-500">টেস্ট: {test.test_name_english} ({test.test_code})</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
        </div>

        <div className="text-xs space-y-3">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px]">
            💡 <strong>মাল্টি-ব্রাঞ্চ নিয়ম:</strong> শাখাভেদে মূল্য, ব্যবহৃত এনালাইজার ইকুইপমেন্ট ও রিপোর্ট ডেলিভারি সময় আলাদা হতে পারে। এখানে মূল্য পরিবর্তন করলেও পূর্বে হয়ে যাওয়া কোনো অর্ডারের মূল্য পরিবর্তিত হবে না (Price Frozen)।
          </div>

          <div className="space-y-2">
            {branches.map(b => {
              const cfg = overrides[b.id] || { price: test.regular_price, emergency_price: test.emergency_price, tat: test.report_turnaround_time, equipment: 'In-house Analyzer' };
              return (
                <div key={b.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 grid grid-cols-4 gap-2 items-center">
                  <div>
                    <div className="font-bold text-slate-800">{b.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{b.code}</div>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">সাধারণ ফি (৳):</label>
                    <input
                      type="number"
                      className="w-full p-1.5 bg-white border rounded font-mono font-bold"
                      value={cfg.price || test.regular_price}
                      onChange={e => handleUpdate(b.id, 'price', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">জরুরি ফি (৳):</label>
                    <input
                      type="number"
                      className="w-full p-1.5 bg-white border rounded font-mono font-bold text-rose-600"
                      value={cfg.emergency_price || (cfg.price * 1.4)}
                      onChange={e => handleUpdate(b.id, 'emergency_price', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">ইকুইপমেন্ট মডেল:</label>
                    <input
                      type="text"
                      className="w-full p-1.5 bg-white border rounded text-xs"
                      value={cfg.equipment || ''}
                      placeholder="মেশিনের নাম..."
                      onChange={e => handleUpdate(b.id, 'equipment', e.target.value)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
          <button onClick={onClose} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs">
            বাতিল
          </button>
          <button onClick={() => onSave(overrides)} className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-md">
            ✓ ম্যাট্রিক্স সংরক্ষণ করুন
          </button>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// SUB-COMPONENT: BRANCH ACTIVATION MODAL
// =========================================================================
function BranchActivationModal({ test, branches, onToggleBranch, onClose }) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-200">
          <div>
            <h3 className="font-bold text-base text-slate-800">শাখায় টেস্টের প্রাপ্যতা ও সক্রিয়করণ</h3>
            <p className="text-xs text-slate-500">টেস্ট: {test.test_name_english}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 font-bold">✕</button>
        </div>

        <div className="space-y-2 text-xs">
          {branches.map(b => {
            const isActive = (test.allowed_branches || []).includes(b.id);
            return (
              <div
                key={b.id}
                onClick={() => onToggleBranch(b.id)}
                className={`p-3 rounded-xl border flex justify-between items-center cursor-pointer transition-all ${
                  isActive ? 'bg-emerald-50/60 border-emerald-300' : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div>
                  <div className="font-bold text-slate-800">{b.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">কোড: {b.code}</div>
                </div>
                <div className={`px-2.5 py-1 rounded text-xs font-bold ${
                  isActive ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {isActive ? '✓ সক্রিয়' : 'নিষ্ক্রিয়'}
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-2 flex justify-end">
          <button onClick={onClose} className="px-5 py-2 bg-slate-800 text-white font-bold rounded-xl text-xs">
            সম্পন্ন
          </button>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// SUB-COMPONENT: CREATE TEST PACKAGE MODAL
// =========================================================================
function CreateTestPackageModal({ tests, onSave, onClose }) {
  const [nameEn, setNameEn] = useState('');
  const [nameBn, setNameBn] = useState('');
  const [selectedTests, setSelectedTests] = useState([]);
  const [pkgPrice, setPkgPrice] = useState(1500);

  const subtotal = tests
    .filter(t => selectedTests.includes(t.test_id))
    .reduce((s, t) => s + (t.regular_price || 0), 0);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-2 border-b border-slate-200">
          <h3 className="font-bold text-base text-slate-800">🧬 নতুন টেস্ট প্যাকেজ / চেকআপ বান্ডেল তৈরি</h3>
          <button onClick={onClose} className="text-slate-400 font-bold">✕</button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">প্যাকেজের নাম (ইংরেজি):</label>
            <input
              type="text"
              placeholder="যেমন: Executive Health Checkup 360"
              className="w-full p-2 bg-slate-50 border rounded-lg"
              value={nameEn}
              onChange={e => setNameEn(e.target.value)}
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">প্যাকেজের নাম (বাংলা):</label>
            <input
              type="text"
              placeholder="যেমন: এক্সিকিউটিভ ফুল বডি হেলথ চেকআপ"
              className="w-full p-2 bg-slate-50 border rounded-lg"
              value={nameBn}
              onChange={e => setNameBn(e.target.value)}
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">অন্তর্ভুক্ত টেস্টসমূহ নির্বাচন করুন ({selectedTests.length}টি নির্বাচিত):</label>
            <div className="max-h-48 overflow-y-auto p-2 bg-slate-50 border rounded-xl space-y-1">
              {tests.map(t => {
                const checked = selectedTests.includes(t.test_id);
                return (
                  <label key={t.test_id} className="flex justify-between items-center p-1.5 hover:bg-white rounded cursor-pointer">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          setSelectedTests(checked ? selectedTests.filter(id => id !== t.test_id) : [...selectedTests, t.test_id]);
                        }}
                      />
                      <span>{t.test_name_english} ({t.test_code})</span>
                    </div>
                    <span className="font-mono text-slate-600">৳{t.regular_price}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 flex justify-between items-center">
            <div>
              <div className="text-[11px] text-slate-500">মূল টেস্টগুলোর একক যোগফল: <span className="line-through font-mono">৳{subtotal}</span></div>
              <div className="text-purple-800 font-bold">প্যাকেজের অফার মূল্য (৳):</div>
            </div>
            <input
              type="number"
              className="w-28 p-2 bg-white border border-purple-300 rounded-lg font-mono font-bold text-purple-900 text-sm text-right"
              value={pkgPrice}
              onChange={e => setPkgPrice(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <button onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs">বাতিল</button>
          <button
            onClick={() => {
              if (!nameEn) { alert('প্যাকেজের নাম লিখুন!'); return; }
              onSave({ bundle_name_english: nameEn, bundle_name_bangla: nameBn, included_tests: selectedTests, package_price: pkgPrice, individual_price_total: subtotal });
            }}
            className="px-5 py-2 bg-purple-600 text-white font-bold rounded-xl text-xs"
          >
            ✓ প্যাকেজ তৈরি করুন
          </button>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// SUB-COMPONENT: NEW TEST ORDER MODAL (11 FIELDS & HISTORICAL PRICE FREEZE)
// =========================================================================
function NewTestOrderModal({ patients, catalogTests, branches, activeBranchId, onSave, onClose }) {
  const [selectedBranch, setSelectedBranch] = useState(activeBranchId || 'dhanmondi');
  const [patientId, setPatientId] = useState('');
  const [doctorName, setDoctorName] = useState('ডাঃ তানভীর আহমেদ (MBBS, FCPS)');
  const [linkedVisitId, setLinkedVisitId] = useState(`VIS-${Date.now().toString().slice(-4)}`);
  const [selectedTestIds, setSelectedTestIds] = useState([]);
  const [priority, setPriority] = useState('সাধারণ');
  const [collectionLocation, setCollectionLocation] = useState('ইন-হাউস ল্যাব');
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [orderNotes, setOrderNotes] = useState('');

  const selectedPatient = patients.find(p => p.patient_id === patientId);

  // Compute subtotal based on branch-specific current price
  const subtotal = useMemo(() => {
    return catalogTests
      .filter(t => selectedTestIds.includes(t.test_id))
      .reduce((s, t) => {
        const branchOverride = t.branch_overrides?.[selectedBranch];
        const price = priority === 'জরুরি'
          ? (branchOverride?.emergency_price || t.emergency_price || (t.regular_price * 1.4))
          : (branchOverride?.price || t.regular_price || 0);
        return s + Number(price);
      }, 0);
  }, [catalogTests, selectedTestIds, selectedBranch, priority]);

  const netTotal = Math.max(0, subtotal - discount);

  // Auto set paid amount default
  useEffect(() => {
    setPaidAmount(netTotal);
  }, [netTotal]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedPatient) {
      alert('রোগী নির্বাচন করুন!');
      return;
    }
    if (selectedTestIds.length === 0) {
      alert('কমপক্ষে একটি টেস্ট নির্বাচন করুন!');
      return;
    }

    const selectedTests = catalogTests.filter(t => selectedTestIds.includes(t.test_id));
    onSave({
      branch_id: selectedBranch,
      patient_id: selectedPatient.patient_id,
      patient_name: selectedPatient.full_name,
      patient_phone: selectedPatient.mobile_number,
      doctor_name: doctorName,
      linked_visit_id: linkedVisitId,
      priority: priority,
      collection_location: collectionLocation,
      tests: selectedTests,
      discount: discount,
      paid_amount: paidAmount,
      order_notes: orderNotes
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-3 border-b border-slate-200">
          <div>
            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
              <span>🧾</span>
              <span>নতুন টেস্ট অর্ডার ও বিলিং (১১টি ফিল্ড)</span>
            </h3>
            <p className="text-xs text-slate-500">অর্ডার তৈরির সময় যে মূল্য প্রযোজ্য হবে তা সারাজীবনের জন্য ফ্রিজ (Freeze) থাকবে।</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">১. শাখা নির্বাচন (Branch):</label>
              <select
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                value={selectedBranch}
                onChange={e => setSelectedBranch(e.target.value)}
              >
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">২. রোগী নির্বাচন (Patient):</label>
              <select
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                value={patientId}
                onChange={e => setPatientId(e.target.value)}
                required
              >
                <option value="">-- রোগী বাছাই করুন --</option>
                {patients.map(p => (
                  <option key={p.patient_id} value={p.patient_id}>
                    {p.full_name} ({p.patient_id}) - {p.mobile_number}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">৩. রেফারকারী ডাক্তার:</label>
              <input
                type="text"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                value={doctorName}
                onChange={e => setDoctorName(e.target.value)}
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">৪. সংশ্লিষ্ট ভিজিট নম্বর:</label>
              <input
                type="text"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                value={linkedVisitId}
                onChange={e => setLinkedVisitId(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">৫. অগ্রাধিকার (Priority):</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPriority('সাধারণ')}
                  className={`flex-1 py-1.5 rounded-lg border font-bold ${
                    priority === 'সাধারণ' ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-50 text-slate-600'
                  }`}
                >
                  সাধারণ (Routine)
                </button>
                <button
                  type="button"
                  onClick={() => setPriority('জরুরি')}
                  className={`flex-1 py-1.5 rounded-lg border font-bold ${
                    priority === 'জরুরি' ? 'bg-rose-600 text-white border-rose-600' : 'bg-slate-50 text-slate-600'
                  }`}
                >
                  জরুরি (Urgent / STAT)
                </button>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">৬. নমুনা সংগ্রহের স্থান:</label>
              <select
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                value={collectionLocation}
                onChange={e => setCollectionLocation(e.target.value)}
              >
                <option value="ইন-হাউস ল্যাব">ইন-হাউস ল্যাব কালেকশন রুম</option>
                <option value="বেডসাইড (কেবিন/ওয়ার্ড)">বেডসাইড (কেবিন / ওয়ার্ড)</option>
                <option value="হোম স্যাম্পল কালেকশন">হোম স্যাম্পল কালেকশন (বাসায়)</option>
              </select>
            </div>
          </div>

          {/* 7. Tests Multi-Select */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">৭. টেস্টের তালিকা নির্বাচন ({selectedTestIds.length}টি টেস্ট):</label>
            <div className="max-h-40 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              {catalogTests.map(t => {
                const checked = selectedTestIds.includes(t.test_id);
                const bPrice = t.branch_overrides?.[selectedBranch]?.price || t.regular_price;
                return (
                  <label key={t.test_id} className="flex justify-between items-center p-1.5 hover:bg-white rounded cursor-pointer">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          setSelectedTestIds(checked ? selectedTestIds.filter(id => id !== t.test_id) : [...selectedTestIds, t.test_id]);
                        }}
                      />
                      <span className="font-bold text-slate-800">{t.test_code}: {t.test_name_english}</span>
                      <span className="text-[10px] text-slate-400">({t.specimen_type})</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900">৳{bPrice}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Pricing & Payment Status (8, 9, 10) */}
          <div className="p-3 bg-slate-100/70 rounded-xl border border-slate-200 space-y-2">
            <div className="flex justify-between font-mono">
              <span>মোট টেস্ট ফি:</span>
              <strong>৳{subtotal}</strong>
            </div>

            <div className="grid grid-cols-2 gap-3 items-center">
              <div>
                <label className="text-[10px] text-slate-500 block">ছাড় / ডিসকাউন্ট (৳):</label>
                <input
                  type="number"
                  className="w-full p-1.5 bg-white border rounded font-mono text-xs"
                  value={discount}
                  onChange={e => setDiscount(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 block">পরিশোধিত অর্থ (৳):</label>
                <input
                  type="number"
                  className="w-full p-1.5 bg-white border rounded font-mono font-bold text-emerald-700 text-xs"
                  value={paidAmount}
                  onChange={e => setPaidAmount(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
              <span className="font-bold text-slate-800">সর্বমোট প্রদেয়:</span>
              <span className="font-mono text-base font-extrabold text-slate-900">৳{netTotal}</span>
            </div>
            {netTotal - paidAmount > 0 && (
              <div className="text-right text-[11px] font-bold text-rose-600 font-mono">
                চলতি বকেয়া: ৳{netTotal - paidAmount}
              </div>
            )}
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">১১. অর্ডারের নোট / বিশেষ নির্দেশনা:</label>
            <input
              type="text"
              placeholder="যেমন: জরুরি রিপোর্ট প্রয়োজন / সুগার ওষুধ খাওয়ার আগে সংগৃহীত"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
              value={orderNotes}
              onChange={e => setOrderNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md"
            >
              ✓ নিশ্চিত ও অর্ডার তৈরি
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =========================================================================
// SUB-COMPONENT: SAMPLE COLLECTION (PHLEBOTOMY MODAL - 9 FIELDS)
// =========================================================================
function SampleCollectionModal({ order, onSave, onClose }) {
  const [collectorStaff, setCollectorStaff] = useState('মোঃ রফিকুল ইসলাম (ফ্লেবোটোমিস্ট)');
  const [receiverStaff, setReceiverStaff] = useState('নাজমিন আক্তার (ল্যাব টেকনোলজিস্ট)');
  const [sampleStatus, setSampleStatus] = useState('নমুনা সংগ্রহ হয়েছে');
  const [rejectionReason, setRejectionReason] = useState('');
  const [resampleInfo, setResampleInfo] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      collector_staff: collectorStaff,
      receiver_staff: receiverStaff,
      sample_status: sampleStatus,
      rejection_reason: rejectionReason,
      resample_info: resampleInfo
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-200">
          <div>
            <h3 className="font-bold text-base text-slate-800 flex items-center gap-1.5">
              <span>🩸</span>
              <span>নমুনা সংগ্রহ ও ল্যাব রিসিভিং (Phlebotomy Log)</span>
            </h3>
            <p className="text-xs text-slate-500">অর্ডার: #{order.lab_order_id} | রোগী: {order.patient_name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 font-bold">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="font-bold text-slate-800">নমুনার বিবরণ:</div>
            {order.tests?.map((t, idx) => (
              <div key={idx} className="flex justify-between text-slate-600 font-mono text-[11px]">
                <span>• {t.test_name} ({t.test_code})</span>
                <span>{t.sample_type}</span>
              </div>
            ))}
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">সংগ্রহকারী কর্মী (Collector Staff):</label>
            <input
              type="text"
              required
              className="w-full p-2 bg-slate-50 border rounded-lg"
              value={collectorStaff}
              onChange={e => setCollectorStaff(e.target.value)}
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">ল্যাব গ্রহণকারী কর্মী (Receiver Staff):</label>
            <input
              type="text"
              required
              className="w-full p-2 bg-slate-50 border rounded-lg"
              value={receiverStaff}
              onChange={e => setReceiverStaff(e.target.value)}
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">নমুনার বর্তমান অবস্থা (Sample Status):</label>
            <select
              className="w-full p-2 bg-slate-50 border rounded-lg font-bold"
              value={sampleStatus}
              onChange={e => setSampleStatus(e.target.value)}
            >
              <option value="নমুনা সংগ্রহ হয়েছে">নমুনা সংগ্রহ হয়েছে (Sample Collected)</option>
              <option value="নমুনা গ্রহণ হয়েছে">নমুনা গ্রহণ হয়েছে (Sample Received in Lab)</option>
              <option value="বাতিল">নমুনা বাতিল / রিজেক্টেড (Sample Rejected)</option>
              <option value="পুনরায় সংগ্রহ">পুনরায় সংগ্রহ প্রয়োজন (Resample Required)</option>
            </select>
          </div>

          {sampleStatus === 'বাতিল' && (
            <div>
              <label className="font-bold text-rose-700 block mb-1">বাতিলের কারণ (Rejection Reason):</label>
              <select
                className="w-full p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-900"
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
              >
                <option value="নমুনায় ক্লট হয়েছিল (Clotted Sample)">নমুনায় ক্লট হয়েছিল (Clotted Sample)</option>
                <option value="হিমোলাইজড নমুনা (Hemolysed)">হিমোলাইজড নমুনা (Hemolysed)</option>
                <option value="অপর্যাপ্ত রক্তের পরিমাণ (Quantity Not Sufficient - QNS)">অপর্যাপ্ত রক্তের পরিমাণ (Quantity Not Sufficient - QNS)</option>
                <option value="ভুল টিউবে সংগৃহীত (Wrong Container)">ভুল টিউবে সংগৃহীত (Wrong Container)</option>
                <option value="লেবেলিং ত্রুটি (Mislabeled Tube)">লেবেলিং ত্রুটি (Mislabeled Tube)</option>
              </select>
            </div>
          )}

          {sampleStatus === 'পুনরায় সংগ্রহ' && (
            <div>
              <label className="font-bold text-amber-700 block mb-1">পুনরায় সংগ্রহের তথ্য / নির্দেশনা:</label>
              <input
                type="text"
                placeholder="যেমন: রোগীকে পুনরায় ডেকে নতুন স্যাম্পল টিউব সংগ্রহ"
                className="w-full p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-900"
                value={resampleInfo}
                onChange={e => setResampleInfo(e.target.value)}
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs">
              বাতিল
            </button>
            <button type="submit" className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl text-xs shadow-md">
              ✓ সংরক্ষণ করুন
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =========================================================================
// SUB-COMPONENT: REPORT EDITOR & REVISION MODAL (ALL 14 FIELDS & 6 BUTTONS)
// =========================================================================
function ReportEditorModal({
  order,
  enforceMakerChecker,
  onSaveDraft,
  onSubmitVerification,
  onApprove,
  onReturnRevision,
  onSaveRevisedVersion,
  onClose
}) {
  const rep = order.report_data || {};
  const isApproved = rep.report_status === 'অনুমোদিত' || rep.report_status === 'রোগীকে দেওয়া হয়েছে';

  const [technologistName, setTechnologistName] = useState(rep.technologist_name || 'মোঃ আলমগীর হোসেন');
  const [verifierName, setVerifierName] = useState(rep.verifier_name || 'ডাঃ নাসরিন সুলতানা');
  const [approverName, setApproverName] = useState(rep.approver_name || 'ডাঃ কামরুল হাসান (চিফ প্যাথলজিস্ট)');
  const [clinicalRemarks, setClinicalRemarks] = useState(rep.clinical_remarks || 'সার্বিক ফলাফল ক্লিনিক্যাল পর্যবেক্ষণের সঙ্গে সংগতিপূর্ণ।');
  const [resultsMap, setResultsMap] = useState(() => {
    const map = {};
    (order.tests || []).forEach(t => {
      (t.parameters || []).forEach(p => {
        map[p.id] = t.results?.[p.id] || (p.ref_male?.includes('-') ? p.ref_male.split('-')[0].trim() : 'স্বাভাবিক');
      });
    });
    return map;
  });

  // State for editing already-approved report (Rule: bumps version v1 -> v2)
  const [isEditingApproved, setIsEditingApproved] = useState(false);
  const [revisionReason, setRevisionReason] = useState('');
  const [revisionNotes, setRevisionNotes] = useState('');

  const handleDraftSubmit = () => {
    onSaveDraft({
      technologist_name: technologistName,
      verifier_name: verifierName,
      approver_name: approverName,
      clinical_remarks: clinicalRemarks
    });
  };

  const handleRevisedSubmit = (e) => {
    e.preventDefault();
    if (!revisionReason) {
      alert('অনুমোদিত রিপোর্ট সংশোধনের কারণ উল্লেখ করা বাধ্যতামূলক!');
      return;
    }
    onSaveRevisedVersion({
      technologist_name: technologistName,
      verifier_name: verifierName,
      approver_name: approverName,
      clinical_remarks: clinicalRemarks
    }, revisionReason);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        <div className="flex justify-between items-start pb-3 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-sm text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg">
                {rep.report_number || `REP-${order.lab_order_id}`}
              </span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                সংস্করণ: v{rep.report_version || 1}.0
              </span>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {rep.report_status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              অর্ডার: #{order.lab_order_id} | শাখা: {order.branch_name} | রোগী: {order.patient_name} ({order.patient_id})
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
        </div>

        {/* Audit Log Banner if report was revised previously */}
        {rep.revisions?.length > 0 && (
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs space-y-1">
            <div className="font-bold text-purple-900 flex items-center gap-1.5">
              <History size={14} />
              <span>পূর্ববর্তী সংস্করণ অডিট ইতিহাস (Immutable Revision Trail):</span>
            </div>
            {rep.revisions.map((rev, i) => (
              <div key={i} className="text-[11px] text-slate-600 flex justify-between">
                <span>{rev.version} — পরিবর্তনকারী: {rev.modified_by} (কারণ: {rev.reason})</span>
                <span className="font-mono text-slate-400">{rev.modified_at}</span>
              </div>
            ))}
          </div>
        )}

        {/* Warning if Approved Report is being viewed */}
        {isApproved && !isEditingApproved && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs flex justify-between items-center text-emerald-900">
            <div>
              ✓ <strong>অনুমোদিত রিপোর্ট:</strong> এই রিপোর্টটি চিফ প্যাথলজিস্ট কর্তৃক অনুমোদিত হয়েছে। সরাসরি কোনো পরিবর্তন করা যাবে না। সংশোধন প্রয়োজন হলে নতুন সংস্করণ তৈরি করতে হবে।
            </div>
            <button
              onClick={() => setIsEditingApproved(true)}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-xs shrink-0"
            >
              ✏️ নতুন সংস্করণ তৈরি করুন
            </button>
          </div>
        )}

        {/* Revision Form if authorized */}
        {isEditingApproved && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-2">
            <div className="font-bold text-amber-900">সংশোধনের কারণ ও নতুন সংস্করণ ট্র্যাকিং (v{(rep.report_version || 1) + 1}.0):</div>
            <input
              type="text"
              required
              placeholder="অনুমোদিত রিপোর্ট পরিবর্তনের সুনির্দিষ্ট কারণ লিখুন (বাধ্যতামূলক)..."
              className="w-full p-2 bg-white border border-amber-300 rounded-lg text-xs"
              value={revisionReason}
              onChange={e => setRevisionReason(e.target.value)}
            />
          </div>
        )}

        {/* Results Entry & Parameters Table */}
        <div className="space-y-3">
          <div className="font-bold text-slate-800 text-xs">টেস্টের ফলাফল, একক ও রেফারেন্স রেঞ্জ:</div>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <th className="p-2.5">প্যারামিটার</th>
                  <th className="p-2.5 text-center">ফলাফল (Result)</th>
                  <th className="p-2.5 text-center">একক (Unit)</th>
                  <th className="p-2.5 text-right">রেফারেন্স রেঞ্জ</th>
                  <th className="p-2.5 text-center">স্ট্যাটাস / ফ্ল্যাগ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.tests?.map((t, idx) => (
                  <React.Fragment key={idx}>
                    <tr className="bg-slate-50/70 font-bold text-slate-800">
                      <td colSpan={5} className="p-2 pl-3">
                        {t.test_name} ({t.test_code})
                      </td>
                    </tr>
                    {t.parameters?.map((p, pIdx) => {
                      const val = resultsMap[p.id] || '';
                      const evalStatus = evaluateResultStatus(val, p.ref_male);
                      const isPanic = isPanicValue(p.name, val);

                      return (
                        <tr key={pIdx} className="hover:bg-slate-50/50">
                          <td className="p-2 pl-5 text-slate-700">• {p.name}</td>
                          <td className="p-2 text-center">
                            <input
                              type="text"
                              disabled={isApproved && !isEditingApproved}
                              className="w-28 p-1 bg-white border rounded font-mono font-bold text-center text-xs"
                              value={val}
                              onChange={e => setResultsMap({ ...resultsMap, [p.id]: e.target.value })}
                            />
                          </td>
                          <td className="p-2 text-center font-mono text-slate-500">{p.unit || '-'}</td>
                          <td className="p-2 text-right font-mono text-slate-600">{p.ref_male || 'স্বাভাবিক'}</td>
                          <td className="p-2 text-center">
                            {isPanic ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white animate-pulse">
                                🚨 CRITICAL PANIC
                              </span>
                            ) : evalStatus ? (
                              <span
                                className="px-2 py-0.5 rounded text-[10px] font-bold font-mono"
                                style={{ background: evalStatus.bg, color: evalStatus.color }}
                              >
                                {evalStatus.label}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[10px]">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Clinical Remarks */}
        <div>
          <label className="font-bold text-slate-700 block mb-1 text-xs">চিকিৎসাগত মন্তব্য / ক্লিনিক্যাল ফাইন্ডিংস:</label>
          <textarea
            rows={2}
            disabled={isApproved && !isEditingApproved}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            value={clinicalRemarks}
            onChange={e => setClinicalRemarks(e.target.value)}
          />
        </div>

        {/* Staff & Signatories Grid (Maker-Checker Separation) */}
        <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">পরীক্ষাকারী (ল্যাব টেকনোলজিস্ট):</label>
            <input
              type="text"
              disabled={isApproved && !isEditingApproved}
              className="w-full p-1.5 bg-white border rounded text-xs"
              value={technologistName}
              onChange={e => setTechnologistName(e.target.value)}
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">যাচাইকারী (মেডিকেল অফিসার):</label>
            <input
              type="text"
              disabled={isApproved && !isEditingApproved}
              className="w-full p-1.5 bg-white border rounded text-xs"
              value={verifierName}
              onChange={e => setVerifierName(e.target.value)}
            />
          </div>

          <div>
            <label className="font-bold text-emerald-800 block mb-1">অনুমোদনকারী (চিফ প্যাথলজিস্ট):</label>
            <input
              type="text"
              disabled={isApproved && !isEditingApproved}
              className="w-full p-1.5 bg-white border rounded text-xs font-bold text-emerald-900"
              value={approverName}
              onChange={e => setApproverName(e.target.value)}
            />
          </div>
        </div>

        {/* Disclaimer Note */}
        <div className="p-2.5 bg-slate-50 rounded-lg text-[10px] text-slate-500 leading-relaxed">
          * সফটওয়্যার কোনোভাবেই চিকিৎসাগত সিদ্ধান্তের বিকল্প নয়। ফলাফল ও রেফারেন্স রেঞ্জ কেবল অনুমোদিত ল্যাব কনসালট্যান্টের বৈধ স্বাক্ষরের মাধ্যমেই চিকিৎসায় গ্রহণযোগ্য হবে।
        </div>

        {/* 6 Action Buttons */}
        <div className="pt-3 border-t border-slate-200 flex flex-wrap justify-between items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
          >
            বন্ধ করুন
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {isEditingApproved ? (
              <button
                type="button"
                onClick={handleRevisedSubmit}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-md"
              >
                ✓ নতুন সংস্করণ (v{(rep.report_version || 1) + 1}.0) সংরক্ষণ ও অনুমোদন
              </button>
            ) : (
              <>
                {/* 1. [খসড়া সংরক্ষণ] */}
                <button
                  type="button"
                  onClick={handleDraftSubmit}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-800 text-white font-bold rounded-xl text-xs"
                >
                  [খসড়া সংরক্ষণ]
                </button>

                {/* 2. [যাচাইয়ের জন্য পাঠান] */}
                <button
                  type="button"
                  onClick={() => onSubmitVerification()}
                  className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs"
                >
                  [যাচাইয়ের জন্য পাঠান]
                </button>

                {/* 3. [সংশোধনের জন্য ফেরত] */}
                <button
                  type="button"
                  onClick={() => {
                    const note = prompt('সংশোধনের জন্য ল্যাব টেকনিশিয়ানের প্রতি নোট লিখুন:');
                    if (note) onReturnRevision(note);
                  }}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-xl text-xs"
                >
                  [সংশোধনের জন্য ফেরত]
                </button>

                {/* 4. [অনুমোদন] */}
                <button
                  type="button"
                  onClick={() => onApprove(approverName)}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  ✓ [অনুমোদন করুন]
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// SUB-COMPONENT: A4 PRINTABLE PATHOLOGY REPORT (OFFICIAL SEAL & QR)
// =========================================================================
function A4PathologyReportModal({ order, onClose }) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const rep = order.report_data || {};

  useEffect(() => {
    const verifyPayload = `https://hisabkitab360.com/verify-report?order=${order.lab_order_id}&patient=${order.patient_id}&date=${order.order_date}&ver=${rep.report_version || 1}`;
    QRCode.toDataURL(verifyPayload, { width: 120, margin: 1 })
      .then(url => setQrCodeDataUrl(url))
      .catch(err => console.error(err));
  }, [order, rep]);

  const handleSendWhatsApp = () => {
    const phone = (order.patient_phone || '').replace(/[^0-9]/g, '');
    const cleanPhone = phone.startsWith('880') ? phone : (phone.startsWith('0') ? '880' + phone.slice(1) : phone);
    const message = encodeURIComponent(
      `সম্মানিত ${order.patient_name},\nহিসাবকিতাব ৩৬০ ক্লিনিক্যাল ল্যাবরেটরি থেকে আপনার প্যাথলজি রিপোর্ট (অর্ডার: #${order.lab_order_id}, সংস্করণ: v${rep.report_version || 1}.0) অনুমোদিত হয়েছে।\nঅনলাইনে যাচাই করুন: https://hisabkitab360.com/verify?order=${order.lab_order_id}\nধন্যবাদ, সুস্থ থাকুন।`
    );
    if (cleanPhone) {
      window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
    } else {
      alert('রোগীর মোবাইল নম্বর পাওয়া যায়নি!');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-8 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto print:p-0 print:m-0 print:shadow-none">
        {/* Hospital Header */}
        <div className="flex justify-between items-start pb-4 border-b-2 border-slate-800">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-wide">হিসাবকিতাব ৩৬০ ক্লিনিক্যাল ল্যাবরেটরি ও LIMS</h1>
            <p className="text-xs text-slate-600">শাখা: {order.branch_name || 'ধানমন্ডি মেইন ব্রাঞ্চ'} | হটলাইন: ১০৬৭৮ | ফোন: +880 1800 000000</p>
            <p className="text-xs font-semibold text-emerald-700 mt-0.5">ডিপার্টমেন্ট অফ প্যাথলজি, বায়োকেমিস্ট্রি ও মলিকুলার ডায়াগনস্টিকস</p>
          </div>
          <div className="text-right flex flex-col items-center">
            {qrCodeDataUrl ? (
              <img src={qrCodeDataUrl} alt="Report Verification QR" className="w-16 h-16 rounded border border-slate-300 shadow-xs" />
            ) : (
              <div className="w-16 h-16 bg-slate-100 border border-slate-300 rounded flex items-center justify-center text-[10px] font-mono text-center">
                QR CODE
              </div>
            )}
            <span className="text-[9px] font-mono text-emerald-700 font-bold mt-1">ISO 15189 CERTIFIED</span>
          </div>
        </div>

        {/* Patient Details & Report Metadata */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
          <div>
            <div>রোগীর নাম: <strong className="text-slate-900">{order.patient_name}</strong></div>
            <div>রোগী আইডি: <strong className="font-mono">{order.patient_id}</strong></div>
            <div>মোবাইল নং: {order.patient_phone || 'N/A'}</div>
            <div>রেফারেল ডাক্তার: <strong>{order.doctor_name || 'ডাঃ তানভীর আহমেদ'}</strong></div>
          </div>
          <div>
            <div>রিপোর্ট নম্বর: <strong className="font-mono text-emerald-800">{rep.report_number || `REP-${order.lab_order_id}`}</strong></div>
            <div>ল্যাব অর্ডার নং: <strong className="font-mono text-slate-900">{order.lab_order_id}</strong></div>
            <div>রিপোর্ট সংস্করণ: <strong className="font-mono text-purple-700">v{rep.report_version || 1}.0</strong></div>
            <div>অনুমোদনের তারিখ: {rep.report_datetime || new Date().toLocaleString('bn-BD')}</div>
          </div>
        </div>

        {/* Tests & Parameters Table */}
        <div className="space-y-4">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-800 text-slate-800 font-bold">
                <th className="py-2">টেস্ট ও প্যারামিটার</th>
                <th className="py-2 text-center">ফলাফল (Result)</th>
                <th className="py-2 text-center">ফ্ল্যাগ / স্ট্যাটাস</th>
                <th className="py-2 text-center">একক (Unit)</th>
                <th className="py-2 text-right">রেফারেন্স রেঞ্জ (Normal Range)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {order.tests?.map((t, idx) => (
                <React.Fragment key={idx}>
                  <tr className="bg-slate-50 font-bold text-slate-800">
                    <td colSpan={5} className="py-2 px-1">
                      {t.test_name} ({t.test_code})
                    </td>
                  </tr>
                  {t.parameters && t.parameters.length > 0 ? (
                    t.parameters.map((p, pIdx) => {
                      const val = t.results?.[p.id] || (p.ref_male?.includes('-') ? p.ref_male.split('-')[0].trim() : 'স্বাভাবিক');
                      const evalStatus = evaluateResultStatus(val, p.ref_male);

                      return (
                        <tr key={pIdx}>
                          <td className="py-2 pl-4 text-slate-700">• {p.name}</td>
                          <td className="py-2 text-center font-bold font-mono text-slate-900 text-sm">
                            {val}
                          </td>
                          <td className="py-2 text-center">
                            {evalStatus ? (
                              <span
                                className="px-2 py-0.5 rounded text-[10px] font-bold font-mono"
                                style={{ background: evalStatus.bg, color: evalStatus.color }}
                              >
                                {evalStatus.label}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[10px]">-</span>
                            )}
                          </td>
                          <td className="py-2 text-center font-mono text-slate-500">{p.unit}</td>
                          <td className="py-2 text-right font-mono text-slate-600">{p.ref_male}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td className="py-2 pl-4 text-slate-700">• সার্বিক ক্লিনিক্যাল ফাইন্ডিংস</td>
                      <td className="py-2 text-center font-bold font-mono text-slate-900">Normal study</td>
                      <td className="py-2 text-center font-bold text-emerald-700">✓ Normal</td>
                      <td className="py-2 text-center font-mono text-slate-500">-</td>
                      <td className="py-2 text-right font-mono text-slate-600">স্বাভাবিক</td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Clinical Disclaimer */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] text-slate-500 leading-relaxed">
          * {CANCER_SAFETY_DISCLAIMER}
        </div>

        {/* Doctor Signature & Official Seal */}
        <div className="pt-6 border-t border-slate-300 flex justify-between items-end">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-emerald-600/40 p-1 flex flex-col items-center justify-center text-[8px] font-bold text-emerald-800 text-center uppercase tracking-tighter">
              <span>★ OFFICIAL ★</span>
              <span className="text-[7px]">LAB SEAL</span>
              <span>VERIFIED</span>
            </div>
            <div className="text-[10px] text-slate-500">
              <div>* এটি একটি ইলেকট্রনিক্যালি ভেরিফাইড ক্লিনিক্যাল ল্যাব রিপোর্ট।</div>
              <div>BMDC রেজিস্ট্রেশন নম্বর: A-48291</div>
            </div>
          </div>

          <div className="text-right text-xs">
            <div className="font-serif italic text-base text-emerald-900 font-bold mb-1">Dr. Kamrul Hasan</div>
            <div className="font-bold text-slate-900">{rep.approver_name || 'ডাঃ কামরুল হাসান'}</div>
            <div className="text-slate-500 text-[11px]">এমবিবিএস, এমডি (চিফ কনসালট্যান্ট প্যাথলজিস্ট)</div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-slate-200 print:hidden">
          <button
            onClick={handleSendWhatsApp}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md"
          >
            <Send size={13} />
            <span>📱 WhatsApp এ পাঠান</span>
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md flex items-center gap-1.5"
            >
              <Printer size={13} />
              <span>🖨️ A4 প্রিন্ট / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
