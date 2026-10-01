/**
 * Initial Preset Data for HisabKitab 360 Healthcare Suite
 * Comprehensive Bangladeshi Clinic, Pharmacy, LIMS & Doctor Prescription Data
 */

export const INITIAL_PATIENTS = [
  {
    patient_id: 'PT-000001',
    patient_code: 'P-1001',
    full_name: 'আব্দুল করিম (Abdul Karim)',
    mobile_number: '01711223344',
    date_of_birth: '1975-04-12',
    calculated_age: 51,
    age_unit: 'years',
    gender: 'male',
    blood_group: 'B+',
    address: 'মিরপুর-১০, ঢাকা-১২১৬',
    branch_id: 'BR-MAIN',
    patient_status: 'Active',
    consent_status: 'Accepted',
    national_id: '19752691234567890',
    emergency_contact_name: 'ফাতেমা বেগম (স্ত্রী)',
    emergency_contact_mobile: '01811223344',
    marital_status: 'Married',
    chronic_disease_note: 'টাইপ-২ ডায়াবেটিস (Type-2 DM), উচ্চ রক্তচাপ (HTN)',
    allergy_note: 'পেনিসিলিন অ্যালার্জি (Penicillin Allergy)',
    current_medicine_note: 'Metformin 500mg, Amlodipine 5mg',
    outstanding_due: 0,
    total_visits: 4,
    created_at: '2026-01-15T10:00:00Z'
  },
  {
    patient_id: 'PT-000002',
    patient_code: 'P-1002',
    full_name: 'নাসরিন আক্তার (Nasrin Akter)',
    mobile_number: '01912334455',
    date_of_birth: '1992-08-24',
    calculated_age: 34,
    age_unit: 'years',
    gender: 'female',
    blood_group: 'O+',
    address: 'উত্তরা সেক্টর-৪, ঢাকা',
    branch_id: 'BR-MAIN',
    patient_status: 'Active',
    consent_status: 'Accepted',
    national_id: '19922699876543210',
    emergency_contact_name: 'কামাল হোসেন (স্বামী)',
    emergency_contact_mobile: '01799887766',
    marital_status: 'Married',
    chronic_disease_note: 'হাইপোথাইরয়েডিজম (Hypothyroidism)',
    allergy_note: 'সালফা ড্রাগ (Sulfa Drugs)',
    current_medicine_note: 'Levothyroxine 50mcg',
    outstanding_due: 450,
    total_visits: 2,
    created_at: '2026-03-10T11:30:00Z'
  },
  {
    patient_id: 'PT-000003',
    patient_code: 'P-1003',
    full_name: 'মোঃ তানভীর হাসান (Tanvir Hasan)',
    mobile_number: '01511002233',
    date_of_birth: '2016-11-05',
    calculated_age: 9,
    age_unit: 'years',
    gender: 'male',
    blood_group: 'A+',
    address: 'ধানমন্ডি ২৭, ঢাকা',
    branch_id: 'BR-MAIN',
    patient_status: 'Active',
    consent_status: 'Accepted',
    guardian_name: 'মোঃ রফিকুল ইসলাম (পিতা)',
    guardian_mobile: '01511002233',
    chronic_disease_note: 'শৈশবকালীন অ্যাজমা (Childhood Asthma)',
    allergy_note: 'ডাস্ট ও ধুলাবালি',
    current_medicine_note: 'Salbutamol Inhaler PRN',
    outstanding_due: 0,
    total_visits: 1,
    created_at: '2026-06-20T16:00:00Z'
  }
];

export const INITIAL_DOCTORS = [
  {
    doctor_id: 'DOC-001',
    doctor_code: 'DR-MED-01',
    doctor_name: 'ডাঃ তানভীর আহমেদ (Dr. Tanvir Ahmed)',
    degree: 'MBBS, FCPS (Medicine), MACP (USA)',
    specialization: 'মেডিসিন ও ডায়াবেটিস বিশেষজ্ঞ (Internal Medicine)',
    BMDC_registration_number: 'A-54321',
    mobile_number: '01711998877',
    email: 'dr.tanvir@hisabkitab360.com',
    chamber_name: 'চেম্বার নং-২০১ (২য় তলা)',
    room_number: '201',
    new_consultation_fee: 1000,
    follow_up_fee: 500,
    follow_up_validity_days: 14,
    appointment_slot_duration_minutes: 15,
    weekly_schedule: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
    visiting_hours: 'বিকাল ৫:০০ - রাত ৯:০০',
    prescription_header: 'অধ্যাপক ডাঃ তানভীর আহমেদ | মেডিসিন ও ডায়াবেটিস বিশেষজ্ঞ',
    prescription_footer: 'জরুরি প্রয়োজনে নিকটস্থ হাসপাতালে যোগাযোগ করুন। প্রেসক্রিপশন মেয়াদ ১৪ দিন।',
    doctor_status: 'Active',
    telemedicine_enabled: true
  },
  {
    doctor_id: 'DOC-002',
    doctor_code: 'DR-GYN-02',
    doctor_name: 'ডাঃ ফারহানা হক (Dr. Farhana Huq)',
    degree: 'MBBS, DGO, MCPS, FCPS (Obs & Gynae)',
    specialization: 'স্ত্রীরোগ ও প্রসূতি বিশেষজ্ঞ ও সার্জন',
    BMDC_registration_number: 'A-68420',
    mobile_number: '01811887766',
    email: 'dr.farhana@hisabkitab360.com',
    chamber_name: 'চেম্বার নং-২০৫ (২য় তলা)',
    room_number: '205',
    new_consultation_fee: 1200,
    follow_up_fee: 600,
    follow_up_validity_days: 21,
    appointment_slot_duration_minutes: 20,
    weekly_schedule: ['Saturday', 'Monday', 'Wednesday'],
    visiting_hours: 'সন্ধ্যা ৬:০০ - রাত ৯:৩০',
    prescription_header: 'ডাঃ ফারহানা হক | স্ত্রীরোগ ও প্রসূতি বিশেষজ্ঞ ও ল্যাপারোস্কপিক সার্জন',
    prescription_footer: 'প্রতিটি ভিজিটে পূর্বের সকল রিপোর্ট ও প্রেসক্রিপশন সঙ্গে আনুন।',
    doctor_status: 'Active',
    telemedicine_enabled: true
  }
];

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

export const INITIAL_TEST_PACKAGES = [
  {
    package_id: 'PKG-001',
    package_code: 'EXEC-HEALTH',
    package_name_english: 'Executive Whole Body Health Check-up Package',
    package_name_bangla: 'এক্সিকিউটিভ হোল বডি হেলথ চেক-আপ প্যাকেজ',
    included_test_ids: ['TEST-001', 'TEST-002', 'TEST-003', 'TEST-004', 'TEST-005', 'TEST-006'],
    individual_price_total: 3900,
    package_price: 2800,
    discount_amount: 1100,
    fasting_required: true,
    package_instruction: 'সকালে ১০-১২ ঘণ্টা খালি পেটে এসে রক্ত দেওয়া এবং পেটের আল্ট্রাসনোগ্রাম করা হবে।',
    active_status: 'Active'
  }
];

export const INITIAL_PHARMACY_MEDICINES = [
  {
    medicine_id: 'MED-001',
    item_code: 'NAP-EXT-500',
    brand_name: 'Napa Extra',
    generic_name: 'Paracetamol + Caffeine',
    manufacturer_name: 'Beximco Pharmaceuticals Ltd.',
    dosage_form: 'Tablet',
    strength: '500 mg + 65 mg',
    route: 'Oral',
    base_unit: 'Tablet',
    box_pack_size: 240, // 24 strips x 10 tablets
    strip_pack_size: 10,
    barcode: '8941100123456',
    prescription_required: false,
    restricted_medicine: false,
    rack_location: 'Rack A-1 (OTC Pain)',
    reorder_level: 50,
    MRP: 3.0, // per tablet
    purchase_rate: 2.3, // per tablet
    vat_percent: 0,
    active_status: 'Active',
    batches: [
      {
        batch_number: 'NE-2026A',
        manufacture_date: '2025-10-01',
        expiry_date: '2027-09-30',
        stock_tablets: 480, // 48 strips
        purchase_rate: 2.3,
        selling_rate: 3.0,
        rack_id: 'Rack A-1'
      }
    ]
  },
  {
    medicine_id: 'MED-002',
    item_code: 'SEC-20',
    brand_name: 'Seclo 20',
    generic_name: 'Omeprazole',
    manufacturer_name: 'Square Pharmaceuticals Ltd.',
    dosage_form: 'Capsule',
    strength: '20 mg',
    route: 'Oral',
    base_unit: 'Capsule',
    box_pack_size: 100, // 10 strips x 10 caps
    strip_pack_size: 10,
    barcode: '8941100654321',
    prescription_required: false,
    restricted_medicine: false,
    rack_location: 'Rack B-3 (Gastric/PPI)',
    reorder_level: 60,
    MRP: 7.0, // per capsule
    purchase_rate: 5.6,
    vat_percent: 0,
    active_status: 'Active',
    batches: [
      {
        batch_number: 'SC-2026B',
        manufacture_date: '2025-11-15',
        expiry_date: '2027-10-31',
        stock_tablets: 320,
        purchase_rate: 5.6,
        selling_rate: 7.0,
        rack_id: 'Rack B-3'
      }
    ]
  },
  {
    medicine_id: 'MED-003',
    item_code: 'CEF-3-200',
    brand_name: 'Cef-3 200',
    generic_name: 'Cefixime',
    manufacturer_name: 'Square Pharmaceuticals Ltd.',
    dosage_form: 'Capsule',
    strength: '200 mg',
    route: 'Oral',
    base_unit: 'Capsule',
    box_pack_size: 14, // 2 strips x 7 caps
    strip_pack_size: 7,
    barcode: '8941100778899',
    prescription_required: true,
    restricted_medicine: false,
    rack_location: 'Rack C-2 (Antibiotics)',
    reorder_level: 28,
    MRP: 45.0, // per capsule
    purchase_rate: 37.0,
    vat_percent: 0,
    active_status: 'Active',
    batches: [
      {
        batch_number: 'CF-8891',
        manufacture_date: '2025-08-01',
        expiry_date: '2027-04-30',
        stock_tablets: 84,
        purchase_rate: 37.0,
        selling_rate: 45.0,
        rack_id: 'Rack C-2'
      }
    ]
  },
  {
    medicine_id: 'MED-004',
    item_code: 'COM-500',
    brand_name: 'Comet 500',
    generic_name: 'Metformin Hydrochloride',
    manufacturer_name: 'Square Pharmaceuticals Ltd.',
    dosage_form: 'Tablet',
    strength: '500 mg',
    route: 'Oral',
    base_unit: 'Tablet',
    box_pack_size: 100,
    strip_pack_size: 10,
    barcode: '8941100332211',
    prescription_required: true,
    restricted_medicine: false,
    rack_location: 'Rack D-1 (Diabetes)',
    reorder_level: 100,
    MRP: 5.0,
    purchase_rate: 3.9,
    vat_percent: 0,
    active_status: 'Active',
    batches: [
      {
        batch_number: 'CM-1092',
        manufacture_date: '2025-09-10',
        expiry_date: '2027-08-31',
        stock_tablets: 260,
        purchase_rate: 3.9,
        selling_rate: 5.0,
        rack_id: 'Rack D-1'
      }
    ]
  }
];

export const INITIAL_APPOINTMENTS = [
  {
    appointment_id: 'APT-20261001-000001',
    appointment_date: '2026-10-01',
    appointment_time: '17:30',
    doctor_id: 'DOC-001',
    doctor_name: 'ডাঃ তানভীর আহমেদ',
    patient_id: 'PT-000001',
    patient_name: 'আব্দুল করিম',
    patient_phone: '01711223344',
    visit_type: 'Follow-up patient',
    appointment_source: 'Walk-in',
    consultation_fee: 500,
    discount: 0,
    paid_amount: 500,
    due_amount: 0,
    payment_status: 'Paid',
    appointment_status: 'In Consultation',
    token_number: 'TK-01',
    priority_level: 'Normal',
    notes: 'রুটিন ডায়াবেটিস ফলো-আপ ভিজিট'
  },
  {
    appointment_id: 'APT-20261001-000002',
    appointment_date: '2026-10-01',
    appointment_time: '18:00',
    doctor_id: 'DOC-001',
    doctor_name: 'ডাঃ তানভীর আহমেদ',
    patient_id: 'PT-000002',
    patient_name: 'নাসরিন আক্তার',
    patient_phone: '01912334455',
    visit_type: 'New patient',
    appointment_source: 'Phone Call',
    consultation_fee: 1000,
    discount: 100,
    paid_amount: 900,
    due_amount: 0,
    payment_status: 'Paid',
    appointment_status: 'Waiting',
    token_number: 'TK-02',
    priority_level: 'Normal',
    notes: 'সাধারণ শারীরিক দুর্বলতা ও থাইরয়েড মূল্যায়ন'
  }
];

export const INITIAL_PRESCRIPTIONS = [
  {
    prescription_id: 'RX-20261001-000001',
    appointment_id: 'APT-20261001-000001',
    doctor_id: 'DOC-001',
    doctor_name: 'ডাঃ তানভীর আহমেদ',
    doctor_degree: 'MBBS, FCPS (Medicine)',
    BMDC_number: 'A-54321',
    patient_id: 'PT-000001',
    patient_name: 'আব্দুল করিম',
    age: '51Y',
    gender: 'Male',
    date: '2026-10-01',
    chief_complaint: 'মাঝে মাঝে মাথা ঘোরা ও খাওয়ার পর ক্লান্তিবোধ (Weakness & Dizziness)',
    vitals: {
      bp_systolic: 130,
      bp_diastolic: 85,
      pulse: 76,
      temp: '98.4°F',
      weight_kg: 68,
      height_cm: 168,
      bmi: '24.1',
      blood_glucose: '8.2 mmol/L (Random)'
    },
    provisional_diagnosis: 'Type-2 Diabetes Mellitus (Uncontrolled) with Mild Hypertension',
    medicines: [
      {
        medicine_id: 'MED-004',
        brand_name: 'Comet',
        generic_name: 'Metformin',
        strength: '500 mg',
        dose: '1 Tablet',
        frequency: '1+0+1',
        timing: 'খাবারের সাথে (With food)',
        duration: '1 Month',
        quantity: 60,
        special_instruction: 'প্রতিদিন সকালে ও রাতে খাবারের সাথে খাবেন।'
      },
      {
        medicine_id: 'MED-002',
        brand_name: 'Seclo',
        generic_name: 'Omeprazole',
        strength: '20 mg',
        dose: '1 Capsule',
        frequency: '1+0+1',
        timing: 'খাবারের ৩০ মি. আগে (Before food)',
        duration: '14 Days',
        quantity: 28,
        special_instruction: 'সকালে ও রাতে খালি পেটে খাবেন।'
      }
    ],
    test_advice: [
      'Fasting Blood Sugar (FBS) & 2HABF',
      'HbA1c',
      'Serum Creatinine',
      'Lipid Profile'
    ],
    advice: 'প্রতিদিন কমপক্ষে ৩০ মিনিট হাঁটুন। মিষ্টি ও চিনিযুক্ত খাবার বর্জন করুন। তৈলাক্ত খাবার পরিহার করুন।',
    follow_up_date: '2026-10-15',
    dispensing_status: 'Sent to Pharmacy', // 'Sent to Pharmacy' | 'Partially Dispensed' | 'Fully Dispensed'
    status: 'Signed'
  }
];

export const INITIAL_LAB_ORDERS = [
  {
    lab_order_id: 'LAB-20261001-000001',
    invoice_id: 'DI-20261001-000001',
    patient_id: 'PT-000001',
    patient_name: 'আব্দুল করিম',
    patient_phone: '01711223344',
    doctor_name: 'ডাঃ তানভীর আহমেদ',
    order_date: '2026-10-01 10:30',
    tests: [
      {
        test_id: 'TEST-001',
        test_code: 'CBC',
        test_name: 'Complete Blood Count (CBC with ESR)',
        price: 450,
        sample_id: 'SMP-20261001-000001',
        sample_type: 'Whole Blood (EDTA)',
        container: 'Purple Top',
        status: 'Sample Collected',
        results: {
          'P-HB': '14.2',
          'P-ESR': '12',
          'P-WBC': '7,800',
          'P-PLT': '245,000'
        }
      },
      {
        test_id: 'TEST-002',
        test_code: 'FBS',
        test_name: 'Fasting Blood Sugar (FBS)',
        price: 150,
        sample_id: 'SMP-20261001-000002',
        sample_type: 'Fluoride Plasma',
        container: 'Grey Top',
        status: 'Result Entered',
        results: {
          'P-GLU': '7.4' // abnormal high
        }
      }
    ],
    total_amount: 600,
    discount: 50,
    paid_amount: 550,
    due_amount: 0,
    order_status: 'Processing', // 'Sample Pending' | 'Sample Collected' | 'Result Entered' | 'Verified' | 'Report Ready' | 'Delivered'
    report_delivery_method: 'Counter Print + WhatsApp Link'
  }
];
