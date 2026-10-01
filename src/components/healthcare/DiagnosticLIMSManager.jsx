import React, { useState, useMemo } from 'react';
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
  Droplet
} from 'lucide-react';
import QRCode from 'qrcode';
import { printElement } from '../../services/printService';
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
    return { status: 'NORMAL', label: '✓ Normal', color: '#059669', bg: 'rgba(5, 150, 105, 0.12)' };
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

export const DiagnosticLIMSManager = () => {
  const {
    diagnosticTests,
    testPackages,
    diagnosticCategories,
    labOrders,
    patients,
    createLabOrder,
    updateLabSampleStatus,
    enterLabResults,
    verifyLabOrderReport
  } = useHealthcare();

  const { lang, showToast } = useApp();

  // Active top navigation tab
  // 'orders' | 'billing' | 'test_catalog' | 'disease_bundles' | 'result_entry'
  const [activeTab, setActiveTab] = useState('orders');

  const [selectedOrderForResults, setSelectedOrderForResults] = useState(null);
  const [selectedTestForResultEntry, setSelectedTestForResultEntry] = useState(null);
  const [viewingReportOrder, setViewingReportOrder] = useState(null);
  const [selectedOrderForBarcode, setSelectedOrderForBarcode] = useState(null);

  // Search & Filter in Catalog & Bundles
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [bundleTypeFilter, setBundleTypeFilter] = useState('ALL'); // 'ALL' | 'CANCER' | 'NON_CANCER' | 'MONITORING'
  const [bundleSearch, setBundleSearch] = useState('');

  // Billing Form State
  const [billingForm, setBillingForm] = useState({
    patient_id: '',
    referring_doctor: 'ডাঃ তানভীর আহমেদ (MBBS, FCPS)',
    selected_tests: [],
    loaded_bundle: null,
    discount: 0,
    paid_amount: 0,
    payment_method: 'cash'
  });

  // Result entry parameter values map: { [paramId]: value }
  const [resultValues, setResultValues] = useState({});

  // Calculation for billing
  const selectedTestObjects = useMemo(() => {
    return diagnosticTests.filter(t => billingForm.selected_tests.includes(t.test_id));
  }, [diagnosticTests, billingForm.selected_tests]);

  const subtotal = selectedTestObjects.reduce((sum, t) => sum + (Number(t.regular_price) || 0), 0);
  const grandTotal = Math.max(0, subtotal - (Number(billingForm.discount) || 0));

  // Check if any selected test or bundle is cancer related
  const hasCancerOrTumorMarker = useMemo(() => {
    if (billingForm.loaded_bundle?.is_cancer_related) return true;
    return selectedTestObjects.some(
      t => t.main_category === 'Tumor Marker' || t.main_category === 'Histopathology' || t.main_category === 'FNAC and Biopsy'
    );
  }, [billingForm.loaded_bundle, selectedTestObjects]);

  // Toggle single test in billing
  const handleToggleTest = (testId) => {
    setBillingForm(prev => {
      const exists = prev.selected_tests.includes(testId);
      const updated = exists ? prev.selected_tests.filter(id => id !== testId) : [...prev.selected_tests, testId];
      const newSubtotal = diagnosticTests.filter(t => updated.includes(t.test_id)).reduce((s, t) => s + (Number(t.regular_price) || 0), 0);
      return {
        ...prev,
        selected_tests: updated,
        paid_amount: Math.max(0, newSubtotal - prev.discount)
      };
    });
  };

  // Load a disease bundle into billing
  const handleLoadBundleToBilling = (bundle) => {
    // Find all tests that match the bundle's included_tests or test codes
    const testIdsToAdd = [];
    (bundle.included_tests || []).forEach(inc => {
      const matched = diagnosticTests.find(t => t.test_id === inc || t.test_code === inc || inc.includes(t.test_code));
      if (matched && !testIdsToAdd.includes(matched.test_id)) {
        testIdsToAdd.push(matched.test_id);
      }
    });

    const bundleSubtotal = diagnosticTests
      .filter(t => testIdsToAdd.includes(t.test_id))
      .reduce((s, t) => s + (Number(t.regular_price) || 0), 0);

    const calculatedDiscount = Math.max(0, bundleSubtotal - (bundle.package_price || bundleSubtotal));

    setBillingForm(prev => ({
      ...prev,
      selected_tests: testIdsToAdd,
      loaded_bundle: bundle,
      discount: calculatedDiscount,
      paid_amount: Math.max(0, bundleSubtotal - calculatedDiscount)
    }));

    setActiveTab('billing');
    showToast(`বান্ডেল "${bundle.bundle_name_bangla || bundle.bundle_name_english}" সফলভাবে বিলিং কাউন্টারে লোড করা হয়েছে!`, 'success');
  };

  // Handle Create Diagnostic Bill
  const handleCreateDiagnosticBill = (e) => {
    e.preventDefault();
    const patient = patients.find(p => p.patient_id === billingForm.patient_id);
    if (!patient) {
      showToast(lang === 'bn' ? 'রোগী নির্বাচন করুন' : 'Select a patient', 'warning');
      return;
    }
    if (selectedTestObjects.length === 0) {
      showToast(lang === 'bn' ? 'কমপক্ষে একটি টেস্ট নির্বাচন করুন' : 'Select at least one test', 'warning');
      return;
    }

    const orderData = {
      patient_id: patient.patient_id,
      patient_name: patient.full_name,
      patient_phone: patient.mobile_number,
      doctor_name: billingForm.referring_doctor,
      bundle_info: billingForm.loaded_bundle ? {
        bundle_id: billingForm.loaded_bundle.bundle_id,
        bundle_code: billingForm.loaded_bundle.bundle_code,
        bundle_name: billingForm.loaded_bundle.bundle_name_english
      } : null,
      tests: selectedTestObjects.map(t => ({
        test_id: t.test_id,
        test_code: t.test_code,
        test_name: t.test_name_english,
        test_name_bn: t.test_name_bangla,
        price: t.regular_price,
        sample_type: t.specimen_type,
        container: t.container_type,
        parameters: t.parameters || []
      })),
      total_amount: grandTotal,
      discount: billingForm.discount,
      paid_amount: billingForm.paid_amount,
      due_amount: Math.max(0, grandTotal - billingForm.paid_amount),
      payment_method: billingForm.payment_method
    };

    const newOrder = createLabOrder(orderData);
    showToast(lang === 'bn' ? `ল্যাব অর্ডার #${newOrder.lab_order_id} সম্পন্ন হয়েছে!` : `Lab Order created: #${newOrder.lab_order_id}`, 'success');
    setActiveTab('orders');
    setBillingForm({
      patient_id: '',
      referring_doctor: 'ডাঃ তানভীর আহমেদ (MBBS, FCPS)',
      selected_tests: [],
      loaded_bundle: null,
      discount: 0,
      paid_amount: 0,
      payment_method: 'cash'
    });
  };

  // Open Result Entry modal
  const handleOpenResultEntry = (order, test) => {
    setSelectedOrderForResults(order);
    setSelectedTestForResultEntry(test);
    setResultValues(test.results || {});
    setActiveTab('result_entry');
  };

  // Submit Result Entry
  const handleSaveResults = (e) => {
    e.preventDefault();
    if (!selectedOrderForResults || !selectedTestForResultEntry) return;

    enterLabResults(selectedOrderForResults.lab_order_id, selectedTestForResultEntry.test_id, resultValues);
    showToast(lang === 'bn' ? 'টেস্টের ফলাফল সফলভাবে সংরক্ষিত হয়েছে!' : 'Test results saved!', 'success');
    setActiveTab('orders');
    setSelectedOrderForResults(null);
    setSelectedTestForResultEntry(null);
  };

  // Verify Report
  const handleVerifyReport = (orderId) => {
    verifyLabOrderReport(orderId, 'ডাঃ কামরুল হাসান (এমবিবিএস, এমডি - চিফ প্যাথলজিস্ট)');
    showToast(lang === 'bn' ? 'রিপোর্ট অনুমোদিত ও ডেলিভারির জন্য প্রস্তুত!' : 'Report verified and ready for delivery!', 'success');
  };

  // Filtered A-to-Z tests
  const filteredCatalogTests = useMemo(() => {
    return diagnosticTests.filter(t => {
      const matchCat = selectedCategoryFilter === 'ALL' || t.main_category === selectedCategoryFilter || t.category_id === selectedCategoryFilter;
      const q = catalogSearch.toLowerCase().trim();
      const matchQuery =
        !q ||
        t.test_code.toLowerCase().includes(q) ||
        t.test_name_english.toLowerCase().includes(q) ||
        (t.test_name_bangla && t.test_name_bangla.toLowerCase().includes(q)) ||
        t.main_category.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [diagnosticTests, selectedCategoryFilter, catalogSearch]);

  // Filtered Bundles
  const filteredBundles = useMemo(() => {
    return testPackages.filter(b => {
      let matchType = true;
      if (bundleTypeFilter === 'CANCER') {
        matchType = b.is_cancer_related && !b.bundle_code.includes('FOL') && !b.bundle_code.includes('CHEMO') && !b.bundle_code.includes('RT-BASE');
      } else if (bundleTypeFilter === 'NON_CANCER') {
        matchType = !b.is_cancer_related;
      } else if (bundleTypeFilter === 'MONITORING') {
        matchType = b.is_cancer_related && (b.bundle_type === 'Treatment Monitoring' || b.bundle_type === 'Follow-up' || b.bundle_type === 'Confirmed Disease Baseline');
      }

      const q = bundleSearch.toLowerCase().trim();
      const matchQuery =
        !q ||
        b.bundle_code.toLowerCase().includes(q) ||
        b.bundle_name_english.toLowerCase().includes(q) ||
        (b.bundle_name_bangla && b.bundle_name_bangla.toLowerCase().includes(q)) ||
        (b.disease_group && b.disease_group.toLowerCase().includes(q));

      return matchType && matchQuery;
    });
  }, [testPackages, bundleTypeFilter, bundleSearch]);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-xl">🔬</span>
            <h1 className="text-2xl font-bold text-slate-800">
              ডায়াগনস্টিক সেন্টার ও ল্যাবরেটরি LIMS (A-to-Z Test Catalog & Bundles)
            </h1>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            ৫০টি ক্যাটাগরির পূর্ণাঙ্গ টেস্ট মাস্টার, ৭৮টি ডিজিজ ও ক্যান্সার ওয়ার্কআপ বান্ডেল, বারকোড ট্র্যাকিং ও ভেরিফাইড রিপোর্ট
          </p>
        </div>

        {/* Top Tab Navigation */}
        <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 overflow-x-auto text-xs font-semibold">
          <button
            type="button"
            className={`px-3 py-2 rounded-lg transition-all ${
              activeTab === 'orders' ? 'bg-white text-emerald-600 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => setActiveTab('orders')}
          >
            📋 ল্যাব অর্ডার কিউ ({labOrders.length})
          </button>
          <button
            type="button"
            className={`px-3 py-2 rounded-lg transition-all ${
              activeTab === 'billing' ? 'bg-white text-emerald-600 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => setActiveTab('billing')}
          >
            🧾 টেস্ট বিলিং কাউন্টার
          </button>
          <button
            type="button"
            className={`px-3 py-2 rounded-lg transition-all ${
              activeTab === 'disease_bundles' ? 'bg-white text-emerald-600 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => setActiveTab('disease_bundles')}
          >
            🧬 ডিজিজ ও ক্যান্সার বান্ডেল ({testPackages.length})
          </button>
          <button
            type="button"
            className={`px-3 py-2 rounded-lg transition-all ${
              activeTab === 'test_catalog' ? 'bg-white text-emerald-600 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => setActiveTab('test_catalog')}
          >
            📚 A-to-Z টেস্ট ক্যাটালগ ({diagnosticTests.length})
          </button>
        </div>
      </div>

      {/* TAB 1: LAB ORDERS QUEUE */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-800">চলমান ল্যাব অর্ডার ও স্যাম্পল ট্র্যাকিং</h2>
              <p className="text-xs text-slate-500">স্যাম্পল কালেকশন, রেজাল্ট এন্ট্রি ও চিফ প্যাথলজিস্ট ভেরিফিকেশন</p>
            </div>
            <button
              onClick={() => setActiveTab('billing')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-1.5"
            >
              <Plus size={14} /> নতুন বিল তৈরি করুন
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <th className="p-3">অর্ডার / ইনভয়েস</th>
                  <th className="p-3">রোগীর বিবরণ</th>
                  <th className="p-3">টেস্ট ও বান্ডেল</th>
                  <th className="p-3">স্যাম্পল ট্র্যাকিং</th>
                  <th className="p-3 text-right">বিল ও পেমেন্ট</th>
                  <th className="p-3 text-center">রিপোর্ট অবস্থা</th>
                  <th className="p-3 text-center">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {labOrders.map(order => (
                  <tr key={order.lab_order_id} className="hover:bg-slate-50/70">
                    <td className="p-3">
                      <div className="font-mono font-bold text-emerald-700">{order.lab_order_id}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{order.invoice_id}</div>
                      <div className="text-[10px] text-slate-500">{order.order_date}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-800">{order.patient_name}</div>
                      <div className="text-[11px] text-slate-500">আইডি: {order.patient_id}</div>
                      <div className="text-[11px] text-slate-500">ফোন: {order.patient_phone}</div>
                    </td>
                    <td className="p-3">
                      {order.bundle_info && (
                        <div className="mb-1 text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded w-fit">
                          📦 {order.bundle_info.bundle_name}
                        </div>
                      )}
                      <div className="space-y-0.5">
                        {order.tests?.map((t, idx) => (
                          <div key={idx} className="text-slate-700 flex items-center gap-1.5">
                            <span className="font-semibold text-slate-900">• {t.test_code || t.test_name}</span>
                            <span className="text-[10px] text-slate-400">({t.sample_type || 'Blood'})</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="space-y-1">
                        {order.tests?.map((t, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1 rounded">
                              {t.sample_id}
                            </span>
                            {t.status === 'Sample Collected' ? (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                ✓ সংগৃহীত
                              </span>
                            ) : (
                              <button
                                onClick={() => updateLabSampleStatus(order.lab_order_id, t.test_id, 'Sample Collected')}
                                className="text-[10px] font-bold text-blue-700 hover:underline bg-blue-50 px-1.5 py-0.5 rounded"
                              >
                                সংগ্রহ করুন
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="font-bold text-slate-900">৳{order.total_amount}</div>
                      <div className="text-[11px] text-emerald-700 font-semibold">জমা: ৳{order.paid_amount}</div>
                      {order.due_amount > 0 && (
                        <div className="text-[11px] text-rose-600 font-bold">বকেয়া: ৳{order.due_amount}</div>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        order.order_status === 'Report Ready'
                          ? 'bg-emerald-100 text-emerald-800'
                          : order.order_status === 'Result Entered'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {order.order_status === 'Report Ready' ? '✓ প্রস্তুত' : order.order_status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {order.order_status !== 'Report Ready' && order.tests?.[0] && (
                          <button
                            onClick={() => handleOpenResultEntry(order, order.tests[0])}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                          >
                            রেজাল্ট
                          </button>
                        )}
                        {order.order_status === 'Result Entered' && (
                          <button
                            onClick={() => handleVerifyReport(order.lab_order_id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm"
                          >
                            ভেরিফাই
                          </button>
                        )}
                        <button
                          onClick={() => setViewingReportOrder(order)}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-1"
                        >
                          <Printer size={12} /> রিপোর্ট
                        </button>
                        <button
                          onClick={() => setSelectedOrderForBarcode(order)}
                          className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-1"
                          title="স্যাম্পল টিউব বারকোড স্টিকার প্রিন্ট করুন"
                        >
                          <Barcode size={12} /> টিউব বারকোড
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: DIAGNOSTIC BILLING COUNTER */}
      {activeTab === 'billing' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Col: Test Selector & Loaded Bundle */}
          <div className="lg:col-span-8 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <span>🧾</span> ডায়াগনস্টিক টেস্ট ও বান্ডেল নির্বাচন
                </h2>
                <p className="text-xs text-slate-500">টেস্ট সার্চ করুন অথবা ৭৮টি ডিজিজ বান্ডেল থেকে সরাসরি লোড করুন</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('disease_bundles')}
                className="px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold rounded-xl text-xs border border-purple-200 flex items-center gap-1"
              >
                <span>🧬</span> ৭৮টি বান্ডেল দেখুন ও লোড করুন
              </button>
            </div>

            {/* Cancer / High Risk Clinical Alert Box */}
            {hasCancerOrTumorMarker && (
              <div className="p-3.5 bg-rose-50 border-2 border-rose-300 rounded-2xl flex items-start gap-3 text-rose-900 animate-pulse">
                <ShieldAlert className="shrink-0 text-rose-600 mt-0.5" size={20} />
                <div className="text-xs space-y-1">
                  <div className="font-black text-rose-800 uppercase tracking-wide">
                    ⚠️ ক্লিনিক্যাল সেফটি রুল ও বাধ্যতামূলক ডিসক্লেইমার (Clinical Safety Rule):
                  </div>
                  <p className="leading-relaxed font-medium">
                    {CANCER_SAFETY_DISCLAIMER}
                  </p>
                </div>
              </div>
            )}

            {/* Loaded Bundle Indicator */}
            {billingForm.loaded_bundle && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-purple-900">
                    সংযুক্ত ডিজিজ বান্ডেল: [{billingForm.loaded_bundle.bundle_code}] {billingForm.loaded_bundle.bundle_name_bangla || billingForm.loaded_bundle.bundle_name_english}
                  </span>
                  <div className="text-[11px] text-purple-700">
                    প্যাকেজ ডিসকাউন্ট: ৳{billingForm.discount} | নির্ধারিত রেট: ৳{billingForm.loaded_bundle.package_price}
                  </div>
                </div>
                <button
                  onClick={() => setBillingForm(prev => ({ ...prev, loaded_bundle: null, discount: 0 }))}
                  className="text-purple-700 hover:text-purple-900 font-bold underline"
                >
                  রিমুভ করুন
                </button>
              </div>
            )}

            {/* Search and Category Filter for Tests */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="🔍 টেস্টের নাম, কোড বা ক্যাটাগরি দিয়ে খুঁজুন..."
                  value={catalogSearch}
                  onChange={e => setCatalogSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
                <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
              </div>
              <select
                value={selectedCategoryFilter}
                onChange={e => setSelectedCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
              >
                <option value="ALL">সকল ক্যাটাগরি (All 50 Categories)</option>
                {diagnosticCategories.map(c => (
                  <option key={c.id} value={c.name_en}>
                    {c.name_en} ({c.name_bn})
                  </option>
                ))}
              </select>
            </div>

            {/* Test Selection Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[380px] overflow-y-auto pr-1">
              {filteredCatalogTests.map(test => {
                const isSelected = billingForm.selected_tests.includes(test.test_id);
                return (
                  <div
                    key={test.test_id}
                    onClick={() => handleToggleTest(test.test_id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-2 text-xs ${
                      isSelected
                        ? 'bg-emerald-50/80 border-emerald-500 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${
                          isSelected ? 'bg-emerald-600 text-white' : 'border border-slate-300'
                        }`}>
                          {isSelected && '✓'}
                        </span>
                        <span className="font-bold text-slate-800">{test.test_code}</span>
                        <span className="text-[10px] text-slate-400">({test.main_category})</span>
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5 truncate max-w-[220px]">
                        {test.test_name_bangla || test.test_name_english}
                      </div>
                    </div>
                    <div className="font-bold font-mono text-emerald-700 shrink-0">
                      ৳{test.regular_price}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Col: Invoice Checkout Form */}
          <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4 h-fit sticky top-4">
            <h3 className="font-bold text-slate-800 text-base border-b border-slate-100 pb-2 flex items-center gap-2">
              <span>💳</span> ইনভয়েস ও পেমেন্ট বিবরণ
            </h3>

            <form onSubmit={handleCreateDiagnosticBill} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">রোগী নির্বাচন করুন *:</label>
                <select
                  required
                  value={billingForm.patient_id}
                  onChange={e => setBillingForm(prev => ({ ...prev, patient_id: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="">-- রোগী নির্বাচন করুন --</option>
                  {patients.map(p => (
                    <option key={p.patient_id} value={p.patient_id}>
                      {p.patient_id} - {p.full_name} ({p.mobile_number})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">রেফারিং ডাক্তার / কনসালটেন্ট:</label>
                <input
                  type="text"
                  value={billingForm.referring_doctor}
                  onChange={e => setBillingForm(prev => ({ ...prev, referring_doctor: e.target.value }))}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              {/* Selected Tests Summary in Cart */}
              <div className="border-t border-b border-slate-100 py-2 space-y-1 max-h-36 overflow-y-auto">
                <div className="text-[11px] font-bold text-slate-400 uppercase">নির্বাচিত টেস্টসমূহ ({selectedTestObjects.length}):</div>
                {selectedTestObjects.map(t => (
                  <div key={t.test_id} className="flex justify-between items-center text-[11px] text-slate-700">
                    <span className="truncate pr-2">• {t.test_code}</span>
                    <span className="font-bold font-mono">৳{t.regular_price}</span>
                  </div>
                ))}
              </div>

              {/* Bill Math */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-slate-600">
                  <span>সাবটোটাল:</span>
                  <span className="font-bold font-mono">৳{subtotal}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>বান্ডেল / স্পেশাল ছাড় (৳):</span>
                  <input
                    type="number"
                    min="0"
                    value={billingForm.discount}
                    onChange={e => {
                      const d = Number(e.target.value) || 0;
                      setBillingForm(prev => ({ ...prev, discount: d, paid_amount: Math.max(0, subtotal - d) }));
                    }}
                    className="w-20 p-1 bg-slate-50 border border-slate-200 rounded-lg text-right font-bold"
                  />
                </div>
                <div className="flex justify-between text-sm font-extrabold text-slate-900 border-t pt-1.5">
                  <span>সর্বমোট প্রদেয়:</span>
                  <span className="text-emerald-700 font-mono">৳{grandTotal}</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span>জমা টাকা (Paid):</span>
                  <input
                    type="number"
                    min="0"
                    value={billingForm.paid_amount}
                    onChange={e => setBillingForm(prev => ({ ...prev, paid_amount: Number(e.target.value) }))}
                    className="w-24 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-right font-bold text-emerald-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">পেমেন্ট মেথড:</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {['cash', 'bkash', 'nagad', 'card'].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setBillingForm(prev => ({ ...prev, payment_method: m }))}
                      className={`p-1.5 rounded-lg border font-bold capitalize text-center ${
                        billingForm.payment_method === m
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={selectedTestObjects.length === 0}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-md transition-all text-xs"
              >
                ✓ বিল কনফার্ম করুন ও বারকোড কাটুন
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: DISEASE & CANCER BUNDLES */}
      {activeTab === 'disease_bundles' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
          {/* Header & Filter Pills */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                ৭৮টি ডিজিজ ও ক্লিনিক্যাল ডায়াগনস্টিক বান্ডেল (Disease & Cancer Workup Bundles)
              </h2>
              <p className="text-xs text-slate-500">
                ক্যান্সার উপসর্গ মূল্যায়ন, স্ক্রিনিং, অর্গান প্যানেল ও ট্রিটমেন্ট মনিটরিং
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs font-bold gap-1 overflow-x-auto">
              <button
                onClick={() => setBundleTypeFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  bundleTypeFilter === 'ALL' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600'
                }`}
              >
                সকল বান্ডেল (৭৮)
              </button>
              <button
                onClick={() => setBundleTypeFilter('CANCER')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  bundleTypeFilter === 'CANCER' ? 'bg-white text-rose-700 shadow-sm' : 'text-slate-600'
                }`}
              >
                🎗️ ক্যান্সার মূল্যায়ন (৩৯)
              </button>
              <button
                onClick={() => setBundleTypeFilter('NON_CANCER')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  bundleTypeFilter === 'NON_CANCER' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'
                }`}
              >
                🩺 সাধারণ রোগ প্যানেল (২৯)
              </button>
              <button
                onClick={() => setBundleTypeFilter('MONITORING')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  bundleTypeFilter === 'MONITORING' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'
                }`}
              >
                🔬 মনিটরিং ও ফলো-আপ (১০)
              </button>
            </div>
          </div>

          {/* Search box for bundles */}
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="🔍 বান্ডেল নাম, কোড বা রোগের নাম দিয়ে খুঁজুন..."
              value={bundleSearch}
              onChange={e => setBundleSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
          </div>

          {/* Bundles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBundles.map(bundle => (
              <div
                key={bundle.bundle_id}
                className="p-4 rounded-2xl border border-slate-200 hover:border-purple-300 transition-all bg-slate-50/60 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex justify-between items-start gap-1">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 bg-purple-100 text-purple-800 rounded">
                      {bundle.bundle_code}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      bundle.is_cancer_related ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {bundle.bundle_type}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-800 text-sm mt-2 leading-snug">
                    {bundle.bundle_name_bangla || bundle.bundle_name_english}
                  </h3>
                  <p className="text-xs text-slate-500 italic mt-0.5">{bundle.bundle_name_english}</p>
                  <div className="text-[11px] text-slate-600 mt-1">বিভাগ: <strong>{bundle.disease_group}</strong></div>

                  {bundle.clinical_triggers && (
                    <div className="mt-2 p-2 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-900">
                      <strong>লক্ষণসমূহ:</strong> {bundle.clinical_triggers}
                    </div>
                  )}

                  {/* Included Tests Pill List */}
                  <div className="mt-2.5 space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">অন্তর্ভুক্ত টেস্টসমূহ:</div>
                    <div className="flex flex-wrap gap-1">
                      {bundle.included_tests?.map((tCode, i) => (
                        <span key={i} className="text-[10px] font-mono px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-700">
                          {tCode}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Cancer Safety Warning */}
                  {bundle.is_cancer_related && (
                    <div className="mt-2.5 p-2 bg-rose-50 border border-rose-200 rounded-lg text-[10px] text-rose-800 flex items-center gap-1.5">
                      <ShieldAlert size={14} className="shrink-0 text-rose-600" />
                      <span>ডাক্তারের লিখিত অনুমোদন ও হিস্টোপ্যাথলজি বায়োপসি ব্যতিরেকে ক্যান্সার নিশ্চিত নয়।</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                  <div>
                    <div className="text-xs text-slate-400 line-through">৳{bundle.individual_price_total}</div>
                    <div className="text-sm font-extrabold text-purple-700">৳{bundle.package_price}</div>
                  </div>

                  <button
                    onClick={() => handleLoadBundleToBilling(bundle)}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all flex items-center gap-1"
                  >
                    <span>🛒</span> বিলিংয়ে লোড করুন
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: A-TO-Z TEST CATALOG */}
      {activeTab === 'test_catalog' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                A-to-Z ডায়াগনস্টিক টেস্ট ক্যাটালগ ও মূল্য তালিকা
              </h2>
              <p className="text-xs text-slate-500">
                ৫০টি ক্যাটাগরির নমুনা ও টিউব টাইপ, উপবাস নির্দেশনা এবং সাধারণ/জরুরি চার্জ
              </p>
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              <input
                type="text"
                placeholder="🔍 টেস্ট খুঁজুন..."
                value={catalogSearch}
                onChange={e => setCatalogSearch(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
              <select
                value={selectedCategoryFilter}
                onChange={e => setSelectedCategoryFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
              >
                <option value="ALL">সকল ক্যাটাগরি</option>
                {diagnosticCategories.map(c => (
                  <option key={c.id} value={c.name_en}>{c.name_en}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <th className="p-3">কোড</th>
                  <th className="p-3">টেস্টের নাম (ইংরেজি ও বাংলা)</th>
                  <th className="p-3">ক্যাটাগরি</th>
                  <th className="p-3">স্পেসিমেন ও টিউব</th>
                  <th className="p-3">ফাস্টিং</th>
                  <th className="p-3">TAT সময়</th>
                  <th className="p-3 text-right">সাধারণ ফি</th>
                  <th className="p-3 text-right">জরুরি ফি</th>
                  <th className="p-3 text-center">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCatalogTests.map(test => (
                  <tr key={test.test_id} className="hover:bg-slate-50/70">
                    <td className="p-3 font-mono font-bold text-emerald-700">{test.test_code}</td>
                    <td className="p-3">
                      <div className="font-bold text-slate-800">{test.test_name_english}</div>
                      <div className="text-slate-500 text-[11px]">{test.test_name_bangla}</div>
                    </td>
                    <td className="p-3 text-slate-600 font-medium">{test.main_category}</td>
                    <td className="p-3">
                      <div>{test.specimen_type}</div>
                      {test.container_type && (
                        <span className="text-[10px] text-slate-400 font-mono">[{test.container_type}]</span>
                      )}
                    </td>
                    <td className="p-3">
                      {test.fasting_requirement ? (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-[10px]">
                          খালি পেটে
                        </span>
                      ) : (
                        <span className="text-slate-400">প্রযোজ্য নয়</span>
                      )}
                    </td>
                    <td className="p-3 font-mono text-slate-600">{test.report_turnaround_time || '4 Hours'}</td>
                    <td className="p-3 text-right font-bold text-slate-900">৳{test.regular_price}</td>
                    <td className="p-3 text-right font-mono text-slate-500">৳{test.emergency_price || '-'}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => {
                          if (!billingForm.selected_tests.includes(test.test_id)) {
                            handleToggleTest(test.test_id);
                          }
                          setActiveTab('billing');
                        }}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs"
                      >
                        + বিলে নিন
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: RESULT ENTRY MODAL/SCREEN */}
      {activeTab === 'result_entry' && selectedOrderForResults && selectedTestForResultEntry && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm max-w-2xl mx-auto space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-200">
            <div>
              <h3 className="font-bold text-lg text-slate-800">ল্যাবরেটরি রেজাল্ট এন্ট্রি (Result Entry)</h3>
              <p className="text-xs text-slate-500">
                অর্ডার: {selectedOrderForResults.lab_order_id} | রোগী: {selectedOrderForResults.patient_name}
              </p>
            </div>
            <button onClick={() => setActiveTab('orders')} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
          </div>

          <form onSubmit={handleSaveResults} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-800 text-sm">{selectedTestForResultEntry.test_name}</span>
              <span className="ml-2 font-mono text-xs text-emerald-700">[{selectedTestForResultEntry.test_code}]</span>
            </div>

            <div className="space-y-3">
              {(selectedTestForResultEntry.parameters?.length > 0
                ? selectedTestForResultEntry.parameters
                : [
                    { id: 'param_main', name: 'Result Value', unit: '', ref_male: 'Normal' }
                  ]
              ).map(param => {
                const enteredVal = resultValues[param.id] || '';
                const evaluation = evaluateResultStatus(enteredVal, param.ref_male);
                const isPanic = isPanicValue(param.name, enteredVal);

                return (
                  <div key={param.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                      <div className="md:col-span-1">
                        <div className="font-bold text-slate-800 text-sm">{param.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">নরমাল রেঞ্জ: {param.ref_male} {param.unit}</div>
                      </div>
                      <div className="md:col-span-2 flex items-center gap-2">
                        <input
                          type="text"
                          required
                          placeholder={`ফলাফল লিখুন (${param.unit || 'Value'})...`}
                          value={enteredVal}
                          onChange={e => setResultValues({ ...resultValues, [param.id]: e.target.value })}
                          className={`flex-1 p-2 bg-white border rounded-lg font-bold font-mono text-slate-900 transition-all ${
                            evaluation?.status === 'HIGH' ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/30' :
                            (evaluation?.status === 'LOW' ? 'border-blue-400 focus:ring-blue-400 bg-blue-50/30' : 'border-slate-300')
                          }`}
                        />
                        <span className="text-slate-600 font-mono text-xs">{param.unit}</span>

                        {/* Real-time Reference Range Auto-Flag */}
                        {evaluation && (
                          <span
                            className="px-2 py-1 rounded text-[11px] font-bold font-mono flex items-center gap-1 shadow-xs"
                            style={{ background: evaluation.bg, color: evaluation.color }}
                          >
                            {evaluation.label}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Panic Value Flashing Alert */}
                    {isPanic && (
                      <div className="p-2.5 bg-rose-100 border border-rose-300 rounded-lg text-rose-800 font-bold text-xs flex items-center gap-2 animate-pulse">
                        <AlertTriangle size={16} className="text-rose-600 flex-shrink-0" />
                        <span>🚨 ক্রিটিক্যাল প্যানিক ভ্যালু অ্যালার্ট! ফলাফলটি বিপজ্জনক মাত্রায় পৌঁছেছে। অনতিবিলম্বে কর্তব্যরত চিকিৎসককে অবহিত করুন।</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md"
              >
                ✓ রেজাল্ট সেভ করুন
              </button>
            </div>
          </form>
        </div>
      )}

      {/* A4 Printable Pathology Report Modal */}
      {viewingReportOrder && (
        <A4PathologyReportModal
          order={viewingReportOrder}
          onClose={() => setViewingReportOrder(null)}
        />
      )}

      {/* Phlebotomy Sample Tube Barcode Sticker Modal */}
      <PhlebotomyBarcodeModal
        isOpen={!!selectedOrderForBarcode}
        onClose={() => setSelectedOrderForBarcode(null)}
        order={selectedOrderForBarcode}
      />
    </div>
  );
};

// A4 Printable Report Component with Dynamic QR Code & Range Flags
function A4PathologyReportModal({ order, onClose }) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');

  React.useEffect(() => {
    const verifyPayload = `https://hisabkitab360.com/verify-report?order=${order.lab_order_id}&patient=${order.patient_id}&date=${order.order_date}`;
    QRCode.toDataURL(verifyPayload, { width: 120, margin: 1 })
      .then(url => setQrCodeDataUrl(url))
      .catch(err => console.error('QR code generation notice:', err));
  }, [order]);

  const handleSendWhatsApp = () => {
    const phone = (order.patient_phone || '').replace(/[^0-9]/g, '');
    const cleanPhone = phone.startsWith('880') ? phone : (phone.startsWith('0') ? '880' + phone.slice(1) : phone);
    const message = encodeURIComponent(
      `সম্মানিত ${order.patient_name},\nহিসাবকিতাব ৩৬০ ক্লিনিক্যাল ল্যাবরেটরি থেকে আপনার প্যাথলজি রিপোর্ট (অর্ডার: #${order.lab_order_id}) প্রস্তুত হয়েছে এবং চিফ প্যাথলজিস্ট কর্তৃক অনুমোদিত হয়েছে।\nরিপোর্ট স্ট্যাটাস: ${order.order_status}\nঅনলাইনে ভেরিফাই করুন: https://hisabkitab360.com/verify?order=${order.lab_order_id}\nধন্যবাদ, সুস্থ থাকুন।`
    );
    if (cleanPhone) {
      window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
    } else {
      alert('রোগীর ফোন নম্বর পাওয়া যায়নি!');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start pb-4 border-b-2 border-slate-800">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-wide">হিসাবকিতাব ৩৬০ ক্লিনিক্যাল ল্যাবরেটরি ও LIMS</h1>
            <p className="text-xs text-slate-600">বাড়ি # ১২, রোড # ৪, ধানমন্ডি, ঢাকা-১২০৫ | হটলাইন: ১০৬৭৮ | ফোন: +880 1800 000000</p>
            <p className="text-xs font-semibold text-emerald-700 mt-1">ডিপার্টমেন্ট অফ প্যাথলজি, বায়োকেমিস্ট্রি ও মলিকুলার ডায়াগনস্টিকস</p>
          </div>
          <div className="text-right flex flex-col items-center">
            {qrCodeDataUrl ? (
              <img src={qrCodeDataUrl} alt="Report Verification QR" className="w-16 h-16 rounded border border-slate-300 shadow-xs" />
            ) : (
              <div className="w-16 h-16 bg-slate-100 border border-slate-300 rounded flex items-center justify-center text-[10px] font-mono text-center">
                QR CODE<br/>VERIFIED
              </div>
            )}
            <span className="text-[9px] font-mono text-emerald-700 font-bold mt-1">ISO 15189 CERTIFIED</span>
          </div>
        </div>

        {/* Patient Details */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
          <div>
            <div>রোগীর নাম: <strong className="text-slate-900">{order.patient_name}</strong></div>
            <div>রোগী আইডি: <strong className="font-mono">{order.patient_id}</strong></div>
            <div>মোবাইল নং: {order.patient_phone || 'N/A'}</div>
          </div>
          <div>
            <div>ল্যাব অর্ডার নং: <strong className="font-mono text-emerald-700">{order.lab_order_id}</strong></div>
            <div>রেফারেল ডাক্তার: <strong>{order.doctor_name || 'ডাঃ তানভীর আহমেদ'}</strong></div>
            <div>রিপোর্ট ভেরিফিকেশন: {order.verified_at || new Date().toLocaleString('bn-BD')}</div>
          </div>
        </div>

        {/* Tests and Results Table with Range Indicator */}
        <div className="space-y-4">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-800 text-slate-800">
                <th className="py-2">টেস্টের নাম ও প্যারামিটার</th>
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
                      const val = t.results?.[p.id] || 'Normal';
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
                      <td className="py-2 text-center font-bold font-mono text-slate-900">
                        {t.results?.param_main || 'Normal study'}
                      </td>
                      <td className="py-2 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                          ✓ Normal
                        </span>
                      </td>
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
            <div className="font-bold text-slate-900">{order.verified_by || 'ডাঃ কামরুল হাসান'}</div>
            <div className="text-slate-500 text-[11px]">এমবিবিএস, এমডি (চিফ কনসালট্যান্ট প্যাথলজিস্ট)</div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-slate-200">
          <button
            onClick={handleSendWhatsApp}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md"
            title="রোগীর মোবাইল নম্বরে সরাসরি WhatsApp এ রিপোর্ট পাঠিয়ে দিন"
          >
            <Send size={13} />
            <span>📱 WhatsApp এ পাঠান</span>
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md flex items-center gap-1.5"
            >
              <Printer size={13} />
              <span>🖨️ A4 প্রিন্ট করুন</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
