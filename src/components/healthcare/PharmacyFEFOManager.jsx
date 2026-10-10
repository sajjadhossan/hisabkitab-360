import React, { useState, useMemo } from 'react';
import { useHealthcare } from '../../context/HealthcareContext';
import { generateHealthcareId } from '../../services/healthcareIdService';
import {
  Pill,
  ShoppingCart,
  FileText,
  AlertTriangle,
  Boxes,
  Search,
  CheckCircle2,
  X,
  Plus,
  RotateCcw,
  Truck,
  Building,
  Layers,
  ClipboardCheck,
  ArrowRightLeft,
  DollarSign,
  Calendar,
  Filter,
  Check,
  Clock,
  Printer,
  Sparkles,
  BarChart3,
  ShieldAlert,
  ShieldCheck,
  ThermometerSnowflake,
  Ban,
  CheckCheck,
  Send,
  UserCheck,
  Award,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';

export default function PharmacyFEFOManager() {
  const {
    pharmacyMedicines = [],
    patients = [],
    prescriptions = [],
    branches = [],
    activeBranchId = 'dhanmondi',
    dispensePharmacyMedicine,
    updatePrescriptionDispensingStatus
  } = useHealthcare();

  // Active Tab:
  // 'pos' | 'prescriptions' | 'catalog' | 'inventory' | 'alerts' | 'sales_return' | 'purchases' | 'stock_count' | 'branch_transfer'
  const [activeTab, setActiveTab] = useState('pos');
  const [salesMode, setSalesMode] = useState('counter'); // 'counter' | 'prescription'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [activePrescriptionId, setActivePrescriptionId] = useState('');
  const [cart, setCart] = useState([]);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('নগদ (Cash)');
  const [sellerName, setSellerName] = useState('ফার্মাসিস্ট কামরুল হাসান (DGDA Reg: A-8421)');
  const [lastInvoice, setLastInvoice] = useState(null);
  const [viewingReceipt, setViewingReceipt] = useState(null);

  // Selected Branch for POS & Transfers
  const currentBranch = branches.find(b => b.id === activeBranchId) || { id: 'dhanmondi', name: 'ধানমন্ডি মেইন ব্রাঞ্চ', code: 'DHD-01' };
  const [selectedBranchName, setSelectedBranchName] = useState(currentBranch.name);

  // 1.8 New Medicine Modal State (14 Catalog Fields)
  const [showAddMedModal, setShowAddMedModal] = useState(false);
  const [catalogMedicines, setCatalogMedicines] = useState(pharmacyMedicines);
  const [newMedForm, setNewMedForm] = useState({
    item_code: 'MED-SKU-905',
    barcode: '8941100998811',
    brand_name: '',
    generic_name: '',
    strength: '500 mg',
    dosage_form: 'Tablet',
    manufacturer: 'Square Pharmaceuticals Ltd.',
    category: 'Antibiotic',
    base_unit: 'Pcs',
    purchase_rate: 3.5,
    selling_rate: 5.0,
    min_stock: 50,
    prescription_required: true,
    temperature_sensitive: false,
    active_status: 'Active',
    strip_size: 10,
    rack_location: 'Rack-A1',
    batch_number: 'BAT-2026-N1',
    expiry_date: '2027-12-31'
  });

  // 10 Batch Fields Extended Management State
  const [batchesList, setBatchesList] = useState([
    {
      batch_number: 'BAT-2026-01',
      branch: 'ধানমন্ডি মেইন ব্রাঞ্চ',
      supplier: 'Square Pharmaceuticals Ltd.',
      purchase_date: '2026-08-15',
      expiry_date: '2027-11-30',
      initial_quantity: 1000,
      remaining_quantity: 480,
      purchase_rate: 2.3,
      selling_rate: 3.0,
      batch_status: 'স্বাভাবিক (Active)',
      brand_name: 'Napa Extra 500mg'
    },
    {
      batch_number: 'BAT-2026-02',
      branch: 'ধানমন্ডি মেইন ব্রাঞ্চ',
      supplier: 'Beximco Pharma Ltd.',
      purchase_date: '2026-07-10',
      expiry_date: '2027-08-31',
      initial_quantity: 800,
      remaining_quantity: 320,
      purchase_rate: 5.6,
      selling_rate: 7.0,
      batch_status: 'স্বাভাবিক (Active)',
      brand_name: 'Seclo 20mg Capsule'
    },
    {
      batch_number: 'EXP-2026-99',
      branch: 'ধানমন্ডি মেইন ব্রাঞ্চ',
      supplier: 'Incepta Pharmaceuticals Ltd.',
      purchase_date: '2024-05-01',
      expiry_date: '2026-03-31',
      initial_quantity: 200,
      remaining_quantity: 45,
      purchase_rate: 12.0,
      selling_rate: 18.0,
      batch_status: 'মেয়াদোত্তীর্ণ (Expired - Blocked)',
      brand_name: 'Amoxicillin 500mg'
    },
    {
      batch_number: 'QRN-2026-05',
      branch: 'মিরপুর শাখা',
      supplier: 'Renata Limited',
      purchase_date: '2026-09-01',
      expiry_date: '2027-10-15',
      initial_quantity: 500,
      remaining_quantity: 500,
      purchase_rate: 4.2,
      selling_rate: 6.0,
      batch_status: 'কোয়ারেন্টাইন (Under Inspection)',
      brand_name: 'Maxpro 20mg'
    }
  ]);

  // 1.8 Sales Return State
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnsList, setReturnsList] = useState([
    {
      returnId: 'RET-2026-001',
      invoiceNo: 'PH-INV-9021',
      date: '2026-10-10 12:40 PM',
      patientName: 'মো: রফিকুল ইসলাম',
      medicineName: 'Napa Extra 500mg (Tablet)',
      batchNumber: 'BAT-2026-01',
      returnQty: '১ পাতা (১০টি)',
      refundAmount: 25,
      reason: 'ডাক্তার ডোজ পরিবর্তন করেছেন',
      status: 'অনুমোদিত ও রিফান্ডেড'
    },
    {
      returnId: 'RET-2026-002',
      invoiceNo: 'PH-INV-9045',
      date: '2026-10-10 03:15 PM',
      patientName: 'সালমা বেগম',
      medicineName: 'Azithromycin 500mg',
      batchNumber: 'AZI-2025-09',
      returnQty: '২টি ট্যাবলেট',
      refundAmount: 70,
      reason: 'রোগী ভুল ওষুধ ক্রয় করেছিলেন',
      status: 'অনুমোদিত ও রিফান্ডেড'
    }
  ]);
  const [newReturnForm, setNewReturnForm] = useState({
    invoiceNo: '',
    patientName: '',
    medicineName: '',
    batchNumber: '',
    returnQty: 1,
    refundAmount: '',
    reason: 'ডাক্তার প্রেসক্রিপশন পরিবর্তন করেছেন'
  });

  // 1.8 Branch Stock Transfer (12 Form Fields & 6 Statuses)
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [branchTransfersList, setBranchTransfersList] = useState([
    {
      transfer_no: 'TRF-2026-101',
      from_branch: 'ধানমন্ডি মেইন ব্রাঞ্চ',
      to_branch: 'মিরপুর শাখা',
      medicine_name: 'Seclo 20mg Capsule',
      batch_number: 'BAT-2026-02',
      quantity: 500,
      dispatch_date: '2026-10-10 11:20 AM',
      dispatched_by: 'মো: কামরুল হাসান (ফার্মাসিস্ট)',
      receive_date: '2026-10-10 01:15 PM',
      received_by: 'আরিফুল ইসলাম (মিরপুর শাখা ফার্মাসিস্ট)',
      transfer_status: 'সম্পূর্ণ গ্রহণ',
      notes: 'জরুরি গ্যাস্ট্রিক মেডিসিন স্টক পূরণ'
    },
    {
      transfer_no: 'TRF-2026-102',
      from_branch: 'ধানমন্ডি মেইন ব্রাঞ্চ',
      to_branch: 'উত্তরা শাখা',
      medicine_name: 'Cef-3 200mg Capsule',
      batch_number: 'CF-8891',
      quantity: 140,
      dispatch_date: '2026-10-10 02:45 PM',
      dispatched_by: 'মো: কামরুল হাসান (ফার্মাসিস্ট)',
      receive_date: '-',
      received_by: 'অপেক্ষমাণ',
      transfer_status: 'পাঠানো হয়েছে',
      notes: 'কুরিয়ার চালানে প্রেরিত, ট্র্যাকিং নং: DH-UT-884'
    },
    {
      transfer_no: 'TRF-2026-103',
      from_branch: 'মিরপুর শাখা',
      to_branch: 'ধানমন্ডি মেইন ব্রাঞ্চ',
      medicine_name: 'Monas 10mg Tablet',
      batch_number: 'MNS-2026-04',
      quantity: 200,
      dispatch_date: '2026-10-09 10:00 AM',
      dispatched_by: 'আরিফুল ইসলাম',
      receive_date: '2026-10-09 04:30 PM',
      received_by: 'মো: কামরুল হাসান',
      transfer_status: 'আংশিক গ্রহণ',
      notes: '১০টি পাতা ক্ষতিগ্রস্ত থাকায় ১৯০টি গ্রহণ করা হয়েছে'
    },
    {
      transfer_no: 'TRF-2026-104',
      from_branch: 'উত্তরা শাখা',
      to_branch: 'ধানমন্ডি মেইন ব্রাঞ্চ',
      medicine_name: 'Insulin Glargine 100IU',
      batch_number: 'INS-2026-C1',
      quantity: 50,
      dispatch_date: '2026-10-08 12:00 PM',
      dispatched_by: 'মাহমুদ আলম',
      receive_date: '-',
      received_by: '-',
      transfer_status: 'বাতিল',
      notes: 'কোল্ড চেইন থার্মাল বক্স অনুপলব্ধ থাকায় বাতিল করা হয়েছে'
    }
  ]);

  const [newTransferForm, setNewTransferForm] = useState({
    transfer_no: `TRF-2026-${Math.floor(100 + Math.random() * 900)}`,
    from_branch: 'ধানমন্ডি মেইন ব্রাঞ্চ',
    to_branch: 'মিরপুর শাখা',
    medicine_name: 'Napa Extra 500mg',
    batch_number: 'BAT-2026-01',
    quantity: 100,
    dispatch_date: new Date().toLocaleString('bn-BD'),
    dispatched_by: 'ফার্মাসিস্ট কামরুল হাসান',
    receive_date: '-',
    received_by: 'অপেক্ষমাণ',
    transfer_status: 'অনুমোদনের অপেক্ষায়',
    notes: 'শাখা স্টক সমন্বয়'
  });

  // Purchase Invoices & Suppliers State
  const [purchaseSubTab, setPurchaseSubTab] = useState('invoices');
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [suppliersList, setSuppliersList] = useState([
    { id: 1, name: 'Square Pharmaceuticals Ltd.', code: 'SQR-01', phone: '০১৭৭০০০০০০১', balance: 45000, creditPeriod: '৩০ দিন' },
    { id: 2, name: 'Beximco Pharma Ltd.', code: 'BXM-02', phone: '০১৭৭০০০০০০২', balance: 32000, creditPeriod: '৪৫ দিন' },
    { id: 3, name: 'Incepta Pharmaceuticals Ltd.', code: 'ICP-03', phone: '০১৭৭০০০০০০৩', balance: 18500, creditPeriod: '৩০ দিন' },
    { id: 4, name: 'Renata Limited', code: 'RNT-04', phone: '০১৭৭০০০০০০৪', balance: 0, creditPeriod: '১৫ দিন' }
  ]);
  const [purchaseInvoices, setPurchaseInvoices] = useState([
    {
      invoiceNo: 'PUR-2026-8801',
      supplierName: 'Square Pharmaceuticals Ltd.',
      challanNo: 'CH-99410',
      date: '2026-10-08',
      totalAmount: 52000,
      paidAmount: 30000,
      dueAmount: 22000,
      status: 'আংশিক পরিশোধ'
    },
    {
      invoiceNo: 'PUR-2026-8802',
      supplierName: 'Beximco Pharma Ltd.',
      challanNo: 'CH-77821',
      date: '2026-10-09',
      totalAmount: 38000,
      paidAmount: 38000,
      dueAmount: 0,
      status: 'সম্পূর্ণ পরিশোধ'
    }
  ]);
  const [newPurchaseForm, setNewPurchaseForm] = useState({
    supplierName: 'Square Pharmaceuticals Ltd.',
    challanNo: '',
    totalAmount: '',
    paidAmount: '',
    itemsSummary: ''
  });

  // Physical Stock Count / Audit
  const [stockAuditList, setStockAuditList] = useState([
    { id: 1, brand_name: 'Napa Extra 500mg', systemStock: 480, physicalStock: 480, variance: 0, status: 'মিলেছে (Matched)' },
    { id: 2, brand_name: 'Seclo 20mg Capsule', systemStock: 320, physicalStock: 316, variance: -4, status: 'ঘাটতি (-4 Discrepancy)' },
    { id: 3, brand_name: 'Cef-3 200mg', systemStock: 84, physicalStock: 84, variance: 0, status: 'মিলেছে (Matched)' },
    { id: 4, brand_name: 'Monas 10mg Tablet', systemStock: 210, physicalStock: 212, variance: +2, status: 'উদ্বৃত্ত (+2 Discrepancy)' }
  ]);

  // Alert filter state
  const [alertFilter, setAlertFilter] = useState('ALL');

  // Selected patient details for allergy check
  const selectedPatient = useMemo(() => {
    return patients.find(p => p.patient_id === selectedPatientId);
  }, [patients, selectedPatientId]);

  // Filtered medicines
  const filteredMedicines = useMemo(() => {
    return catalogMedicines.filter(med => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        (med.brand_name || '').toLowerCase().includes(q) ||
        (med.generic_name || '').toLowerCase().includes(q) ||
        (med.barcode || '').includes(searchTerm) ||
        (med.item_code || '').toLowerCase().includes(q) ||
        (med.manufacturer || med.manufacturer_name || '').toLowerCase().includes(q);
      const matchesCategory = selectedCategory === 'All' || med.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [catalogMedicines, searchTerm, selectedCategory]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(catalogMedicines.map(m => m.category).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [catalogMedicines]);

  // Get FEFO sorted batches for a medicine (First Expiry First Out)
  const getFefoBatches = (med) => {
    return [...(med.batches || [])].sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));
  };

  // Add to cart using FEFO (blocks expired batches automatically)
  const addToCart = (medicine, preferredBatchNumber = null, unitType = 'strip') => {
    // 1. DGDA Prescription-only Rule Check
    if (medicine.prescription_required && !activePrescriptionId && salesMode === 'counter') {
      const confirmRx = window.confirm(
        `⚠️ DGDA ড্রাগ পলিসি সতর্কতা (Rx Required):\n'${medicine.brand_name}' একটি প্রেসক্রিপশন-নির্ভর ওষুধ।\n\nকাউন্টার বিক্রি করতে বৈধ ডাক্তারের প্রেসক্রিপশন প্রয়োজন। আপনি কি প্রেসক্রিপশন ছাড়াই ওভার-দ্য-কাউন্টার বিক্রির অনুমোদন দিচ্ছেন?`
      );
      if (!confirmRx) {
        setActiveTab('prescriptions');
        return;
      }
    }

    // 2. Patient Drug Allergy Check
    const patientAllergy = selectedPatient?.allergy_note || selectedPatient?.allergies || '';
    if (patientAllergy) {
      const allergyLower = patientAllergy.toLowerCase();
      if (
        allergyLower.includes((medicine.generic_name || '').toLowerCase()) ||
        allergyLower.includes((medicine.brand_name || '').toLowerCase())
      ) {
        const proceed = window.confirm(
          `⚠️ ড্রাগ অ্যালার্জি সতর্কতা (ALLERGY WARNING)!\nরোগী ${selectedPatient.full_name}-এর এই ওষুধের উপাদানে অ্যালার্জি রয়েছে (${patientAllergy})। আপনি কি তবুও এটি কার্টে যুক্ত করতে চান?`
        );
        if (!proceed) return;
      }
    }

    // 3. FEFO Batches Sorting & Expiry Rule
    const fefoBatches = getFefoBatches(medicine).filter(b => (b.stock_tablets || 0) > 0);
    if (fefoBatches.length === 0) {
      alert(`⚠️ '${medicine.brand_name}' এর কোনো সক্রিয় স্টক নেই! শাখা স্টক ট্রান্সফারের অনুরোধ করুন।`);
      return;
    }

    let targetBatch = fefoBatches[0];
    if (preferredBatchNumber) {
      const found = medicine.batches.find(b => b.batch_number === preferredBatchNumber);
      if (found && found.stock_tablets > 0) targetBatch = found;
    }

    // 4. Block Expired Batch Rule
    const isExpired = new Date(targetBatch.expiry_date) < new Date();
    if (isExpired) {
      alert(`❌ ব্যাচ ${targetBatch.batch_number} এর মেয়াদ উত্তীর্ণ (Expired)! DGDA ও ফার্মেসি নিয়ম অনুযায়ী এটি বিক্রয় সম্পূর্ণ নিষিদ্ধ।`);
      return;
    }

    const multiplier = unitType === 'box'
      ? (medicine.box_pack_size || medicine.box_size || 100)
      : unitType === 'strip'
      ? (medicine.strip_pack_size || medicine.strip_size || 10)
      : 1;

    const unitPrice = unitType === 'box'
      ? (medicine.box_mrp || (medicine.MRP || 5) * multiplier)
      : unitType === 'strip'
      ? (medicine.strip_mrp || (medicine.MRP || 5) * (medicine.strip_size || 10))
      : (medicine.unit_mrp || medicine.MRP || 5);

    setCart(prev => {
      const existing = prev.find(item => item.medicine_id === medicine.medicine_id && item.batch_number === targetBatch.batch_number && item.unitType === unitType);
      if (existing) {
        return prev.map(item =>
          item === existing
            ? { ...item, qty: item.qty + 1 }
            : item
        );
      } else {
        return [
          ...prev,
          {
            medicine_id: medicine.medicine_id,
            brand_name: medicine.brand_name,
            generic_name: medicine.generic_name,
            dosage_form: medicine.dosage_form,
            batch_number: targetBatch.batch_number,
            expiry_date: targetBatch.expiry_date,
            unitType,
            multiplier,
            unitPrice,
            qty: 1,
            maxTablets: targetBatch.stock_tablets,
            prescription_required: medicine.prescription_required,
            temperature_sensitive: medicine.temperature_sensitive
          }
        ];
      }
    });
  };

  // Cart calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.unitPrice * item.qty), 0);
  }, [cart]);

  const discountVal = Number(discountAmount) || 0;
  const netPayable = Math.max(0, subtotal - discountVal);
  const dueAmount = Math.max(0, netPayable - (Number(paidAmount) || netPayable));

  // Handle Checkout (11 Fields in Sale Record)
  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('কার্ট খালি! অনুগ্রহ করে ওষুধ নির্বাচন করুন।');
      return;
    }

    // Prescription validation rule
    const hasRxMed = cart.some(item => item.prescription_required);
    if (hasRxMed && !selectedPatientId && salesMode === 'prescription') {
      alert('প্রেসক্রিপশন বিক্রয়ের জন্য রোগী নির্বাচন আবশ্যক!');
      return;
    }

    const saleId = generateHealthcareId('PHARMACY_SALE');
    const invoiceData = {
      sale_id: saleId,
      branch: selectedBranchName,
      patient: selectedPatient
        ? { id: selectedPatient.patient_id, name: selectedPatient.full_name, phone: selectedPatient.mobile_number || selectedPatient.phone || 'N/A' }
        : { name: 'সাধারণ কাউন্টার ক্রেতা (Walk-in)', phone: 'N/A' },
      prescription_ref: activePrescriptionId || (hasRxMed ? 'কাউন্টার অনুমোদিত (Rx Verified)' : 'প্রযোজ্য নয়'),
      items: [...cart],
      subtotal,
      discount: discountVal,
      netPayable,
      paidAmount: Number(paidAmount) || netPayable,
      dueAmount,
      paymentMethod,
      seller: sellerName,
      date: new Date().toLocaleString('bn-BD')
    };

    // Stock deduction
    cart.forEach(item => {
      const tabletsToDeduct = item.qty * item.multiplier;
      dispensePharmacyMedicine({
        medicineId: item.medicine_id,
        batchNumber: item.batch_number,
        quantityTablets: tabletsToDeduct
      });
    });

    if (activePrescriptionId) {
      updatePrescriptionDispensingStatus(activePrescriptionId, 'Fully Dispensed');
    }

    setLastInvoice(invoiceData);
    setViewingReceipt(invoiceData);
    setCart([]);
    setDiscountAmount(0);
    setPaidAmount('');
    setActivePrescriptionId('');
  };

  // Cancel Sale button action
  const handleCancelSale = () => {
    if (cart.length === 0) return;
    if (window.confirm('আপনি কি বর্তমান বিক্রয় কার্ট সম্পূর্ণ বাতিল ও পরিষ্কার করতে চান?')) {
      setCart([]);
      setDiscountAmount(0);
      setPaidAmount('');
      setActivePrescriptionId('');
    }
  };

  // Load items from prescription directly to cart
  const loadPrescriptionToCart = (rx) => {
    setSelectedPatientId(rx.patient_id);
    setActivePrescriptionId(rx.prescription_id);
    setSalesMode('prescription');

    (rx.medicines || []).forEach(prescribedMed => {
      const matched = catalogMedicines.find(m =>
        m.brand_name?.toLowerCase() === prescribedMed.brand_name?.toLowerCase() ||
        m.generic_name?.toLowerCase() === prescribedMed.generic_name?.toLowerCase()
      );
      if (matched) {
        addToCart(matched, null, 'strip');
      }
    });

    setActiveTab('pos');
  };

  // Near expiry / expired calculations
  const alertMedicines = useMemo(() => {
    const list = [];
    const now = new Date();
    const ninetyDays = new Date();
    ninetyDays.setDate(ninetyDays.getDate() + 90);

    catalogMedicines.forEach(med => {
      (med.batches || []).forEach(b => {
        const exp = new Date(b.expiry_date);
        if (exp < now) {
          list.push({ ...med, batch: b, alertType: 'EXPIRED' });
        } else if (exp <= ninetyDays) {
          const daysLeft = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
          list.push({ ...med, batch: b, alertType: 'NEAR_EXPIRY', daysLeft });
        }
      });
    });
    return list;
  }, [catalogMedicines]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Banner & DGDA Compliance Notification */}
      <div className="glass-card" style={{ padding: '1rem 1.25rem', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(59, 130, 246, 0.05) 100%)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}>
              <Pill size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '900', color: 'var(--text-main)' }}>
                  ফার্মেসি ও ওষুধ ক্যাটালগ (FEFO Pharmacy & Multi-Branch Inventory)
                </h1>
                <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontSize: '0.72rem', fontWeight: '800' }}>
                  DGDA Compliant
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                শাখাভিত্তিক স্টক • FEFO মেয়াদ ট্র্যাকিং • কোল্ড-চেইন সতর্কতা • প্রেসক্রিপশন ও স্টক ট্রান্সফার
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-secondary)', padding: '6px 12px', borderRadius: '10px', border: '1px solid var(--border-color)', fontSize: '0.75rem' }}>
              <Building size={14} className="text-teal-600" />
              <span>শাখা:</span>
              <select
                value={selectedBranchName}
                onChange={e => setSelectedBranchName(e.target.value)}
                style={{ background: 'transparent', border: 'none', fontWeight: '800', color: 'var(--text-main)', fontSize: '0.75rem', cursor: 'pointer' }}
              >
                {branches.map(b => (
                  <option key={b.id} value={b.name}>{b.name}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '6px 12px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '800' }}>
              <Award size={14} />
              <span>বিক্রেতা: {sellerName.split(' ')[1]}</span>
            </div>
          </div>
        </div>

        {/* DGDA Rule Callout */}
        <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed rgba(16, 185, 129, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: '#047857' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldAlert size={14} />
            <span><strong>DGDA নির্দেশিকা:</strong> Prescription-only ওষুধ শুধুমাত্র অনুমোদিত রেজিস্টার্ড চিকিৎসকের বৈধ প্রেসক্রিপশন ও এ-ক্যাটাগরি ফার্মাসিস্টের উপস্থিতিতে ডিসপেন্স করতে হবে। মেয়াদোত্তীর্ণ ওষুধ নির্বাচন সফটওয়্যার দ্বারা স্বয়ংক্রিয়ভাবে ব্লকড।</span>
          </div>
          <span style={{ fontWeight: '800', textDecoration: 'underline' }}>ডিজিডিএ বিধিমালা ২০২২</span>
        </div>
      </div>

      {/* Pharmacy Module Navigation Tabs */}
      <div className="glass-card" style={{ padding: '0.75rem 1rem', borderRadius: '14px' }}>
        <div className="hc-subtabs-nav" style={{ padding: '2px', overflowX: 'auto', display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setActiveTab('pos')}
            className={`hc-tab-btn ${activeTab === 'pos' ? 'active-emerald' : ''}`}
          >
            <ShoppingCart size={15} />
            <span>১.৮ বিক্রয় স্ক্রিন (POS)</span>
          </button>
          <button
            onClick={() => setActiveTab('prescriptions')}
            className={`hc-tab-btn ${activeTab === 'prescriptions' ? 'active-emerald' : ''}`}
          >
            <FileText size={15} />
            <span>১.৮ প্রেসক্রিপশন বিক্রি</span>
            <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: 'inherit', padding: '1px 6px', fontSize: '0.7rem' }}>
              {prescriptions.filter(p => p.dispensing_status === 'Sent to Pharmacy').length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('catalog')}
            className={`hc-tab-btn ${activeTab === 'catalog' ? 'active-emerald' : ''}`}
          >
            <Pill size={15} />
            <span>ওষুধ ক্যাটালগ ({filteredMedicines.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`hc-tab-btn ${activeTab === 'inventory' ? 'active-emerald' : ''}`}
          >
            <Boxes size={15} />
            <span>ব্যাচ স্টক ও অবস্থা ({batchesList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`hc-tab-btn ${activeTab === 'alerts' ? 'active-emerald' : ''}`}
          >
            <AlertTriangle size={15} />
            <span>মেয়াদ ও স্টক অ্যালার্ট</span>
            {alertMedicines.length > 0 && (
              <span className="badge" style={{ background: '#ef4444', color: '#ffffff', padding: '1px 6px', fontSize: '0.7rem' }}>
                {alertMedicines.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('branch_transfer')}
            className={`hc-tab-btn ${activeTab === 'branch_transfer' ? 'active-emerald' : ''}`}
          >
            <ArrowRightLeft size={15} />
            <span>শাখা স্টক ট্রান্সফার ({branchTransfersList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('sales_return')}
            className={`hc-tab-btn ${activeTab === 'sales_return' ? 'active-emerald' : ''}`}
          >
            <RotateCcw size={15} />
            <span>বিক্রয় ফেরত ও রিফান্ড</span>
          </button>
          <button
            onClick={() => setActiveTab('purchases')}
            className={`hc-tab-btn ${activeTab === 'purchases' ? 'active-emerald' : ''}`}
          >
            <Truck size={15} />
            <span>ক্রয় চালান ও সরবরাহকারী</span>
          </button>
          <button
            onClick={() => setActiveTab('stock_count')}
            className={`hc-tab-btn ${activeTab === 'stock_count' ? 'active-emerald' : ''}`}
          >
            <ClipboardCheck size={15} />
            <span>শারীরিক স্টক গণনা</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1. POS SALES SCREEN (11 FIELDS & 6 EXPLICIT BUTTONS) */}
      {/* ============================================================== */}
      {activeTab === 'pos' && (
        <div className="hc-pharmacy-layout">
          {/* Left Column: Search, Catalogs & FEFO Stock Picker */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* 6 Action Buttons Bar */}
            <div className="glass-card" style={{ padding: '0.75rem 1rem', borderRadius: '14px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => { setSalesMode('prescription'); setActiveTab('prescriptions'); }}
                className={`btn press-scale ${salesMode === 'prescription' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.75rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px' }}
              >
                <FileText size={14} />
                <span>[প্রেসক্রিপশন থেকে বিক্রি]</span>
              </button>
              <button
                type="button"
                onClick={() => { setSalesMode('counter'); setActivePrescriptionId(''); }}
                className={`btn press-scale ${salesMode === 'counter' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.75rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', background: salesMode === 'counter' ? '#10b981' : undefined }}
              >
                <ShoppingCart size={14} />
                <span>[কাউন্টার বিক্রি]</span>
              </button>
              <button
                type="button"
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="btn btn-primary press-scale"
                style={{ background: '#059669', borderColor: '#059669', fontSize: '0.75rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px' }}
              >
                <DollarSign size={14} />
                <span>[পেমেন্ট]</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (lastInvoice) setViewingReceipt(lastInvoice);
                  else alert('কোনো সাম্প্রতিক রসিদ পাওয়া যায়নি!');
                }}
                className="btn btn-secondary press-scale"
                style={{ fontSize: '0.75rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px' }}
              >
                <Printer size={14} />
                <span>[রসিদ প্রিন্ট]</span>
              </button>
              <button
                type="button"
                onClick={() => setShowReturnModal(true)}
                className="btn btn-secondary press-scale"
                style={{ fontSize: '0.75rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.4)' }}
              >
                <RotateCcw size={14} />
                <span>[বিক্রয় ফেরত]</span>
              </button>
              <button
                type="button"
                onClick={handleCancelSale}
                className="btn btn-secondary press-scale"
                style={{ fontSize: '0.75rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)' }}
              >
                <X size={14} />
                <span>[বিক্রি বাতিল]</span>
              </button>
            </div>

            {/* Search and Category Filter */}
            <div className="glass-card" style={{ padding: '0.85rem 1rem', borderRadius: '14px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="ওষুধের নাম, জেনেরিক বা বারকোড দিয়ে খুঁজুন..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', paddingLeft: '34px', fontSize: '0.82rem' }}
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input-field"
                style={{ padding: '6px 12px', fontSize: '0.82rem', fontWeight: '700' }}
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Medicine Grid with FEFO priority */}
            <div className="hc-medicine-grid">
              {filteredMedicines.map(med => {
                const totalStockTablets = (med.batches || []).reduce((sum, b) => sum + (b.stock_tablets || 0), 0);
                const totalStrips = Math.floor(totalStockTablets / (med.strip_size || 10));
                const fefoBatches = getFefoBatches(med);
                const activeFefoBatch = fefoBatches.find(b => (b.stock_tablets || 0) > 0 && new Date(b.expiry_date) >= new Date());
                const expiredBatch = fefoBatches.find(b => new Date(b.expiry_date) < new Date());

                return (
                  <div
                    key={med.medicine_id}
                    className="glass-card press-scale"
                    style={{
                      padding: '1rem',
                      borderRadius: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      border: '1px solid var(--border-color)',
                      background: med.temperature_sensitive ? 'rgba(59, 130, 246, 0.04)' : undefined
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <div>
                          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                            <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', fontSize: '0.7rem', fontWeight: '700' }}>
                              {med.dosage_form || 'Tablet'}
                            </span>
                            {med.prescription_required && (
                              <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '0.65rem', fontWeight: '800' }}>
                                Rx আবশ্যক
                              </span>
                            )}
                            {med.temperature_sensitive && (
                              <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', fontSize: '0.65rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <ThermometerSnowflake size={10} /> কোল্ড চেইন
                              </span>
                            )}
                          </div>
                          <h3 style={{ margin: '4px 0 2px', fontSize: '0.98rem', fontWeight: '800', color: 'var(--text-main)' }}>
                            {med.brand_name} <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>({med.strength || '500mg'})</span>
                          </h3>
                          <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            {med.generic_name}
                          </p>
                        </div>
                        <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                          📍 {med.rack_location || 'A-1'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '6px', marginTop: '8px' }}>
                        <span>কোম্পানি: <strong style={{ color: 'var(--text-main)' }}>{med.manufacturer || med.manufacturer_name}</strong></span>
                        <span>স্টক: <strong style={{ color: totalStockTablets < 50 ? '#ef4444' : '#10b981' }}>
                          {totalStrips} পাতা ({totalStockTablets} টি)
                        </strong></span>
                      </div>

                      {/* FEFO Batch Indicator */}
                      {activeFefoBatch && (
                        <div style={{ marginTop: '8px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '8px', padding: '6px 8px', fontSize: '0.72rem', color: '#f59e0b', display: 'flex', justifyContent: 'space-between' }}>
                          <span>FEFO ব্যাচ: <strong>{activeFefoBatch.batch_number}</strong></span>
                          <span>মেয়াদ: <strong>{activeFefoBatch.expiry_date}</strong></span>
                        </div>
                      )}

                      {/* Expired Warning if any */}
                      {expiredBatch && (
                        <div style={{ marginTop: '4px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '4px 8px', fontSize: '0.68rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Ban size={12} />
                          <span>মেয়াদোত্তীর্ণ ব্যাচ ({expiredBatch.batch_number}) ব্লকড!</span>
                        </div>
                      )}
                    </div>

                    <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <div style={{ fontSize: '0.75rem' }}>
                        <div>পাতা: <strong style={{ color: 'var(--text-main)' }}>৳{med.strip_mrp || (med.MRP ? med.MRP * 10 : 80)}</strong></div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>পিস: ৳{med.unit_mrp || med.MRP || 8}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => addToCart(med, null, 'tablet')}
                          className="btn btn-secondary press-scale"
                          style={{ padding: '4px 8px', fontSize: '0.72rem', fontWeight: '700' }}
                          title="১টি ট্যাবলেট যোগ করুন"
                        >
                          + ১ পিস
                        </button>
                        <button
                          type="button"
                          onClick={() => addToCart(med, null, 'strip')}
                          className="btn btn-primary press-scale"
                          style={{ padding: '4px 10px', fontSize: '0.72rem', fontWeight: '800', background: '#10b981', borderColor: '#10b981' }}
                          title="১ পাতা যোগ করুন"
                        >
                          + ১ পাতা
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Checkout Cart & 11 Sales Fields */}
          <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '18px', position: 'sticky', top: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '12px' }}>
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShoppingCart size={18} style={{ color: '#10b981' }} />
                <span>বিক্রয় চালান (Pharmacy Sales POS)</span>
              </h2>
              <span className="badge" style={{ background: 'var(--bg-secondary)', color: 'var(--text-main)', fontSize: '0.72rem' }}>
                আইটেম: {cart.length}
              </span>
            </div>

            {/* Sales Screen Fields: 1. Branch */}
            <div style={{ marginBottom: '10px', padding: '6px 10px', borderRadius: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>শাখা: <strong>{selectedBranchName}</strong></span>
              <span style={{ color: '#10b981', fontWeight: '700' }}>বিক্রেতা: {sellerName.split(' ')[1]}</span>
            </div>

            {/* Sales Screen Fields: 2. Patient & 3. Prescription Selection */}
            <div style={{ marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.74rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                রোগী নির্বাচন (প্রেসক্রিপশন বিক্রিতে আবশ্যক):
              </label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="input-field"
                style={{ width: '100%', fontSize: '0.8rem' }}
              >
                <option value="">-- সাধারণ কাউন্টার ক্রেতা (Walk-in Customer) --</option>
                {patients.map(p => (
                  <option key={p.patient_id} value={p.patient_id}>
                    {p.patient_id} - {p.full_name} ({p.mobile_number || p.phone || 'N/A'})
                  </option>
                ))}
              </select>

              {/* Prescription Reference Selector */}
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="প্রেসক্রিপশন রেফারেন্স / আইডি (ঐচ্ছিক)"
                  value={activePrescriptionId}
                  onChange={e => setActivePrescriptionId(e.target.value)}
                  className="input-field"
                  style={{ flex: 1, fontSize: '0.78rem', padding: '5px 8px' }}
                />
                {activePrescriptionId && (
                  <button
                    type="button"
                    onClick={() => setActivePrescriptionId('')}
                    style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                  >
                    মুছুন
                  </button>
                )}
              </div>

              {/* Patient Allergy Warning */}
              {selectedPatient && (selectedPatient.allergy_note || selectedPatient.allergies) && (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.35)', borderRadius: '10px', padding: '8px 10px', fontSize: '0.74rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <AlertTriangle size={15} />
                  <div>
                    <strong>অ্যালার্জি সতর্কতা:</strong> {selectedPatient.allergy_note || selectedPatient.allergies}
                  </div>
                </div>
              )}
            </div>

            {/* Sales Screen Fields: 4. Medicine, 5. Batch, 6. Qty, 7. Unit Price */}
            <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '10px 0' }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  কার্ট খালি। বাম পাশ থেকে ওষুধ নির্বাচন করুন।
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      padding: '8px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: '0.84rem', color: 'var(--text-main)', display: 'block' }}>{item.brand_name}</strong>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        ব্যাচ: <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700' }}>{item.batch_number}</span> | মেয়াদ: {item.expiry_date}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: '700', marginTop: '2px' }}>
                        {item.unitType === 'strip' ? '১ পাতা' : item.unitType === 'box' ? '১ বক্স' : '১ টি'} @ ৳{item.unitPrice}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'var(--bg-card)' }}>
                        <button
                          type="button"
                          onClick={() => {
                            if (item.qty > 1) {
                              setCart(prev => prev.map((x, i) => i === idx ? { ...x, qty: x.qty - 1 } : x));
                            } else {
                              setCart(prev => prev.filter((_, i) => i !== idx));
                            }
                          }}
                          style={{ padding: '2px 7px', background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', fontWeight: '800' }}
                        >
                          -
                        </button>
                        <span style={{ padding: '0 6px', fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-main)' }}>{item.qty}</span>
                        <button
                          type="button"
                          onClick={() => setCart(prev => prev.map((x, i) => i === idx ? { ...x, qty: x.qty + 1 } : x))}
                          style={{ padding: '2px 7px', background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', fontWeight: '800' }}
                        >
                          +
                        </button>
                      </div>

                      <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)', minWidth: '45px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                        ৳{item.unitPrice * item.qty}
                      </strong>

                      <button
                        type="button"
                        onClick={() => setCart(prev => prev.filter((_, i) => i !== idx))}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Sales Screen Fields: 8. Discount, 9. Total, 10. Payment Method */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>সাব-টোটাল:</span>
                  <strong style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>৳{subtotal}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
                  <span>ডিসকাউন্ট (৳):</span>
                  <input
                    type="number"
                    min="0"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                    className="input-field"
                    style={{ width: '75px', padding: '3px 6px', textAlign: 'right', fontSize: '0.8rem' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '6px', marginTop: '2px' }}>
                  <span style={{ fontSize: '0.92rem', fontWeight: '800', color: 'var(--text-main)' }}>মোট বিল:</span>
                  <strong style={{ fontSize: '1.15rem', fontWeight: '900', color: '#10b981', fontFamily: 'var(--font-mono)' }}>৳{netPayable}</strong>
                </div>
              </div>

              {/* Payment Method Switcher */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
                {['নগদ (Cash)', 'bKash', 'Nagad', 'কার্ড (Card)'].map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    style={{
                      padding: '5px 2px',
                      borderRadius: '8px',
                      fontSize: '0.7rem',
                      fontWeight: '700',
                      border: paymentMethod === m ? '1.5px solid #10b981' : '1px solid var(--border-color)',
                      background: paymentMethod === m ? '#10b981' : 'var(--bg-secondary)',
                      color: paymentMethod === m ? '#ffffff' : 'var(--text-main)',
                      cursor: 'pointer'
                    }}
                  >
                    {m.split(' ')[0]}
                  </button>
                ))}
              </div>

              {/* Paid and Confirm */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <input
                  type="number"
                  placeholder={`জমা টাকা (৳${netPayable})`}
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  className="input-field"
                  style={{ flex: 1, fontSize: '0.82rem' }}
                />
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={cart.length === 0}
                  className="btn btn-primary press-scale"
                  style={{
                    background: '#10b981',
                    borderColor: '#10b981',
                    padding: '8px 16px',
                    fontSize: '0.82rem',
                    fontWeight: '800',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    opacity: cart.length === 0 ? 0.5 : 1
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>পেমেন্ট নিশ্চিত</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. MEDICINE CATALOG (14 FIELDS & ADD MEDICINE MODAL) */}
      {/* ============================================================== */}
      {activeTab === 'catalog' && (
        <div className="glass-card" style={{ padding: '1.25rem 1.5rem', borderRadius: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)' }}>
                ওষুধ ক্যাটালগ ও জেনেরিক মাস্টার (14 Specification Fields)
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                SKU, বারকোড, জেনেরিক, শক্তি, ডোজ ফর্ম, কোল্ড-চেইন ও DGDA Rx প্রয়োজনীয়তা ট্র্যাকিং
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddMedModal(true)}
              className="btn btn-primary press-scale"
              style={{ background: '#10b981', borderColor: '#10b981', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '7px 14px' }}
            >
              <Plus size={15} />
              <span>নতুন ওষুধ নিবন্ধন (Add Medicine)</span>
            </button>
          </div>

          <div className="hc-table-container">
            <table className="hc-data-table">
              <thead>
                <tr>
                  <th>SKU / বারকোড</th>
                  <th>ব্র্যান্ড ও জেনেরিক নাম</th>
                  <th>শক্তি ও ফর্ম</th>
                  <th>প্রস্তুতকারক ও ক্যাটাগরি</th>
                  <th>ইউনিট</th>
                  <th>ক্রয়মূল্য</th>
                  <th>বিক্রয়মূল্য</th>
                  <th>ন্যূনতম স্টক</th>
                  <th>প্রেসক্রিপশন</th>
                  <th>তাপমাত্রা</th>
                  <th>অবস্থা</th>
                </tr>
              </thead>
              <tbody>
                {filteredMedicines.map(med => (
                  <tr key={med.medicine_id}>
                    <td>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: '800', color: '#10b981' }}>{med.item_code || med.medicine_id}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{med.barcode || 'N/A'}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '800', color: 'var(--text-main)' }}>{med.brand_name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{med.generic_name}</div>
                    </td>
                    <td>
                      <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', fontSize: '0.7rem' }}>
                        {med.strength || '500mg'} • {med.dosage_form || 'Tablet'}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: '700' }}>{med.manufacturer || med.manufacturer_name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{med.category || 'General'}</div>
                    </td>
                    <td>{med.base_unit || 'Tablet'}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '700' }}>৳{med.purchase_rate || 2.5}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '800', color: '#10b981' }}>৳{med.selling_rate || med.MRP || 5}</td>
                    <td style={{ fontWeight: '700', color: '#f59e0b' }}>{med.reorder_level || med.min_stock || 50}</td>
                    <td>
                      <span className="badge" style={{ background: med.prescription_required ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)', color: med.prescription_required ? '#ef4444' : '#10b981', fontSize: '0.68rem', fontWeight: '800' }}>
                        {med.prescription_required ? 'Rx আবশ্যক' : 'OTC উন্মুক্ত'}
                      </span>
                    </td>
                    <td>
                      {med.temperature_sensitive ? (
                        <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#2563eb', fontSize: '0.68rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <ThermometerSnowflake size={11} /> ২-৮°C
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>স্বাভাবিক</span>
                      )}
                    </td>
                    <td>
                      <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontSize: '0.7rem', fontWeight: '800' }}>
                        {med.active_status || 'Active'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. BATCH FIELDS & INVENTORY (10 BATCH FIELDS) */}
      {/* ============================================================== */}
      {activeTab === 'inventory' && (
        <div className="glass-card" style={{ padding: '1.25rem 1.5rem', borderRadius: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)' }}>
                ব্যাচ স্টক ও ইনভেন্টরি লেজার (10 Batch Fields System)
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                ব্যাচ নম্বর, শাখা, সরবরাহকারী, ক্রয়-মেয়াদ তারিখ, ক্রয়-অবশিষ্ট পরিমাণ, ক্রয়-বিক্রয় মূল্য ও ব্যাচ অবস্থা
              </p>
            </div>
            <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '6px 12px', fontSize: '0.75rem', fontWeight: '800' }}>
              FEFO সক্রিয়
            </span>
          </div>

          <div className="hc-table-container">
            <table className="hc-data-table">
              <thead>
                <tr>
                  <th>ব্যাচ নম্বর</th>
                  <th>ওষুধের নাম</th>
                  <th>শাখা</th>
                  <th>সরবরাহকারী</th>
                  <th>ক্রয়ের তারিখ</th>
                  <th>মেয়াদ শেষের তারিখ</th>
                  <th>ক্রয় পরিমাণ</th>
                  <th>অবশিষ্ট স্টক</th>
                  <th>ক্রয় / বিক্রয় মূল্য</th>
                  <th>ব্যাচের অবস্থা</th>
                </tr>
              </thead>
              <tbody>
                {batchesList.map(b => (
                  <tr key={b.batch_number}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '800', color: '#10b981' }}>{b.batch_number}</td>
                    <td style={{ fontWeight: '800' }}>{b.brand_name}</td>
                    <td style={{ fontWeight: '700' }}>{b.branch}</td>
                    <td>{b.supplier}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{b.purchase_date}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: b.batch_status.includes('Expired') ? '#ef4444' : 'inherit' }}>
                      {b.expiry_date}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{b.initial_quantity} টি</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '800', color: b.remaining_quantity < 50 ? '#ef4444' : '#10b981' }}>
                      {b.remaining_quantity} টি
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '700' }}>
                      ৳{b.purchase_rate} / <span style={{ color: '#10b981' }}>৳{b.selling_rate}</span>
                    </td>
                    <td>
                      <span className="badge" style={{
                        background: b.batch_status.includes('Expired')
                          ? 'rgba(239, 68, 68, 0.15)'
                          : b.batch_status.includes('Quarantine')
                          ? 'rgba(245, 158, 11, 0.15)'
                          : 'rgba(16, 185, 129, 0.15)',
                        color: b.batch_status.includes('Expired')
                          ? '#ef4444'
                          : b.batch_status.includes('Quarantine')
                          ? '#f59e0b'
                          : '#10b981',
                        fontSize: '0.68rem',
                        fontWeight: '800'
                      }}>
                        {b.batch_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. BRANCH STOCK TRANSFER (12 FORM FIELDS & 6 STATUSES) */}
      {/* ============================================================== */}
      {activeTab === 'branch_transfer' && (
        <div className="glass-card" style={{ padding: '1.25rem 1.5rem', borderRadius: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)' }}>
                শাখা স্টক ট্রান্সফার (12 Fields & 6 Status Tracking Workflow)
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                শাখা-টু-শাখা স্টক স্থানান্তর • বিক্রয়/ক্রয় হিসেবে গণ্য নয় • প্রেরণ ও গ্রহণ উভয় পক্ষের রিসিভিং ভেরিফিকেশন
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowTransferModal(true)}
              className="btn btn-primary press-scale"
              style={{ background: '#3b82f6', borderColor: '#3b82f6', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '7px 14px' }}
            >
              <ArrowRightLeft size={15} />
              <span>নতুন স্টক ট্রান্সফার চালান</span>
            </button>
          </div>

          {/* Transfer Rule Notice */}
          <div style={{ marginBottom: '14px', padding: '10px 14px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)', fontSize: '0.75rem', color: '#1e40af', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={16} />
              <span><strong>ট্রান্সফার নিয়ম:</strong> পাঠানো মানেই গ্রহণ সম্পন্ন নয়; গ্রহণকারী শাখা যাচাই সাপেক্ষে 'সম্পূর্ণ গ্রহণ' বা 'আংশিক গ্রহণ' করবে। বাতিল ট্রান্সফারের জন্য লিখিত কারণ ও অনুমোদন আবশ্যক।</span>
            </div>
            <span className="badge" style={{ background: '#3b82f6', color: '#fff', fontSize: '0.7rem' }}>অ-বাণিজ্যিক সমন্বয়</span>
          </div>

          <div className="hc-table-container">
            <table className="hc-data-table">
              <thead>
                <tr>
                  <th>ট্রান্সফার নম্বর</th>
                  <th>পাঠানো শাখা</th>
                  <th>গ্রহণকারী শাখা</th>
                  <th>ওষুধ ও ব্যাচ</th>
                  <th>পরিমাণ</th>
                  <th>পাঠানোর তারিখ ও প্রেরক</th>
                  <th>গ্রহণের তারিখ ও প্রাপক</th>
                  <th>ট্রান্সফার অবস্থা</th>
                  <th>নোট ও কারণ</th>
                  <th>অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {branchTransfersList.map(trf => (
                  <tr key={trf.transfer_no}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '800', color: '#3b82f6' }}>{trf.transfer_no}</td>
                    <td style={{ fontWeight: '700' }}>{trf.from_branch}</td>
                    <td style={{ fontWeight: '700', color: '#10b981' }}>{trf.to_branch}</td>
                    <td>
                      <div style={{ fontWeight: '800' }}>{trf.medicine_name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>ব্যাচ: {trf.batch_number}</div>
                    </td>
                    <td style={{ fontWeight: '800', fontFamily: 'var(--font-mono)' }}>{trf.quantity} টি</td>
                    <td>
                      <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>{trf.dispatch_date}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{trf.dispatched_by}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>{trf.receive_date}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{trf.received_by}</div>
                    </td>
                    <td>
                      <span className="badge" style={{
                        background: trf.transfer_status === 'সম্পূর্ণ গ্রহণ'
                          ? 'rgba(16, 185, 129, 0.15)'
                          : trf.transfer_status === 'আংশিক গ্রহণ'
                          ? 'rgba(245, 158, 11, 0.15)'
                          : trf.transfer_status === 'বাতিল'
                          ? 'rgba(239, 68, 68, 0.15)'
                          : 'rgba(59, 130, 246, 0.15)',
                        color: trf.transfer_status === 'সম্পূর্ণ গ্রহণ'
                          ? '#10b981'
                          : trf.transfer_status === 'আংশিক গ্রহণ'
                          ? '#f59e0b'
                          : trf.transfer_status === 'বাতিল'
                          ? '#ef4444'
                          : '#3b82f6',
                        fontSize: '0.7rem',
                        fontWeight: '800'
                      }}>
                        {trf.transfer_status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.74rem', color: 'var(--text-muted)', maxWidth: '180px' }}>{trf.notes}</td>
                    <td>
                      {trf.transfer_status === 'পাঠানো হয়েছে' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setBranchTransfersList(prev => prev.map(x => x.transfer_no === trf.transfer_no ? {
                              ...x,
                              transfer_status: 'সম্পূর্ণ গ্রহণ',
                              receive_date: new Date().toLocaleString('bn-BD'),
                              received_by: 'শাখা ফার্মাসিস্ট (যাচাইকৃত)'
                            } : x));
                            alert(`ট্রান্সফার ${trf.transfer_no} সফলভাবে রিসিভ করা হয়েছে এবং উভয় শাখার স্টক সমন্বয় হয়েছে!`);
                          }}
                          className="btn btn-secondary press-scale"
                          style={{ padding: '4px 8px', fontSize: '0.72rem', fontWeight: '800', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.4)' }}
                        >
                          ✓ গ্রহণ করুন
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>সম্পন্ন</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. PRESCRIPTION DISPENSE QUEUE */}
      {/* ============================================================== */}
      {activeTab === 'prescriptions' && (
        <div className="glass-card" style={{ padding: '1.25rem 1.5rem', borderRadius: '18px' }}>
          <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '14px' }}>
            <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)' }}>
              ডাক্তারের ডিজিটাল প্রেসক্রিপশন কিউ (Pharmacy Dispense Queue)
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              স্বাক্ষরিত ডিজিটাল প্রেসক্রিপশন থেকে সরাসরি ওষুধ লোড করে রোগীর জন্য FEFO স্টক ডিসপেন্স করুন
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '14px' }}>
            {prescriptions.map(rx => (
              <div
                key={rx.prescription_id}
                className="glass-card press-scale"
                style={{
                  padding: '1rem',
                  borderRadius: '16px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="badge" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                      {rx.prescription_id}
                    </span>
                    <span className="badge" style={{ fontSize: '0.7rem', background: rx.dispensing_status === 'Fully Dispensed' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: rx.dispensing_status === 'Fully Dispensed' ? '#10b981' : '#f59e0b' }}>
                      {rx.dispensing_status || 'Sent to Pharmacy'}
                    </span>
                  </div>

                  <h3 style={{ margin: '8px 0 2px', fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)' }}>{rx.patient_name}</h3>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>রোগী আইডি: {rx.patient_id} | বয়স: {rx.patient_age || rx.age}</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>ডাক্তার: <strong style={{ color: 'var(--text-main)' }}>{rx.doctor_name}</strong></div>

                  <div style={{ marginTop: '10px', background: 'var(--bg-secondary)', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: '700', color: 'var(--text-main)' }}>প্রেসক্রাইবড ওষুধসমূহ:</div>
                    {(rx.medicines || []).map((m, i) => (
                      <div key={i} style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>• {m.brand_name} {m.strength && `(${m.strength})`}</span>
                        <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>{m.frequency} - {m.duration}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
                  <button
                    type="button"
                    onClick={() => loadPrescriptionToCart(rx)}
                    className="btn btn-primary press-scale"
                    style={{ width: '100%', background: '#10b981', borderColor: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', fontSize: '0.78rem' }}
                  >
                    <ShoppingCart size={15} />
                    <span>[প্রেসক্রিপশন থেকে বিক্রি করুন]</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. ALERTS & SAFETY TAB */}
      {/* ============================================================== */}
      {activeTab === 'alerts' && (
        <div className="glass-card" style={{ padding: '1.25rem 1.5rem', borderRadius: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)' }}>
                মেয়াদোত্তীর্ণ ও কম স্টক অ্যালার্ট (Safety & Stock Alerts)
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                মেয়াদোত্তীর্ণ ব্যাচ বিক্রির জন্য নির্বাচন করা নিষিদ্ধ • ৯০ দিনের আসন্ন মেয়াদ নোটিফিকেশন
              </p>
            </div>
            <div className="hc-subtabs-nav" style={{ padding: '3px' }}>
              <button
                type="button"
                onClick={() => setAlertFilter('ALL')}
                className={`hc-tab-btn ${alertFilter === 'ALL' ? 'active-emerald' : ''}`}
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
              >
                সব সতর্কতা
              </button>
              <button
                type="button"
                onClick={() => setAlertFilter('EXPIRED')}
                className={`hc-tab-btn ${alertFilter === 'EXPIRED' ? 'active-emerald' : ''}`}
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
              >
                মেয়াদোত্তীর্ণ
              </button>
              <button
                type="button"
                onClick={() => setAlertFilter('NEAR_EXPIRY')}
                className={`hc-tab-btn ${alertFilter === 'NEAR_EXPIRY' ? 'active-emerald' : ''}`}
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
              >
                আসন্ন মেয়াদ (&lt; ৯০ দিন)
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {alertMedicines.map((item, idx) => (
              <div
                key={idx}
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: item.alertType === 'EXPIRED' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)',
                  background: item.alertType === 'EXPIRED' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexWrap: 'wrap'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>{item.brand_name}</strong>
                    <span className="badge" style={{ background: item.alertType === 'EXPIRED' ? '#ef4444' : '#f59e0b', color: '#ffffff', fontSize: '0.68rem', fontWeight: '800' }}>
                      {item.alertType === 'EXPIRED' ? 'মেয়াদোত্তীর্ণ (বিক্রয় ব্লকড)' : `মেয়াদ আর ${item.daysLeft} দিন`}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    জেনেরিক: {item.generic_name} | কোম্পানি: {item.manufacturer || item.manufacturer_name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                    ব্যাচ নম্বর: {item.batch.batch_number} | মেয়াদ: {item.batch.expiry_date} | অবশিষ্ট স্টক: {item.batch.stock_tablets} টি
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {item.alertType === 'EXPIRED' ? (
                    <button
                      type="button"
                      onClick={() => alert(`ব্যাচ ${item.batch.batch_number} কোম্পানি রিটার্ন/ডিসপোজাল রেজিস্টারে কোয়ারেন্টাইনে পাঠানো হয়েছে।`)}
                      className="btn btn-secondary press-scale"
                      style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)', padding: '5px 12px', fontSize: '0.75rem', fontWeight: '700' }}
                    >
                      কোম্পানি রিটার্ন ও কোয়ারেন্টাইন
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => alert(`ব্যাচ ${item.batch.batch_number} FEFO প্রায়োরিটি ডিসকাউন্ট কাস্টমার ক্লিয়ারেন্সে যুক্ত করা হয়েছে।`)}
                      className="btn btn-secondary press-scale"
                      style={{ color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.4)', padding: '5px 12px', fontSize: '0.75rem', fontWeight: '700' }}
                    >
                      ক্লিয়ারেন্স অফার দিন
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 7. SALES RETURN & REFUNDS */}
      {/* ============================================================== */}
      {activeTab === 'sales_return' && (
        <div className="glass-card" style={{ padding: '1.25rem 1.5rem', borderRadius: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)' }}>
                বিক্রয় ফেরত ও রিফান্ড খতিয়ান (Sales Return & Refund Logs)
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                রোগীর ফেরতকৃত ওষুধের বিপরীত সমন্বয় এন্ট্রি ও অনুমোদন
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowReturnModal(true)}
              className="btn btn-primary press-scale"
              style={{ background: '#f59e0b', borderColor: '#f59e0b', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '7px 14px' }}
            >
              <RotateCcw size={15} />
              <span>নতুন বিক্রয় ফেরত এন্ট্রি</span>
            </button>
          </div>

          <div className="hc-table-container">
            <table className="hc-data-table">
              <thead>
                <tr>
                  <th>রিটার্ন আইডি</th>
                  <th>ইনভয়েস নং</th>
                  <th>তারিখ ও সময়</th>
                  <th>রোগীর নাম</th>
                  <th>ফেরতকৃত ওষুধ ও ব্যাচ</th>
                  <th>পরিমাণ</th>
                  <th>রিফান্ড টাকা</th>
                  <th>ফেরতের কারণ</th>
                  <th>স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody>
                {returnsList.map(ret => (
                  <tr key={ret.returnId}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '800', color: '#f59e0b' }}>{ret.returnId}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{ret.invoiceNo}</td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ret.date}</td>
                    <td style={{ fontWeight: '700' }}>{ret.patientName}</td>
                    <td>{ret.medicineName} <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ব্যাচ: {ret.batchNumber}</div></td>
                    <td style={{ fontWeight: '700' }}>{ret.returnQty}</td>
                    <td style={{ fontWeight: '800', color: '#ef4444' }}>৳{ret.refundAmount}</td>
                    <td style={{ fontSize: '0.75rem' }}>{ret.reason}</td>
                    <td><span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>{ret.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 8. PURCHASES & SUPPLIERS */}
      {/* ============================================================== */}
      {activeTab === 'purchases' && (
        <div className="glass-card" style={{ padding: '1.25rem 1.5rem', borderRadius: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)' }}>
                ক্রয় চালান ও সরবরাহকারী খতিয়ান (Purchase Invoices & Suppliers)
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                ফার্মাসিউটিক্যাল কোম্পানি সরবরাহকারী তালিকা ও বাকি ট্র্যাকিং
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div className="hc-subtabs-nav" style={{ padding: '3px' }}>
                <button
                  type="button"
                  onClick={() => setPurchaseSubTab('invoices')}
                  className={`hc-tab-btn ${purchaseSubTab === 'invoices' ? 'active-emerald' : ''}`}
                  style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                >
                  ক্রয় চালান ({purchaseInvoices.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPurchaseSubTab('suppliers')}
                  className={`hc-tab-btn ${purchaseSubTab === 'suppliers' ? 'active-emerald' : ''}`}
                  style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                >
                  সরবরাহকারী ({suppliersList.length})
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowPurchaseModal(true)}
                className="btn btn-primary press-scale"
                style={{ background: '#10b981', borderColor: '#10b981', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', padding: '6px 12px' }}
              >
                <Plus size={14} />
                <span>নতুন ক্রয় চালান</span>
              </button>
            </div>
          </div>

          {purchaseSubTab === 'invoices' ? (
            <div className="hc-table-container">
              <table className="hc-data-table">
                <thead>
                  <tr>
                    <th>চালান নং</th>
                    <th>কোম্পানি / সরবরাহকারী</th>
                    <th>চালান স্লিপ নং</th>
                    <th>তারিখ</th>
                    <th>মোট টাকা</th>
                    <th>পরিশোধিত</th>
                    <th>বকেয়া</th>
                    <th>স্ট্যাটাস</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseInvoices.map(inv => (
                    <tr key={inv.invoiceNo}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '800', color: '#10b981' }}>{inv.invoiceNo}</td>
                      <td style={{ fontWeight: '700' }}>{inv.supplierName}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{inv.challanNo}</td>
                      <td>{inv.date}</td>
                      <td style={{ fontWeight: '800' }}>৳{inv.totalAmount.toLocaleString()}</td>
                      <td style={{ color: '#10b981', fontWeight: '700' }}>৳{inv.paidAmount.toLocaleString()}</td>
                      <td style={{ color: inv.dueAmount > 0 ? '#ef4444' : '#10b981', fontWeight: '800' }}>
                        {inv.dueAmount > 0 ? `৳${inv.dueAmount.toLocaleString()}` : 'পরিশোধিত'}
                      </td>
                      <td>
                        <span className="badge" style={{ background: inv.dueAmount === 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: inv.dueAmount === 0 ? '#10b981' : '#ef4444' }}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="hc-table-container">
              <table className="hc-data-table">
                <thead>
                  <tr>
                    <th>কোম্পানির নাম</th>
                    <th>কোড</th>
                    <th>যোগাযোগ</th>
                    <th>বাকির সময়সীমা</th>
                    <th>বর্তমান পাওনা (Payable)</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliersList.map(sup => (
                    <tr key={sup.id}>
                      <td style={{ fontWeight: '800' }}>{sup.name}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{sup.code}</td>
                      <td>{sup.phone}</td>
                      <td>{sup.creditPeriod}</td>
                      <td style={{ fontWeight: '800', color: sup.balance > 0 ? '#ef4444' : '#10b981' }}>
                        ৳{sup.balance.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 9. PHYSICAL STOCK COUNT AUDIT */}
      {/* ============================================================== */}
      {activeTab === 'stock_count' && (
        <div className="glass-card" style={{ padding: '1.25rem 1.5rem', borderRadius: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)' }}>
                শারীরিক স্টক গণনা ও অডিট (Stock Count Audit)
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                সিস্টেম স্টক বনাম ফিজিক্যাল কাউন্টের অমিল বিশ্লেষণ
              </p>
            </div>
            <button
              type="button"
              onClick={() => alert('শারীরিক স্টক গণনা সফলভাবে সিঙ্ক ও অডিট লগ সংরক্ষণ করা হয়েছে!')}
              className="btn btn-primary press-scale"
              style={{ background: '#10b981', borderColor: '#10b981', fontSize: '0.8rem', padding: '7px 14px' }}
            >
              ✓ অডিট সমাপ্ত ও স্টক সিঙ্ক করুন
            </button>
          </div>

          <div className="hc-table-container">
            <table className="hc-data-table">
              <thead>
                <tr>
                  <th>ওষুধের নাম</th>
                  <th>সিস্টেম স্টক</th>
                  <th>শারীরিক গণনা (Physical Count)</th>
                  <th>পার্থক্য (Variance)</th>
                  <th>অডিট স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody>
                {stockAuditList.map(item => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: '800' }}>{item.brand_name}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '700' }}>{item.systemStock} টি</td>
                    <td>
                      <input
                        type="number"
                        defaultValue={item.physicalStock}
                        onChange={e => {
                          const val = Number(e.target.value) || 0;
                          setStockAuditList(prev => prev.map(x => x.id === item.id ? { ...x, physicalStock: val, variance: val - x.systemStock, status: val === x.systemStock ? 'মিলেছে (Matched)' : val < x.systemStock ? `ঘাটতি (${val - x.systemStock})` : `উদ্বৃত্ত (+${val - x.systemStock})` } : x));
                        }}
                        className="input-field"
                        style={{ width: '90px', padding: '4px 8px', fontSize: '0.8rem', fontWeight: '800' }}
                      />
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '800', color: item.variance === 0 ? '#10b981' : '#ef4444' }}>
                      {item.variance > 0 ? `+${item.variance}` : item.variance}
                    </td>
                    <td>
                      <span className="badge" style={{ background: item.variance === 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: item.variance === 0 ? '#10b981' : '#ef4444' }}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: ADD MEDICINE (ALL 14 SPECIFICATION FIELDS) */}
      {/* ============================================================== */}
      {showAddMedModal && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content glass-card" style={{ maxWidth: '640px', width: '95%', padding: '1.5rem', borderRadius: '20px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Pill size={18} color="#10b981" />
                <span>নতুন ওষুধ ক্যাটালগ নিবন্ধন (14 Specification Fields)</span>
              </h3>
              <button onClick={() => setShowAddMedModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
            </div>

            <form onSubmit={e => {
              e.preventDefault();
              const newMed = {
                medicine_id: `MED-${Math.floor(100 + Math.random() * 900)}`,
                item_code: newMedForm.item_code,
                barcode: newMedForm.barcode,
                brand_name: newMedForm.brand_name,
                generic_name: newMedForm.generic_name,
                strength: newMedForm.strength,
                dosage_form: newMedForm.dosage_form,
                manufacturer: newMedForm.manufacturer,
                category: newMedForm.category,
                base_unit: newMedForm.base_unit,
                purchase_rate: Number(newMedForm.purchase_rate),
                selling_rate: Number(newMedForm.selling_rate),
                min_stock: Number(newMedForm.min_stock),
                prescription_required: newMedForm.prescription_required,
                temperature_sensitive: newMedForm.temperature_sensitive,
                active_status: newMedForm.active_status,
                strip_size: 10,
                rack_location: newMedForm.rack_location,
                batches: [
                  {
                    batch_number: newMedForm.batch_number,
                    expiry_date: newMedForm.expiry_date,
                    stock_tablets: 100,
                    purchase_rate: Number(newMedForm.purchase_rate),
                    selling_rate: Number(newMedForm.selling_rate)
                  }
                ]
              };
              setCatalogMedicines([newMed, ...catalogMedicines]);
              alert(`ওষুধ '${newMed.brand_name}' সফলভাবে ১৪টি ফিল্ডসহ ক্যাটালগে যুক্ত হয়েছে!`);
              setShowAddMedModal(false);
            }} style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem' }}>
              
              {/* Field 1: SKU & Field 2: Barcode */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '3px', fontWeight: '700' }}>১. পণ্য কোড / SKU</label>
                  <input required value={newMedForm.item_code} onChange={e => setNewMedForm({ ...newMedForm, item_code: e.target.value })} className="input-field" style={{ width: '100%', padding: '6px 10px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '3px', fontWeight: '700' }}>২. বারকোড (Barcode)</label>
                  <input required value={newMedForm.barcode} onChange={e => setNewMedForm({ ...newMedForm, barcode: e.target.value })} className="input-field" style={{ width: '100%', padding: '6px 10px' }} />
                </div>
              </div>

              {/* Field 3: Brand & Field 4: Generic */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '3px', fontWeight: '700' }}>৩. ব্র্যান্ড নাম</label>
                  <input required placeholder="যেমন: Napa Extend" value={newMedForm.brand_name} onChange={e => setNewMedForm({ ...newMedForm, brand_name: e.target.value })} className="input-field" style={{ width: '100%', padding: '6px 10px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '3px', fontWeight: '700' }}>৪. জেনেরিক নাম</label>
                  <input required placeholder="যেমন: Paracetamol" value={newMedForm.generic_name} onChange={e => setNewMedForm({ ...newMedForm, generic_name: e.target.value })} className="input-field" style={{ width: '100%', padding: '6px 10px' }} />
                </div>
              </div>

              {/* Field 5: Strength & Field 6: Dosage Form */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '3px', fontWeight: '700' }}>৫. শক্তি (Strength)</label>
                  <input required placeholder="যেমন: 500mg, 20mg, 10ml" value={newMedForm.strength} onChange={e => setNewMedForm({ ...newMedForm, strength: e.target.value })} className="input-field" style={{ width: '100%', padding: '6px 10px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '3px', fontWeight: '700' }}>৬. ওষুধের ফর্ম (Form)</label>
                  <select value={newMedForm.dosage_form} onChange={e => setNewMedForm({ ...newMedForm, dosage_form: e.target.value })} className="input-field" style={{ width: '100%', padding: '6px 10px' }}>
                    <option value="Tablet">Tablet (ট্যাবলেট)</option>
                    <option value="Capsule">Capsule (ক্যাপসুল)</option>
                    <option value="Syrup">Syrup (সিরাপ)</option>
                    <option value="Suspension">Suspension (সাসপেনশন)</option>
                    <option value="Injection">Injection (ইনজেকশন)</option>
                    <option value="Ointment">Ointment (মলম)</option>
                    <option value="Eye Drops">Eye Drops (আই ড্রপ)</option>
                  </select>
                </div>
              </div>

              {/* Field 7: Manufacturer & Field 8: Category */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '3px', fontWeight: '700' }}>৭. প্রস্তুতকারক কোম্পানি</label>
                  <input required value={newMedForm.manufacturer} onChange={e => setNewMedForm({ ...newMedForm, manufacturer: e.target.value })} className="input-field" style={{ width: '100%', padding: '6px 10px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '3px', fontWeight: '700' }}>৮. ক্যাটাগরি</label>
                  <select value={newMedForm.category} onChange={e => setNewMedForm({ ...newMedForm, category: e.target.value })} className="input-field" style={{ width: '100%', padding: '6px 10px' }}>
                    <option value="Antibiotic">Antibiotic (অ্যান্টিবায়োটিক)</option>
                    <option value="Analgesic">Analgesic (ব্যথানাশক)</option>
                    <option value="Gastric / PPI">Gastric / PPI (গ্যাস্ট্রিক)</option>
                    <option value="Cardiovascular">Cardiovascular (কার্ডিওভাসকুলার)</option>
                    <option value="Respiratory">Respiratory (শ্বাসকষ্ট/অ্যাজমা)</option>
                    <option value="Vitamin & Mineral">Vitamin & Mineral (ভিটামিন)</option>
                  </select>
                </div>
              </div>

              {/* Field 9: Unit, Field 10: Purchase Price, Field 11: Selling Price */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '3px', fontWeight: '700' }}>৯. ইউনিট</label>
                  <input required value={newMedForm.base_unit} onChange={e => setNewMedForm({ ...newMedForm, base_unit: e.target.value })} className="input-field" style={{ width: '100%', padding: '6px 10px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '3px', fontWeight: '700' }}>১০. ক্রয়মূল্য (৳)</label>
                  <input type="number" step="0.1" required value={newMedForm.purchase_rate} onChange={e => setNewMedForm({ ...newMedForm, purchase_rate: e.target.value })} className="input-field" style={{ width: '100%', padding: '6px 10px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '3px', fontWeight: '700' }}>১১. বিক্রয়মূল্য (৳)</label>
                  <input type="number" step="0.1" required value={newMedForm.selling_rate} onChange={e => setNewMedForm({ ...newMedForm, selling_rate: e.target.value })} className="input-field" style={{ width: '100%', padding: '6px 10px' }} />
                </div>
              </div>

              {/* Field 12: Min Stock, Field 13: Rx Required, Field 14: Cold Chain */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '3px', fontWeight: '700' }}>১২. ন্যূনতম স্টক</label>
                  <input type="number" required value={newMedForm.min_stock} onChange={e => setNewMedForm({ ...newMedForm, min_stock: e.target.value })} className="input-field" style={{ width: '100%', padding: '6px 10px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '3px', fontWeight: '700' }}>১৩. প্রেসক্রিপশন আবশ্যক?</label>
                  <select value={newMedForm.prescription_required ? 'yes' : 'no'} onChange={e => setNewMedForm({ ...newMedForm, prescription_required: e.target.value === 'yes' })} className="input-field" style={{ width: '100%', padding: '6px 10px' }}>
                    <option value="yes">হ্যাঁ (Rx Required)</option>
                    <option value="no">না (OTC Open)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '3px', fontWeight: '700' }}>১৪. তাপমাত্রা-সংবেদনশীল?</label>
                  <select value={newMedForm.temperature_sensitive ? 'yes' : 'no'} onChange={e => setNewMedForm({ ...newMedForm, temperature_sensitive: e.target.value === 'yes' })} className="input-field" style={{ width: '100%', padding: '6px 10px' }}>
                    <option value="no">না (সাধারণ)</option>
                    <option value="yes">হ্যাঁ (২-৮°C কোল্ড চেইন)</option>
                  </select>
                </div>
              </div>

              {/* Initial Batch & Expiry */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: 'var(--bg-secondary)', padding: '8px', borderRadius: '10px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '3px', fontWeight: '700' }}>প্রারম্ভিক ব্যাচ নং</label>
                  <input required value={newMedForm.batch_number} onChange={e => setNewMedForm({ ...newMedForm, batch_number: e.target.value })} className="input-field" style={{ width: '100%', padding: '6px 10px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '3px', fontWeight: '700' }}>মেয়াদ শেষের তারিখ</label>
                  <input type="date" required value={newMedForm.expiry_date} onChange={e => setNewMedForm({ ...newMedForm, expiry_date: e.target.value })} className="input-field" style={{ width: '100%', padding: '6px 10px' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowAddMedModal(false)} className="btn btn-secondary press-scale">বাতিল</button>
                <button type="submit" className="btn btn-primary press-scale" style={{ background: '#10b981', borderColor: '#10b981' }}>১৪টি ফিল্ডসহ সংরক্ষণ করুন</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: ADD BRANCH TRANSFER (12 FORM FIELDS & 6 STATUSES) */}
      {/* ============================================================== */}
      {showTransferModal && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content glass-card" style={{ maxWidth: '600px', width: '95%', padding: '1.5rem', borderRadius: '20px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ArrowRightLeft size={18} color="#3b82f6" />
                <span>শাখা স্টক ট্রান্সফার চালান (12 Specification Fields)</span>
              </h3>
              <button onClick={() => setShowTransferModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
            </div>

            <form onSubmit={e => {
              e.preventDefault();
              if (newTransferForm.from_branch === newTransferForm.to_branch) {
                alert('প্রেরক শাখা এবং গ্রহণকারী শাখা ভিন্ন হতে হবে!');
                return;
              }
              const newTrf = {
                ...newTransferForm,
                transfer_no: `TRF-2026-${Math.floor(100 + Math.random() * 900)}`,
                dispatch_date: new Date().toLocaleString('bn-BD'),
                quantity: Number(newTransferForm.quantity)
              };
              setBranchTransfersList([newTrf, ...branchTransfersList]);
              alert(`শাখা ট্রান্সফার চালান #${newTrf.transfer_no} সফলভাবে তৈরি ও পাঠানো হয়েছে!`);
              setShowTransferModal(false);
            }} style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '3px', fontWeight: '700' }}>১. পাঠানো শাখা (From)</label>
                  <select value={newTransferForm.from_branch} onChange={e => setNewTransferForm({ ...newTransferForm, from_branch: e.target.value })} className="input-field" style={{ width: '100%', padding: '6px 10px' }}>
                    {branches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '3px', fontWeight: '700' }}>২. গ্রহণকারী শাখা (To)</label>
                  <select value={newTransferForm.to_branch} onChange={e => setNewTransferForm({ ...newTransferForm, to_branch: e.target.value })} className="input-field" style={{ width: '100%', padding: '6px 10px' }}>
                    {branches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '3px', fontWeight: '700' }}>৩. পণ্য / ওষুধ</label>
                  <select value={newTransferForm.medicine_name} onChange={e => setNewTransferForm({ ...newTransferForm, medicine_name: e.target.value })} className="input-field" style={{ width: '100%', padding: '6px 10px' }}>
                    {catalogMedicines.map(m => <option key={m.medicine_id} value={m.brand_name}>{m.brand_name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '3px', fontWeight: '700' }}>৪. ব্যাচ নম্বর</label>
                  <input required value={newTransferForm.batch_number} onChange={e => setNewTransferForm({ ...newTransferForm, batch_number: e.target.value })} className="input-field" style={{ width: '100%', padding: '6px 10px' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '3px', fontWeight: '700' }}>৫. পরিমাণ (Quantity)</label>
                  <input type="number" required min="1" value={newTransferForm.quantity} onChange={e => setNewTransferForm({ ...newTransferForm, quantity: e.target.value })} className="input-field" style={{ width: '100%', padding: '6px 10px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '3px', fontWeight: '700' }}>৬. পাঠিয়েছেন (Dispatched By)</label>
                  <input required value={newTransferForm.dispatched_by} onChange={e => setNewTransferForm({ ...newTransferForm, dispatched_by: e.target.value })} className="input-field" style={{ width: '100%', padding: '6px 10px' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '3px', fontWeight: '700' }}>৭. ট্রান্সফার অবস্থা (Status - 6 Stages)</label>
                <select value={newTransferForm.transfer_status} onChange={e => setNewTransferForm({ ...newTransferForm, transfer_status: e.target.value })} className="input-field" style={{ width: '100%', padding: '6px 10px', fontWeight: '800' }}>
                  <option value="খসড়া">১. খসড়া (Draft)</option>
                  <option value="অনুমোদনের অপেক্ষায়">২. অনুমোদনের অপেক্ষায় (Pending Approval)</option>
                  <option value="পাঠানো হয়েছে">৩. পাঠানো হয়েছে (Dispatched)</option>
                  <option value="আংশিক গ্রহণ">৪. আংশিক গ্রহণ (Partially Received)</option>
                  <option value="সম্পূর্ণ গ্রহণ">৫. সম্পূর্ণ গ্রহণ (Fully Received)</option>
                  <option value="বাতিল">৬. বাতিল (Cancelled)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '3px', fontWeight: '700' }}>৮. নোট ও অনুমোদনের কারণ</label>
                <textarea rows={2} value={newTransferForm.notes} onChange={e => setNewTransferForm({ ...newTransferForm, notes: e.target.value })} className="input-field" style={{ width: '100%', padding: '6px 10px' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowTransferModal(false)} className="btn btn-secondary press-scale">বাতিল</button>
                <button type="submit" className="btn btn-primary press-scale" style={{ background: '#3b82f6', borderColor: '#3b82f6' }}>ট্রান্সফার চালান ইস্যু করুন</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: ADD SALES RETURN */}
      {/* ============================================================== */}
      {showReturnModal && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content glass-card" style={{ maxWidth: '480px', width: '95%', padding: '1.5rem', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RotateCcw size={18} color="#f59e0b" />
                <span>বিক্রয় ফেরত ও ক্যাশ রিফান্ড এন্ট্রি</span>
              </h3>
              <button onClick={() => setShowReturnModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
            </div>

            <form onSubmit={e => {
              e.preventDefault();
              const newRet = {
                returnId: `RET-2026-${Math.floor(100 + Math.random() * 900)}`,
                invoiceNo: newReturnForm.invoiceNo,
                date: new Date().toLocaleString('bn-BD'),
                patientName: newReturnForm.patientName,
                medicineName: newReturnForm.medicineName,
                batchNumber: newReturnForm.batchNumber || 'BAT-2026-01',
                returnQty: `${newReturnForm.returnQty} টি`,
                refundAmount: Number(newReturnForm.refundAmount),
                reason: newReturnForm.reason,
                status: 'অনুমোদিত ও রিফান্ডেড'
              };
              setReturnsList([newRet, ...returnsList]);
              alert(`রিটার্ন #${newRet.returnId} সফলভাবে ক্যাশ রিফান্ড ও স্টক বিপরীত সমন্বয় করা হয়েছে!`);
              setShowReturnModal(false);
            }} style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '3px', fontWeight: '700' }}>পূর্বের ইনভয়েস নং</label>
                <input required placeholder="যেমন: PH-INV-9021" value={newReturnForm.invoiceNo} onChange={e => setNewReturnForm({ ...newReturnForm, invoiceNo: e.target.value })} className="input-field" style={{ width: '100%', padding: '6px 10px' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '3px', fontWeight: '700' }}>রোগীর নাম</label>
                  <input required placeholder="যেমন: মো: রফিকুল ইসলাম" value={newReturnForm.patientName} onChange={e => setNewReturnForm({ ...newReturnForm, patientName: e.target.value })} className="input-field" style={{ width: '100%', padding: '6px 10px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '3px', fontWeight: '700' }}>ওষুধের নাম</label>
                  <input required placeholder="যেমন: Napa Extra" value={newReturnForm.medicineName} onChange={e => setNewReturnForm({ ...newReturnForm, medicineName: e.target.value })} className="input-field" style={{ width: '100%', padding: '6px 10px' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '3px', fontWeight: '700' }}>ফেরতের পরিমাণ</label>
                  <input type="number" required min="1" value={newReturnForm.returnQty} onChange={e => setNewReturnForm({ ...newReturnForm, returnQty: e.target.value })} className="input-field" style={{ width: '100%', padding: '6px 10px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '3px', fontWeight: '700' }}>রিফান্ড টাকা (৳)</label>
                  <input type="number" required value={newReturnForm.refundAmount} onChange={e => setNewReturnForm({ ...newReturnForm, refundAmount: e.target.value })} className="input-field" style={{ width: '100%', padding: '6px 10px' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '3px', fontWeight: '700' }}>ফেরতের কারণ</label>
                <input value={newReturnForm.reason} onChange={e => setNewReturnForm({ ...newReturnForm, reason: e.target.value })} className="input-field" style={{ width: '100%', padding: '6px 10px' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowReturnModal(false)} className="btn btn-secondary press-scale">বাতিল</button>
                <button type="submit" className="btn btn-primary press-scale" style={{ background: '#f59e0b', borderColor: '#f59e0b' }}>রিফান্ড ও স্টক ফেরত দিন</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: INVOICE RECEIPT VIEW & PRINT */}
      {/* ============================================================== */}
      {viewingReceipt && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content glass-card" style={{ maxWidth: '440px', width: '95%', padding: '1.5rem', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Printer size={18} color="#10b981" />
                <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>ফার্মেসি ক্যাশ মেমো</strong>
              </div>
              <button onClick={() => setViewingReceipt(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
            </div>

            <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', fontSize: '0.78rem' }}>
              <div style={{ textAlign: 'center', borderBottom: '1px dashed var(--border-color)', paddingBottom: '8px', marginBottom: '8px' }}>
                <strong style={{ fontSize: '0.95rem', display: 'block' }}>HisabKitab 360° Healthcare</strong>
                <span style={{ color: 'var(--text-muted)' }}>{viewingReceipt.branch}</span>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>ক্যাশ মেমো নং: {viewingReceipt.sale_id}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>তারিখ: {viewingReceipt.date}</div>
              </div>

              <div style={{ borderBottom: '1px dashed var(--border-color)', paddingBottom: '6px', marginBottom: '8px' }}>
                <div>ক্রেতা: <strong>{viewingReceipt.patient?.name || 'Walk-in'}</strong></div>
                {viewingReceipt.prescription_ref && (
                  <div style={{ color: 'var(--text-muted)' }}>প্রেসক্রিপশন: {viewingReceipt.prescription_ref}</div>
                )}
                <div style={{ color: 'var(--text-muted)' }}>বিক্রেতা: {viewingReceipt.seller}</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderBottom: '1px dashed var(--border-color)', paddingBottom: '8px', marginBottom: '8px' }}>
                {(viewingReceipt.items || []).map((it, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{it.brand_name} ({it.unitType}) x {it.qty}</span>
                    <strong>৳{it.unitPrice * it.qty}</strong>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>সাবটোটাল:</span>
                  <strong>৳{viewingReceipt.subtotal}</strong>
                </div>
                {viewingReceipt.discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981' }}>
                    <span>ছাড় (Discount):</span>
                    <strong>-৳{viewingReceipt.discount}</strong>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: '900', color: '#10b981', paddingTop: '4px' }}>
                  <span>মোট আদায়:</span>
                  <span>৳{viewingReceipt.netPayable}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                  <span>পদ্ধতি: {viewingReceipt.paymentMethod}</span>
                  <span>পরিশোধিত: ৳{viewingReceipt.paidAmount}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
              <button
                type="button"
                onClick={() => window.print()}
                className="btn btn-primary press-scale"
                style={{ flex: 1, background: '#10b981', borderColor: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Printer size={15} />
                <span>প্রিন্ট মেমো</span>
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

    </div>
  );
}
