/**
 * Initial Preset Data for HisabKitab 360 Healthcare Suite
 * Comprehensive Bangladeshi Clinic, Pharmacy, LIMS & Doctor Prescription Data
 */

export const INITIAL_PATIENTS = [];


export const INITIAL_DOCTORS = [];

export const INITIAL_DIAGNOSTIC_TESTS = [
  {
    test_id: 'TEST-001',
    test_code: 'CBC',
    test_name_english: 'Complete Blood Count (CBC with ESR)',
    test_name_bangla: 'সিবিসি রক্তের পরীক্ষা (ইএসআর সহ)',
    main_category: 'Hematology',
    department_id: 'DEP-HEM',
    specimen_type: 'Whole Blood (EDTA)',
    container_type: 'Purple Top (K2/K3 EDTA Tube)',
    fasting_requirement: false,
    patient_preparation_instruction: 'কোনো উপবাসের প্রয়োজন নেই। স্বাভাবিক পানি পান করতে পারেন।',
    regular_price: 450,
    emergency_price: 600,
    corporate_price: 350,
    report_turnaround_time: '4 Hours',
    requires_barcode: true,
    requires_doctor_approval: true,
    in_house_or_referred: 'in_house',
    parameters: [
      { id: 'P-HB', name: 'Hemoglobin (Hb)', unit: 'g/dL', ref_male: '13.5 - 17.5', ref_female: '12.0 - 15.5', critical_low: 7.0, critical_high: 20.0 },
      { id: 'P-ESR', name: 'ESR (Westergren)', unit: 'mm/1st hr', ref_male: '0 - 10', ref_female: '0 - 20', critical_low: null, critical_high: 100 },
      { id: 'P-WBC', name: 'Total WBC Count', unit: '/cu.mm', ref_male: '4,000 - 11,000', ref_female: '4,000 - 11,000', critical_low: 2000, critical_high: 30000 },
      { id: 'P-PLT', name: 'Platelet Count', unit: '/cu.mm', ref_male: '150,000 - 450,000', ref_female: '150,000 - 450,000', critical_low: 50000, critical_high: 1000000 }
    ],
    active_status: 'Active'
  },
  {
    test_id: 'TEST-002',
    test_code: 'FBS',
    test_name_english: 'Fasting Blood Sugar (FBS)',
    test_name_bangla: 'খালি পেটে রক্তের সুগার (গ্লুকোজ)',
    main_category: 'Clinical Biochemistry',
    department_id: 'DEP-BIO',
    specimen_type: 'Fluoride Plasma / Serum',
    container_type: 'Grey Top (Sodium Fluoride)',
    fasting_requirement: true,
    patient_preparation_instruction: 'নমুনা দেওয়ার পূর্বে ৮ থেকে ১০ ঘণ্টা খালি পেটে থাকতে হবে।',
    regular_price: 150,
    emergency_price: 220,
    corporate_price: 120,
    report_turnaround_time: '2 Hours',
    requires_barcode: true,
    requires_doctor_approval: true,
    in_house_or_referred: 'in_house',
    parameters: [
      { id: 'P-GLU', name: 'Fasting Glucose', unit: 'mmol/L', ref_male: '4.0 - 6.0', ref_female: '4.0 - 6.0', critical_low: 2.8, critical_high: 22.0 }
    ],
    active_status: 'Active'
  },
  {
    test_id: 'TEST-003',
    test_code: 'CREAT',
    test_name_english: 'Serum Creatinine (Kidney Function)',
    test_name_bangla: 'সিরাম ক্রিয়েটিনিন (কিডনি ফাংশন)',
    main_category: 'Clinical Biochemistry',
    department_id: 'DEP-BIO',
    specimen_type: 'Clotted Blood (Serum)',
    container_type: 'Red/Yellow Top (Gel Clot Activator)',
    fasting_requirement: false,
    regular_price: 300,
    emergency_price: 450,
    corporate_price: 250,
    report_turnaround_time: '3 Hours',
    requires_barcode: true,
    requires_doctor_approval: true,
    in_house_or_referred: 'in_house',
    parameters: [
      { id: 'P-CR', name: 'Serum Creatinine', unit: 'mg/dL', ref_male: '0.7 - 1.3', ref_female: '0.6 - 1.1', critical_low: 0.3, critical_high: 5.0 }
    ],
    active_status: 'Active'
  },
  {
    test_id: 'TEST-004',
    test_code: 'LIPID',
    test_name_english: 'Lipid Profile (Cholesterol & Triglycerides)',
    test_name_bangla: 'লিপিড প্রোফাইল (রক্তে চর্বির মাত্রা)',
    main_category: 'Clinical Biochemistry',
    department_id: 'DEP-BIO',
    specimen_type: 'Serum',
    container_type: 'Yellow Top (Gel Separator)',
    fasting_requirement: true,
    patient_preparation_instruction: '১০ থেকে ১২ ঘণ্টা খালি পেটে থাকতে হবে।',
    regular_price: 900,
    emergency_price: 1200,
    corporate_price: 700,
    report_turnaround_time: '4 Hours',
    requires_barcode: true,
    requires_doctor_approval: true,
    in_house_or_referred: 'in_house',
    parameters: [
      { id: 'P-CHOL', name: 'Total Cholesterol', unit: 'mg/dL', ref_male: '< 200', ref_female: '< 200' },
      { id: 'P-TG', name: 'Triglycerides', unit: 'mg/dL', ref_male: '< 150', ref_female: '< 150' },
      { id: 'P-HDL', name: 'HDL Cholesterol (Good)', unit: 'mg/dL', ref_male: '> 40', ref_female: '> 50' },
      { id: 'P-LDL', name: 'LDL Cholesterol (Bad)', unit: 'mg/dL', ref_male: '< 100', ref_female: '< 100' }
    ],
    active_status: 'Active'
  },
  {
    test_id: 'TEST-005',
    test_code: 'USG-WA',
    test_name_english: 'Ultrasonogram of Whole Abdomen (USG)',
    test_name_bangla: 'হোল অ্যাবডোমেন আল্ট্রাসনোগ্রাম (পেটের পূর্ণাঙ্গ পরীক্ষা)',
    main_category: 'Radiology',
    department_id: 'DEP-RAD',
    specimen_type: 'Imaging Modality',
    container_type: 'N/A',
    fasting_requirement: true,
    patient_preparation_instruction: '৬ ঘণ্টা খালি পেটে এবং পরীক্ষা শুরুর পূর্বে পর্যাপ্ত পানি খেয়ে প্রস্রাবের বেগ রাখতে হবে।',
    regular_price: 1500,
    emergency_price: 2000,
    corporate_price: 1200,
    report_turnaround_time: 'Same Day',
    requires_barcode: false,
    requires_doctor_approval: true,
    in_house_or_referred: 'in_house',
    active_status: 'Active'
  },
  {
    test_id: 'TEST-006',
    test_code: 'XRAY-CHEST',
    test_name_english: 'Digital X-Ray Chest P/A View',
    test_name_bangla: 'ডিজিটাল বুকের এক্স-রে (পি/এ ভিউ)',
    main_category: 'Radiology',
    department_id: 'DEP-RAD',
    specimen_type: 'Digital X-Ray',
    container_type: 'N/A',
    fasting_requirement: false,
    regular_price: 600,
    emergency_price: 800,
    corporate_price: 500,
    report_turnaround_time: '2 Hours',
    requires_barcode: false,
    requires_doctor_approval: true,
    in_house_or_referred: 'in_house',
    active_status: 'Active'
  }
];

export const INITIAL_TEST_PACKAGES = [];

export const INITIAL_PHARMACY_MEDICINES = [];

export const INITIAL_APPOINTMENTS = [];

export const INITIAL_PRESCRIPTIONS = [];

export const INITIAL_LAB_ORDERS = [];

