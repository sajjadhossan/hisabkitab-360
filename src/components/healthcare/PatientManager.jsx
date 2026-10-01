import React, { useState } from 'react';
import { useHealthcare } from '../../context/HealthcareContext';
import { useApp } from '../../context/AppContext';
import {
  Users,
  Search,
  Plus,
  UserCheck,
  AlertTriangle,
  Clock,
  Phone,
  Calendar,
  Heart,
  ShieldAlert,
  FileText,
  X,
  Check,
  Edit,
  Activity
} from 'lucide-react';
import { calculateAgeFromDOB } from '../../services/healthcareIdService';

export const PatientManager = () => {
  const { patients, addPatient, updatePatient, appointments, prescriptions, labOrders } = useHealthcare();
  const { lang, showToast } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatientForTimeline, setSelectedPatientForTimeline] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State for New Patient
  const [form, setForm] = useState({
    full_name: '',
    mobile_number: '',
    date_of_birth: '',
    gender: 'male',
    blood_group: 'B+',
    address: '',
    national_id: '',
    emergency_contact_name: '',
    emergency_contact_mobile: '',
    chronic_disease_note: '',
    allergy_note: '',
    outstanding_due: ''
  });

  const [duplicateWarning, setDuplicateWarning] = useState(null);

  // Search filter
  const filteredPatients = patients.filter(p => {
    const q = searchTerm.toLowerCase();
    return (
      p.full_name?.toLowerCase().includes(q) ||
      p.mobile_number?.includes(q) ||
      p.patient_id?.toLowerCase().includes(q) ||
      p.patient_code?.toLowerCase().includes(q)
    );
  });

  // Check duplicate as user types mobile number
  const handleMobileChange = (e) => {
    const phone = e.target.value;
    setForm(prev => ({ ...prev, mobile_number: phone }));
    if (phone.length >= 10) {
      const match = patients.find(p => p.mobile_number === phone);
      if (match) {
        setDuplicateWarning(`সাবধান! এই মোবাইল নম্বরে (${match.patient_id} - ${match.full_name}) পূর্বেই একজন রোগী নিবন্ধিত আছেন।`);
      } else {
        setDuplicateWarning(null);
      }
    } else {
      setDuplicateWarning(null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.mobile_number.trim()) {
      showToast(lang === 'bn' ? 'রোগীর নাম ও মোবাইল নম্বর আবশ্যক' : 'Name and mobile number are required', 'warning');
      return;
    }

    const ageCalc = calculateAgeFromDOB(form.date_of_birth);

    const res = addPatient({
      ...form,
      calculated_age: ageCalc.age,
      age_unit: ageCalc.unit
    });

    if (res.success) {
      showToast(lang === 'bn' ? `রোগী ${res.patient.patient_id} সফলভাবে নিবন্ধিত হয়েছে!` : `Patient ${res.patient.patient_id} registered!`, 'success');
      setShowAddModal(false);
      setForm({
        full_name: '',
        mobile_number: '',
        date_of_birth: '',
        gender: 'male',
        blood_group: 'B+',
        address: '',
        national_id: '',
        emergency_contact_name: '',
        emergency_contact_mobile: '',
        chronic_disease_note: '',
        allergy_note: '',
        outstanding_due: ''
      });
      setDuplicateWarning(null);
    }
  };

  // Build Patient Timeline
  const getTimelineForPatient = (patientId) => {
    const apts = appointments.filter(a => a.patient_id === patientId).map(a => ({
      type: 'appointment',
      date: a.appointment_date,
      title: `ডাক্তার অ্যাপয়েন্টমেন্ট: ${a.doctor_name}`,
      details: `টোকেন: ${a.token_number} | স্ট্যাটাস: ${a.appointment_status}`,
      color: '#8b5cf6'
    }));

    const rxs = prescriptions.filter(p => p.patient_id === patientId).map(p => ({
      type: 'prescription',
      date: p.date,
      title: `প্রেসক্রিপশন: #${p.prescription_id} (${p.doctor_name})`,
      details: `রোগ নির্ণয়: ${p.provisional_diagnosis || 'সাধারণ স্বাস্থ্য চেক'} | ওষুধ: ${p.medicines?.length || 0}টি`,
      color: '#10b981'
    }));

    const labs = labOrders.filter(l => l.patient_id === patientId).map(l => ({
      type: 'lab',
      date: l.order_date?.split(' ')[0] || '2026-10-01',
      title: `ডায়াগনস্টিক ল্যাব অর্ডার: #${l.lab_order_id}`,
      details: `টেস্ট: ${l.tests?.map(t => t.test_code).join(', ')} | অবস্থা: ${l.order_status}`,
      color: '#f59e0b'
    }));

    return [...apts, ...rxs, ...labs].sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  return (
    <div className="animate-fade-in">
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={22} style={{ color: '#3b82f6' }} />
            <span>{lang === 'bn' ? 'রোগী ও পেশেন্ট প্রোফাইল ম্যানেজমেন্ট' : 'Patient Management & CRM'}</span>
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {lang === 'bn' ? 'ইউনিক পেশেন্ট আইডি (PT-XXXXXX), লাইভ টাইমলাইন ও ডুপ্লিকেট প্রোটেকশন' : 'Universal Patient ID, medical history, allergies & timeline'}
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} />
          <span>{lang === 'bn' ? 'নতুন রোগী নিবন্ধন' : 'Register New Patient'}</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="glass-card" style={{ padding: '0.75rem 1rem', marginBottom: '1.25rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input-field"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={lang === 'bn' ? 'রোগীর নাম, মোবাইল নম্বর অথবা পেশেন্ট আইডি (যেমন: PT-000001) দিয়ে খুঁজুন...' : 'Search by name, mobile, or Patient ID...'}
            style={{ paddingLeft: '38px', width: '100%', fontSize: '0.9rem' }}
          />
        </div>
      </div>

      {/* Patients Table */}
      <div className="glass-card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>{lang === 'bn' ? 'পেশেন্ট আইডি' : 'Patient ID'}</th>
                <th>{lang === 'bn' ? 'রোগীর নাম' : 'Patient Name'}</th>
                <th>{lang === 'bn' ? 'মোবাইল নম্বর' : 'Mobile'}</th>
                <th>{lang === 'bn' ? 'বয়স ও লিঙ্গ' : 'Age & Gender'}</th>
                <th>{lang === 'bn' ? 'রক্তের গ্রুপ' : 'Blood Group'}</th>
                <th>{lang === 'bn' ? 'অ্যালার্জি ও ক্রনিক রোগ' : 'Allergies & Chronic'}</th>
                <th style={{ textAlign: 'right' }}>{lang === 'bn' ? 'বকেয়া' : 'Due'}</th>
                <th style={{ textAlign: 'center' }}>{lang === 'bn' ? 'অ্যাকশন' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient) => (
                <tr key={patient.patient_id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: '800', color: '#3b82f6', fontSize: '0.85rem' }}>
                    {patient.patient_id}
                  </td>
                  <td>
                    <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>{patient.full_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{patient.address || 'ঠিকানা দেওয়া নেই'}</div>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Phone size={12} style={{ color: 'var(--text-muted)' }} />
                      <span>{patient.mobile_number}</span>
                    </div>
                  </td>
                  <td>
                    <span>{patient.calculated_age} {patient.age_unit === 'months' ? 'মাস' : 'বছর'}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize', marginLeft: '4px' }}>
                      ({patient.gender})
                    </span>
                  </td>
                  <td>
                    <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontWeight: '800' }}>
                      {patient.blood_group}
                    </span>
                  </td>
                  <td>
                    {patient.allergy_note ? (
                      <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontSize: '0.7rem' }}>
                        ⚠️ {patient.allergy_note}
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>কোনো অ্যালার্জি নেই</span>
                    )}
                    {patient.chronic_disease_note && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {patient.chronic_disease_note}
                      </div>
                    )}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: '800', fontFamily: 'monospace', color: patient.outstanding_due > 0 ? '#ef4444' : '#10b981' }}>
                    ৳{(patient.outstanding_due || 0).toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setSelectedPatientForTimeline(patient)}
                      style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Activity size={13} />
                      <span>{lang === 'bn' ? 'মেডিকেল টাইমলাইন' : 'Timeline'}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PATIENT REGISTRATION MODAL */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '620px', width: '95%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserCheck size={20} style={{ color: '#3b82f6' }} />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800' }}>
                  {lang === 'bn' ? 'নতুন রোগী নিবন্ধন ফর্ম' : 'Register New Patient'}
                </h3>
              </div>
              <button className="btn-icon" onClick={() => setShowAddModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Duplicate Mobile Warning */}
              {duplicateWarning && (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '8px', padding: '10px', marginBottom: '1rem', color: '#ef4444', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={18} />
                  <span>{duplicateWarning}</span>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '4px' }}>
                    {lang === 'bn' ? 'রোগীর পূর্ণ নাম *' : 'Patient Full Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={form.full_name}
                    onChange={(e) => setForm(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="যেমন: আব্দুল করিম"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '4px' }}>
                    {lang === 'bn' ? 'মোবাইল নম্বর *' : 'Mobile Number *'}
                  </label>
                  <input
                    type="tel"
                    required
                    className="input-field"
                    value={form.mobile_number}
                    onChange={handleMobileChange}
                    placeholder="017xxxxxxxx"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '4px' }}>
                    {lang === 'bn' ? 'জন্ম তারিখ' : 'Date of Birth'}
                  </label>
                  <input
                    type="date"
                    className="input-field"
                    value={form.date_of_birth}
                    onChange={(e) => setForm(prev => ({ ...prev, date_of_birth: e.target.value }))}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '4px' }}>
                    {lang === 'bn' ? 'লিঙ্গ' : 'Gender'}
                  </label>
                  <select
                    className="input-field"
                    value={form.gender}
                    onChange={(e) => setForm(prev => ({ ...prev, gender: e.target.value }))}
                  >
                    <option value="male">{lang === 'bn' ? 'পুরুষ (Male)' : 'Male'}</option>
                    <option value="female">{lang === 'bn' ? 'মহিলা (Female)' : 'Female'}</option>
                    <option value="other">{lang === 'bn' ? 'অন্যান্য (Other)' : 'Other'}</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '4px' }}>
                    {lang === 'bn' ? 'রক্তের গ্রুপ' : 'Blood Group'}
                  </label>
                  <select
                    className="input-field"
                    value={form.blood_group}
                    onChange={(e) => setForm(prev => ({ ...prev, blood_group: e.target.value }))}
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '4px' }}>
                    {lang === 'bn' ? 'জাতীয় পরিচয়পত্র / জন্মনিবন্ধন' : 'National ID / NID'}
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={form.national_id}
                    onChange={(e) => setForm(prev => ({ ...prev, national_id: e.target.value }))}
                    placeholder="NID নম্বর"
                  />
                </div>
              </div>

              {/* Address */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '4px' }}>
                  {lang === 'bn' ? 'ঠিকানা' : 'Address'}
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={form.address}
                  onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="গ্রাম / এলাকা, থানা, জেলা"
                />
              </div>

              {/* Clinical Notes (Allergy & Chronic) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#f59e0b', marginBottom: '4px' }}>
                    ⚠️ {lang === 'bn' ? 'অ্যালার্জি নোট (Allergies)' : 'Allergy Warnings'}
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={form.allergy_note}
                    onChange={(e) => setForm(prev => ({ ...prev, allergy_note: e.target.value }))}
                    placeholder="যেমন: পেনিসিলিন, সালফা, ধুলাবালি"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#3b82f6', marginBottom: '4px' }}>
                    🩺 {lang === 'bn' ? 'দীর্ঘমেয়াদী রোগ (Chronic Illness)' : 'Chronic Diseases'}
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={form.chronic_disease_note}
                    onChange={(e) => setForm(prev => ({ ...prev, chronic_disease_note: e.target.value }))}
                    placeholder="যেমন: ডায়াবেটিস, উচ্চ রক্তচাপ, অ্যাজমা"
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: '#3b82f6', borderColor: '#3b82f6' }}>
                  <Check size={16} />
                  <span>{lang === 'bn' ? 'নিবন্ধন সম্পন্ন করুন' : 'Confirm Registration'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PATIENT MEDICAL TIMELINE MODAL */}
      {selectedPatientForTimeline && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px', width: '95%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800' }}>
                  {selectedPatientForTimeline.full_name}
                </h3>
                <div style={{ fontSize: '0.78rem', color: '#3b82f6', fontFamily: 'monospace' }}>
                  পেশেন্ট আইডি: #{selectedPatientForTimeline.patient_id} | রক্ত: {selectedPatientForTimeline.blood_group}
                </div>
              </div>
              <button className="btn-icon" onClick={() => setSelectedPatientForTimeline(null)}>
                <X size={18} />
              </button>
            </div>

            {/* Timeline Events */}
            <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '8px' }}>
              {getTimelineForPatient(selectedPatientForTimeline.patient_id).length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {getTimelineForPatient(selectedPatientForTimeline.patient_id).map((event, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '10px 14px',
                        background: 'var(--bg-primary)',
                        borderRadius: '10px',
                        border: '1px solid var(--border-color)',
                        borderLeft: `4px solid ${event.color}`,
                        fontSize: '0.82rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <strong style={{ color: 'var(--text-main)' }}>{event.title}</strong>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>{event.date}</span>
                      </div>
                      <div style={{ color: 'var(--text-muted)' }}>{event.details}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  কোনো অতীত মেডিকেল রেকর্ড বা প্রেসক্রিপশন ইতিহাস পাওয়া যায়নি।
                </div>
              )}
            </div>

            <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedPatientForTimeline(null)}>
                {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
