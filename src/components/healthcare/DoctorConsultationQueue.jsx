import React, { useState } from 'react';
import { useHealthcare } from '../../context/HealthcareContext';
import { useApp } from '../../context/AppContext';
import {
  Stethoscope,
  Users,
  Calendar,
  Clock,
  Plus,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Printer,
  X,
  Search,
  Check,
  Activity,
  Heart,
  Pill,
  FlaskConical,
  QrCode
} from 'lucide-react';
import { printElement } from '../../services/printService';

export const DoctorConsultationQueue = () => {
  const {
    doctors,
    patients,
    appointments,
    bookAppointment,
    updateAppointmentStatus,
    createPrescription,
    diagnosticTests,
    pharmacyMedicines,
    prescriptions
  } = useHealthcare();

  const { lang, businessSettings, showToast } = useApp();

  const [selectedDoctorId, setSelectedDoctorId] = useState(doctors[0]?.doctor_id || '');
  const [activeConsultationAppointment, setActiveConsultationAppointment] = useState(null);
  const [showBookAppointmentModal, setShowBookAppointmentModal] = useState(false);
  const [viewingPrescription, setViewingPrescription] = useState(null);

  // Booking Form State
  const [bookForm, setBookForm] = useState({
    patient_id: '',
    appointment_date: new Date().toISOString().split('T')[0],
    appointment_time: '17:30',
    visit_type: 'New patient',
    consultation_fee: 1000,
    paid_amount: 1000,
    notes: ''
  });

  // Digital Prescription Form State
  const [rxForm, setRxForm] = useState({
    chief_complaint: '',
    vitals: {
      bp_systolic: 120,
      bp_diastolic: 80,
      pulse: 72,
      temp: '98.4°F',
      weight_kg: 65,
      height_cm: 165,
      blood_glucose: ''
    },
    provisional_diagnosis: '',
    medicines: [
      {
        medicine_id: 'MED-001',
        brand_name: 'Napa Extra',
        generic_name: 'Paracetamol',
        strength: '500mg+65mg',
        dose: '1 Tablet',
        frequency: '1+0+1',
        timing: 'খাবারের পর (After food)',
        duration: '5 Days',
        quantity: 10,
        special_instruction: 'জ্বর বা ব্যথা হলে খাবেন।'
      }
    ],
    test_advice: [],
    advice: 'পর্যাপ্ত পানি পান করুন ও বিশ্রাম নিন।',
    follow_up_date: ''
  });

  const selectedDoctor = doctors.find(d => d.doctor_id === selectedDoctorId) || doctors[0];
  const doctorAppointments = appointments.filter(a => a.doctor_id === selectedDoctorId);

  // Add Medicine row to Rx builder
  const handleAddMedicineRow = () => {
    setRxForm(prev => ({
      ...prev,
      medicines: [
        ...prev.medicines,
        {
          medicine_id: '',
          brand_name: '',
          generic_name: '',
          strength: '',
          dose: '1 Tablet',
          frequency: '1+0+1',
          timing: 'খাবারের পর (After food)',
          duration: '7 Days',
          quantity: 14,
          special_instruction: ''
        }
      ]
    }));
  };

  const handleMedicineChange = (idx, field, value) => {
    setRxForm(prev => {
      const updated = [...prev.medicines];
      updated[idx] = { ...updated[idx], [field]: value };

      // If medicine brand changed, auto-fill generic & strength
      if (field === 'brand_name') {
        const found = pharmacyMedicines.find(m => m.brand_name.toLowerCase() === value.toLowerCase());
        if (found) {
          updated[idx].medicine_id = found.medicine_id;
          updated[idx].generic_name = found.generic_name;
          updated[idx].strength = found.strength;
        }
      }
      return { ...prev, medicines: updated };
    });
  };

  const handleRemoveMedicineRow = (idx) => {
    setRxForm(prev => ({
      ...prev,
      medicines: prev.medicines.filter((_, i) => i !== idx)
    }));
  };

  // Toggle Test Advice
  const handleToggleTestAdvice = (testName) => {
    setRxForm(prev => {
      const exists = prev.test_advice.includes(testName);
      return {
        ...prev,
        test_advice: exists
          ? prev.test_advice.filter(t => t !== testName)
          : [...prev.test_advice, testName]
      };
    });
  };

  // Start Consultation
  const handleStartConsultation = (appointment) => {
    setActiveConsultationAppointment(appointment);
    updateAppointmentStatus(appointment.appointment_id, 'In Consultation');
  };

  // Sign & Complete Digital Prescription
  const handleSignPrescription = (e) => {
    e.preventDefault();
    if (!activeConsultationAppointment) return;

    const patient = patients.find(p => p.patient_id === activeConsultationAppointment.patient_id);

    const newPrescription = createPrescription({
      appointment_id: activeConsultationAppointment.appointment_id,
      doctor_id: selectedDoctor.doctor_id,
      doctor_name: selectedDoctor.doctor_name,
      doctor_degree: selectedDoctor.degree,
      BMDC_number: selectedDoctor.BMDC_registration_number,
      patient_id: patient?.patient_id || activeConsultationAppointment.patient_id,
      patient_name: patient?.full_name || activeConsultationAppointment.patient_name,
      age: `${patient?.calculated_age || 35}Y`,
      gender: patient?.gender || 'Male',
      ...rxForm
    });

    showToast(lang === 'bn' ? `প্রেসক্রিপশন #${newPrescription.prescription_id} সফলভাবে তৈরি ও সাইন করা হয়েছে!` : 'Prescription signed and issued!', 'success');
    setViewingPrescription(newPrescription);
    setActiveConsultationAppointment(null);
  };

  // Submit New Appointment
  const handleBookAppointment = (e) => {
    e.preventDefault();
    const patient = patients.find(p => p.patient_id === bookForm.patient_id);
    if (!patient) {
      showToast(lang === 'bn' ? 'রোগী নির্বাচন করুন' : 'Select a patient', 'warning');
      return;
    }

    const newApt = bookAppointment({
      ...bookForm,
      doctor_id: selectedDoctor.doctor_id,
      doctor_name: selectedDoctor.doctor_name,
      patient_name: patient.full_name,
      patient_phone: patient.mobile_number
    });

    showToast(lang === 'bn' ? `টোকেন ${newApt.token_number} অ্যাপয়েন্টমেন্ট সফল!` : `Appointment booked: ${newApt.token_number}`, 'success');
    setShowBookAppointmentModal(false);
  };

  return (
    <div className="animate-fade-in">
      {/* Header and Doctor Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Stethoscope size={22} style={{ color: '#8b5cf6' }} />
            <span>{lang === 'bn' ? 'ডাক্তার কনসালটেশন ও ডিজিটাল প্রেসক্রিপশন' : 'Doctor Consultation & Digital Rx'}</span>
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {lang === 'bn' ? 'লাইভ টোকেন কিউ, ভাইটাল সাইন, বিএমডিসি ভেরিফাইড প্রেসক্রিপশন ও কিউআর কোড' : 'Live patient queue, vitals, BMDC certified Rx & automated pharmacy queue'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Doctor Switcher Dropdown */}
          <select
            className="input-field"
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            style={{ fontWeight: '700', padding: '6px 12px', fontSize: '0.85rem' }}
          >
            {doctors.map(d => (
              <option key={d.doctor_id} value={d.doctor_id}>
                👨‍⚕️ {d.doctor_name} ({d.specialization.split(' ')[0]})
              </option>
            ))}
          </select>

          <button className="btn btn-primary" onClick={() => setShowBookAppointmentModal(true)}>
            <Plus size={16} />
            <span>{lang === 'bn' ? 'নতুন অ্যাপয়েন্টমেন্ট বুকিং' : 'Book Appointment'}</span>
          </button>
        </div>
      </div>

      {/* DOCTOR INFO BAR */}
      <div className="glass-card" style={{ padding: '0.85rem 1.25rem', marginBottom: '1.25rem', borderLeft: '4px solid #8b5cf6' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>
              {selectedDoctor.doctor_name}
            </h3>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {selectedDoctor.degree} | <strong>বিএমডিসি রেজিঃ #{selectedDoctor.BMDC_registration_number}</strong>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>চেম্বার: </span>
              <strong>{selectedDoctor.chamber_name}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>ফি: </span>
              <strong style={{ color: '#10b981' }}>৳{selectedDoctor.new_consultation_fee}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>সময়: </span>
              <strong>{selectedDoctor.visiting_hours}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN TWO COLUMN LAYOUT: QUEUE on LEFT, CONSULTATION BUILDER on RIGHT */}
      <div style={{ display: 'grid', gridTemplateColumns: activeConsultationAppointment ? '360px 1fr' : '1fr', gap: '16px' }}>
        {/* LEFT COLUMN: APPOINTMENT TOKEN QUEUE */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={16} style={{ color: '#8b5cf6' }} />
              <strong style={{ fontSize: '0.9rem' }}>{lang === 'bn' ? 'আজকের রোগীর তালিকা ও টোকেন' : 'Today Token Queue'}</strong>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{doctorAppointments.length} জন</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {doctorAppointments.map((apt) => {
              const patient = patients.find(p => p.patient_id === apt.patient_id);
              const isCurrent = activeConsultationAppointment?.appointment_id === apt.appointment_id;

              return (
                <div
                  key={apt.appointment_id}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: isCurrent ? '2px solid #8b5cf6' : '1px solid var(--border-color)',
                    background: isCurrent ? 'rgba(139, 92, 246, 0.08)' : 'var(--bg-primary)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '900', color: '#8b5cf6', background: 'rgba(139, 92, 246, 0.15)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.8rem' }}>
                      {apt.token_number}
                    </span>
                    <span className="badge" style={{ fontSize: '0.68rem', background: apt.appointment_status === 'Completed' ? 'rgba(16, 185, 129, 0.15)' : apt.appointment_status === 'In Consultation' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: apt.appointment_status === 'Completed' ? '#10b981' : apt.appointment_status === 'In Consultation' ? '#3b82f6' : '#f59e0b' }}>
                      {apt.appointment_status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.88rem' }}>{apt.patient_name}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        {patient ? `${patient.calculated_age} বছর | ${patient.gender}` : 'সাধারণ রোগী'}
                      </div>
                    </div>
                    {patient?.allergy_note && (
                      <span title={patient.allergy_note} style={{ fontSize: '0.68rem', color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '2px 6px', borderRadius: '4px', fontWeight: '800' }}>
                        ⚠️ অ্যালার্জি
                      </span>
                    )}
                  </div>

                  {apt.appointment_status !== 'Completed' && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => handleStartConsultation(apt)}
                      style={{ padding: '5px 10px', fontSize: '0.75rem', marginTop: '4px', background: isCurrent ? '#10b981' : '#8b5cf6', borderColor: isCurrent ? '#10b981' : '#8b5cf6' }}
                    >
                      <Stethoscope size={13} />
                      <span>{isCurrent ? 'কনসালটেশন চলছে...' : 'কনসালটেশন শুরু করুন'}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVE CONSULTATION & PRESCRIPTION BUILDER */}
        {activeConsultationAppointment && (
          <div className="glass-card animate-fade-in" style={{ borderTop: '4px solid #10b981' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800' }}>
                  প্রেসক্রিপশন প্রস্তুতকরণ: {activeConsultationAppointment.patient_name}
                </h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  টোকেন: {activeConsultationAppointment.token_number} | পেশেন্ট আইডি: {activeConsultationAppointment.patient_id}
                </div>
              </div>
              <button className="btn-icon" onClick={() => setActiveConsultationAppointment(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSignPrescription}>
              {/* Vitals Signs Strip */}
              <div style={{ background: 'var(--bg-primary)', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                <strong style={{ display: 'block', fontSize: '0.8rem', color: '#10b981', marginBottom: '6px' }}>
                  📊 ভাইটাল সাইন ও শারীরিক মাপজোখ (Vitals)
                </strong>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>রক্তচাপ (BP)</label>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <input
                        type="number"
                        className="input-field"
                        style={{ padding: '4px 6px', fontSize: '0.8rem' }}
                        value={rxForm.vitals.bp_systolic}
                        onChange={(e) => setRxForm(prev => ({ ...prev, vitals: { ...prev.vitals, bp_systolic: e.target.value } }))}
                        placeholder="Sys"
                      />
                      <span>/</span>
                      <input
                        type="number"
                        className="input-field"
                        style={{ padding: '4px 6px', fontSize: '0.8rem' }}
                        value={rxForm.vitals.bp_diastolic}
                        onChange={(e) => setRxForm(prev => ({ ...prev, vitals: { ...prev.vitals, bp_diastolic: e.target.value } }))}
                        placeholder="Dia"
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>পালস (Pulse bpm)</label>
                    <input
                      type="number"
                      className="input-field"
                      style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                      value={rxForm.vitals.pulse}
                      onChange={(e) => setRxForm(prev => ({ ...prev, vitals: { ...prev.vitals, pulse: e.target.value } }))}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>ওজন (Weight kg)</label>
                    <input
                      type="number"
                      className="input-field"
                      style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                      value={rxForm.vitals.weight_kg}
                      onChange={(e) => setRxForm(prev => ({ ...prev, vitals: { ...prev.vitals, weight_kg: e.target.value } }))}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>তাপমাত্রা (Temp)</label>
                    <input
                      type="text"
                      className="input-field"
                      style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                      value={rxForm.vitals.temp}
                      onChange={(e) => setRxForm(prev => ({ ...prev, vitals: { ...prev.vitals, temp: e.target.value } }))}
                    />
                  </div>
                </div>
              </div>

              {/* Chief Complaint & Provisional Diagnosis */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '4px' }}>
                    প্রধান সমস্যা ও লক্ষণ (Chief Complaint)
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={rxForm.chief_complaint}
                    onChange={(e) => setRxForm(prev => ({ ...prev, chief_complaint: e.target.value }))}
                    placeholder="যেমন: ৩ দিন যাবত তীব্র জ্বর ও কফ..."
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '4px' }}>
                    সম্ভাব্য রোগ নির্ণয় (Provisional Diagnosis)
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={rxForm.provisional_diagnosis}
                    onChange={(e) => setRxForm(prev => ({ ...prev, provisional_diagnosis: e.target.value }))}
                    placeholder="যেমন: Acute Upper Respiratory Tract Infection"
                  />
                </div>
              </div>

              {/* Medicine Builder (Rx) */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <strong style={{ fontSize: '0.85rem', color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Pill size={16} />
                    <span>ওষুধের ফর্দ (Rx Medicines)</span>
                  </strong>
                  <button type="button" className="btn btn-secondary" onClick={handleAddMedicineRow} style={{ padding: '3px 8px', fontSize: '0.75rem' }}>
                    + ওষুধ যোগ করুন
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {rxForm.medicines.map((med, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 2fr 30px', gap: '6px', alignItems: 'center', background: 'var(--bg-primary)', padding: '6px 8px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <input
                        type="text"
                        placeholder="ব্র্যান্ডের নাম (e.g. Napa Extra)"
                        className="input-field"
                        style={{ padding: '4px 6px', fontSize: '0.8rem' }}
                        value={med.brand_name}
                        onChange={(e) => handleMedicineChange(idx, 'brand_name', e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="ডোজ (1 Tab)"
                        className="input-field"
                        style={{ padding: '4px 6px', fontSize: '0.8rem' }}
                        value={med.dose}
                        onChange={(e) => handleMedicineChange(idx, 'dose', e.target.value)}
                      />
                      <select
                        className="input-field"
                        style={{ padding: '4px 6px', fontSize: '0.78rem' }}
                        value={med.frequency}
                        onChange={(e) => handleMedicineChange(idx, 'frequency', e.target.value)}
                      >
                        <option value="1+0+0">১+০+০ (সকাল)</option>
                        <option value="1+0+1">১+০+১ (সকাল-রাত)</option>
                        <option value="1+1+1">১+১+১ (৩ বার)</option>
                        <option value="0+0+1">০+০+১ (রাত)</option>
                        <option value="1+1+1+1">৪ বার</option>
                        <option value="PRN">প্রয়োজনে (PRN)</option>
                      </select>
                      <input
                        type="text"
                        placeholder="মেয়াদ (e.g. 7 Days)"
                        className="input-field"
                        style={{ padding: '4px 6px', fontSize: '0.8rem' }}
                        value={med.duration}
                        onChange={(e) => handleMedicineChange(idx, 'duration', e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="খাওয়ার নিয়ম (e.g. খাবারের পর)"
                        className="input-field"
                        style={{ padding: '4px 6px', fontSize: '0.8rem' }}
                        value={med.special_instruction}
                        onChange={(e) => handleMedicineChange(idx, 'special_instruction', e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveMedicineRow(idx)}
                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                        title="মুছুন"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Diagnostic Test Advice Selection */}
              <div style={{ marginBottom: '1rem' }}>
                <strong style={{ display: 'block', fontSize: '0.82rem', color: '#f59e0b', marginBottom: '6px' }}>
                  🔬 প্রয়োজনীয় ল্যাব টেস্ট উপদেশ (Test Advice)
                </strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {diagnosticTests.map(t => {
                    const isSelected = rxForm.test_advice.includes(t.test_name_english);
                    return (
                      <button
                        type="button"
                        key={t.test_id}
                        onClick={() => handleToggleTestAdvice(t.test_name_english)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '16px',
                          fontSize: '0.74rem',
                          fontWeight: '700',
                          border: isSelected ? '1px solid #f59e0b' : '1px solid var(--border-color)',
                          background: isSelected ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-primary)',
                          color: isSelected ? '#f59e0b' : 'var(--text-muted)',
                          cursor: 'pointer'
                        }}
                      >
                        {isSelected ? '✓ ' : '+ '}{t.test_code}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* General Advice & Follow-up Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '4px' }}>
                    সাধারণ উপদেশ (Advice)
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={rxForm.advice}
                    onChange={(e) => setRxForm(prev => ({ ...prev, advice: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '4px' }}>
                    পরবর্তী সাক্ষাতের তারিখ (Follow-up)
                  </label>
                  <input
                    type="date"
                    className="input-field"
                    value={rxForm.follow_up_date}
                    onChange={(e) => setRxForm(prev => ({ ...prev, follow_up_date: e.target.value }))}
                  />
                </div>
              </div>

              {/* Bottom Submit */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setActiveConsultationAppointment(null)}>
                  বন্ধ করুন
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: '#10b981', borderColor: '#10b981', fontWeight: '800' }}>
                  <CheckCircle2 size={16} />
                  <span>প্রেসক্রিপশন সাইন করুন ও ইস্যু করুন</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* BOOK APPOINTMENT MODAL */}
      {showBookAppointmentModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px', width: '95%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800' }}>
                ডাক্তার অ্যাপয়েন্টমেন্ট বুকিং
              </h3>
              <button className="btn-icon" onClick={() => setShowBookAppointmentModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleBookAppointment}>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '4px' }}>
                  রোগী নির্বাচন করুন *
                </label>
                <select
                  required
                  className="input-field"
                  value={bookForm.patient_id}
                  onChange={(e) => setBookForm(prev => ({ ...prev, patient_id: e.target.value }))}
                >
                  <option value="">-- রোগী নির্বাচন করুন --</option>
                  {patients.map(p => (
                    <option key={p.patient_id} value={p.patient_id}>
                      {p.patient_id} - {p.full_name} ({p.mobile_number})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '4px' }}>তারিখ</label>
                  <input
                    type="date"
                    className="input-field"
                    value={bookForm.appointment_date}
                    onChange={(e) => setBookForm(prev => ({ ...prev, appointment_date: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '4px' }}>সময়</label>
                  <input
                    type="time"
                    className="input-field"
                    value={bookForm.appointment_time}
                    onChange={(e) => setBookForm(prev => ({ ...prev, appointment_time: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '4px' }}>কনসালটেশন ফি</label>
                  <input
                    type="number"
                    className="input-field"
                    value={bookForm.consultation_fee}
                    onChange={(e) => setBookForm(prev => ({ ...prev, consultation_fee: Number(e.target.value), paid_amount: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '4px' }}>পরিশোধিত টাকা</label>
                  <input
                    type="number"
                    className="input-field"
                    value={bookForm.paid_amount}
                    onChange={(e) => setBookForm(prev => ({ ...prev, paid_amount: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowBookAppointmentModal(false)}>
                  বাতিল
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: '#8b5cf6', borderColor: '#8b5cf6' }}>
                  টোকেন কনফার্ম করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE DIGITAL PRESCRIPTION MODAL */}
      {viewingPrescription && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '680px', width: '95%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }} className="no-print">
              <span className="badge badge-success">✓ প্রেসক্রিপশন সফলভাবে সাইন করা হয়েছে</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-primary"
                  onClick={() => printElement('printable-digital-rx', { title: `Rx-${viewingPrescription.prescription_id}`, paperType: 'a4' })}
                >
                  <Printer size={16} />
                  <span>প্রিন্ট করুন (A4)</span>
                </button>
                <button className="btn btn-secondary" onClick={() => setViewingPrescription(null)}>
                  বন্ধ করুন
                </button>
              </div>
            </div>

            {/* A4 PRINTABLE RX CONTAINER */}
            <div
              id="printable-digital-rx"
              style={{
                background: '#ffffff',
                color: '#0f172a',
                padding: '2rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontFamily: "'Segoe UI', Tahoma, sans-serif",
                lineHeight: 1.5
              }}
            >
              {/* Doctor Letterhead Header */}
              <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: '10px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#1e3a8a' }}>
                    {viewingPrescription.doctor_name}
                  </h2>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>
                    {viewingPrescription.doctor_degree}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    BMDC Reg. No: <strong>{viewingPrescription.BMDC_number}</strong>
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '11px', color: '#475569' }}>
                  <div style={{ fontWeight: '800', fontSize: '14px', color: '#0f172a' }}>{businessSettings.companyName || 'হিসাব কিতাব হেলথকেয়ার'}</div>
                  <div>📞 {businessSettings.phone || '01700000000'}</div>
                  <div style={{ fontFamily: 'monospace', color: '#3b82f6', fontWeight: '700' }}>#{viewingPrescription.prescription_id}</div>
                </div>
              </div>

              {/* Patient Bar */}
              <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', display: 'flex', justifyContent: 'space-between', marginBottom: '12px', border: '1px solid #e2e8f0' }}>
                <div><strong>রোগী:</strong> {viewingPrescription.patient_name} ({viewingPrescription.age}, {viewingPrescription.gender})</div>
                <div><strong>পেশেন্ট আইডি:</strong> {viewingPrescription.patient_id}</div>
                <div><strong>তারিখ:</strong> {viewingPrescription.date}</div>
              </div>

              {/* Vitals & Diagnosis */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', color: '#334155', borderRight: '1px dashed #cbd5e1', paddingRight: '12px' }}>
                  <strong style={{ color: '#0f172a', display: 'block', marginBottom: '4px' }}>Vitals:</strong>
                  <div>BP: {viewingPrescription.vitals?.bp_systolic}/{viewingPrescription.vitals?.bp_diastolic} mmHg</div>
                  <div>Pulse: {viewingPrescription.vitals?.pulse} bpm</div>
                  <div>Temp: {viewingPrescription.vitals?.temp}</div>
                  <div>Weight: {viewingPrescription.vitals?.weight_kg} kg</div>
                  {viewingPrescription.chief_complaint && (
                    <div style={{ marginTop: '8px' }}>
                      <strong>C/C:</strong> {viewingPrescription.chief_complaint}
                    </div>
                  )}
                </div>

                <div>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>
                    Diagnosis: {viewingPrescription.provisional_diagnosis || 'Clinical evaluation'}
                  </div>
                  {viewingPrescription.test_advice?.length > 0 && (
                    <div style={{ fontSize: '11px', marginTop: '6px' }}>
                      <strong style={{ color: '#b45309' }}>Investigate:</strong> {viewingPrescription.test_advice.join(', ')}
                    </div>
                  )}
                </div>
              </div>

              {/* Rx Symbol & Medicines */}
              <div style={{ minHeight: '200px' }}>
                <div style={{ fontSize: '24px', fontWeight: '900', color: '#1e3a8a', fontFamily: 'serif', marginBottom: '8px' }}>
                  ℞
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingLeft: '8px' }}>
                  {viewingPrescription.medicines?.map((m, idx) => (
                    <div key={idx} style={{ fontSize: '12px' }}>
                      <div style={{ fontWeight: '700', color: '#0f172a' }}>
                        {idx + 1}. {m.brand_name} {m.strength && `(${m.strength})`}
                      </div>
                      <div style={{ color: '#475569', fontSize: '11px', marginLeft: '14px' }}>
                        {m.dose} --- {m.frequency} --- {m.duration} ({m.timing})
                        {m.special_instruction && ` [${m.special_instruction}]`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Advice & Footer */}
              <div style={{ marginTop: '20px', paddingTop: '10px', borderTop: '1px solid #e2e8f0', fontSize: '11px', color: '#334155' }}>
                {viewingPrescription.advice && (
                  <div><strong>উপদেশ:</strong> {viewingPrescription.advice}</div>
                )}
                {viewingPrescription.follow_up_date && (
                  <div style={{ marginTop: '4px' }}><strong>পরবর্তী সাক্ষাত:</strong> {viewingPrescription.follow_up_date}</div>
                )}
              </div>

              {/* Signature Line */}
              <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div style={{ fontSize: '9px', color: '#94a3b8' }}>
                  QR Certified Digital Prescription | HisabKitab 360 Healthcare
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ borderTop: '1px dotted #000000', width: '150px', paddingTop: '4px', fontSize: '11px', fontWeight: '700' }}>
                    {viewingPrescription.doctor_name}
                  </div>
                  <div style={{ fontSize: '9px', color: '#64748b' }}>Authorized Signature</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
