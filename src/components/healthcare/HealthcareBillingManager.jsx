import React, { useState, useMemo, useEffect } from 'react';
import { useHealthcare } from '../../context/HealthcareContext';
import {
  CreditCard,
  DollarSign,
  Receipt,
  Search,
  Plus,
  Trash2,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Wallet,
  Building,
  Sparkles,
  TrendingUp,
  UserCheck,
  BarChart3,
  RotateCcw,
  FileText,
  XCircle,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  PieChart,
  Users,
  Stethoscope,
  FlaskConical,
  Pill,
  Boxes,
  Percent,
  Truck,
  ShieldCheck,
  Ban,
  Clock,
  Filter,
  CheckCheck,
  History,
  FileSpreadsheet,
  Download,
  X
} from 'lucide-react';
import { generateQrDataUrl, createInvoiceVerificationUrl } from '../../services/qrService';
import { printElement } from '../../services/printService';

export const HealthcareBillingManager = () => {
  const {
    patients = [],
    doctors = [],
    diagnosticTests = [],
    branches = [],
    activeBranchId = 'dhanmondi',
    appointments = [],
    labOrders = [],
    pharmacyMedicines = []
  } = useHealthcare();

  const currentBranch = branches.find(b => b.id === activeBranchId) || { id: 'dhanmondi', name: 'ধানমন্ডি মেইন ব্রাঞ্চ', code: 'DHD-01' };

  // Master Section: 'bills' | 'due_list' | 'refunds_cancel' | 'cash_closing' | 'reports'
  const [masterTab, setMasterTab] = useState('bills');

  // Subtabs within Bills
  const [billSubTab, setBillSubTab] = useState('new_bill'); // 'new_bill' | 'recent_invoices'

  // 15 Bill Fields POS State
  const [selectedBranch, setSelectedBranch] = useState(currentBranch.name);
  const [selectedPatient, setSelectedPatient] = useState(patients[0] || null);
  const [serviceType, setServiceType] = useState('ডাক্তার ফি'); // 'ডাক্তার ফি' | 'ডায়াগনস্টিক' | 'ফার্মেসি' | 'বেড চার্জ' | 'সাধারণ'
  const [billItems, setBillItems] = useState([
    { id: 1, type: 'ডাক্তার ফি', name: 'কনসালটেন্সি ফি (ডা: রফিকুল ইসলাম)', qty: 1, rate: 800, total: 800 },
    { id: 2, type: 'ডায়াগনস্টিক', name: 'কমপ্লিট ব্লাড কাউন্ট (CBC with ESR)', qty: 1, rate: 450, total: 450 }
  ]);
  const [discountAmount, setDiscountAmount] = useState(50);
  const [vatPercent, setVatPercent] = useState(0); // কর / VAT
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('নগদ'); // 8 Modes: 'নগদ' | 'কার্ড' | 'ব্যাংক' | 'bKash' | 'Nagad' | 'অন্যান্য অনুমোদিত পদ্ধতি' | 'আংশিক পেমেন্ট' | 'বকেয়া'
  const [cashierName, setCashierName] = useState('প্রধান ক্যাশিয়ার (আবুল কালাম)');

  // Modal states
  const [viewingReceipt, setViewingReceipt] = useState(null);
  const [receiptQrUrl, setReceiptQrUrl] = useState('');

  useEffect(() => {
    if (viewingReceipt) {
      const verifyUrl = createInvoiceVerificationUrl(viewingReceipt);
      generateQrDataUrl(verifyUrl, { width: 140, margin: 1 }).then(url => {
        if (url) setReceiptQrUrl(url);
      });
    } else {
      setReceiptQrUrl('');
    }
  }, [viewingReceipt]);
  const [showPartialPayModal, setShowPartialPayModal] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState(null);
  const [partialPayInput, setPartialPayInput] = useState('');
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundForm, setRefundForm] = useState({ invoiceNo: '', amount: '', reason: '', supervisorPin: '' });
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelForm, setCancelForm] = useState({ invoiceNo: '', reason: '', supervisorPin: '' });

  // Invoices List (15 Fields with Transaction Logs & Contra Entries)
  const [invoices, setInvoices] = useState([
    {
      bill_no: 'BILL-2026-1001',
      branch: 'ধানমন্ডি মেইন ব্রাঞ্চ',
      patient: 'মো: রফিকুল ইসলাম (UHID-2026-001)',
      patient_id: 'UHID-2026-001',
      service_type: 'ডাক্তার ফি ও ডায়াগনস্টিক',
      description: 'কনসালটেন্সি ফি + CBC রক্ত পরীক্ষা',
      quantity: 2,
      unit_price: 1250,
      discount: 50,
      vat: 0,
      total_bill: 1200,
      paid_amount: 1200,
      due_amount: 0,
      payment_mode: 'নগদ',
      cashier: 'প্রধান ক্যাশিয়ার (আবুল কালাম)',
      date_time: '2026-10-10 11:30 AM',
      status: 'পরিশোধিত',
      installments: [
        { trans_id: 'TXN-01', date: '2026-10-10 11:30 AM', amount: 1200, mode: 'নগদ', cashier: 'প্রধান ক্যাশিয়ার' }
      ]
    },
    {
      bill_no: 'BILL-2026-1002',
      branch: 'ধানমন্ডি মেইন ব্রাঞ্চ',
      patient: 'মোসা: সুমি আক্তার (UHID-2026-003)',
      patient_id: 'UHID-2026-003',
      service_type: 'ডায়াগনস্টিক',
      description: 'হোল অ্যাবডোমেন আল্ট্রাসনোগ্রাম + লিপিড প্রোফাইল',
      quantity: 2,
      unit_price: 3500,
      discount: 200,
      vat: 0,
      total_bill: 3300,
      paid_amount: 2000,
      due_amount: 1300,
      payment_mode: 'আংশিক পেমেন্ট (bKash)',
      cashier: 'প্রধান ক্যাশিয়ার (আবুল কালাম)',
      date_time: '2026-10-10 12:15 PM',
      status: 'আংশিক বকেয়া',
      installments: [
        { trans_id: 'TXN-02', date: '2026-10-10 12:15 PM', amount: 2000, mode: 'bKash', cashier: 'প্রধান ক্যাশিয়ার' }
      ]
    },
    {
      bill_no: 'BILL-2026-1003',
      branch: 'মিরপুর শাখা',
      patient: 'আলহাজ্ব মো: আব্দুল করিম (UHID-2026-002)',
      patient_id: 'UHID-2026-002',
      service_type: 'ফার্মেসি ও বেড চার্জ',
      description: 'ইনপেশেন্ট বেড চার্জ (২ দিন) + জরুরি ওষুধ',
      quantity: 5,
      unit_price: 8200,
      discount: 500,
      vat: 0,
      total_bill: 7700,
      paid_amount: 7700,
      due_amount: 0,
      payment_mode: 'কার্ড',
      cashier: 'শিফট-২ ক্যাশিয়ার (নাজমুল)',
      date_time: '2026-10-10 02:40 PM',
      status: 'পরিশোধিত',
      installments: [
        { trans_id: 'TXN-03', date: '2026-10-10 02:40 PM', amount: 7700, mode: 'কার্ড', cashier: 'শিফট-২ ক্যাশিয়ার' }
      ]
    }
  ]);

  // Contra Entries / Audit Ledger for Cancellations and Refunds
  const [contraEntries, setContraEntries] = useState([
    {
      contra_id: 'CONTRA-2026-801',
      original_bill_no: 'BILL-2026-0985',
      type: 'রিফান্ড সমন্বয় (Refund Contra)',
      amount: -1450,
      patient: 'জাহাঙ্গীর আলম',
      reason: 'রোগী অন্য হাসপাতালে ট্রান্সফার হয়েছেন',
      supervisor: 'সুপারভাইজার ডা: তানভীর (অনুমোদিত)',
      date: '2026-10-10 10:45 AM',
      branch: 'ধানমন্ডি মেইন ব্রাঞ্চ'
    },
    {
      contra_id: 'CONTRA-2026-802',
      original_bill_no: 'BILL-2026-0992',
      type: 'বিল বাতিল সমন্বয় (Cancellation Contra)',
      amount: -800,
      patient: 'ফারজানা ইয়াসমিন',
      reason: 'ডাক্তার জরুরি সার্জারিতে ব্যস্ত থাকায় অ্যাপয়েন্টমেন্ট বাতিল',
      supervisor: 'সুপারভাইজার ডা: তানভীর (অনুমোদিত)',
      date: '2026-10-10 01:20 PM',
      branch: 'ধানমন্ডি মেইন ব্রাঞ্চ'
    }
  ]);

  // Calculations for POS
  const subtotal = useMemo(() => {
    return billItems.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  }, [billItems]);

  const vatAmount = Math.round((subtotal * (Number(vatPercent) || 0)) / 100);
  const totalBill = Math.max(0, subtotal - (Number(discountAmount) || 0) + vatAmount);
  const effectivePaid = paymentMode === 'বকেয়া' ? 0 : Number(paidAmount) || totalBill;
  const dueAmount = Math.max(0, totalBill - effectivePaid);

  // Quick Service Adders
  const handleAddItem = (type, name, rate) => {
    setBillItems([...billItems, { id: Date.now(), type, name, qty: 1, rate, total: rate }]);
  };

  const handleRemoveItem = (id) => {
    setBillItems(billItems.filter(item => item.id !== id));
  };

  // 1. [পেমেন্ট গ্রহণ] / [আংশিক পেমেন্ট] Bill Generation
  const handleCreateInvoice = (isPartial = false) => {
    if (!selectedPatient) {
      alert('অনুগ্রহ করে একজন রোগী নির্বাচন করুন!');
      return;
    }
    if (billItems.length === 0) {
      alert('বিলে অন্তত একটি সেবা বা আইটেম যোগ করুন!');
      return;
    }

    const billNo = `BILL-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const finalPaid = isPartial ? Number(paidAmount) || 0 : effectivePaid;
    const finalDue = Math.max(0, totalBill - finalPaid);
    const finalMode = isPartial ? 'আংশিক পেমেন্ট' : paymentMode;

    const newInvoice = {
      bill_no: billNo,
      branch: selectedBranch,
      patient: `${selectedPatient.full_name} (${selectedPatient.patient_id})`,
      patient_id: selectedPatient.patient_id,
      service_type: billItems[0]?.type || 'সাধারণ সেবা',
      description: billItems.map(i => i.name).join(', '),
      quantity: billItems.reduce((acc, i) => acc + (i.qty || 1), 0),
      unit_price: subtotal,
      discount: Number(discountAmount) || 0,
      vat: vatAmount,
      total_bill: totalBill,
      paid_amount: finalPaid,
      due_amount: finalDue,
      payment_mode: finalMode,
      cashier: cashierName,
      date_time: new Date().toLocaleString('bn-BD'),
      status: finalDue === 0 ? 'পরিশোধিত' : finalPaid > 0 ? 'আংশিক বকেয়া' : 'সম্পূর্ণ বকেয়া',
      installments: [
        { trans_id: `TXN-${Date.now().toString().slice(-4)}`, date: new Date().toLocaleString('bn-BD'), amount: finalPaid, mode: finalMode, cashier: cashierName }
      ]
    };

    setInvoices([newInvoice, ...invoices]);
    setViewingReceipt(newInvoice);
    setBillItems([]);
    setDiscountAmount(0);
    setPaidAmount('');
  };

  // 4. [রিফান্ড] Processing with Contra-entry
  const handleProcessRefund = (e) => {
    e.preventDefault();
    if (!refundForm.supervisorPin || refundForm.supervisorPin !== '1234') {
      alert('সুপারভাইজার অনুমোদন পিন ভুল! (ডেমো পিন: 1234)');
      return;
    }

    const refAmount = Number(refundForm.amount) || 0;
    const contra = {
      contra_id: `CONTRA-2026-${Math.floor(100 + Math.random() * 900)}`,
      original_bill_no: refundForm.invoiceNo,
      type: 'রিফান্ড বিপরীত সমন্বয় (Refund Contra)',
      amount: -refAmount,
      patient: 'অনুমোদিত রোগী',
      reason: refundForm.reason,
      supervisor: 'সুপারভাইজার অ্যাডমিন (যাচাইকৃত PIN)',
      date: new Date().toLocaleString('bn-BD'),
      branch: selectedBranch
    };

    setContraEntries([contra, ...contraEntries]);
    setInvoices(prev => prev.map(inv => inv.bill_no === refundForm.invoiceNo ? { ...inv, status: 'রিফান্ড সম্পন্ন' } : inv));
    alert(`রিফান্ড সফল! বিপরীত সমন্বয় এন্ট্রি #${contra.contra_id} তৈরি হয়েছে। মূল লেনদেন অক্ষুণ্ণ রাখা হয়েছে।`);
    setShowRefundModal(false);
    setRefundForm({ invoiceNo: '', amount: '', reason: '', supervisorPin: '' });
  };

  // 5. [বিল বাতিল] Processing with Contra-entry
  const handleProcessCancellation = (e) => {
    e.preventDefault();
    if (!cancelForm.supervisorPin || cancelForm.supervisorPin !== '1234') {
      alert('সুপারভাইজার অনুমোদন পিন ভুল! (ডেমো পিন: 1234)');
      return;
    }

    const targetInv = invoices.find(i => i.bill_no === cancelForm.invoiceNo);
    const contra = {
      contra_id: `CONTRA-2026-${Math.floor(100 + Math.random() * 900)}`,
      original_bill_no: cancelForm.invoiceNo,
      type: 'বিল বাতিল সমন্বয় (Cancellation Contra)',
      amount: -(targetInv ? targetInv.paid_amount : 0),
      patient: targetInv ? targetInv.patient : 'রোগী',
      reason: cancelForm.reason,
      supervisor: 'সুপারভাইজার অ্যাডমিন (যাচাইকৃত PIN)',
      date: new Date().toLocaleString('bn-BD'),
      branch: targetInv?.branch || selectedBranch
    };

    setContraEntries([contra, ...contraEntries]);
    setInvoices(prev => prev.map(inv => inv.bill_no === cancelForm.invoiceNo ? { ...inv, status: 'বাতিলকৃত (Cancelled)' } : inv));
    alert(`বিল #${cancelForm.invoiceNo} সফলভাবে বাতিল করা হয়েছে এবং বিপরীত হিসাব তৈরি হয়েছে!`);
    setShowCancelModal(false);
    setCancelForm({ invoiceNo: '', reason: '', supervisorPin: '' });
  };

  // Partial Installment Collection
  const handleCollectInstallment = (e) => {
    e.preventDefault();
    const pay = Number(partialPayInput) || 0;
    if (pay <= 0 || !selectedInvoiceForPayment) return;

    setInvoices(prev => prev.map(inv => {
      if (inv.bill_no === selectedInvoiceForPayment.bill_no) {
        const newPaid = inv.paid_amount + pay;
        const newDue = Math.max(0, inv.total_bill - newPaid);
        return {
          ...inv,
          paid_amount: newPaid,
          due_amount: newDue,
          status: newDue === 0 ? 'পরিশোধিত' : 'আংশিক বকেয়া',
          installments: [
            ...inv.installments,
            { trans_id: `TXN-${Date.now().toString().slice(-4)}`, date: new Date().toLocaleString('bn-BD'), amount: pay, mode: 'নগদ কিস্তি', cashier: cashierName }
          ]
        };
      }
      return inv;
    }));

    alert(`৳${pay} কিস্তি পেমেন্ট সফলভাবে জমা হয়েছে!`);
    setShowPartialPayModal(false);
    setPartialPayInput('');
    setSelectedInvoiceForPayment(null);
  };

  // ==============================================================
  // REPORT SCREEN: 9 COMMON FILTERS & 14 SPECIFIC REPORTS
  // ==============================================================
  const [reportSubTab, setReportSubTab] = useState('rep_1_daily_patients'); // 14 reports
  const [reportFilters, setReportFilters] = useState({
    date_from: '2026-10-01',
    date_to: '2026-10-10',
    branch: 'সব শাখা',
    doctor: 'সব ডাক্তার',
    department: 'সব বিভাগ',
    service_type: 'সব সেবা',
    payment_status: 'সব স্ট্যাটাস',
    report_status: 'সব রিপোর্ট',
    staff: 'সব কর্মী'
  });

  const reportsNavList = [
    { id: 'rep_1_daily_patients', label: '১. দৈনিক রোগী ও অ্যাপয়েন্টমেন্ট', icon: Users },
    { id: 'rep_2_doctor_fees', label: '২. ডাক্তারভিত্তিক ভিজিট ও ফি', icon: Stethoscope },
    { id: 'rep_3_branch_tests', label: '৩. শাখাভিত্তিক টেস্ট অর্ডার', icon: FlaskConical },
    { id: 'rep_4_tat_delivery', label: '৪. রিপোর্ট তৈরি ও ডেলিভারির সময়', icon: Clock },
    { id: 'rep_5_pharmacy_sales', label: '৫. ফার্মেসি বিক্রি', icon: Pill },
    { id: 'rep_6_batch_stock', label: '৬. ব্যাচভিত্তিক স্টক', icon: Boxes },
    { id: 'rep_7_expiry_alerts', label: '৭. মেয়াদোত্তীর্ণ / মেয়াদ-সতর্কতা', icon: AlertTriangle },
    { id: 'rep_8_stock_transfer', label: '৮. শাখা থেকে শাখায় স্টক ট্রান্সফার', icon: Truck },
    { id: 'rep_9_revenue_methods', label: '৯. মোট আয় ও পেমেন্ট পদ্ধতি', icon: PieChart },
    { id: 'rep_10_due_patients', label: '১০. বকেয়া রোগী খতিয়ান', icon: UserCheck },
    { id: 'rep_11_supplier_payables', label: '১১. সরবরাহকারী পাওনা', icon: Building },
    { id: 'rep_12_refund_cancelled', label: '১২. রিফান্ড ও বাতিল (Contra Entries)', icon: RotateCcw },
    { id: 'rep_13_daily_cash_closing', label: '১৩. দৈনিক ক্যাশ ক্লোজিং', icon: CheckCheck },
    { id: 'rep_14_branch_comparison', label: '১৪. শাখাভিত্তিক তুলনা', icon: BarChart3 }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Banner */}
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem', borderRadius: '18px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(20, 184, 166, 0.05) 100%)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#059669', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)' }}>
              <Receipt size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900', color: 'var(--text-main)' }}>
                  বিল ও পেমেন্ট এবং সেন্ট্রাল রিপোর্ট হাব (Billing & 14 Reports)
                </h1>
                <span className="badge" style={{ background: 'rgba(5, 150, 105, 0.15)', color: '#059669', fontSize: '0.72rem', fontWeight: '800' }}>
                  GAAP / Contra-Entry Enabled
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                ১৫টি বিল ফিল্ড • ৮টি পেমেন্ট পদ্ধতি • ৬টি অ্যাকশন বাটন • বিপরীত সমন্বয় লেনদেন ও ১৪টি রিপোর্ট
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setMasterTab('bills')}
              className={`btn press-scale ${masterTab === 'bills' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 14px', fontSize: '0.8rem', fontWeight: '800' }}
            >
              <CreditCard size={15} />
              <span>১.৯ বিল ও পেমেন্ট (POS)</span>
            </button>
            <button
              onClick={() => setMasterTab('due_list')}
              className={`btn press-scale ${masterTab === 'due_list' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 14px', fontSize: '0.8rem', fontWeight: '800' }}
            >
              <Users size={15} />
              <span>[বকেয়া তালিকা] ({invoices.filter(i => i.due_amount > 0).length})</span>
            </button>
            <button
              onClick={() => setMasterTab('refunds_cancel')}
              className={`btn press-scale ${masterTab === 'refunds_cancel' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 14px', fontSize: '0.8rem', fontWeight: '800' }}
            >
              <RotateCcw size={15} />
              <span>রিফান্ড ও বাতিল ({contraEntries.length})</span>
            </button>
            <button
              onClick={() => setMasterTab('reports')}
              className={`btn press-scale ${masterTab === 'reports' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 14px', fontSize: '0.8rem', fontWeight: '800', background: masterTab === 'reports' ? '#2563eb' : undefined }}
            >
              <BarChart3 size={15} />
              <span>রিপোর্ট হাব (১৪টি রিপোর্ট)</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SECTION 1: BILLS & PAYMENTS (15 FIELDS & 6 BUTTONS) */}
      {/* ============================================================== */}
      {masterTab === 'bills' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Subtabs and 6 Prominent Action Buttons */}
          <div className="glass-card" style={{ padding: '0.75rem 1rem', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div className="hc-subtabs-nav" style={{ padding: '3px' }}>
              <button
                onClick={() => setBillSubTab('new_bill')}
                className={`hc-tab-btn ${billSubTab === 'new_bill' ? 'active-emerald' : ''}`}
              >
                নতুন বিল তৈরি (New Bill POS)
              </button>
              <button
                onClick={() => setBillSubTab('recent_invoices')}
                className={`hc-tab-btn ${billSubTab === 'recent_invoices' ? 'active-emerald' : ''}`}
              >
                সর্বশেষ বিল তালিকা ({invoices.length})
              </button>
            </div>

            {/* 6 Mandatory Action Buttons */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => handleCreateInvoice(false)}
                className="btn btn-primary press-scale"
                style={{ fontSize: '0.75rem', fontWeight: '800', background: '#059669', borderColor: '#059669', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <CheckCircle2 size={14} />
                <span>[পেমেন্ট গ্রহণ]</span>
              </button>
              <button
                type="button"
                onClick={() => handleCreateInvoice(true)}
                className="btn btn-primary press-scale"
                style={{ fontSize: '0.75rem', fontWeight: '800', background: '#2563eb', borderColor: '#2563eb', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Percent size={14} />
                <span>[আংশিক পেমেন্ট]</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (invoices[0]) setViewingReceipt(invoices[0]);
                  else alert('কোনো বিল তৈরি হয়নি!');
                }}
                className="btn btn-secondary press-scale"
                style={{ fontSize: '0.75rem', fontWeight: '800', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Printer size={14} />
                <span>[রসিদ প্রিন্ট]</span>
              </button>
              <button
                type="button"
                onClick={() => setShowRefundModal(true)}
                className="btn btn-secondary press-scale"
                style={{ fontSize: '0.75rem', fontWeight: '800', padding: '6px 10px', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.4)', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <RotateCcw size={14} />
                <span>[রিফান্ড]</span>
              </button>
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                className="btn btn-secondary press-scale"
                style={{ fontSize: '0.75rem', fontWeight: '800', padding: '6px 10px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Ban size={14} />
                <span>[বিল বাতিল]</span>
              </button>
              <button
                type="button"
                onClick={() => setMasterTab('due_list')}
                className="btn btn-secondary press-scale"
                style={{ fontSize: '0.75rem', fontWeight: '800', padding: '6px 10px', color: '#dc2626', borderColor: 'rgba(220, 38, 38, 0.4)', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Wallet size={14} />
                <span>[বকেয়া তালিকা]</span>
              </button>
            </div>
          </div>

          {billSubTab === 'new_bill' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: 15 Billing Fields & Item selection (7 Cols) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                  {/* Field 1: Branch Selection */}
                  <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-200 text-xs font-bold text-teal-900 flex items-center justify-between">
                    <span>📍 বিল তৈরির সক্রিয় শাখা: <strong>{selectedBranch}</strong></span>
                    <select
                      value={selectedBranch}
                      onChange={e => setSelectedBranch(e.target.value)}
                      className="px-2 py-0.5 rounded bg-teal-100 font-bold border-none text-xs"
                    >
                      {branches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                    </select>
                  </div>

                  {/* Field 2: Patient Selection */}
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <UserCheck size={18} className="text-teal-600" />
                    <span>রোগী নির্বাচন (Patient Selection)</span>
                  </h3>
                  <select
                    value={selectedPatient?.patient_id || ''}
                    onChange={e => {
                      const p = patients.find(item => item.patient_id === e.target.value);
                      if (p) setSelectedPatient(p);
                    }}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 font-medium"
                  >
                    {patients.map(p => (
                      <option key={p.patient_id} value={p.patient_id}>
                        {p.full_name} ({p.patient_id}) • {p.mobile_number || p.phone}
                      </option>
                    ))}
                  </select>

                  {selectedPatient && (
                    <div className="p-3 rounded-xl bg-teal-50/60 border border-teal-200 text-xs flex justify-between items-center">
                      <div>
                        <span className="font-bold text-teal-950">{selectedPatient.full_name}</span> ({selectedPatient.age} বছর)
                        <div className="text-[11px] text-teal-800">মোবাইল: {selectedPatient.mobile_number || selectedPatient.phone}</div>
                      </div>
                      <span className="px-2.5 py-1 bg-teal-200 text-teal-900 font-black rounded-lg text-[10px]">{selectedPatient.patient_id}</span>
                    </div>
                  )}
                </div>

                {/* Field 3: Service Type Quick Selectors */}
                <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                  <h3 className="text-sm font-black text-slate-900">সেবার ধরন ও দ্রুত আইটেম যোগ</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button type="button" onClick={() => handleAddItem('ডাক্তার ফি', 'কনসালটেন্সি ফি (সাধারণ)', 600)} className="p-2.5 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50 text-left transition-all text-xs">
                      <div className="font-bold text-slate-900">🩺 ডক্টর ফি</div>
                      <div className="text-[11px] text-teal-700 font-extrabold">৳৬০০</div>
                    </button>
                    <button type="button" onClick={() => handleAddItem('ডায়াগনস্টিক', 'ব্লাড সুগার (RBS)', 150)} className="p-2.5 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50 text-left transition-all text-xs">
                      <div className="font-bold text-slate-900">🧪 ব্লাড সুগার</div>
                      <div className="text-[11px] text-teal-700 font-extrabold">৳১৫০</div>
                    </button>
                    <button type="button" onClick={() => handleAddItem('ফার্মেসি', 'Napa Extra Strip (10 pcs)', 25)} className="p-2.5 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50 text-left transition-all text-xs">
                      <div className="font-bold text-slate-900">💊 নাপা এক্সট্রা</div>
                      <div className="text-[11px] text-teal-700 font-extrabold">৳২৫</div>
                    </button>
                    <button type="button" onClick={() => handleAddItem('বেড চার্জ', 'জেনারেল বেড ভাড়া (১ দিন)', 1000)} className="p-2.5 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50 text-left transition-all text-xs">
                      <div className="font-bold text-slate-900">🛏️ বেড চার্জ</div>
                      <div className="text-[11px] text-teal-700 font-extrabold">৳১,০০০</div>
                    </button>
                  </div>
                </div>

                {/* Items in Current Bill */}
                <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-black text-slate-900">বিল আইটেম বিবরণ ({billItems.length})</h3>
                    <span className="text-xs text-slate-500">পরিমাণ ও একক মূল্য</span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {billItems.map(item => (
                      <div key={item.id} className="py-2.5 flex justify-between items-center text-xs">
                        <div>
                          <div className="font-bold text-slate-900">{item.name}</div>
                          <span className="text-[10px] text-teal-700 font-semibold">{item.type} • {item.qty} টি @ ৳{item.rate}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-slate-900">৳{item.total}</span>
                          <button onClick={() => handleRemoveItem(item.id)} className="text-rose-500 hover:text-rose-700 p-1">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Checkout, 8 Payment Modes, 15 Billing Fields (5 Cols) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-base font-black text-slate-900">পেমেন্ট গ্রহণ ও রসিদ তৈরি</h3>
                  
                  <div className="space-y-2 text-xs border-b border-slate-100 pb-3">
                    <div className="flex justify-between text-slate-600">
                      <span>সাবটোটাল (একক মূল্য x পরিমাণ):</span>
                      <strong className="text-slate-900">৳{subtotal}</strong>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>ডিসকাউন্ট (৳):</span>
                      <input type="number" value={discountAmount} onChange={e => setDiscountAmount(e.target.value)} className="w-24 px-2 py-1 border rounded text-right font-bold text-xs" />
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>কর / VAT (%):</span>
                      <input type="number" value={vatPercent} onChange={e => setVatPercent(e.target.value)} className="w-24 px-2 py-1 border rounded text-right font-bold text-xs" />
                    </div>
                    <div className="flex justify-between text-base font-black text-slate-900 pt-1">
                      <span>মোট বিল (Total Bill):</span>
                      <span className="text-emerald-700 font-black">৳{totalBill}</span>
                    </div>
                  </div>

                  {/* 8 Payment Modes Selector */}
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="font-bold block mb-1">পেমেন্টের ধরন (৮টি অনুমোদিত পদ্ধতি)</label>
                      <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)} className="w-full px-3 py-2 border rounded-xl font-bold">
                        <option value="নগদ">১. নগদ (Cash)</option>
                        <option value="কার্ড">২. কার্ড (Card / POS)</option>
                        <option value="ব্যাংক">৩. ব্যাংক (Bank Transfer / Cheque)</option>
                        <option value="bKash">৪. bKash</option>
                        <option value="Nagad">৫. Nagad</option>
                        <option value="অন্যান্য অনুমোদিত পদ্ধতি">৬. অন্যান্য অনুমোদিত পদ্ধতি (Rocket / Upay)</option>
                        <option value="আংশিক পেমেন্ট">৭. আংশিক পেমেন্ট (Partial Payment)</option>
                        <option value="বকেয়া">৮. বকেয়া (Full Due / Credit)</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold block mb-1">জমা টাকা (Paid Amount)</label>
                      <input
                        type="number"
                        placeholder={`৳${totalBill}`}
                        value={paidAmount}
                        onChange={e => setPaidAmount(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl font-black text-emerald-700 text-sm"
                      />
                    </div>

                    {dueAmount > 0 && (
                      <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 flex justify-between items-center text-xs text-rose-800 font-bold">
                        <span>অবশিষ্ট বকেয়া (Due):</span>
                        <span>৳{dueAmount}</span>
                      </div>
                    )}

                    <div>
                      <label className="font-bold block mb-1">ক্যাশিয়ার</label>
                      <input type="text" value={cashierName} onChange={e => setCashierName(e.target.value)} className="w-full px-3 py-1.5 border rounded-xl text-xs font-semibold" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      onClick={() => handleCreateInvoice(false)}
                      className="py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center gap-1.5"
                    >
                      <Printer size={15} />
                      <span>[পেমেন্ট ও রসিদ]</span>
                    </button>
                    <button
                      onClick={() => handleCreateInvoice(true)}
                      className="py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center gap-1.5"
                    >
                      <Percent size={15} />
                      <span>[আংশিক পেমেন্ট]</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recent Invoices Table */}
          {billSubTab === 'recent_invoices' && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-black text-slate-900">সর্বশেষ ইনভয়েস ও রসিদ তালিকা (১৫টি ফিল্ড)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[11px]">
                    <tr>
                      <th className="p-3">বিল নম্বর</th>
                      <th className="p-3">তারিখ ও সময়</th>
                      <th className="p-3">শাখা</th>
                      <th className="p-3">রোগী ও বিবরণ</th>
                      <th className="p-3">মোট বিল</th>
                      <th className="p-3">জমা</th>
                      <th className="p-3">বকেয়া</th>
                      <th className="p-3">পদ্ধতি</th>
                      <th className="p-3">ক্যাশিয়ার</th>
                      <th className="p-3">অবস্থা</th>
                      <th className="p-3">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoices.map(inv => (
                      <tr key={inv.bill_no}>
                        <td className="p-3 font-mono font-bold text-teal-700">{inv.bill_no}</td>
                        <td className="p-3 text-slate-500">{inv.date_time}</td>
                        <td className="p-3 font-semibold">{inv.branch}</td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{inv.patient}</div>
                          <div className="text-[10px] text-slate-500">{inv.description}</div>
                        </td>
                        <td className="p-3 font-black text-slate-900">৳{inv.total_bill}</td>
                        <td className="p-3 font-bold text-emerald-700">৳{inv.paid_amount}</td>
                        <td className="p-3 font-bold text-rose-600">৳{inv.due_amount}</td>
                        <td className="p-3 font-semibold">{inv.payment_mode}</td>
                        <td className="p-3 text-slate-600">{inv.cashier}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.status.includes('পরিশোধিত') ? 'bg-emerald-100 text-emerald-800' :
                            inv.status.includes('বকেয়া') ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="p-3">
                          <button onClick={() => setViewingReceipt(inv)} className="p-1.5 text-teal-700 hover:bg-teal-50 rounded-lg">
                            <Printer size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION 2: DUE LIST (বকেয়া তালিকা) */}
      {/* ============================================================== */}
      {masterTab === 'due_list' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2 border-b">
            <div>
              <h2 className="text-base font-black text-slate-900">[বকেয়া তালিকা] (Outstanding Patient Due Ledger)</h2>
              <p className="text-xs text-slate-500">বকেয়া বিলের কিস্তি আদায় ও লেনদেন খতিয়ান</p>
            </div>
            <span className="px-3 py-1 bg-rose-100 text-rose-800 font-black rounded-xl text-xs">
              মোট বকেয়া বিল: {invoices.filter(i => i.due_amount > 0).length}টি
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[11px]">
                <tr>
                  <th className="p-3">বিল নম্বর</th>
                  <th className="p-3">শাখা</th>
                  <th className="p-3">রোগীর নাম</th>
                  <th className="p-3">মোট বিল</th>
                  <th className="p-3">জমা</th>
                  <th className="p-3">বকেয়া পরিমাণ</th>
                  <th className="p-3">কিস্তি লেনদেন</th>
                  <th className="p-3">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.filter(i => i.due_amount > 0).map(inv => (
                  <tr key={inv.bill_no}>
                    <td className="p-3 font-mono font-bold text-teal-700">{inv.bill_no}</td>
                    <td className="p-3">{inv.branch}</td>
                    <td className="p-3 font-bold text-slate-900">{inv.patient}</td>
                    <td className="p-3 font-bold">৳{inv.total_bill}</td>
                    <td className="p-3 text-emerald-700 font-bold">৳{inv.paid_amount}</td>
                    <td className="p-3 font-black text-rose-600">৳{inv.due_amount}</td>
                    <td className="p-3 text-slate-500">{inv.installments.length}টি কিস্তি</td>
                    <td className="p-3">
                      <button
                        onClick={() => {
                          setSelectedInvoiceForPayment(inv);
                          setShowPartialPayModal(true);
                        }}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs"
                      >
                        কিস্তি আদায় করুন
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION 3: REFUNDS & CANCELLATIONS (CONTRA ENTRIES) */}
      {/* ============================================================== */}
      {masterTab === 'refunds_cancel' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2 border-b">
            <div>
              <h2 className="text-base font-black text-slate-900">রিফান্ড ও বিল বাতিল (Contra Entries Audit Ledger)</h2>
              <p className="text-xs text-slate-500">মূল লেনদেন মুছে না ফেলে বিপরীত/সমন্বয় লেনদেনের স্বচ্ছ খতিয়ান</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowRefundModal(true)} className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold">
                + নতুন রিফান্ড
              </button>
              <button onClick={() => setShowCancelModal(true)} className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold">
                + বিল বাতিল করুন
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[11px]">
                <tr>
                  <th className="p-3">সমন্বয় আইডি</th>
                  <th className="p-3">মূল বিল নং</th>
                  <th className="p-3">সমন্বয়ের ধরন</th>
                  <th className="p-3">বিপরীত সমন্বয় টাকা</th>
                  <th className="p-3">রোগী</th>
                  <th className="p-3">অনুমোদনের কারণ</th>
                  <th className="p-3">অনুমোদনকারী সুপারভাইজার</th>
                  <th className="p-3">তারিখ ও সময়</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contraEntries.map(c => (
                  <tr key={c.contra_id}>
                    <td className="p-3 font-mono font-bold text-rose-700">{c.contra_id}</td>
                    <td className="p-3 font-mono font-bold text-slate-700">{c.original_bill_no}</td>
                    <td className="p-3 font-semibold">{c.type}</td>
                    <td className="p-3 font-black text-rose-600">৳{c.amount}</td>
                    <td className="p-3 font-bold">{c.patient}</td>
                    <td className="p-3 text-slate-600">{c.reason}</td>
                    <td className="p-3 text-emerald-800 font-semibold">{c.supervisor}</td>
                    <td className="p-3 text-slate-500">{c.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION 4: 14 COMPREHENSIVE REPORTS WITH 9 COMMON FILTERS */}
      {/* ============================================================== */}
      {masterTab === 'reports' && (
        <div className="space-y-6">
          {/* 9 COMMON FILTERS BAR */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Filter size={16} className="text-teal-600" />
                <span>রিপোর্ট সাধারণ ফিল্টার (৯টি ফিল্টার মানদণ্ড)</span>
              </h3>
              <button
                onClick={() => setReportFilters({
                  date_from: '2026-10-01',
                  date_to: '2026-10-10',
                  branch: 'সব শাখা',
                  doctor: 'সব ডাক্তার',
                  department: 'সব বিভাগ',
                  service_type: 'সব সেবা',
                  payment_status: 'সব স্ট্যাটাস',
                  report_status: 'সব রিপোর্ট',
                  staff: 'সব কর্মী'
                })}
                className="text-xs text-teal-700 hover:underline font-bold"
              >
                রিসেট ফিল্টার
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
              {/* Filter 1: Date From */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">১. তারিখ থেকে</label>
                <input
                  type="date"
                  value={reportFilters.date_from}
                  onChange={e => setReportFilters({ ...reportFilters, date_from: e.target.value })}
                  className="w-full px-2.5 py-1.5 border rounded-xl font-medium"
                />
              </div>

              {/* Filter 2: Date To */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">২. তারিখ পর্যন্ত</label>
                <input
                  type="date"
                  value={reportFilters.date_to}
                  onChange={e => setReportFilters({ ...reportFilters, date_to: e.target.value })}
                  className="w-full px-2.5 py-1.5 border rounded-xl font-medium"
                />
              </div>

              {/* Filter 3: Branch */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">৩. শাখা ফিল্টার</label>
                <select
                  value={reportFilters.branch}
                  onChange={e => setReportFilters({ ...reportFilters, branch: e.target.value })}
                  className="w-full px-2.5 py-1.5 border rounded-xl font-medium"
                >
                  <option value="সব শাখা">সব শাখা</option>
                  {branches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                </select>
              </div>

              {/* Filter 4: Doctor */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">৪. ডাক্তার</label>
                <select
                  value={reportFilters.doctor}
                  onChange={e => setReportFilters({ ...reportFilters, doctor: e.target.value })}
                  className="w-full px-2.5 py-1.5 border rounded-xl font-medium"
                >
                  <option value="সব ডাক্তার">সব ডাক্তার</option>
                  {doctors.map(d => <option key={d.doctor_id} value={d.full_name}>{d.full_name}</option>)}
                </select>
              </div>

              {/* Filter 5: Department */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">৫. বিভাগ</label>
                <select
                  value={reportFilters.department}
                  onChange={e => setReportFilters({ ...reportFilters, department: e.target.value })}
                  className="w-full px-2.5 py-1.5 border rounded-xl font-medium"
                >
                  <option value="সব বিভাগ">সব বিভাগ</option>
                  <option value="মেডিসিন">মেডিসিন</option>
                  <option value="কার্ডিওলজি">কার্ডিওলজি</option>
                  <option value="বায়োকেমিস্ট্রি">বায়োকেমিস্ট্রি</option>
                  <option value="হেমাটোলজি">হেমাটোলজি</option>
                  <option value="রেডিওলজি">রেডিওলজি</option>
                </select>
              </div>

              {/* Filter 6: Service Type */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">৬. সেবার ধরন</label>
                <select
                  value={reportFilters.service_type}
                  onChange={e => setReportFilters({ ...reportFilters, service_type: e.target.value })}
                  className="w-full px-2.5 py-1.5 border rounded-xl font-medium"
                >
                  <option value="সব সেবা">সব সেবা</option>
                  <option value="ডাক্তার ভিজিট">ডাক্তার ভিজিট</option>
                  <option value="ডায়াগনস্টিক টেস্ট">ডায়াগনস্টিক টেস্ট</option>
                  <option value="ফার্মেসি ঔষধ">ফার্মেসি ঔষধ</option>
                  <option value="আইপিডি বেড চার্জ">আইপিডি বেড চার্জ</option>
                </select>
              </div>

              {/* Filter 7: Payment Status */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">৭. পেমেন্টের অবস্থা</label>
                <select
                  value={reportFilters.payment_status}
                  onChange={e => setReportFilters({ ...reportFilters, payment_status: e.target.value })}
                  className="w-full px-2.5 py-1.5 border rounded-xl font-medium"
                >
                  <option value="সব স্ট্যাটাস">সব স্ট্যাটাস</option>
                  <option value="পরিশোধিত">পরিশোধিত</option>
                  <option value="আংশিক বকেয়া">আংশিক বকেয়া</option>
                  <option value="সম্পূর্ণ বকেয়া">সম্পূর্ণ বকেয়া</option>
                  <option value="রিফান্ডেড">রিফান্ডেড</option>
                </select>
              </div>

              {/* Filter 8: Report Status */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">৮. রিপোর্টের অবস্থা</label>
                <select
                  value={reportFilters.report_status}
                  onChange={e => setReportFilters({ ...reportFilters, report_status: e.target.value })}
                  className="w-full px-2.5 py-1.5 border rounded-xl font-medium"
                >
                  <option value="সব রিপোর্ট">সব রিপোর্ট</option>
                  <option value="যাচাইকৃত">যাচাইকৃত (Approved)</option>
                  <option value="অপেক্ষমাণ">অপেক্ষমাণ (Pending)</option>
                  <option value="ডেলিভার্ড">ডেলিভার্ড (Delivered)</option>
                </select>
              </div>

              {/* Filter 9: Staff */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">৯. কর্মী / ক্যাশিয়ার</label>
                <select
                  value={reportFilters.staff}
                  onChange={e => setReportFilters({ ...reportFilters, staff: e.target.value })}
                  className="w-full px-2.5 py-1.5 border rounded-xl font-medium"
                >
                  <option value="সব কর্মী">সব কর্মী</option>
                  <option value="প্রধান ক্যাশিয়ার">প্রধান ক্যাশিয়ার</option>
                  <option value="শিফট-২ ক্যাশিয়ার">শিফট-২ ক্যাশিয়ার</option>
                  <option value="ফার্মাসিস্ট কামরুল">ফার্মাসিস্ট কামরুল</option>
                </select>
              </div>
            </div>
          </div>

          {/* 14 REPORTS NAVIGATION TABS */}
          <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm">
            <h3 className="text-xs font-black text-slate-600 uppercase mb-3">১৪টি সুনির্দিষ্ট রিপোর্ট সিলেক্টর</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {reportsNavList.map(r => {
                const IconComponent = r.icon;
                const isActive = reportSubTab === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => setReportSubTab(r.id)}
                    className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                      isActive
                        ? 'bg-teal-800 text-white border-teal-800 shadow-md font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <IconComponent size={16} />
                    <span className="text-[11px] leading-tight font-bold">{r.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ============================================================== */}
          {/* REPORT 1: DAILY PATIENTS & APPOINTMENTS */}
          {/* ============================================================== */}
          {reportSubTab === 'rep_1_daily_patients' && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <div>
                  <h3 className="text-base font-black text-slate-900">১. দৈনিক রোগী ও অ্যাপয়েন্টমেন্ট রিপোর্ট</h3>
                  <p className="text-xs text-slate-500">মোট রোগী: {patients.length} জন • বুকিং: {appointments.length} টি</p>
                </div>
                <button onClick={() => window.print()} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1">
                  <Printer size={13} /> প্রিন্ট
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100"><div className="text-xs text-indigo-700 font-bold">মোট নিবন্ধিত রোগী</div><div className="text-2xl font-black text-indigo-950 mt-1">{patients.length} জন</div></div>
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100"><div className="text-xs text-emerald-700 font-bold">আজকের নতুন রোগী</div><div className="text-2xl font-black text-emerald-950 mt-1">১৮ জন</div></div>
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100"><div className="text-xs text-blue-700 font-bold">আজকের অ্যাপয়েন্টমেন্ট</div><div className="text-2xl font-black text-blue-950 mt-1">{appointments.length} টি</div></div>
                <div className="p-4 rounded-2xl bg-teal-50 border border-teal-100"><div className="text-xs text-teal-700 font-bold">সেবা সম্পন্ন</div><div className="text-2xl font-black text-teal-950 mt-1">{appointments.filter(a => a.appointment_status === 'Completed').length} টি</div></div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* REPORT 2: DOCTOR-WISE VISITS & FEES */}
          {/* ============================================================== */}
          {reportSubTab === 'rep_2_doctor_fees' && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <div>
                  <h3 className="text-base font-black text-slate-900">২. ডাক্তারভিত্তিক ভিজিট ও ফি রিপোর্ট</h3>
                  <p className="text-xs text-slate-500">ডাক্তার তালিকা, পরামর্শ ফি এবং সংগৃহীত ফি বিশ্লেষণ</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[11px]">
                    <tr><th className="p-3">ডাক্তারের নাম</th><th className="p-3">বিশেষত্ব</th><th className="p-3">মোট রোগী</th><th className="p-3">ভিজিট ফি</th><th className="p-3">মোট সংগৃহীত ফি</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {doctors.map(doc => (
                      <tr key={doc.doctor_id}>
                        <td className="p-3 font-bold text-slate-900">{doc.full_name}</td>
                        <td className="p-3">{doc.specialty}</td>
                        <td className="p-3 font-bold">২৮ জন</td>
                        <td className="p-3 font-mono">৳{doc.consultation_fee}</td>
                        <td className="p-3 font-black text-emerald-700 font-mono">৳{(doc.consultation_fee * 28).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* REPORT 3: BRANCH-WISE TEST ORDERS */}
          {/* ============================================================== */}
          {reportSubTab === 'rep_3_branch_tests' && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <div>
                  <h3 className="text-base font-black text-slate-900">৩. শাখাভিত্তিক টেস্ট অর্ডার রিপোর্ট</h3>
                  <p className="text-xs text-slate-500">বিভিন্ন শাখায় টেস্টের সংখ্যা ও আর্থিক পরিমাণ</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[11px]">
                    <tr><th className="p-3">শাখার নাম</th><th className="p-3">টেস্ট কোড</th><th className="p-3">অর্ডার সংখ্যা</th><th className="p-3">মোট টেস্ট মূল্য</th><th className="p-3">স্ট্যাটাস</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr><td className="p-3 font-bold">ধানমন্ডি মেইন ব্রাঞ্চ</td><td className="p-3 font-mono">CBC, FBS, LIPID</td><td className="p-3 font-bold">১১৪ টি</td><td className="p-3 font-black text-teal-800">৳৫৮,৫০০</td><td><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">সক্রিয়</span></td></tr>
                    <tr><td className="p-3 font-bold">মিরপুর শাখা</td><td className="p-3 font-mono">CBC, CREAT, USG</td><td className="p-3 font-bold">৭২ টি</td><td className="p-3 font-black text-teal-800">৳৩৬,২০০</td><td><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">সক্রিয়</span></td></tr>
                    <tr><td className="p-3 font-bold">উত্তরা শাখা</td><td className="p-3 font-mono">FBS, HbA1c, X-RAY</td><td className="p-3 font-bold">৫৮ টি</td><td className="p-3 font-black text-teal-800">৳২৮,৯০০</td><td><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">সক্রিয়</span></td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* REPORT 4: TAT (REPORT DELIVERY TIME) */}
          {/* ============================================================== */}
          {reportSubTab === 'rep_4_tat_delivery' && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <div>
                  <h3 className="text-base font-black text-slate-900">৪. রিপোর্ট তৈরি ও ডেলিভারির সময় (TAT Delivery Report)</h3>
                  <p className="text-xs text-slate-500">টার্ন-অ্যারাউন্ড টাইম (TAT) ও সময়মত ডেলিভারি পারফরম্যান্স</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-teal-50 border border-teal-100"><div className="text-xs text-teal-800 font-bold">গড় নমুনা-থেকে-যাচাই সময়</div><div className="text-2xl font-black text-teal-950 mt-1">১.৮ ঘণ্টা</div></div>
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100"><div className="text-xs text-emerald-800 font-bold">সময়মত ডেলিভারি হার</div><div className="text-2xl font-black text-emerald-950 mt-1">৯৬.৪%</div></div>
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100"><div className="text-xs text-amber-800 font-bold">পেন্ডিং যাচাই বাকি</div><div className="text-2xl font-black text-amber-950 mt-1">৪ টি</div></div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* REPORT 5: PHARMACY SALES */}
          {/* ============================================================== */}
          {reportSubTab === 'rep_5_pharmacy_sales' && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <div>
                  <h3 className="text-base font-black text-slate-900">৫. ফার্মেসি বিক্রি রিপোর্ট</h3>
                  <p className="text-xs text-slate-500">প্রেসক্রিপশন বিক্রি বনাম কাউন্টার ওভার-দ্য-কাউন্টার বিক্রি</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100"><div className="text-xs text-emerald-800 font-bold">মোট ওষুধ বিক্রি</div><div className="text-2xl font-black text-emerald-950 mt-1">৳১,২৬,৫০০</div></div>
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100"><div className="text-xs text-blue-800 font-bold">প্রেসক্রিপশন বিক্রি</div><div className="text-2xl font-black text-blue-950 mt-1">৳৮৮,০০০ (৭০%)</div></div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100"><div className="text-xs text-slate-800 font-bold">ওটিসি কাউন্টার বিক্রি</div><div className="text-2xl font-black text-slate-950 mt-1">৳৩৮,৫০০ (৩০%)</div></div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* REPORT 6: BATCH-WISE STOCK */}
          {/* ============================================================== */}
          {reportSubTab === 'rep_6_batch_stock' && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <div>
                  <h3 className="text-base font-black text-slate-900">৬. ব্যাচভিত্তিক স্টক লেজার রিপোর্ট</h3>
                  <p className="text-xs text-slate-500">প্রতিটি ব্যাচের অবশিষ্ট পরিমাণ ও শাখাভিত্তিক অবস্থান</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[11px]">
                    <tr><th className="p-3">ওষুধের নাম</th><th className="p-3">ব্যাচ নং</th><th className="p-3">শাখা</th><th className="p-3">অবশিষ্ট স্টক</th><th className="p-3">মেয়াদ শেষের তারিখ</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr><td className="p-3 font-bold">Napa Extra 500mg</td><td className="p-3 font-mono">BAT-2026-01</td><td className="p-3">ধানমন্ডি মেইন</td><td className="p-3 font-black text-emerald-700">৪৮০ টি</td><td className="p-3 font-mono">2027-11-30</td></tr>
                    <tr><td className="p-3 font-bold">Seclo 20mg Capsule</td><td className="p-3 font-mono">BAT-2026-02</td><td className="p-3">ধানমন্ডি মেইন</td><td className="p-3 font-black text-emerald-700">৩২০ টি</td><td className="p-3 font-mono">2027-08-31</td></tr>
                    <tr><td className="p-3 font-bold">Cef-3 200mg</td><td className="p-3 font-mono">CF-8891</td><td className="p-3">মিরপুর শাখা</td><td className="p-3 font-black text-amber-700">৮৪ টি</td><td className="p-3 font-mono">2027-04-30</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* REPORT 7: EXPIRED & NEAR-EXPIRY ALERTS */}
          {/* ============================================================== */}
          {reportSubTab === 'rep_7_expiry_alerts' && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <div>
                  <h3 className="text-base font-black text-slate-900">৭. মেয়াদোত্তীর্ণ ও মেয়াদ-সতর্কতা রিপোর্ট</h3>
                  <p className="text-xs text-slate-500">DGDA নিয়ন্ত্রিত মেয়াদ উত্তীর্ণ ওষুধের তালিকা</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200"><div className="text-xs text-rose-800 font-bold">মেয়াদোত্তীর্ণ (বিক্রয় ব্লকড)</div><div className="text-2xl font-black text-rose-900 mt-1">১টি ব্যাচ (৪৫টি ট্যাবলেট)</div></div>
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200"><div className="text-xs text-amber-800 font-bold">আসন্ন মেয়াদ (&lt; ৯০ দিন)</div><div className="text-2xl font-black text-amber-900 mt-1">২টি ব্যাচ (১৪০টি ট্যাবলেট)</div></div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* REPORT 8: BRANCH TO BRANCH STOCK TRANSFERS */}
          {/* ============================================================== */}
          {reportSubTab === 'rep_8_stock_transfer' && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <div>
                  <h3 className="text-base font-black text-slate-900">৮. শাখা থেকে শাখায় স্টক ট্রান্সফার রিপোর্ট</h3>
                  <p className="text-xs text-slate-500">আন্তঃশাখা চালান ও রিসিভিং রিপোর্ট (অ-বাণিজ্যিক)</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100"><div className="text-xs text-blue-800 font-bold">মোট ট্রান্সফার চালান</div><div className="text-2xl font-black text-blue-950 mt-1">৪ টি</div></div>
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100"><div className="text-xs text-emerald-800 font-bold">সম্পূর্ণ গৃহীত</div><div className="text-2xl font-black text-emerald-950 mt-1">২ টি</div></div>
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100"><div className="text-xs text-amber-800 font-bold">পথে আছে ও আংশিক</div><div className="text-2xl font-black text-amber-950 mt-1">২ টি</div></div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* REPORT 9: TOTAL REVENUE & PAYMENT METHODS SPLIT */}
          {/* ============================================================== */}
          {reportSubTab === 'rep_9_revenue_methods' && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <div>
                  <h3 className="text-base font-black text-slate-900">৯. মোট আয় ও পেমেন্ট পদ্ধতি রিপোর্ট</h3>
                  <p className="text-xs text-slate-500">নগদ, কার্ড, bKash, Nagad ও ব্যাংক আয়ের বিভাজন</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100"><div className="text-xs text-emerald-800 font-bold">নগদ (Cash)</div><div className="text-xl font-black text-emerald-950 mt-1">৳১,৪২,০০০</div></div>
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100"><div className="text-xs text-blue-800 font-bold">কার্ড (POS Card)</div><div className="text-xl font-black text-blue-950 mt-1">৳৮২,৫০০</div></div>
                <div className="p-4 rounded-2xl bg-pink-50 border border-pink-100"><div className="text-xs text-pink-800 font-bold">bKash / Nagad</div><div className="text-xl font-black text-pink-950 mt-1">৳৬৪,৩০০</div></div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100"><div className="text-xs text-slate-800 font-bold">ব্যাংক ও অন্যান্য</div><div className="text-xl font-black text-slate-950 mt-1">৳৫২,৭০০</div></div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* REPORT 10: OUTSTANDING PATIENT DUES */}
          {/* ============================================================== */}
          {reportSubTab === 'rep_10_due_patients' && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <div>
                  <h3 className="text-base font-black text-slate-900">১০. বকেয়া রোগী খতিয়ান (Patient Due Ledger)</h3>
                  <p className="text-xs text-slate-500">রোগীভিত্তিক বকেয়া টাকার হিসাব</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200"><div className="text-xs text-rose-800 font-bold">মোট বকেয়া পাওনা (রোগী)</div><div className="text-2xl font-black text-rose-900 mt-1">৳১,৩০০</div></div>
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200"><div className="text-xs text-amber-800 font-bold">বকেয়া রোগীর সংখ্যা</div><div className="text-2xl font-black text-amber-900 mt-1">১ জন (মোসা: সুমি আক্তার)</div></div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* REPORT 11: SUPPLIER PAYABLES */}
          {/* ============================================================== */}
          {reportSubTab === 'rep_11_supplier_payables' && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <div>
                  <h3 className="text-base font-black text-slate-900">১১. সরবরাহকারী পাওনা রিপোর্ট (Supplier Payables)</h3>
                  <p className="text-xs text-slate-500">ঔষধ প্রস্তুতকারক ও ল্যাব রিএজেন্ট কোম্পানির দেনা</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[11px]">
                    <tr><th className="p-3">সরবরাহকারী</th><th className="p-3">যোগাযোগ</th><th className="p-3">মোট ক্রয়</th><th className="p-3">পরিশোধ</th><th className="p-3">পাওনা দেনা</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr><td className="p-3 font-bold">Square Pharmaceuticals Ltd.</td><td className="p-3">০১৭১১-২২৩৩৪৪</td><td className="p-3 font-mono">৳১,২৫,০০০</td><td className="p-3 font-mono">৳৮০,০০০</td><td className="p-3 font-bold text-rose-600 font-mono">৳৪৫,০০০</td></tr>
                    <tr><td className="p-3 font-bold">Beximco Pharma Ltd.</td><td className="p-3">০১৭২২-৩৩৪৪৫৫</td><td className="p-3 font-mono">৳৯৮,০০০</td><td className="p-3 font-mono">৳৬৬,০০০</td><td className="p-3 font-bold text-rose-600 font-mono">৳৩২,০০০</td></tr>
                    <tr><td className="p-3 font-bold">Popular Diagnostic Reagents</td><td className="p-3">০১৭৩৩-৪৪৫৫৬৬</td><td className="p-3 font-mono">৳৪৫,০০০</td><td className="p-3 font-mono">৳২৬,৫০০</td><td className="p-3 font-bold text-rose-600 font-mono">৳১৮,৫০০</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* REPORT 12: REFUNDS & CANCELLATIONS (CONTRA ENTRIES) */}
          {/* ============================================================== */}
          {reportSubTab === 'rep_12_refund_cancelled' && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <div>
                  <h3 className="text-base font-black text-slate-900">১২. রিফান্ড ও বাতিল রিপোর্ট (Contra Entries)</h3>
                  <p className="text-xs text-slate-500">বিপরীত সমন্বয় লেনদেন ও কারণের নিরীক্ষা</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200"><div className="text-xs text-rose-800 font-bold">মোট রিফান্ড ও সমন্বয়</div><div className="text-2xl font-black text-rose-900 mt-1">৳২,২৫০</div></div>
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200"><div className="text-xs text-amber-800 font-bold">বাতিলকৃত বিলের সংখ্যা</div><div className="text-2xl font-black text-amber-900 mt-1">২ টি</div></div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* REPORT 13: DAILY CASH CLOSING */}
          {/* ============================================================== */}
          {reportSubTab === 'rep_13_daily_cash_closing' && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <div>
                  <h3 className="text-base font-black text-slate-900">১৩. দৈনিক ক্যাশ ক্লোজিং রিপোর্ট (Daily Cash Closing)</h3>
                  <p className="text-xs text-slate-500">দিনের শেষে ক্যাশিয়ার ও পেমেন্ট পদ্ধতিভিত্তিক হিসাব মেলানো</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-teal-50 border border-teal-100"><div className="text-xs text-teal-800 font-bold">আজকের ক্যাশ ড্রয়ার ব্যালেন্স</div><div className="text-2xl font-black text-teal-950 mt-1">৳১,০৯,২০০</div></div>
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100"><div className="text-xs text-emerald-800 font-bold">ডিজিটাল পেমেন্ট (কার্ড/বিকাশ)</div><div className="text-2xl font-black text-emerald-950 mt-1">৳১,৪৭,০০০</div></div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100"><div className="text-xs text-slate-800 font-bold">ক্যাশিয়ার ক্লোজিং স্ট্যাটাস</div><div className="text-2xl font-black text-emerald-600 mt-1">✓ মিলেছে (Matched)</div></div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* REPORT 14: MULTI-BRANCH COMPARISON */}
          {/* ============================================================== */}
          {reportSubTab === 'rep_14_branch_comparison' && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <div>
                  <h3 className="text-base font-black text-slate-900">১৪. শাখাভিত্তিক তুলনা রিপোর্ট (Branch Comparison Analytics)</h3>
                  <p className="text-xs text-slate-500">শাখাভিত্তিক মোট রাজস্ব, রোগী সংখ্যা ও গড় বিল</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[11px]">
                    <tr><th className="p-3">শাখার নাম</th><th className="p-3">রোগী সংখ্যা</th><th className="p-3">ল্যাব টেস্ট</th><th className="p-3">ফার্মেসি বিক্রি</th><th className="p-3">মোট রাজস্ব</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr><td className="p-3 font-bold">ধানমন্ডি মেইন ব্রাঞ্চ</td><td className="p-3 font-bold">১৪২ জন</td><td className="p-3 font-mono">৳৫৮,৫০০</td><td className="p-3 font-mono">৳৭৪,২০০</td><td className="p-3 font-black text-emerald-700 font-mono">৳১,৯২,৭০০</td></tr>
                    <tr><td className="p-3 font-bold">মিরপুর শাখা</td><td className="p-3 font-bold">৮৮ জন</td><td className="p-3 font-mono">৳৩৬,২০০</td><td className="p-3 font-mono">৳৩২,০০০</td><td className="p-3 font-black text-emerald-700 font-mono">৳১,০৮,২০০</td></tr>
                    <tr><td className="p-3 font-bold">উত্তরা শাখা</td><td className="p-3 font-bold">৬৫ জন</td><td className="p-3 font-mono">৳২৮,৯০০</td><td className="p-3 font-mono">৳২০,৩০০</td><td className="p-3 font-black text-emerald-700 font-mono">৳৭৬,২০০</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: RECEIPT VIEW & PRINT */}
      {/* ============================================================== */}
      {viewingReceipt && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content glass-card" style={{ maxWidth: '440px', width: '95%', padding: '1.5rem', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Printer size={18} color="#059669" />
                <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>মানি রসিদ (Money Receipt)</strong>
              </div>
              <button onClick={() => setViewingReceipt(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
            </div>

            <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', fontSize: '0.78rem' }}>
              <div style={{ textAlign: 'center', borderBottom: '1px dashed var(--border-color)', paddingBottom: '8px', marginBottom: '8px' }}>
                <strong style={{ fontSize: '0.95rem', display: 'block' }}>HisabKitab 360° Healthcare</strong>
                <span style={{ color: 'var(--text-muted)' }}>{viewingReceipt.branch}</span>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>বিল নম্বর: {viewingReceipt.bill_no}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>তারিখ ও সময়: {viewingReceipt.date_time}</div>
              </div>

              <div style={{ borderBottom: '1px dashed var(--border-color)', paddingBottom: '6px', marginBottom: '8px' }}>
                <div>রোগী: <strong>{viewingReceipt.patient}</strong></div>
                <div style={{ color: 'var(--text-muted)' }}>সেবার বিবরণ: {viewingReceipt.description}</div>
                <div style={{ color: 'var(--text-muted)' }}>ক্যাশিয়ার: {viewingReceipt.cashier}</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>মোট বিল:</span>
                  <strong>৳{viewingReceipt.total_bill}</strong>
                </div>
                {viewingReceipt.discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
                    <span>ছাড় (Discount):</span>
                    <strong>-৳{viewingReceipt.discount}</strong>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: 'bold' }}>
                  <span>পরিশোধিত টাকা:</span>
                  <strong>৳{viewingReceipt.paid_amount}</strong>
                </div>
                {viewingReceipt.due_amount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444', fontWeight: 'bold' }}>
                    <span>বকেয়া (Due):</span>
                    <strong>৳{viewingReceipt.due_amount}</strong>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.72rem', paddingTop: '4px' }}>
                  <span>পেমেন্ট পদ্ধতি: {viewingReceipt.payment_mode}</span>
                  <span>অবস্থা: {viewingReceipt.status}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
              <button
                type="button"
                onClick={() => window.print()}
                className="btn btn-primary press-scale"
                style={{ flex: 1, background: '#059669', borderColor: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Printer size={15} />
                <span>প্রিন্ট রসিদ</span>
              </button>
              <button
                type="button"
                onClick={() => setViewingReceipt(null)}
                className="btn btn-secondary press-scale"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: PARTIAL INSTALLMENT PAYMENT */}
      {/* ============================================================== */}
      {showPartialPayModal && selectedInvoiceForPayment && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content glass-card" style={{ maxWidth: '420px', width: '95%', padding: '1.5rem', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)' }}>
                [আংশিক পেমেন্ট / কিস্তি আদায়]
              </h3>
              <button onClick={() => setShowPartialPayModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
            </div>

            <form onSubmit={handleCollectInstallment} style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem' }}>
              <div>বিল নং: <strong>{selectedInvoiceForPayment.bill_no}</strong></div>
              <div>রোগী: <strong>{selectedInvoiceForPayment.patient}</strong></div>
              <div>মোট বিল: <strong>৳{selectedInvoiceForPayment.total_bill}</strong></div>
              <div style={{ color: '#ef4444' }}>বর্তমান বকেয়া: <strong>৳{selectedInvoiceForPayment.due_amount}</strong></div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '700' }}>জমা গ্রহণের পরিমাণ (৳)</label>
                <input
                  type="number"
                  required
                  max={selectedInvoiceForPayment.due_amount}
                  value={partialPayInput}
                  onChange={e => setPartialPayInput(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', padding: '6px 10px', fontSize: '0.9rem', fontWeight: 'bold', color: '#059669' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowPartialPayModal(false)} className="btn btn-secondary press-scale">বাতিল</button>
                <button type="submit" className="btn btn-primary press-scale" style={{ background: '#059669', borderColor: '#059669' }}>কিস্তি জমা নিন</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: REFUND MODAL WITH CONTRA-ENTRY */}
      {/* ============================================================== */}
      {showRefundModal && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content glass-card" style={{ maxWidth: '440px', width: '95%', padding: '1.5rem', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <RotateCcw size={17} color="#f59e0b" />
                <span>রিফান্ড অনুমোদন (Contra-Entry)</span>
              </h3>
              <button onClick={() => setShowRefundModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
            </div>

            <form onSubmit={handleProcessRefund} style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '3px', fontWeight: '700' }}>বিল / ইনভয়েস নম্বর</label>
                <input required placeholder="যেমন: BILL-2026-1001" value={refundForm.invoiceNo} onChange={e => setRefundForm({ ...refundForm, invoiceNo: e.target.value })} className="input-field" style={{ width: '100%', padding: '6px 10px' }} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '3px', fontWeight: '700' }}>রিফান্ড পরিমাণ (৳)</label>
                <input type="number" required placeholder="টাকার পরিমাণ" value={refundForm.amount} onChange={e => setRefundForm({ ...refundForm, amount: e.target.value })} className="input-field" style={{ width: '100%', padding: '6px 10px' }} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '3px', fontWeight: '700' }}>রিফান্ডের কারণ</label>
                <input required placeholder="যেমন: রোগী টেস্ট বাতিল করেছেন" value={refundForm.reason} onChange={e => setRefundForm({ ...refundForm, reason: e.target.value })} className="input-field" style={{ width: '100%', padding: '6px 10px' }} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '3px', fontWeight: '700' }}>সুপারভাইজার অনুমোদন পিন (Demo: 1234)</label>
                <input type="password" required placeholder="৪-সংখ্যার PIN" value={refundForm.supervisorPin} onChange={e => setRefundForm({ ...refundForm, supervisorPin: e.target.value })} className="input-field" style={{ width: '100%', padding: '6px 10px' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowRefundModal(false)} className="btn btn-secondary press-scale">বাতিল</button>
                <button type="submit" className="btn btn-primary press-scale" style={{ background: '#f59e0b', borderColor: '#f59e0b' }}>রিফান্ড সমন্বয় নিশ্চিত করুন</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: CANCEL BILL MODAL WITH CONTRA-ENTRY */}
      {/* ============================================================== */}
      {showCancelModal && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content glass-card" style={{ maxWidth: '440px', width: '95%', padding: '1.5rem', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Ban size={17} color="#ef4444" />
                <span>বিল বাতিল অনুমোদন (Cancellation Contra-Entry)</span>
              </h3>
              <button onClick={() => setShowCancelModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
            </div>

            <form onSubmit={handleProcessCancellation} style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '3px', fontWeight: '700' }}>বাতিলযোগ্য বিল নম্বর</label>
                <input required placeholder="যেমন: BILL-2026-1002" value={cancelForm.invoiceNo} onChange={e => setCancelForm({ ...cancelForm, invoiceNo: e.target.value })} className="input-field" style={{ width: '100%', padding: '6px 10px' }} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '3px', fontWeight: '700' }}>বাতিলের কারণ</label>
                <input required placeholder="যেমন: ভুল এন্ট্রি / ডুপ্লিকেট ইনভয়েস" value={cancelForm.reason} onChange={e => setCancelForm({ ...cancelForm, reason: e.target.value })} className="input-field" style={{ width: '100%', padding: '6px 10px' }} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '3px', fontWeight: '700' }}>সুপারভাইজার অনুমোদন পিন (Demo: 1234)</label>
                <input type="password" required placeholder="৪-সংখ্যার PIN" value={cancelForm.supervisorPin} onChange={e => setCancelForm({ ...cancelForm, supervisorPin: e.target.value })} className="input-field" style={{ width: '100%', padding: '6px 10px' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowCancelModal(false)} className="btn btn-secondary press-scale">বাতিল</button>
                <button type="submit" className="btn btn-primary press-scale" style={{ background: '#ef4444', borderColor: '#ef4444' }}>বিল বাতিল ও বিপরীত সমন্বয়</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 5: HEALTHCARE INVOICE & RECEIPT PRINT MODAL */}
      {/* ============================================================== */}
      {viewingReceipt && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content glass-card" style={{ maxWidth: '650px', width: '95%', padding: '1.5rem', borderRadius: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Receipt size={20} className="text-teal-600" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  মানি রিসিট ও বিল প্রিন্ট (#{viewingReceipt.bill_no})
                </h3>
              </div>
              <button onClick={() => setViewingReceipt(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            {/* Printable Slip */}
            <div
              id="printable-healthcare-receipt"
              style={{
                background: '#ffffff',
                color: '#0f172a',
                padding: '24px',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}
            >
              {/* Slip Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f172a', paddingBottom: '12px', marginBottom: '14px' }}>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#0f766e' }}>
                    হেলথকেয়ার 360° হাসপাতাল ও মেডিকেল সেন্টার
                  </h2>
                  <p style={{ margin: '2px 0', fontSize: '11px', color: '#64748b' }}>
                    {viewingReceipt.branch || 'ধানমন্ডি মেইন ব্রাঞ্চ'} • ফোন: ০৯৬১১-২২৩৩৪৪
                  </p>
                  <p style={{ margin: '2px 0', fontSize: '10px', color: '#94a3b8' }}>
                    DGHS Reg: 2026/HC-360 • সেন্ট্রাল বিলিং ক্যাশ রসিদ
                  </p>
                </div>

                {receiptQrUrl ? (
                  <div style={{ textAlign: 'center', background: '#ffffff', padding: '4px', border: '1.5px solid #0f172a', borderRadius: '8px' }}>
                    <img src={receiptQrUrl} alt="Verify QR" style={{ width: '76px', height: '76px', display: 'block', margin: '0 auto' }} />
                    <span style={{ fontSize: '7.5px', fontWeight: '800', color: '#059669', display: 'block', marginTop: '2px' }}>
                      ✓ আসল ভেরিফাইড QR
                    </span>
                  </div>
                ) : null}
              </div>

              {/* Patient & Bill Meta */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#f8fafc', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '14px' }}>
                <div>
                  <div><strong>বিল নম্বর:</strong> #{viewingReceipt.bill_no}</div>
                  <div><strong>তারিখ:</strong> {viewingReceipt.date_time || new Date().toLocaleString()}</div>
                  <div><strong>সেবা ধরন:</strong> {viewingReceipt.service_type}</div>
                </div>
                <div>
                  <div><strong>রোগীর নাম:</strong> {viewingReceipt.patient}</div>
                  <div><strong>ক্যাশিয়ার:</strong> {viewingReceipt.cashier}</div>
                  <div><strong>পদ্ধতি:</strong> {viewingReceipt.payment_mode}</div>
                </div>
              </div>

              {/* Items / Description */}
              <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '12px', borderBottom: '1px solid #cbd5e1', paddingBottom: '4px', color: '#475569' }}>
                  <span>সেবা / বিবরণ</span>
                  <span>পরিমাণ</span>
                  <span>মোট টাকা</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', paddingTop: '6px' }}>
                  <span>{viewingReceipt.description || viewingReceipt.service_type}</span>
                  <span>{viewingReceipt.quantity || 1}টি</span>
                  <span style={{ fontWeight: '700' }}>৳{viewingReceipt.total_bill}</span>
                </div>
              </div>

              {/* Financial Totals */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', alignItems: 'flex-end', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '200px' }}>
                  <span>মোট বিল:</span>
                  <span style={{ fontWeight: '700' }}>৳{viewingReceipt.total_bill}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '200px', color: '#059669', fontWeight: '700' }}>
                  <span>পরিশোধিত অর্থ:</span>
                  <span>৳{viewingReceipt.paid_amount}</span>
                </div>
                {viewingReceipt.due_amount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '200px', color: '#dc2626', fontWeight: '800' }}>
                    <span>অবশিষ্ট বকেয়া:</span>
                    <span>৳{viewingReceipt.due_amount}</span>
                  </div>
                )}
              </div>

              {/* Signatures */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '20px', borderTop: '1px dashed #cbd5e1', fontSize: '10px', color: '#64748b' }}>
                <div>
                  <div style={{ borderTop: '1px solid #94a3b8', width: '100px', marginBottom: '2px' }}></div>
                  <span>গ্রাহক / রোগী স্বাক্ষর</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span>🛡️ যেকোনো ক্যামেরা দিয়ে QR স্ক্যান করে বিলটি যাচাই করা যাবে।</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ borderTop: '1px solid #94a3b8', width: '100px', marginBottom: '2px', marginLeft: 'auto' }}></div>
                  <span>অনুমোদিত ক্যাশিয়ার সিল</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => setViewingReceipt(null)}
                className="btn btn-secondary press-scale"
              >
                বন্ধ করুন
              </button>
              <button
                type="button"
                onClick={() => {
                  printElement('printable-healthcare-receipt', {
                    title: `Healthcare-Receipt-${viewingReceipt.bill_no}`,
                    paperType: 'receipt'
                  });
                }}
                className="btn btn-primary press-scale"
                style={{ background: 'linear-gradient(135deg, #059669, #10b981)', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Printer size={16} />
                <span>প্রিন্ট করুন (Print Now)</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default HealthcareBillingManager;
