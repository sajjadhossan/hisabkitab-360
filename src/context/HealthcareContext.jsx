import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  INITIAL_PATIENTS,
  INITIAL_DOCTORS,
  INITIAL_DIAGNOSTIC_TESTS,
  INITIAL_TEST_PACKAGES,
  INITIAL_PHARMACY_MEDICINES,
  INITIAL_APPOINTMENTS,
  INITIAL_PRESCRIPTIONS,
  INITIAL_LAB_ORDERS
} from '../data/healthcareInitialData';
import {
  A_TO_Z_TEST_CATALOG,
  DISEASE_BUNDLES_CATALOG,
  DIAGNOSTIC_CATEGORIES,
  CANCER_SAFETY_DISCLAIMER
} from '../data/diagnosticCatalogData';
import {
  INITIAL_LQMS_OBJECTIVES,
  INITIAL_CONTROLLED_SOPS,
  INITIAL_INCIDENTS_LOG,
  INITIAL_CAPA_RISK_ITEMS,
  INITIAL_BIOMEDICAL_WASTE_LOG,
  INITIAL_LAB_CONSUMABLES,
  INITIAL_INSURANCE_TPA,
  INITIAL_CALL_CENTER_TICKETS,
  PRODUCTION_ACCEPTANCE_CHECKLIST
} from '../data/advancedHealthcareData';
import { generateHealthcareId, attachHealthcareMetadata } from '../services/healthcareIdService';
import { logDiagnosticEvent } from '../services/diagnosticService';

const HealthcareContext = createContext();

export const useHealthcare = () => {
  const context = useContext(HealthcareContext);
  if (!context) {
    throw new Error('useHealthcare must be used within a HealthcareProvider');
  }
  return context;
};

export const HealthcareProvider = ({ children }) => {
  // Load or fallback to initial data
  const [patients, setPatients] = useState(() => {
    try {
      const saved = localStorage.getItem('hisabkitab_hc_patients');
      return saved ? JSON.parse(saved) : INITIAL_PATIENTS;
    } catch {
      return INITIAL_PATIENTS;
    }
  });

  const [doctors, setDoctors] = useState(() => {
    try {
      const saved = localStorage.getItem('hisabkitab_hc_doctors');
      return saved ? JSON.parse(saved) : INITIAL_DOCTORS;
    } catch {
      return INITIAL_DOCTORS;
    }
  });

  const [diagnosticCategories] = useState(DIAGNOSTIC_CATEGORIES);

  const [diagnosticTests, setDiagnosticTests] = useState(() => {
    try {
      const saved = localStorage.getItem('hisabkitab_hc_tests');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.length >= A_TO_Z_TEST_CATALOG.length) return parsed;
      }
      return A_TO_Z_TEST_CATALOG;
    } catch {
      return A_TO_Z_TEST_CATALOG;
    }
  });

  const [testPackages, setTestPackages] = useState(() => {
    try {
      const saved = localStorage.getItem('hisabkitab_hc_packages');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.length >= DISEASE_BUNDLES_CATALOG.length) return parsed;
      }
      return DISEASE_BUNDLES_CATALOG;
    } catch {
      return DISEASE_BUNDLES_CATALOG;
    }
  });

  const [pharmacyMedicines, setPharmacyMedicines] = useState(() => {
    try {
      const saved = localStorage.getItem('hisabkitab_hc_medicines');
      return saved ? JSON.parse(saved) : INITIAL_PHARMACY_MEDICINES;
    } catch {
      return INITIAL_PHARMACY_MEDICINES;
    }
  });

  const [appointments, setAppointments] = useState(() => {
    try {
      const saved = localStorage.getItem('hisabkitab_hc_appointments');
      return saved ? JSON.parse(saved) : INITIAL_APPOINTMENTS;
    } catch {
      return INITIAL_APPOINTMENTS;
    }
  });

  const [prescriptions, setPrescriptions] = useState(() => {
    try {
      const saved = localStorage.getItem('hisabkitab_hc_prescriptions');
      return saved ? JSON.parse(saved) : INITIAL_PRESCRIPTIONS;
    } catch {
      return INITIAL_PRESCRIPTIONS;
    }
  });

  const [labOrders, setLabOrders] = useState(() => {
    try {
      const saved = localStorage.getItem('hisabkitab_hc_lab_orders');
      return saved ? JSON.parse(saved) : INITIAL_LAB_ORDERS;
    } catch {
      return INITIAL_LAB_ORDERS;
    }
  });

  // Section 24: Admin Approval & Advanced Compliance State
  const [isAdvancedSuiteApproved, setIsAdvancedSuiteApproved] = useState(() => {
    try {
      return localStorage.getItem('hisabkitab_hc_advanced_approved') === 'true';
    } catch {
      return false;
    }
  });

  const [approvalAudit, setApprovalAudit] = useState(() => {
    try {
      const saved = localStorage.getItem('hisabkitab_hc_approval_audit');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [lqmsObjectives, setLqmsObjectives] = useState(() => {
    try {
      const saved = localStorage.getItem('hisabkitab_hc_lqms_obj');
      return saved ? JSON.parse(saved) : INITIAL_LQMS_OBJECTIVES;
    } catch {
      return INITIAL_LQMS_OBJECTIVES;
    }
  });

  const [controlledSops, setControlledSops] = useState(() => {
    try {
      const saved = localStorage.getItem('hisabkitab_hc_sops');
      return saved ? JSON.parse(saved) : INITIAL_CONTROLLED_SOPS;
    } catch {
      return INITIAL_CONTROLLED_SOPS;
    }
  });

  const [incidentsLog, setIncidentsLog] = useState(() => {
    try {
      const saved = localStorage.getItem('hisabkitab_hc_incidents');
      return saved ? JSON.parse(saved) : INITIAL_INCIDENTS_LOG;
    } catch {
      return INITIAL_INCIDENTS_LOG;
    }
  });

  const [capaRisks, setCapaRisks] = useState(() => {
    try {
      const saved = localStorage.getItem('hisabkitab_hc_risks');
      return saved ? JSON.parse(saved) : INITIAL_CAPA_RISK_ITEMS;
    } catch {
      return INITIAL_CAPA_RISK_ITEMS;
    }
  });

  const [biomedicalWaste, setBiomedicalWaste] = useState(() => {
    try {
      const saved = localStorage.getItem('hisabkitab_hc_waste');
      return saved ? JSON.parse(saved) : INITIAL_BIOMEDICAL_WASTE_LOG;
    } catch {
      return INITIAL_BIOMEDICAL_WASTE_LOG;
    }
  });

  const [labConsumables, setLabConsumables] = useState(() => {
    try {
      const saved = localStorage.getItem('hisabkitab_hc_consumables');
      return saved ? JSON.parse(saved) : INITIAL_LAB_CONSUMABLES;
    } catch {
      return INITIAL_LAB_CONSUMABLES;
    }
  });

  const [insuranceTpa, setInsuranceTpa] = useState(() => {
    try {
      const saved = localStorage.getItem('hisabkitab_hc_insurance');
      return saved ? JSON.parse(saved) : INITIAL_INSURANCE_TPA;
    } catch {
      return INITIAL_INSURANCE_TPA;
    }
  });

  const [callCenterTickets, setCallCenterTickets] = useState(() => {
    try {
      const saved = localStorage.getItem('hisabkitab_hc_tickets');
      return saved ? JSON.parse(saved) : INITIAL_CALL_CENTER_TICKETS;
    } catch {
      return INITIAL_CALL_CENTER_TICKETS;
    }
  });

  const [acceptanceChecklist, setAcceptanceChecklist] = useState(() => {
    try {
      const saved = localStorage.getItem('hisabkitab_hc_checklist');
      return saved ? JSON.parse(saved) : PRODUCTION_ACCEPTANCE_CHECKLIST;
    } catch {
      return PRODUCTION_ACCEPTANCE_CHECKLIST;
    }
  });

  // Master Healthcare ERP Suite Admin Approval (Template Mode vs Live Mode)
  const [isHealthcareApproved, setIsHealthcareApproved] = useState(() => {
    try {
      return localStorage.getItem('hisabkitab_hc_master_approved') !== 'false';
    } catch {
      return true;
    }
  });

  const [healthcareApprovalRecord, setHealthcareApprovalRecord] = useState(() => {
    try {
      const saved = localStorage.getItem('hisabkitab_hc_master_approval_record');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Active Linked App: 'hub' (Executive Launchpad) | 'hospital' (Hospital Chamber App) | 'diagnostic' (LIMS Lab App) | 'pharmacy' (FEFO POS App)
  const [activeLinkedApp, setActiveLinkedApp] = useState('hub');

  // Global Patient Lookup Context (cross-app sync)
  const [globalSelectedPatientId, setGlobalSelectedPatientId] = useState(null);

  // 3-Pillar Healthcare Template Activation State (Hospital, Diagnostic, Pharmacy)
  const [activeModules, setActiveModules] = useState(() => {
    try {
      const saved = localStorage.getItem('hisabkitab_hc_active_modules');
      if (saved) return JSON.parse(saved);
      // Default all 3 modules to active so users can instantly use Pharmacy, Lab, and Doctor Chamber
      return { hospital: true, diagnostic: true, pharmacy: true };
    } catch {
      return { hospital: true, diagnostic: true, pharmacy: true };
    }
  });

  // Section: Institution Setup Info
  const [institutionInfo, setInstitutionInfo] = useState(() => {
    try {
      const saved = localStorage.getItem('hisabkitab_hc_institution_info');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      name: 'হেলথকেয়ার 360° হাসপাতাল ও ডায়াগনস্টিক কমপ্লেক্স',
      logo: '',
      type: 'হাসপাতাল + ডায়াগনস্টিক + ফার্মেসি',
      phone: '+৮৮০ ১৭০০-১২৩৪৫৬',
      email: 'contact@healthcare360.com.bd',
      address: 'বাড়ি ১২, রোড ৫, ধানমন্ডি, ঢাকা ১২০৫',
      country: 'বাংলাদেশ',
      timezone: 'Asia/Dhaka (GMT+6)',
      currency: 'BDT (৳)',
      defaultLanguage: 'বাংলা (Bengali)',
      receiptFooter: 'সুস্থ থাকুন, ভালো থাকুন। জরুরি প্রয়োজনে কল করুন: ১৬২৬৩। যেকোনো অভিযোগ বা পরামর্শে যোগাযোগ করুন admin@healthcare360.com.bd',
      isActive: true
    };
  });

  const updateInstitutionInfo = (newInfo) => {
    setInstitutionInfo(prev => {
      const updated = { ...prev, ...newInfo };
      localStorage.setItem('hisabkitab_hc_institution_info', JSON.stringify(updated));
      return updated;
    });
  };

  // Section 1.2: Multi-Branch & Role Permissions State
  const [branches, setBranches] = useState(() => {
    try {
      const saved = localStorage.getItem('hisabkitab_hc_branches');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      { id: 'all', name: 'সব শাখা (একীভূত রূপ)', code: 'ALL', address: 'সকল শাখা সম্মিলিত ভিউ', isAll: true, isActive: true },
      { id: 'dhanmondi', name: 'ধানমন্ডি মেইন ব্রাঞ্চ', code: 'DHD-01', phone: '০১৭৭০০০০০১০', email: 'dhanmondi@healthcare360.com', address: 'রোড ৫, ধানমন্ডি, ঢাকা', manager: 'ডা: রফিকুল ইসলাম', openTime: '08:00 AM', closeTime: '10:00 PM', holiday: 'শুক্রবার', stockLocation: 'Central-Rack-01', receiptTitle: 'হেলথকেয়ার 360° - ধানমন্ডি শাখা', isMain: true, isActive: true, transactionCount: 145 },
      { id: 'uttara', name: 'উত্তরা শাখা', code: 'UTT-02', phone: '০১৭৭০০০০০২০', email: 'uttara@healthcare360.com', address: 'সেক্টর ৩, উত্তরা, ঢাকা', manager: 'মাহমুদুল হাসান', openTime: '08:00 AM', closeTime: '10:00 PM', holiday: 'শুক্রবার', stockLocation: 'Uttara-Rack-01', receiptTitle: 'হেলথকেয়ার 360° - উত্তরা শাখা', isMain: false, isActive: true, transactionCount: 42 },
      { id: 'mirpur', name: 'মিরপুর শাখা', code: 'MIR-03', phone: '০১৭৭০০০০০৩০', email: 'mirpur@healthcare360.com', address: 'মিরপুর ১০, ঢাকা', manager: 'নাজমুল করিম', openTime: '08:00 AM', closeTime: '10:00 PM', holiday: 'শুক্রবার', stockLocation: 'Mirpur-Rack-01', receiptTitle: 'হেলথকেয়ার 360° - মিরপুর শাখা', isMain: false, isActive: true, transactionCount: 68 },
      { id: 'chattogram', name: 'চট্টগ্রাম শাখা', code: 'CTG-04', phone: '০১৭৭০০০০০৪০', email: 'ctg@healthcare360.com', address: 'জিইসি মোড়, চট্টগ্রাম', manager: 'ফারহান আহমেদ', openTime: '09:00 AM', closeTime: '09:00 PM', holiday: 'শুক্রবার', stockLocation: 'Ctg-Rack-01', receiptTitle: 'হেলথকেয়ার 360° - চট্টগ্রাম শাখা', isMain: false, isActive: false, transactionCount: 12 }
    ];
  });

  const saveBranches = (newBranches) => {
    setBranches(newBranches);
    localStorage.setItem('hisabkitab_hc_branches', JSON.stringify(newBranches));
  };

  const addBranch = (newBranch) => {
    const updated = [...branches, { ...newBranch, transactionCount: 0, isActive: true }];
    saveBranches(updated);
    return true;
  };

  const updateBranch = (id, updatedFields) => {
    const updated = branches.map(b => b.id === id ? { ...b, ...updatedFields } : b);
    saveBranches(updated);
    return true;
  };

  const toggleBranchStatus = (id) => {
    const updated = branches.map(b => b.id === id ? { ...b, isActive: !b.isActive } : b);
    saveBranches(updated);
    return true;
  };

  const [activeBranchId, setActiveBranchId] = useState(() => {
    try {
      return localStorage.getItem('hisabkitab_hc_active_branch') || 'dhanmondi';
    } catch {
      return 'dhanmondi';
    }
  });

  const [currentStaffRole, setCurrentStaffRole] = useState(() => {
    try {
      return localStorage.getItem('hisabkitab_hc_staff_role') || 'admin';
    } catch {
      return 'admin';
    }
  });

  const isAnyModuleActive = activeModules.hospital || activeModules.diagnostic || activeModules.pharmacy;

  const toggleHealthcareModule = (modKey) => {
    setActiveModules(prev => {
      const updated = { ...prev, [modKey]: !prev[modKey] };
      localStorage.setItem('hisabkitab_hc_active_modules', JSON.stringify(updated));
      const anyActive = updated.hospital || updated.diagnostic || updated.pharmacy;
      setIsHealthcareApproved(anyActive);
      localStorage.setItem('hisabkitab_hc_master_approved', anyActive ? 'true' : 'false');
      return updated;
    });
  };

  const activateAllHealthcareModules = (approvedBy = 'Super Admin', remarks = 'All 3 Healthcare modules activated.') => {
    const allActive = { hospital: true, diagnostic: true, pharmacy: true };
    setActiveModules(allActive);
    localStorage.setItem('hisabkitab_hc_active_modules', JSON.stringify(allActive));
    approveHealthcareSuite(approvedBy, 'Chief Medical & IT Operations', remarks);
  };

  const deactivateAllHealthcareModules = () => {
    const allInactive = { hospital: false, diagnostic: false, pharmacy: false };
    setActiveModules(allInactive);
    localStorage.setItem('hisabkitab_hc_active_modules', JSON.stringify(allInactive));
    revokeHealthcareSuite();
  };

  const approveHealthcareSuite = (approvedBy = 'Super Admin', designation = 'Chief Medical Operations & IT Director', remarks = 'Enterprise healthcare modules approved for live clinical operation.') => {
    const auditRecord = {
      approvedBy,
      designation,
      timestamp: new Date().toISOString(),
      remarks,
      licenseMode: 'Enterprise Clinical Multi-Tenant License',
      activatedPillars: [
        'Hospital & Doctor Chamber App',
        'Diagnostic Lab & LIMS App',
        'Pharmacy FEFO POS App'
      ],
      complianceLevel: 'DGHS / ISO 15189 Ready'
    };
    setIsHealthcareApproved(true);
    setActiveModules({ hospital: true, diagnostic: true, pharmacy: true });
    localStorage.setItem('hisabkitab_hc_active_modules', JSON.stringify({ hospital: true, diagnostic: true, pharmacy: true }));
    setHealthcareApprovalRecord(auditRecord);
    localStorage.setItem('hisabkitab_hc_master_approved', 'true');
    localStorage.setItem('hisabkitab_hc_master_approval_record', JSON.stringify(auditRecord));
    return auditRecord;
  };

  const revokeHealthcareSuite = () => {
    setIsHealthcareApproved(false);
    setActiveModules({ hospital: false, diagnostic: false, pharmacy: false });
    localStorage.setItem('hisabkitab_hc_active_modules', JSON.stringify({ hospital: false, diagnostic: false, pharmacy: false }));
    setHealthcareApprovalRecord(null);
    setActiveLinkedApp('hub');
    localStorage.removeItem('hisabkitab_hc_master_approved');
    localStorage.removeItem('hisabkitab_hc_master_approval_record');
  };

  // Active module navigation inside Healthcare Hub
  // 'dashboard' | 'patients' | 'doctor_rx' | 'lims_lab' | 'pharmacy' | 'radiology' | 'home_service' | 'compliance_suite'
  const [activeHealthcareTab, setActiveHealthcareTab] = useState('dashboard');

  // Sync to LocalStorage on updates
  useEffect(() => {
    localStorage.setItem('hisabkitab_hc_patients', JSON.stringify(patients));
  }, [patients]);

  useEffect(() => {
    localStorage.setItem('hisabkitab_hc_doctors', JSON.stringify(doctors));
  }, [doctors]);

  useEffect(() => {
    localStorage.setItem('hisabkitab_hc_tests', JSON.stringify(diagnosticTests));
  }, [diagnosticTests]);

  useEffect(() => {
    localStorage.setItem('hisabkitab_hc_packages', JSON.stringify(testPackages));
  }, [testPackages]);

  useEffect(() => {
    localStorage.setItem('hisabkitab_hc_medicines', JSON.stringify(pharmacyMedicines));
  }, [pharmacyMedicines]);

  useEffect(() => {
    localStorage.setItem('hisabkitab_hc_appointments', JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem('hisabkitab_hc_prescriptions', JSON.stringify(prescriptions));
  }, [prescriptions]);

  useEffect(() => {
    localStorage.setItem('hisabkitab_hc_lab_orders', JSON.stringify(labOrders));
  }, [labOrders]);

  // --- PATIENT MANAGEMENT ACTIONS ---
  const addPatient = (patientData) => {
    // Check duplicates by phone
    const existing = patients.find(p => p.mobile_number === patientData.mobile_number);
    const newId = generateHealthcareId('PATIENT', false);
    const newPatient = attachHealthcareMetadata({
      ...patientData,
      patient_id: newId,
      patient_code: `P-${Math.floor(1000 + Math.random() * 9000)}`,
      total_visits: 1,
      outstanding_due: Number(patientData.outstanding_due) || 0,
      patient_status: 'Active',
      consent_status: 'Accepted'
    }, { source_module: 'patient_registration' });

    setPatients(prev => [newPatient, ...prev]);
    return { success: true, patient: newPatient, duplicateWarning: Boolean(existing) };
  };

  const [patientMergeAuditLogs, setPatientMergeAuditLogs] = useState(() => {
    try {
      const saved = localStorage.getItem('hisabkitab_hc_patient_merge_logs');
      return saved ? JSON.parse(saved) : [
        {
          auditId: 'MRG-2026-001',
          sourcePatientId: 'PT-000099',
          targetPatientId: 'PT-000001',
          sourceName: 'করিম সাহেব (ডুপ্লিকেট)',
          targetName: 'আব্দুল করিম (Abdul Karim)',
          mergedBy: 'অ্যাডমিন ইউজার (সুপার অ্যাডমিন)',
          timestamp: '2026-10-09T14:30:00Z',
          reason: 'একই ব্যক্তির দুটি ফোন নম্বরে খোলা অ্যাকাউন্ট একীভূতকরণ'
        }
      ];
    } catch {
      return [];
    }
  });

  const updatePatient = (patientId, updateData) => {
    setPatients(prev => prev.map(p => {
      if (p.patient_id === patientId) {
        return attachHealthcareMetadata({ ...p, ...updateData }, { source_module: 'patient_edit' });
      }
      return p;
    }));
  };

  const mergePatients = (targetId, sourceId, reason, mergedBy = 'সুপার অ্যাডমিন') => {
    const sourcePatient = patients.find(p => p.patient_id === sourceId);
    const targetPatient = patients.find(p => p.patient_id === targetId);

    if (!sourcePatient || !targetPatient) {
      return { success: false, error: 'উৎস বা গন্তব্য রোগী খুঁজে পাওয়া যায়নি' };
    }

    // Reassign visits, prescriptions, lab orders
    setAppointments(prev => prev.map(a => a.patient_id === sourceId ? { ...a, patient_id: targetId, merged_from: sourceId } : a));
    setPrescriptions(prev => prev.map(p => p.patient_id === sourceId ? { ...p, patient_id: targetId, merged_from: sourceId } : p));
    setLabOrders(prev => prev.map(l => l.patient_id === sourceId ? { ...l, patient_id: targetId, merged_from: sourceId } : l));

    // Update patients
    setPatients(prev => prev.map(p => {
      if (p.patient_id === sourceId) {
        return {
          ...p,
          patient_status: 'একীভূত (Merged)',
          merged_into: targetId,
          active: false
        };
      }
      if (p.patient_id === targetId) {
        return {
          ...p,
          total_visits: (p.total_visits || 1) + (sourcePatient.total_visits || 1),
          outstanding_due: (Number(p.outstanding_due) || 0) + (Number(sourcePatient.outstanding_due) || 0)
        };
      }
      return p;
    }));

    const auditEntry = {
      auditId: `MRG-${Date.now()}`,
      sourcePatientId: sourceId,
      targetPatientId: targetId,
      sourceName: sourcePatient.full_name || sourceId,
      targetName: targetPatient.full_name || targetId,
      mergedBy,
      timestamp: new Date().toISOString(),
      reason: reason || 'ডুপ্লিকেট রেকর্ড একীভূতকরণ'
    };

    setPatientMergeAuditLogs(prev => {
      const updated = [auditEntry, ...prev];
      localStorage.setItem('hisabkitab_hc_patient_merge_logs', JSON.stringify(updated));
      return updated;
    });

    return { success: true, audit: auditEntry };
  };

  // --- APPOINTMENT ACTIONS ---
  const bookAppointment = (appointmentData) => {
    const newId = generateHealthcareId('APPOINTMENT');
    const doctorAppointments = appointments.filter(a => a.doctor_id === appointmentData.doctor_id && a.appointment_date === appointmentData.appointment_date);
    const tokenNumber = `TK-${String(doctorAppointments.length + 1).padStart(2, '0')}`;

    const newAppointment = attachHealthcareMetadata({
      ...appointmentData,
      appointment_id: newId,
      token_number: tokenNumber,
      appointment_status: appointmentData.appointment_status || 'Waiting',
      payment_status: appointmentData.paid_amount >= appointmentData.consultation_fee ? 'Paid' : 'Pending'
    }, { source_module: 'appointment_booking' });

    setAppointments(prev => [newAppointment, ...prev]);
    return newAppointment;
  };

  const updateAppointmentStatus = (appointmentId, status) => {
    setAppointments(prev => prev.map(a => {
      if (a.appointment_id === appointmentId) {
        return attachHealthcareMetadata({ ...a, appointment_status: status }, { source_module: 'appointment_status' });
      }
      return a;
    }));
  };

  // --- PRESCRIPTION ACTIONS ---
  const createPrescription = (rxData) => {
    const newId = generateHealthcareId('PRESCRIPTION');
    const newRx = attachHealthcareMetadata({
      ...rxData,
      prescription_id: newId,
      date: new Date().toISOString().split('T')[0],
      status: 'Signed',
      dispensing_status: 'Sent to Pharmacy'
    }, { source_module: 'digital_prescription' });

    setPrescriptions(prev => [newRx, ...prev]);

    // Update appointment status to Completed if linked
    if (rxData.appointment_id) {
      updateAppointmentStatus(rxData.appointment_id, 'Completed');
    }

    return newRx;
  };

  // --- LIMS & DIAGNOSTIC LAB ACTIONS ---
  const createLabOrder = (orderData) => {
    const newOrderId = generateHealthcareId('DIAGNOSTIC_LAB_ORDER');
    const invoiceId = generateHealthcareId('DIAGNOSTIC_INVOICE');

    const testsWithSamples = (orderData.tests || []).map(t => ({
      ...t,
      sample_id: generateHealthcareId('SAMPLE'),
      status: 'Sample Pending',
      results: {}
    }));

    const newOrder = attachHealthcareMetadata({
      ...orderData,
      lab_order_id: newOrderId,
      invoice_id: invoiceId,
      order_date: new Date().toLocaleString('bn-BD'),
      tests: testsWithSamples,
      order_status: 'Sample Pending'
    }, { source_module: 'diagnostic_billing' });

    setLabOrders(prev => [newOrder, ...prev]);
    return newOrder;
  };

  const updateLabSampleStatus = (orderId, testId, sampleStatus) => {
    setLabOrders(prev => prev.map(order => {
      if (order.lab_order_id === orderId) {
        const updatedTests = order.tests.map(t => {
          if (t.test_id === testId) {
            return { ...t, status: sampleStatus };
          }
          return t;
        });
        const allCollected = updatedTests.every(t => t.status === 'Sample Collected');
        return attachHealthcareMetadata({
          ...order,
          tests: updatedTests,
          order_status: allCollected ? 'Processing' : order.order_status
        }, { source_module: 'lims_sample' });
      }
      return order;
    }));
  };

  const enterLabResults = (orderId, testId, parameterResults) => {
    setLabOrders(prev => prev.map(order => {
      if (order.lab_order_id === orderId) {
        const updatedTests = order.tests.map(t => {
          if (t.test_id === testId) {
            return { ...t, results: parameterResults, status: 'Result Entered' };
          }
          return t;
        });
        return attachHealthcareMetadata({
          ...order,
          tests: updatedTests,
          order_status: 'Result Entered'
        }, { source_module: 'lims_results' });
      }
      return order;
    }));
  };

  const verifyLabOrderReport = (orderId, verifierName) => {
    setLabOrders(prev => prev.map(order => {
      if (order.lab_order_id === orderId) {
        return attachHealthcareMetadata({
          ...order,
          order_status: 'Report Ready',
          verified_by: verifierName || 'Chief Pathologist',
          verified_at: new Date().toLocaleString('bn-BD')
        }, { source_module: 'lims_verification' });
      }
      return order;
    }));
  };

  // --- PHARMACY FEFO DISPENSING ACTIONS ---
  const dispensePharmacyMedicine = ({ medicineId, batchNumber, quantityTablets }) => {
    setPharmacyMedicines(prev => prev.map(med => {
      if (med.medicine_id === medicineId) {
        const updatedBatches = med.batches.map(b => {
          if (b.batch_number === batchNumber) {
            const newStock = Math.max(0, b.stock_tablets - quantityTablets);
            return { ...b, stock_tablets: newStock };
          }
          return b;
        });
        return { ...med, batches: updatedBatches };
      }
      return med;
    }));
  };

  // Update prescription dispensing status
  const updatePrescriptionDispensingStatus = (prescriptionId, status) => {
    setPrescriptions(prev => prev.map(rx => {
      if (rx.prescription_id === prescriptionId) {
        return { ...rx, dispensing_status: status };
      }
      return rx;
    }));
  };

  // Section 24: Admin Approval & Suite Activation
  const approveAdvancedSuite = (adminName = 'Super Admin', notes = 'Approved for full production deployment') => {
    const auditRecord = {
      approved_by: adminName,
      approved_at: new Date().toLocaleString('bn-BD'),
      notes,
      modules_unlocked: 18
    };
    setIsAdvancedSuiteApproved(true);
    setApprovalAudit(auditRecord);
    localStorage.setItem('hisabkitab_hc_advanced_approved', 'true');
    localStorage.setItem('hisabkitab_hc_approval_audit', JSON.stringify(auditRecord));
    return auditRecord;
  };

  const revokeAdvancedSuite = () => {
    setIsAdvancedSuiteApproved(false);
    setApprovalAudit(null);
    localStorage.removeItem('hisabkitab_hc_advanced_approved');
    localStorage.removeItem('hisabkitab_hc_approval_audit');
  };

  const toggleChecklistItem = (id) => {
    setAcceptanceChecklist(prev => {
      const updated = prev.map(item => item.id === id ? { ...item, completed: !item.completed } : item);
      localStorage.setItem('hisabkitab_hc_checklist', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <HealthcareContext.Provider
      value={{
        patients,
        doctors,
        diagnosticTests,
        testPackages,
        diagnosticCategories,
        CANCER_SAFETY_DISCLAIMER,
        pharmacyMedicines,
        appointments,
        prescriptions,
        labOrders,
        activeHealthcareTab,
        setActiveHealthcareTab,
        // Master Suite Admin Approval & 3 Linked Apps
        isHealthcareApproved,
        healthcareApprovalRecord,
        activeModules,
        isAnyModuleActive,
        toggleHealthcareModule,
        activateAllHealthcareModules,
        deactivateAllHealthcareModules,
        activeLinkedApp,
        setActiveLinkedApp,
        globalSelectedPatientId,
        setGlobalSelectedPatientId,
        approveHealthcareSuite,
        revokeHealthcareSuite,
        // Section 24 Advanced Suite
        isAdvancedSuiteApproved,
        approvalAudit,
        lqmsObjectives,
        controlledSops,
        incidentsLog,
        capaRisks,
        biomedicalWaste,
        labConsumables,
        insuranceTpa,
        callCenterTickets,
        acceptanceChecklist,
        approveAdvancedSuite,
        revokeAdvancedSuite,
        toggleChecklistItem,
        // Section 1.1 & 1.2: Institution & Multi-Branch Management
        institutionInfo,
        setInstitutionInfo,
        updateInstitutionInfo,
        branches,
        setBranches,
        saveBranches,
        addBranch,
        updateBranch,
        toggleBranchStatus,
        activeBranchId,
        setActiveBranchId,
        currentStaffRole,
        setCurrentStaffRole,
        // Methods & Patient Merging
        addPatient,
        updatePatient,
        mergePatients,
        patientMergeAuditLogs,
        bookAppointment,
        updateAppointmentStatus,
        createPrescription,
        createLabOrder,
        updateLabSampleStatus,
        enterLabResults,
        verifyLabOrderReport,
        dispensePharmacyMedicine,
        updatePrescriptionDispensingStatus
      }}
    >
      {children}
    </HealthcareContext.Provider>
  );
};
