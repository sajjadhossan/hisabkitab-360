/**
 * Initial Preset Data for HisabKitab 360 Healthcare Suite
 * Comprehensive Bangladeshi Clinic, Pharmacy, LIMS & Doctor Prescription Data
 */

export const INITIAL_PATIENTS = [];


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

export const INITIAL_APPOINTMENTS = [];

export const INITIAL_PRESCRIPTIONS = [];

export const INITIAL_LAB_ORDERS = [];

