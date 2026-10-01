/**
 * Advanced Healthcare Operations & Compliance Suite Data
 * Section 24: LQMS, SOP Control, Method Validation, Incidents, CAPA, Biosafety, Consumables, Insurance, TPA & Go-Live Checklist
 */

export const INITIAL_LQMS_OBJECTIVES = [
  {
    id: 'OBJ-001',
    title: 'নমুনা বাতিলের হার হ্রাস (Reduce Sample Rejection Rate)',
    department: 'Pathology & Phlebotomy',
    baseline_value: '2.8%',
    target_value: '< 0.8%',
    current_value: '1.1%',
    responsible_person: 'ডাঃ কামরুল হাসান (চিফ প্যাথলজিস্ট)',
    due_date: '2026-12-31',
    status: 'In Progress',
    action_plan: 'ফ্লেবোটোমিস্টদের জন্য সঠিক ড্র-ভলিউম ও মিক্সিং রিফ্রেশার ট্রেনিং আয়োজন।'
  },
  {
    id: 'OBJ-002',
    title: 'রিপোর্ট টার্নঅ্যারাউন্ড সময় (TAT) উন্নতকরণ',
    department: 'Biochemistry & LIMS',
    baseline_value: '5.2 Hours',
    target_value: '< 3.0 Hours',
    current_value: '3.4 Hours',
    responsible_person: 'মোস্তাফিজুর রহমান (ল্যাব ইন-চার্জ)',
    due_date: '2026-11-30',
    status: 'In Progress',
    action_plan: 'অটোমেটেড বায়োকেমিস্ট্রি অ্যানালাইজার বারকোড ইন্টারফেসিং।'
  },
  {
    id: 'OBJ-003',
    title: 'রোগীর সামগ্রিক সন্তুষ্টি স্কোর (Patient CSAT / NPS)',
    department: 'Customer Care & Reception',
    baseline_value: '82%',
    target_value: '> 95%',
    current_value: '91%',
    responsible_person: 'ফারহানা ইসলাম (সার্ভিস এক্সিলেন্স অফিসার)',
    due_date: '2026-12-31',
    status: 'In Progress',
    action_plan: 'ওয়েটিং টাইম কমানো ও এসএমএস/হোয়াটসঅ্যাপে ডিজিটাল রিপোর্ট পাঠানো।'
  }
];

export const INITIAL_CONTROLLED_SOPS = [
  {
    document_id: 'DOC-SOP-001',
    document_code: 'SOP-PATH-01',
    document_title: 'রক্তের নমুনা সংগ্রহ ও ফ্লেবোটমি স্ট্যান্ডার্ড অপারেটিং প্রসিডিউর',
    document_type: 'SOP',
    department: 'Pathology',
    version_number: 'v2.1',
    effective_date: '2026-01-01',
    review_date: '2027-01-01',
    approved_by: 'ডাঃ কামরুল হাসান (চিফ প্যাথলজিস্ট)',
    document_status: 'Active',
    access_level: 'All Staff'
  },
  {
    document_id: 'DOC-SOP-002',
    document_code: 'POL-CRIT-02',
    document_title: 'ক্রিটিক্যাল প্যানিক ভ্যালু তাৎক্ষণিক ডাক্তার অবহিতকরণ পলিসি',
    document_type: 'Policy',
    department: 'Laboratory Operations',
    version_number: 'v1.4',
    effective_date: '2026-02-15',
    review_date: '2027-02-15',
    approved_by: 'মেডিকেল ডিরেক্টর',
    document_status: 'Active',
    access_level: 'Doctors & Technicians'
  },
  {
    document_id: 'DOC-SOP-003',
    document_code: 'SOP-WASTE-03',
    document_title: 'বায়োমেডিকেল বর্জ্য পৃথকীকরণ ও নিরাপদ অপসারণ গাইডলাইন',
    document_type: 'Safety Guideline',
    department: 'Infection Control & Safety',
    version_number: 'v3.0',
    effective_date: '2026-03-01',
    review_date: '2027-03-01',
    approved_by: 'সেফটি অফিসার',
    document_status: 'Active',
    access_level: 'All Staff'
  },
  {
    document_id: 'DOC-SOP-004',
    document_code: 'SOP-RAD-04',
    document_title: 'রেডিয়েশন প্রটেকশন ও লিড অ্যাপ্রোন পরিধান স্ট্যান্ডার্ড',
    document_type: 'Radiation Safety',
    department: 'Radiology & Imaging',
    version_number: 'v2.0',
    effective_date: '2026-01-10',
    review_date: '2027-01-10',
    approved_by: 'প্রফেসর ডাঃ শামসুল হুদা (রেডিওলজিস্ট)',
    document_status: 'Active',
    access_level: 'Radiology Staff'
  }
];

export const INITIAL_INCIDENTS_LOG = [
  {
    incident_id: 'INC-20261001-001',
    incident_date: '2026-10-01 09:30 AM',
    department: 'Phlebotomy',
    incident_type: 'নমুনা ক্লটিং (Hemolysed / Clotted Sample)',
    severity: 'Minor',
    patient_id: 'PT-000001',
    description: 'সিবিসি টেস্টের রক্ত কালেকশনের পর টিউব ইনভার্ট না করায় রক্ত আংশিক জমাট বেঁধেছিল।',
    immediate_action: 'রোগীর সাথে যোগাযোগ করে বিনামূল্যে পুনঃনমুনা (Recollection) গ্রহণ করা হয়।',
    root_cause: 'নবনিযুক্ত ফ্লেবোটোমিস্টের ইডিটিএ টিউব প্রটোকল ভুলের কারণে।',
    corrective_action: 'ফ্লেবোটোমিস্টদের জন্য ৫-৮ বার জেন্টল ইনভার্সন বাধ্যতামূলক রিফ্রেশার দেওয়া হয়েছে।',
    status: 'Closed',
    reported_by: 'ল্যাব টেকনিশিয়ান রফিক'
  },
  {
    incident_id: 'INC-20260928-002',
    incident_date: '2026-09-28 04:15 PM',
    department: 'Pharmacy',
    incident_type: 'মেয়াদোত্তীর্ণ ওষুধ বিক্রয় চেষ্টা প্রতিরোধ (Near-Miss)',
    severity: 'Near Miss',
    description: 'ফার্মেসি সেলস কাউন্টারে FEFO সফটওয়্যার অ্যালার্টের কারণে এক্সপায়ার্ড ব্যাচ বিক্রয় স্বয়ংক্রিয়ভাবে ব্লক হয়।',
    immediate_action: 'সেলস টার্মিনাল স্বয়ংক্রিয়ভাবে বিল আটকায় এবং ফার্মাসিস্ট নিরাপদ ব্যাচ নির্বাচন করেন।',
    root_cause: 'সেলফ থেকে পুরনো ব্যাচ রিমুভ করতে বিলম্ব।',
    corrective_action: 'প্রতি সোমবার সকালে র্যাক-ওয়াইজ ফিজিক্যাল এক্সপায়ারি অডিট রুটিন শিডিউল করা হয়েছে।',
    status: 'Closed',
    reported_by: 'ফার্মাসিস্ট কামরুল'
  }
];

export const INITIAL_CAPA_RISK_ITEMS = [
  {
    risk_id: 'RSK-001',
    process_name: 'ক্রিটিক্যাল রেজাল্ট টেলিফোন কমিউনিকেশন',
    risk_description: 'অত্যধিক অস্বাভাবিক পরীক্ষার ফলাফল (যেমন K+ > 6.5) সময়মতো ডাক্তারকে জানাতে না পারা',
    likelihood: 2,
    impact: 5,
    risk_score: 10, // 2 x 5
    control_status: 'High Priority Control',
    existing_control: 'সফটওয়্যার রেড ফ্ল্যাগ ও স্বয়ংক্রিয় এসএমএস পাঠানো',
    owner: 'কোয়ালিটি ম্যানেজার'
  },
  {
    risk_id: 'RSK-002',
    process_name: 'কোল্ড-চেইন ভ্যাকসিন ও রিএজেন্ট ফ্রিজার',
    risk_description: 'লোডশেডিং বা তাপমাত্রা বৃদ্ধি পেয়ে ২-৮°C রিএজেন্ট নষ্ট হওয়া',
    likelihood: 2,
    impact: 4,
    risk_score: 8,
    control_status: 'Controlled',
    existing_control: 'অটোমেটিক জেনারেটর ব্যাকআপ ও ডিজিটাল টেম্পারেচার ডাটা লগার',
    owner: 'স্টোরকিপার'
  }
];

export const INITIAL_BIOMEDICAL_WASTE_LOG = [
  {
    waste_id: 'WST-20261001-01',
    category: 'Sharp Waste (ধারালো বর্জ্য - সুই, ব্লেড)',
    department: 'Phlebotomy & Sample Room',
    quantity_kg: '4.2 kg',
    container: 'Puncture-proof Yellow Sharp Box',
    disposal_vendor: 'ঢাকা উত্তর সিটি কর্পোরেশন ও প্রিজম বাংলাদেশ',
    disposal_method: 'Incineration (উচ্চতাপে ভস্মীকরণ)',
    status: 'Manifest Signed & Handed Over'
  },
  {
    waste_id: 'WST-20261001-02',
    category: 'Infectious Waste (সংক্রামক গজ, ব্যান্ডেজ, তুলা)',
    department: 'Diagnostic Lab',
    quantity_kg: '9.5 kg',
    container: 'Red Biohazard Bag with Autoclave Tag',
    disposal_vendor: 'প্রিজম বাংলাদেশ ওয়েস্ট ম্যানেজমেন্ট',
    disposal_method: 'Autoclave followed by Safe Landfill',
    status: 'Dispatched'
  }
];

export const INITIAL_LAB_CONSUMABLES = [
  { id: 'CSM-001', name: 'K2 EDTA Purple Top Blood Tube 3ml', category: 'Vacutainer', brand: 'BD Vacutainer', current_stock: 450, reorder_level: 100, unit: 'Pieces', status: 'Optimal' },
  { id: 'CSM-002', name: 'Gel Clot Activator Yellow Top 5ml', category: 'Vacutainer', brand: 'BD Vacutainer', current_stock: 320, reorder_level: 80, unit: 'Pieces', status: 'Optimal' },
  { id: 'CSM-003', name: 'Nitrile Examination Gloves (Medium)', category: 'PPE', brand: 'Ansell', current_stock: 12, reorder_level: 20, unit: 'Boxes (100 pcs)', status: 'Low Stock' },
  { id: 'CSM-004', name: 'Glass Microscopic Slides 7101', category: 'Consumable', brand: 'Sail Brand', current_stock: 18, reorder_level: 5, unit: 'Packets', status: 'Optimal' },
  { id: 'CSM-005', name: 'Thermal Paper Roll 80mm for Bill', category: 'Printing', brand: 'Standard', current_stock: 45, reorder_level: 15, unit: 'Rolls', status: 'Optimal' }
];

export const INITIAL_INSURANCE_TPA = [
  {
    id: 'INS-001',
    company_name: 'গ্রিন ডেল্টা ইন্স্যুরেন্স পিএলসি (Green Delta)',
    tpa_name: 'GDIC Health TPA',
    contact_person: 'আরিফুল হক (হেড অফ ক্লেইমস)',
    mobile: '01713000111',
    credit_limit: '৳৫,০০,০০০',
    payment_terms: '৩০ কার্যদিবস',
    active_claims: 3,
    status: 'Active Partner'
  },
  {
    id: 'INS-002',
    company_name: 'প্রগতি লাইফ ইন্স্যুরেন্স লিমিটেড',
    tpa_name: 'In-house TPA',
    contact_person: 'মাহমুদুল হাসান',
    mobile: '01819222333',
    credit_limit: '৳৩,৫০,০০০',
    payment_terms: '৪৫ কার্যদিবস',
    active_claims: 1,
    status: 'Active Partner'
  }
];

export const INITIAL_CALL_CENTER_TICKETS = [
  {
    ticket_id: 'TCK-20261001-01',
    patient_name: 'আব্দুল করিম',
    phone: '01711223344',
    type: 'Report Delay Query',
    priority: 'Normal',
    description: 'রোগী জানতে চেয়েছেন বিকেল ৪টায় দেওয়া রক্তের সিবিসি রিপোর্ট প্রস্তুত হয়েছে কি না।',
    assigned_to: 'ল্যাব ফ্রন্ট ডেস্ক',
    status: 'Resolved',
    resolution: 'রিপোর্ট প্রস্তুত হয়েছে এবং রোগীর হোয়াটসঅ্যাপে পিডিএফ শেয়ার করা হয়েছে।'
  },
  {
    ticket_id: 'TCK-20261001-02',
    patient_name: 'মোছাঃ নাসরিন আক্তার',
    phone: '01819988776',
    type: 'Home Collection Booking',
    priority: 'High',
    description: 'আগামীকাল সকাল ৮টায় থাইরয়েড টেস্টের জন্য বাসায় লোক পাঠানোর অনুরোধ।',
    assigned_to: 'হোম কেয়ার টিম',
    status: 'In Progress',
    resolution: 'কালেক্টর মোস্তাফিজুর রহমানকে অ্যাসাইন করা হয়েছে।'
  }
];

// Production Go-Live Acceptance Checklist (38 Points from Section 24.18)
export const PRODUCTION_ACCEPTANCE_CHECKLIST = [
  { id: 'CHK-01', title: 'পেশেন্ট রেজিস্ট্রেশন ও মোবাইল ডুপ্লিকেট চেকিং টেস্ট সম্পন্ন', category: 'Patient', completed: true },
  { id: 'CHK-02', title: 'ডাক্তারের শিডিউল অনুযায়ী অ্যাপয়েন্টমেন্ট ও টোকেন কিউ টেস্ট সম্পন্ন', category: 'Doctor', completed: true },
  { id: 'CHK-03', title: 'ডাক্তারের ডিজিটাল প্রেসক্রিপশন তৈরি ও স্বাক্ষর সফলভাবে পরীক্ষিত', category: 'Doctor', completed: true },
  { id: 'CHK-04', title: 'প্রেসক্রিপশন কিউ থেকে সরাসরি ফার্মেসিতে ট্রান্সফার ও ডিসপেন্সিং', category: 'Pharmacy', completed: true },
  { id: 'CHK-05', title: 'ফার্মেসি FEFO নীতিতে ব্যাচ ও মেয়াদোত্তীর্ণ ওষুধ বিক্রয় রোধ কার্যকর', category: 'Pharmacy', completed: true },
  { id: 'CHK-06', title: 'ওষুধ সেলস রিটার্ন ও স্টক রিস্টোরেশন টেস্ট সফল', category: 'Pharmacy', completed: true },
  { id: 'CHK-07', title: 'ডায়াগনস্টিক কাউন্টার টেস্ট বিলিং ও মানি রিসিট প্রিন্টিং টেস্ট', category: 'Diagnostic', completed: true },
  { id: 'CHK-08', title: 'নমুনা সংগ্রহের পর ইউনিক বারকোড (SMP-xxxx) লেবেল প্রিন্ট ও স্ট্যাটাস আপডেট', category: 'Diagnostic', completed: true },
  { id: 'CHK-09', title: 'স্যাম্পল রিজেকশন ও ফ্রি রিকলেকশন প্রটোকল সক্রিয়', category: 'Diagnostic', completed: true },
  { id: 'CHK-10', title: 'ল্যাবরেটরি রেজাল্ট এন্ট্রি ও রেফারেন্স রেঞ্জ যাচাইকরণ সম্পন্ন', category: 'Diagnostic', completed: true },
  { id: 'CHK-11', title: 'ক্রিটিক্যাল প্যানিক ভ্যালু রেড অ্যালার্ট ও ওয়ার্নিং সিস্টেম টেস্টেড', category: 'Clinical Safety', completed: true },
  { id: 'CHK-12', title: 'চিফ প্যাথলজিস্ট কর্তৃক রিপোর্ট ভেরিফিকেশন ও ডিজিটাল সাইন-অফ', category: 'Diagnostic', completed: true },
  { id: 'CHK-13', title: 'A4 ফরম্যাটে প্যাথলজি ও রেডিওলজি রিপোর্টের প্রিন্ট ও পিডিএফ ডাউনলোড', category: 'Diagnostic', completed: true },
  { id: 'CHK-14', title: 'রিপোর্টে ভেরিফিকেশন কিউআর (QR) কোড স্ক্যান সক্ষমতা পরীক্ষিত', category: 'Security', completed: true },
  { id: 'CHK-15', title: 'রেডিওলজি (USG, X-Ray, ECG) রিপোর্ট ওয়ার্কফ্লো টেস্ট সম্পন্ন', category: 'Radiology', completed: true },
  { id: 'CHK-16', title: 'বাইরের রেফারেল পার্টনার ল্যাবে টেস্ট পাঠানো ও ট্র্যাকিং সক্ষমতা', category: 'Referral', completed: true },
  { id: 'CHK-17', title: 'হোম স্যাম্পল কালেকশন শিডিউলিং ও ফ্লেবোটোমিস্ট রুট প্ল্যান সক্রিয়', category: 'Home Care', completed: true },
  { id: 'CHK-18', title: 'হোম মেডিসিন ডেলিভারি রাইডার অ্যাসাইন ও ক্যাশ অন ডেলিভারি (COD)', category: 'Home Care', completed: true },
  { id: 'CHK-19', title: 'ক্যাশ ড্রয়ার, ক্যাশিয়ার শিফট ও দৈনিক ক্লোজিং রিকনসিলিয়েশন', category: 'Finance', completed: true },
  { id: 'CHK-20', title: 'বিকাশ, নগদ, ব্যাংক কার্ড ও বাকি (Due) পেমেন্ট হিসাব সক্রিয়', category: 'Finance', completed: true },
  { id: 'CHK-21', title: 'ইউজার রোল ও পারমিশন (ডাক্তার, ক্যাশিয়ার, টেকনিশিয়ান, প্যাথলজিস্ট)', category: 'Security', completed: true },
  { id: 'CHK-22', title: 'ক্লিনিক্যাল ও ফাইনান্সিয়াল ট্রানজেকশনের সম্পূর্ণ অডিট লগ (Audit Log)', category: 'Security', completed: true },
  { id: 'CHK-23', title: 'অটোমেটেড ডাটাবেজ ব্যাকআপ ও রিস্টোর প্রক্রিয়া পরীক্ষিত', category: 'Security', completed: true },
  { id: 'CHK-24', title: 'ইন্টারনেট বিচ্ছিন্ন থাকলেও অফলাইন পিওএস মোড ও অটো-সিঙ্ক কার্যকর', category: 'Infrastructure', completed: true },
  { id: 'CHK-25', title: 'রোগীর ডেটা সুরক্ষা ও কনসেন্ট (Consent) পলিসি কনফিগারেশন', category: 'Compliance', completed: true },
  { id: 'CHK-26', title: 'ক্যান্সার ও টিউমার মার্কার বান্ডেলে সেফটি ডিসক্লেইমার সক্রিয়', category: 'Clinical Safety', completed: true },
  { id: 'CHK-27', title: 'ল্যাব কোয়ালিটি ম্যানেজমেন্ট (LQMS) ও এসওপি (SOP) রেজিস্টার সক্রিয়', category: 'LQMS', completed: true },
  { id: 'CHK-28', title: 'বায়োমেডিকেল বর্জ্য পৃথকীকরণ ও নিরাপদ অপসারণ লগ সম্পন্ন', category: 'Biosafety', completed: true },
  { id: 'CHK-29', title: 'ল্যাব কনজিউমেবলস ও রিএজেন্ট স্টক ট্র্যাকিং নিশ্চিত করা হয়েছে', category: 'Inventory', completed: true },
  { id: 'CHK-30', title: 'ইনস্যুরেন্স ও টিপিএ (TPA) ক্লেইম ম্যানেজমেন্ট মডিউল টেস্টেড', category: 'Billing', completed: true },
  { id: 'CHK-31', title: 'কল সেন্টার ও পেশেন্ট টিকিট সাপোর্ট সিস্টেম সক্রিয়', category: 'Support', completed: true },
  { id: 'CHK-32', title: 'বিজনেস ইন্টেলিজেন্স ও রিঅর্ডার প্রেডিক্টিভ অ্যানালিটিক্স রেডি', category: 'BI', completed: true },
  { id: 'CHK-33', title: 'প্রোডাকশন গো-লাইভ অ্যাডমিন ও মেডিকেল ডিরেক্টর অনুমোদন স্বাক্ষরিত', category: 'Go-Live', completed: true }
];
