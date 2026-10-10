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
  X
} from 'lucide-react';

export default function PharmacyFEFOManager() {
  const {
    pharmacyMedicines = [],
    patients = [],
    prescriptions = [],
    dispensePharmacyMedicine,
    updatePrescriptionDispensingStatus
  } = useHealthcare();

  const [activeTab, setActiveTab] = useState('pos'); // 'pos' | 'prescriptions' | 'inventory' | 'alerts'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [cart, setCart] = useState([]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [lastInvoice, setLastInvoice] = useState(null);
  const [activePrescriptionId, setActivePrescriptionId] = useState(null);

  // Selected patient details for allergy check
  const selectedPatient = useMemo(() => {
    return patients.find(p => p.patient_id === selectedPatientId);
  }, [patients, selectedPatientId]);

  // Filtered medicines
  const filteredMedicines = useMemo(() => {
    return pharmacyMedicines.filter(med => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        (med.brand_name || '').toLowerCase().includes(q) ||
        (med.generic_name || '').toLowerCase().includes(q) ||
        (med.barcode || '').includes(searchTerm) ||
        (med.manufacturer || '').toLowerCase().includes(q);
      const matchesCategory = selectedCategory === 'All' || med.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [pharmacyMedicines, searchTerm, selectedCategory]);

  // Categories
  const categories = useMemo(() => {
    const set = new Set(pharmacyMedicines.map(m => m.category).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [pharmacyMedicines]);

  // Get FEFO sorted batches for a medicine
  const getFefoBatches = (med) => {
    return [...(med.batches || [])].sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));
  };

  // Add to cart using FEFO (earliest expiring batch with stock)
  const addToCart = (medicine, preferredBatchNumber = null, unitType = 'strip') => {
    // Check allergy
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

    const fefoBatches = getFefoBatches(medicine).filter(b => (b.stock_tablets || 0) > 0);
    if (fefoBatches.length === 0) {
      alert(`⚠️ '${medicine.brand_name}' এর কোনো সক্রিয় স্টক নেই!`);
      return;
    }

    let targetBatch = fefoBatches[0];
    if (preferredBatchNumber) {
      const found = medicine.batches.find(b => b.batch_number === preferredBatchNumber);
      if (found && found.stock_tablets > 0) targetBatch = found;
    }

    // Check if expired
    const isExpired = new Date(targetBatch.expiry_date) < new Date();
    if (isExpired) {
      alert(`❌ ব্যাচ ${targetBatch.batch_number} এর মেয়াদ উত্তীর্ণ (Expired)! এটি বিক্রয় নিষিদ্ধ।`);
      return;
    }

    // Determine unit multiplier and pricing
    const multiplier = unitType === 'box'
      ? (medicine.box_size || 10) * (medicine.strip_size || 10)
      : unitType === 'strip'
      ? (medicine.strip_size || 10)
      : 1;

    const unitPrice = unitType === 'box'
      ? medicine.box_mrp
      : unitType === 'strip'
      ? medicine.strip_mrp
      : medicine.unit_mrp;

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
            maxTablets: targetBatch.stock_tablets
          }
        ];
      }
    });
  };

  // Cart calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.unitPrice * item.qty), 0);
  }, [cart]);

  const discountAmount = Math.round((subtotal * (Number(discountPercent) || 0)) / 100);
  const netPayable = Math.max(0, subtotal - discountAmount);
  const dueAmount = Math.max(0, netPayable - (Number(paidAmount) || 0));

  // Handle Checkout
  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('কার্ট খালি! অনুগ্রহ করে ওষুধ যোগ করুন।');
      return;
    }

    const saleId = generateHealthcareId('PHARMACY_SALE');
    const invoiceData = {
      sale_id: saleId,
      date: new Date().toLocaleString('bn-BD'),
      patient: selectedPatient
        ? { id: selectedPatient.patient_id, name: selectedPatient.full_name, phone: selectedPatient.mobile_number || selectedPatient.phone || 'N/A' }
        : { name: 'সাধারণ কাস্টমার (Walk-in)', phone: 'N/A' },
      prescription_id: activePrescriptionId,
      items: [...cart],
      subtotal,
      discountAmount,
      netPayable,
      paidAmount: Number(paidAmount) || netPayable,
      dueAmount: Number(paidAmount) ? Math.max(0, netPayable - Number(paidAmount)) : 0,
      paymentMethod
    };

    // Deduct stock for each item
    cart.forEach(item => {
      const tabletsToDeduct = item.qty * item.multiplier;
      dispensePharmacyMedicine({
        medicineId: item.medicine_id,
        batchNumber: item.batch_number,
        quantityTablets: tabletsToDeduct
      });
    });

    // If linked to a prescription, mark it as dispensed
    if (activePrescriptionId) {
      updatePrescriptionDispensingStatus(activePrescriptionId, 'Fully Dispensed');
    }

    setLastInvoice(invoiceData);
    setCart([]);
    setPaidAmount('');
    setActivePrescriptionId(null);
  };

  // Load items from prescription directly to cart
  const loadPrescriptionToCart = (rx) => {
    setSelectedPatientId(rx.patient_id);
    setActivePrescriptionId(rx.prescription_id);

    (rx.medicines || []).forEach(prescribedMed => {
      const matched = pharmacyMedicines.find(m =>
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

    pharmacyMedicines.forEach(med => {
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
  }, [pharmacyMedicines]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header & Tabs */}
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem', borderRadius: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Pill size={22} />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  ফার্মেসি ও FEFO ব্যাচ ডিসপেনসিং (Pharmacy POS)
                </h1>
                <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  ফার্স্ট-এক্সপায়ারি-ফার্স্ট-আউট (FEFO) নীতি, জেনেরিক সার্চ ও ডিজিটাল প্রেসক্রিপশন বিতরণ
                </p>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="hc-subtabs-nav" style={{ padding: '4px' }}>
            <button
              onClick={() => setActiveTab('pos')}
              className={`hc-tab-btn ${activeTab === 'pos' ? 'active-emerald' : ''}`}
            >
              <ShoppingCart size={15} />
              <span>ফার্মেসি বিক্রয় (POS)</span>
            </button>
            <button
              onClick={() => setActiveTab('prescriptions')}
              className={`hc-tab-btn ${activeTab === 'prescriptions' ? 'active-emerald' : ''}`}
            >
              <FileText size={15} />
              <span>প্রেসক্রিপশন কিউ</span>
              <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: 'inherit', padding: '1px 6px', fontSize: '0.7rem' }}>
                {prescriptions.filter(p => p.dispensing_status === 'Sent to Pharmacy').length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`hc-tab-btn ${activeTab === 'inventory' ? 'active-emerald' : ''}`}
            >
              <Boxes size={15} />
              <span>ব্যাচ ইনভেন্টরি</span>
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`hc-tab-btn ${activeTab === 'alerts' ? 'active-emerald' : ''}`}
            >
              <AlertTriangle size={15} />
              <span>মেয়াদ অ্যালার্ট</span>
              {alertMedicines.length > 0 && (
                <span className="badge" style={{ background: '#ef4444', color: '#ffffff', padding: '1px 6px', fontSize: '0.7rem' }}>
                  {alertMedicines.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* POS VIEW (2-COLUMN RESPONSIVE LAYOUT) */}
      {activeTab === 'pos' && (
        <div className="hc-pharmacy-layout">
          {/* Left Column: Search, Filter, Medicine Catalog */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Search and Category Bar */}
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

            {/* Medicine Grid */}
            <div className="hc-medicine-grid">
              {filteredMedicines.map(med => {
                const totalStockTablets = (med.batches || []).reduce((sum, b) => sum + (b.stock_tablets || 0), 0);
                const totalStrips = Math.floor(totalStockTablets / (med.strip_size || 10));
                const fefoBatch = getFefoBatches(med).find(b => (b.stock_tablets || 0) > 0);

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
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <div>
                          <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', fontSize: '0.7rem', fontWeight: '700' }}>
                            {med.dosage_form || 'Tablet'}
                          </span>
                          <h3 style={{ margin: '4px 0 2px', fontSize: '0.98rem', fontWeight: '800', color: 'var(--text-main)' }}>
                            {med.brand_name}
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
                        <span>কোম্পানি: <strong style={{ color: 'var(--text-main)' }}>{med.manufacturer}</strong></span>
                        <span>স্টক: <strong style={{ color: totalStockTablets < 50 ? '#ef4444' : '#10b981' }}>
                          {totalStrips} পাতা ({totalStockTablets} টি)
                        </strong></span>
                      </div>

                      {fefoBatch && (
                        <div style={{ marginTop: '8px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '8px', padding: '6px 8px', fontSize: '0.72rem', color: '#f59e0b', display: 'flex', justifyContent: 'space-between' }}>
                          <span>FEFO ব্যাচ: <strong>{fefoBatch.batch_number}</strong></span>
                          <span>মেয়াদ: <strong>{fefoBatch.expiry_date}</strong></span>
                        </div>
                      )}
                    </div>

                    <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <div style={{ fontSize: '0.75rem' }}>
                        <div>পাতা: <strong style={{ color: 'var(--text-main)' }}>৳{med.strip_mrp}</strong></div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>পিস: ৳{med.unit_mrp}</div>
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

          {/* Right Column: Checkout Cart & Billing Panel */}
          <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '18px', position: 'sticky', top: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '12px' }}>
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShoppingCart size={18} style={{ color: '#10b981' }} />
                <span>বিক্রয় কার্ট (Checkout Cart)</span>
              </h2>
              <span className="badge" style={{ background: 'var(--bg-secondary)', color: 'var(--text-main)', fontSize: '0.72rem' }}>
                আইটেম: {cart.length}
              </span>
            </div>

            {/* Patient Selector */}
            <div style={{ marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.74rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                রোগী নির্বাচন করুন (Patient ID / Name):
              </label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="input-field"
                style={{ width: '100%', fontSize: '0.8rem' }}
              >
                <option value="">-- সাধারণ কাস্টমার (Walk-in Customer) --</option>
                {patients.map(p => (
                  <option key={p.patient_id} value={p.patient_id}>
                    {p.patient_id} - {p.full_name} ({p.mobile_number || p.phone || 'N/A'})
                  </option>
                ))}
              </select>

              {/* Patient Allergy Warning Alert */}
              {selectedPatient && (selectedPatient.allergy_note || selectedPatient.allergies) && (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.35)', borderRadius: '10px', padding: '8px 10px', fontSize: '0.74rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                  <AlertTriangle size={15} />
                  <div>
                    <strong>অ্যালার্জি সতর্কতা:</strong> {selectedPatient.allergy_note || selectedPatient.allergies}
                  </div>
                </div>
              )}

              {activePrescriptionId && (
                <div style={{ background: 'rgba(37, 99, 235, 0.1)', border: '1px solid rgba(37, 99, 235, 0.3)', borderRadius: '10px', padding: '6px 10px', fontSize: '0.74rem', color: '#2563eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                  <span>সংযুক্ত প্রেসক্রিপশন: <strong>{activePrescriptionId}</strong></span>
                  <button onClick={() => setActivePrescriptionId(null)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.72rem', fontWeight: '700' }}>রিমুভ</button>
                </div>
              )}
            </div>

            {/* Cart Items List */}
            <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '10px 0' }}>
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
                        ব্যাচ: <span style={{ fontFamily: 'var(--font-mono)' }}>{item.batch_number}</span> | মেয়াদ: {item.expiry_date}
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

            {/* Calculations & Payment */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>মোট সাব-টোটাল:</span>
                  <strong style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>৳{subtotal}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
                  <span>ডিসকাউন্ট (%):</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                    className="input-field"
                    style={{ width: '65px', padding: '3px 6px', textAlign: 'right', fontSize: '0.8rem' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '6px', marginTop: '2px' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-main)' }}>সর্বমোট প্রদেয়:</span>
                  <strong style={{ fontSize: '1.2rem', fontWeight: '900', color: '#10b981', fontFamily: 'var(--font-mono)' }}>৳{netPayable}</strong>
                </div>
              </div>

              {/* Payment Method Switcher */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                {['Cash', 'bKash', 'Nagad', 'Card'].map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    style={{
                      padding: '5px',
                      borderRadius: '8px',
                      fontSize: '0.74rem',
                      fontWeight: '700',
                      border: paymentMethod === m ? '1.5px solid #10b981' : '1px solid var(--border-color)',
                      background: paymentMethod === m ? '#10b981' : 'var(--bg-secondary)',
                      color: paymentMethod === m ? '#ffffff' : 'var(--text-main)',
                      cursor: 'pointer'
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
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
                  <span>বিল কনফার্ম</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRESCRIPTION QUEUE TAB */}
      {activeTab === 'prescriptions' && (
        <div className="glass-card" style={{ padding: '1.25rem 1.5rem', borderRadius: '18px' }}>
          <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '14px' }}>
            <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)' }}>
              ডাক্তারের ডিজিটাল প্রেসক্রিপশন কিউ (Pharmacy Dispense Queue)
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              ডাক্তারের স্বাক্ষরিত প্রেসক্রিপশন থেকে সরাসরি ওষুধ লোড করে কাউন্টারে ডিসপেন্স করুন
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
                    <span>কার্টে লোড করুন ও বিল করুন</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BATCH INVENTORY TAB */}
      {activeTab === 'inventory' && (
        <div className="glass-card" style={{ padding: '1.25rem 1.5rem', borderRadius: '18px' }}>
          <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '14px' }}>
            <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)' }}>
              ব্যাচ স্টক ও র্যাক অবস্থান (Batch Inventory & Rack Location)
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              প্রতিটি ওষুধের ব্যাচ নম্বর, মেয়াদ, খুচরা মূল্য ও স্ট্যাটাস ট্র্যাকিং
            </p>
          </div>

          <div className="hc-table-container">
            <table className="hc-data-table">
              <thead>
                <tr>
                  <th>ওষুধের নাম</th>
                  <th>জেনেরিক ও কোম্পানি</th>
                  <th>র্যাক</th>
                  <th>ব্যাচ নম্বর</th>
                  <th>মেয়াদ উত্তীর্ণ তারিখ</th>
                  <th>স্টক</th>
                  <th>মূল্য (পাতা)</th>
                  <th>স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody>
                {pharmacyMedicines.flatMap(med =>
                  (med.batches || []).map((b, idx) => {
                    const isExpired = new Date(b.expiry_date) < new Date();
                    return (
                      <tr key={`${med.medicine_id}-${idx}`}>
                        <td style={{ fontWeight: '800' }}>{med.brand_name}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{med.generic_name} ({med.manufacturer})</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{med.rack_location}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '700' }}>{b.batch_number}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{b.expiry_date}</td>
                        <td style={{ fontWeight: '800', color: isExpired ? '#ef4444' : '#10b981' }}>{b.stock_tablets} টি</td>
                        <td style={{ fontWeight: '800', color: '#10b981' }}>৳{med.strip_mrp}</td>
                        <td>
                          {isExpired ? (
                            <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontSize: '0.68rem', fontWeight: '800' }}>
                              EXPIRED
                            </span>
                          ) : (
                            <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontSize: '0.68rem', fontWeight: '800' }}>
                              AVAILABLE
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EXPIRY ALERTS TAB */}
      {activeTab === 'alerts' && (
        <div className="glass-card" style={{ padding: '1.25rem 1.5rem', borderRadius: '18px' }}>
          <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '14px' }}>
            <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)' }}>
              মেয়াদোত্তীর্ণ ও আসন্ন মেয়াদোত্তীর্ণ ওষুধ (FEFO Safety Alerts)
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              মেয়াদোত্তীর্ণ ওষুধ বিক্রয় সম্পূর্ণ নিষিদ্ধ এবং ৯০ দিনের মধ্যে মেয়াদোত্তীর্ণ ওষুধসমূহ সতর্কবার্তা
            </p>
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
                      {item.alertType === 'EXPIRED' ? 'মেয়াদোত্তীর্ণ (EXPIRED)' : `মেয়াদ আর ${item.daysLeft} দিন`}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    জেনেরিক: {item.generic_name} | কোম্পানি: {item.manufacturer}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                    ব্যাচ নম্বর: {item.batch.batch_number} | মেয়াদ: {item.batch.expiry_date} | অবশিষ্ট স্টক: {item.batch.stock_tablets} টি
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {item.alertType === 'EXPIRED' ? (
                    <button
                      type="button"
                      onClick={() => alert(`ব্যাচ ${item.batch.batch_number} কোম্পানি রিটার্ন/ডিসপোজাল রেজিস্টারে পাঠানো হয়েছে।`)}
                      className="btn btn-secondary press-scale"
                      style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)', padding: '5px 12px', fontSize: '0.75rem', fontWeight: '700' }}
                    >
                      কোম্পানি রিটার্ন করুন
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => alert(`ব্যাচ ${item.batch.batch_number} ডিসকাউন্ট ক্লিয়ারেন্সে অন্তর্ভুক্ত করা হয়েছে।`)}
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

      {/* Invoice Receipt Modal */}
      {lastInvoice && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content glass-card" style={{ maxWidth: '460px', width: '95%', padding: '1.25rem', borderRadius: '18px' }}>
            <div style={{ textAlign: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>হিসাবকিতাব ৩৬০ - হেলথকেয়ার ফার্মেসি</h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: 'var(--text-muted)' }}>ক্যাশ ইনভয়েস ও ডিসপেনসারি রসিদ</p>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: '800', color: '#10b981', fontSize: '0.8rem', marginTop: '4px' }}>
                #{lastInvoice.sale_id}
              </div>
            </div>

            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '10px' }}>
              <div>তারিখ: <strong style={{ color: 'var(--text-main)' }}>{lastInvoice.date}</strong></div>
              <div>ক্রেতা: <strong style={{ color: 'var(--text-main)' }}>{lastInvoice.patient.name}</strong> ({lastInvoice.patient.phone})</div>
              {lastInvoice.prescription_id && (
                <div>প্রেসক্রিপশন: <strong style={{ color: '#2563eb' }}>{lastInvoice.prescription_id}</strong></div>
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '8px 0', maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {lastInvoice.items.map((it, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem' }}>
                  <div>
                    <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>{it.brand_name}</span> ({it.qty} {it.unitType})
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>ব্যাচ: {it.batch_number}</div>
                  </div>
                  <strong style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>৳{it.unitPrice * it.qty}</strong>
                </div>
              ))}
            </div>

            <div style={{ padding: '8px 0', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.78rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>সাবটোটাল:</span>
                <span style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>৳{lastInvoice.subtotal}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>ডিসকাউন্ট:</span>
                <span style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>৳{lastInvoice.discountAmount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', borderTop: '1px solid var(--border-color)', paddingTop: '4px' }}>
                <span style={{ color: 'var(--text-main)' }}>মোট প্রদেয়:</span>
                <span style={{ color: '#10b981', fontFamily: 'var(--font-mono)', fontSize: '0.95rem' }}>৳{lastInvoice.netPayable}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>পরিশোধিত ({lastInvoice.paymentMethod}):</span>
                <span style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>৳{lastInvoice.paidAmount}</span>
              </div>
              {lastInvoice.dueAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444', fontWeight: '800' }}>
                  <span>বকেয়া:</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>৳{lastInvoice.dueAmount}</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => window.print()}
                className="btn btn-secondary press-scale"
                style={{ flex: 1, padding: '8px', fontSize: '0.8rem' }}
              >
                🖨️ প্রিন্ট রসিদ
              </button>
              <button
                type="button"
                onClick={() => setLastInvoice(null)}
                className="btn btn-primary press-scale"
                style={{ flex: 1, padding: '8px', fontSize: '0.8rem', background: '#10b981', borderColor: '#10b981' }}
              >
                সম্পন্ন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
