// Master Industry Templates Catalog for HisabKitab 360
// Supports 100+ business types across 10 major industry sectors

export const INDUSTRY_SECTORS = [
  { id: 'food_dining', name: 'রেস্টুরেন্ট, ক্যাফে ও খাদ্য ব্যবসা', enName: 'Food, Dining & Hospitality', icon: 'Utensils', color: '#f59e0b' },
  { id: 'retail_grocery', name: 'মুদি, সুপারশপ ও কাঁচাবাজার', enName: 'Grocery, Super Shop & Retail', icon: 'ShoppingCart', color: '#10b981' },
  { id: 'pharmacy_health', name: 'ফার্মেসি, ল্যাব ও স্বাস্থ্যসেবা', enName: 'Pharmacy & Healthcare', icon: 'HeartPulse', color: '#ef4444' },
  { id: 'fashion_apparel', name: 'পোশাক, ফ্যাশন ও জুতা', enName: 'Fashion, Tailoring & Footwear', icon: 'Shirt', color: '#8b5cf6' },
  { id: 'electronics_mobile', name: 'মোবাইল, গ্যাজেট ও ইলেকট্রনিক্স', enName: 'Mobile, Gadgets & Hardware', icon: 'Smartphone', color: '#3b82f6' },
  { id: 'transport_travel', name: 'বাস, পরিবহন ও ট্রাভেল টিকিট', enName: 'Bus, Ticket Counter & Travel', icon: 'Bus', color: '#06b6d4' },
  { id: 'construction_materials', name: 'নির্মাণ সামগ্রী, রড-সিমেন্ট ও স-মিল', enName: 'Construction & Building Materials', icon: 'Building2', color: '#e11d48' },
  { id: 'jewelry_gold', name: 'স্বর্ণ, জুয়েলারি ও মূল্যবান অলংকার', enName: 'Jewelry, Gold & Gemstones', icon: 'Gem', color: '#d97706' },
  { id: 'logistics_courier', name: 'কুরিয়ার, পার্সেল ও সিএন্ডএফ', enName: 'Courier, Logistics & Freight', icon: 'Truck', color: '#6366f1' },
  { id: 'services_lifestyle', name: 'সেলুন, পার্লার, লন্ড্রি ও সার্ভিস', enName: 'Services, Salon & Lifestyle', icon: 'Scissors', color: '#ec4899' },
  { id: 'agro_poultry', name: 'কৃষি, পোল্ট্রি, ডেইরি ও ফিশারিজ', enName: 'Agriculture, Poultry & Dairy', icon: 'Wheat', color: '#84cc16' },
  { id: 'entertainment_events', name: 'সিনেমা, ইভেন্ট ও টিকেট বুকিং', enName: 'Cinema, Events & Entertainment', icon: 'Film', color: '#a855f7' }
];

export const MASTER_INDUSTRY_TEMPLATES = [
  // ==========================================
  // 1. FOOD & DINING
  // ==========================================
  {
    id: 'food_restaurant',
    sectorId: 'food_dining',
    name: 'ডাইন-ইন রেস্টুরেন্ট ও ক্যাফে',
    enName: 'Dine-in Restaurant & Cafe',
    icon: 'UtensilsCrossed',
    uiMode: 'restaurant',
    posViewMode: 'image_grid', // 'image_grid' | 'hybrid' | 'compact'
    supportsPhotos: true,
    units: ['প্লেট', 'সার্ভিং', 'পিস', 'বাটি', 'গ্লাস', 'সেট', 'হাফ', 'ফুল'],
    features: ['table_system', 'kot_kitchen', 'variants_sizes', 'waiter_tracking'],
    defaultCategories: ['রাইস ও বিরিয়ানি', 'কারি ও ঝোল', 'চিকেন ও মাটন', 'চাইনিজ ও থাই', 'কোল্ড ড্রিংকস', 'ডেজার্ট', 'স্পেশাল প্যাকেজ'],
    sampleProducts: [
      { name: 'চিকেন দম বিরিয়ানি (হাফ)', category: 'রাইস ও বিরিয়ানি', costPrice: 160, sellPrice: 240, unit: 'প্লেট', stock: 50, image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300' },
      { name: 'স্পেশাল মাটন কাচ্চি (ফুল)', category: 'রাইস ও বিরিয়ানি', costPrice: 280, sellPrice: 380, unit: 'প্লেট', stock: 40, image: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=300' },
      { name: 'ক্রিস্পি ফ্রাইড চিকেন (২ পিস)', category: 'চিকেন ও মাটন', costPrice: 120, sellPrice: 190, unit: 'সেট', stock: 60, image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=300' },
      { name: 'গার্লিক বাটার নান', category: 'রাইস ও বিরিয়ানি', costPrice: 25, sellPrice: 50, unit: 'পিস', stock: 100, image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300' },
      { name: 'চিকেন কর্ন স্যুপ (বাটি)', category: 'চাইনিজ ও থাই', costPrice: 90, sellPrice: 150, unit: 'বাটি', stock: 30, image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=300' },
      { name: 'কোল্ড কফি উইথ আইসক্রিম', category: 'কোল্ড ড্রিংকস', costPrice: 65, sellPrice: 120, unit: 'গ্লাস', stock: 45, image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=300' }
    ]
  },
  {
    id: 'food_fastfood',
    sectorId: 'food_dining',
    name: 'ফাস্ট ফুড, পিৎজা ও বার্গার শপ',
    enName: 'Fast Food, Burger & Pizza',
    icon: 'Flame',
    uiMode: 'restaurant',
    posViewMode: 'image_grid',
    supportsPhotos: true,
    units: ['পিস', 'সেট', 'কম্বো', 'বক্স', 'প্যাক'],
    features: ['combo_deals', 'add_ons', 'kot_kitchen'],
    defaultCategories: ['বার্গার', 'পিৎজা', 'ফ্রাইড আইটেম', 'কম্বো মিল', 'সফট ড্রিংকস', 'শেয়ারিং প্লাটার'],
    sampleProducts: [
      { name: 'ক্লাসিক বিফ চিজবার্গার', category: 'বার্গার', costPrice: 150, sellPrice: 250, unit: 'পিস', stock: 35, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300' },
      { name: 'স্মোকি চিকেন পিৎজা (১০ ইঞ্চি)', category: 'পিৎজা', costPrice: 320, sellPrice: 520, unit: 'পিস', stock: 25, image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300' },
      { name: 'ফ্রেঞ্চ ফ্রাইস (লার্জ)', category: 'ফ্রাইড আইটেম', costPrice: 45, sellPrice: 110, unit: 'প্যাক', stock: 80, image: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=300' }
    ]
  },
  {
    id: 'food_bakery',
    sectorId: 'food_dining',
    name: 'বেকারি ও পেস্ট্রি শপ',
    enName: 'Bakery & Pastry Shop',
    icon: 'Cake',
    uiMode: 'standard',
    posViewMode: 'image_grid',
    supportsPhotos: true,
    units: ['পাউন্ড', 'পিস', 'বক্স', 'কেজি', 'প্যাক'],
    features: ['cake_advance_booking', 'expiry_date', 'custom_flavors'],
    defaultCategories: ['বার্থডে কেক', 'পেস্ট্রি ও রোল', 'বিস্কুট ও কুকিজ', 'ব্রেড ও বান', 'স্ন্যাক্স ও প্যাটিস'],
    sampleProducts: [
      { name: 'চকলেট ফাজ কেক (১ পাউন্ড)', category: 'বার্থডে কেক', costPrice: 350, sellPrice: 650, unit: 'পাউন্ড', stock: 12, image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300' },
      { name: 'রেড ভেলভেট পেস্ট্রি', category: 'পেস্ট্রি ও রোল', costPrice: 60, sellPrice: 120, unit: 'পিস', stock: 30, image: 'https://images.unsplash.com/photo-1616541823729-00fe0aacd32c?w=300' }
    ]
  },
  {
    id: 'food_sweet',
    sectorId: 'food_dining',
    name: 'মিষ্টান্ন ভান্ডার ও মিষ্টির দোকান',
    enName: 'Sweet & Desserts Shop',
    icon: 'Cookie',
    uiMode: 'standard',
    posViewMode: 'image_grid',
    supportsPhotos: true,
    units: ['কেজি', 'গ্রাম', 'হাড়ি', 'বক্স', 'পিস'],
    features: ['weight_scale', 'tare_box_weight', 'custom_packing'],
    defaultCategories: ['রসগোল্লা ও চমচম', 'দই ও মিষ্টি দই', 'সন্দেশ ও প্যাড়া', 'লাড্ডু ও জিলাপি', 'ঘি ও ননী'],
    sampleProducts: [
      { name: 'বগুড়ার স্পেশাল ক্ষীরসা দই (হাঁড়ি)', category: 'দই ও মিষ্টি দই', costPrice: 180, sellPrice: 280, unit: 'হাড়ি', stock: 40, image: 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=300' },
      { name: 'স্পঞ্জ রসগোল্লা (১ কেজি)', category: 'রসগোল্লা ও চমচম', costPrice: 220, sellPrice: 340, unit: 'কেজি', stock: 25, image: 'https://images.unsplash.com/photo-1589119908995-c6837fa14d48?w=300' }
    ]
  },
  {
    id: 'food_cafe_coffee',
    sectorId: 'food_dining',
    name: 'কফি শপ ও চা-জুস বার',
    enName: 'Coffee Shop & Juice Bar',
    icon: 'Coffee',
    uiMode: 'restaurant',
    posViewMode: 'image_grid',
    supportsPhotos: true,
    units: ['কাপ', 'গ্লাস', 'পিস', 'বটল'],
    features: ['sugar_level', 'cup_size_addon', 'quick_touch'],
    defaultCategories: ['হট কফি', 'আইস কফি', 'ফ্রেশ ফ্রুট জুস', 'চা ও মসলা চা', 'কুকিজ ও স্ন্যাক্স'],
    sampleProducts: [
      { name: 'ক্যাপুচিনো (রেগুলার)', category: 'হট কফি', costPrice: 60, sellPrice: 140, unit: 'কাপ', stock: 100, image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=300' }
    ]
  },

  // ==========================================
  // 2. RETAIL & GROCERY
  // ==========================================
  {
    id: 'retail_supershop',
    sectorId: 'retail_grocery',
    name: 'মডার্ন সুপারশপ ও ডিপার্টমেন্টাল স্টোর',
    enName: 'Super Shop & Departmental Store',
    icon: 'ShoppingBag',
    uiMode: 'standard',
    posViewMode: 'hybrid',
    supportsPhotos: true,
    units: ['পিস', 'কেজি', 'গ্রাম', 'প্যাক', 'লিটার', 'বক্স'],
    features: ['fast_barcode', 'multi_counter', 'loyalty_points', 'low_stock_alert'],
    defaultCategories: ['চাল, ডাল ও তেল', 'মসলা ও বেকারি', 'দুগ্ধজাত ও ডিম', 'পানীয় ও স্ন্যাক্স', 'কসমেটিকস ও টয়লেট্রিজ', 'বেবি কেয়ার', 'ক্লিনিং সামগ্রী'],
    sampleProducts: [
      { name: 'রূপচাঁদা সয়াবিন তেল (৫ লিটার)', category: 'চাল, ডাল ও তেল', costPrice: 880, sellPrice: 950, unit: 'পিস', stock: 45, barcode: '8941100112211' },
      { name: 'নাজিরশাইল প্রিমিয়াম চাল (২৫ কেজি)', category: 'চাল, ডাল ও তেল', costPrice: 1950, sellPrice: 2150, unit: 'ব্যাগ', stock: 30, barcode: '8941100112228' }
    ]
  },
  {
    id: 'retail_village_store',
    sectorId: 'retail_grocery',
    name: 'গ্রামের লোকাল মুদি দোকান (ভ্যালু-স্টক)',
    enName: 'Village Local Store (Value Stock)',
    icon: 'Store',
    uiMode: 'village_grocery',
    posViewMode: 'compact',
    supportsPhotos: false,
    units: ['টাকা', 'কেজি', 'পিস', 'পোয়া', 'সের'],
    features: ['lump_sum_stock', 'cash_in_out', 'due_khata_sms', 'simple_profit_calc'],
    defaultCategories: ['সাধারণ মুদি পণ্য', 'তেল ও চিনি', 'মসলা ও ডাল', 'সাবান ও প্রসাধন', 'বিস্কুট ও শুকনো খাবার'],
    sampleProducts: [
      { name: 'সার্বিক দৈনিক নগদ বিক্রি (Lump Sum)', category: 'সাধারণ মুদি পণ্য', costPrice: 0, sellPrice: 50, unit: 'টাকা', stock: 50000 }
    ]
  },
  {
    id: 'retail_raw_market',
    sectorId: 'retail_grocery',
    name: 'কাঁচাবাজার, শাকসবজি ও ফলমূলের দোকান',
    enName: 'Vegetable & Fruit Market',
    icon: 'Apple',
    uiMode: 'standard',
    posViewMode: 'image_grid',
    supportsPhotos: true,
    units: ['কেজি', 'গ্রাম', 'পাল্লা', 'পিস', 'ডজন', 'আটি'],
    features: ['digital_scale_sync', 'wastage_perishable', 'dynamic_pricing'],
    defaultCategories: ['তাজা শাকসবজি', 'দেশি ও বিদেশি ফল', 'আলু ও পেঁয়াজ', 'কাঁচামরিচ ও ধনেপাতা'],
    sampleProducts: [
      { name: 'দেশি গোল আলু (১ কেজি)', category: 'আলু ও পেঁয়াজ', costPrice: 28, sellPrice: 35, unit: 'কেজি', stock: 250, image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=300' },
      { name: 'মিষ্টি মাল্টা (১ কেজি)', category: 'দেশি ও বিদেশি ফল', costPrice: 180, sellPrice: 240, unit: 'কেজি', stock: 60, image: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=300' }
    ]
  },
  {
    id: 'retail_meat_fish',
    sectorId: 'retail_grocery',
    name: 'মাংস ও মাছের আড়ত / দোকান',
    enName: 'Meat & Fresh Fish Store',
    icon: 'Fish',
    uiMode: 'standard',
    posViewMode: 'hybrid',
    supportsPhotos: true,
    units: ['কেজি', 'গ্রাম', 'পিস', 'মণ', 'পাল্লা'],
    features: ['live_vs_dressed_weight', 'ice_expense', 'wastage_loss'],
    defaultCategories: ['ব্রয়লার মুরগি', 'সোনালি মুরগি', 'গরুর ফ্রেশ মাংস', 'খাসির মাংস', 'তাজা নদী ও সাগরের মাছ'],
    sampleProducts: [
      { name: 'গরুর সলিড মাংস (১ কেজি)', category: 'গরুর ফ্রেশ মাংস', costPrice: 680, sellPrice: 780, unit: 'কেজি', stock: 80, image: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=300' },
      { name: 'পদ্মার তাজা রুই মাছ (২ কেজি সাইজ)', category: 'তাজা নদী ও সাগরের মাছ', costPrice: 360, sellPrice: 450, unit: 'কেজি', stock: 45, image: 'https://images.unsplash.com/photo-1534948216015-843149f72be3?w=300' }
    ]
  },

  // ==========================================
  // 3. PHARMACY & HEALTHCARE
  // ==========================================
  {
    id: 'health_master_ecosystem',
    sectorId: 'pharmacy_health',
    name: 'স্মার্ট ক্লিনিক, ডায়াগনস্টিক ও ফার্মেসি ইকোসিস্টেম (৩-ইন-১)',
    enName: 'Smart Clinic, Diagnostic & Pharmacy 3-in-1 Ecosystem',
    icon: 'Activity',
    uiMode: 'healthcare',
    posViewMode: 'compact',
    supportsPhotos: false,
    units: ['রোগী/পেশেন্ট', 'টেস্ট/ইনভেস্টিগেশন', 'পাতা/Strip', 'ট্যাবলেট/পিস', 'বক্স'],
    features: ['hospital_chamber', 'diagnostic_lims', 'fefo_pharmacy', 'central_patient_id', 'prescription_sync'],
    defaultCategories: ['ডক্টর কনসালটেশন', 'প্যাথলজি ও ল্যাব টেস্ট', 'রেডিওলজি ও আল্ট্রাসনোগ্রাফি', 'জরুরি ও প্রাথমিক চিকিৎসা', 'ওষুধ ও ফার্মেসি'],
    sampleProducts: [
      { name: 'জেনারেল ডক্টর কনসালটেশন ফি', category: 'ডক্টর কনসালটেশন', costPrice: 0, sellPrice: 500, unit: 'পেশেন্ট' },
      { name: 'সিবিসি (CBC with ESR) রক্ত পরীক্ষা', category: 'প্যাথলজি ও ল্যাব টেস্ট', costPrice: 120, sellPrice: 400, unit: 'টেস্ট' },
      { name: 'Napa Extra (500mg+65mg)', genericName: 'Paracetamol + Caffeine', category: 'ওষুধ ও ফার্মেসি', costPrice: 2.2, sellPrice: 3.0, unit: 'ট্যাবলেট/পিস', stock: 500, batch: 'B2401', expiryDate: '2027-08-31' }
    ]
  },
  {
    id: 'health_pharmacy',
    sectorId: 'pharmacy_health',
    name: 'খুচরা ফার্মেসি ও ওষুধের দোকান',
    enName: 'Retail Pharmacy & Drugstore',
    icon: 'Pill',
    uiMode: 'pharmacy',
    posViewMode: 'compact',
    supportsPhotos: false,
    units: ['পাতা/Strip', 'ট্যাবলেট/পিস', 'বোতল/ফাইল', 'বক্স', 'ড্রপ', 'ইনজেকশন'],
    features: ['generic_brand_search', 'strip_tablet_converter', 'expiry_date_alert', 'batch_number'],
    defaultCategories: ['প্যারাসিটামল ও জ্বর', 'গ্যাস্ট্রিক ও এন্টাসিড', 'অ্যান্টিবায়োটিক', 'ডায়াবেটিস ও প্রেশার', 'ভিটামিন ও সাপ্লিমেন্ট', 'শিশু ও শিশুখাদ্য', 'সার্জিক্যাল ও ফার্স্টএইড'],
    sampleProducts: [
      { name: 'Napa Extra (500mg+65mg)', genericName: 'Paracetamol + Caffeine', category: 'প্যারাসিটামল ও জ্বর', costPrice: 2.2, sellPrice: 3.0, unit: 'ট্যাবলেট/পিস', stock: 500, batch: 'B2401', expiryDate: '2027-08-31' },
      { name: 'Seclo 20mg Capsule', genericName: 'Omeprazole', category: 'গ্যাস্ট্রিক ও এন্টাসিড', costPrice: 5.5, sellPrice: 7.0, unit: 'ট্যাবলেট/পিস', stock: 400, batch: 'OM88', expiryDate: '2028-02-28' },
      { name: 'Pantonix 20mg Tablet', genericName: 'Pantoprazole', category: 'গ্যাস্ট্রিক ও এন্টাসিড', costPrice: 6.0, sellPrice: 8.0, unit: 'ট্যাবলেট/পিস', stock: 350, batch: 'PX11', expiryDate: '2027-11-30' }
    ]
  },
  {
    id: 'health_optics',
    sectorId: 'pharmacy_health',
    name: 'চশমার দোকান ও অপটিক্যাল শপ',
    enName: 'Optical & Eyewear Store',
    icon: 'Glasses',
    uiMode: 'standard',
    posViewMode: 'image_grid',
    supportsPhotos: true,
    units: ['পিস', 'সেট', 'জোড়া'],
    features: ['eye_power_prescription', 'frame_lens_fitting', 'warranty_card'],
    defaultCategories: ['চশমার ফ্রেম', 'আইগ্লাস লেন্স', 'সানগ্লাস', 'কন্টাক্ট লেন্স', 'চশমার কেস ও ড্রপ'],
    sampleProducts: [
      { name: 'টাইটানিয়াম লাইটওয়েট ফ্রেম', category: 'চশমার ফ্রেম', costPrice: 650, sellPrice: 1500, unit: 'পিস', stock: 25, image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=300' }
    ]
  },

  // ==========================================
  // 4. TRANSPORT, BUS & TICKETING
  // ==========================================
  {
    id: 'travel_bus_counter',
    sectorId: 'transport_travel',
    name: 'বাস টিকিট কাউন্টার ও ট্রাভেল এজেন্সি',
    enName: 'Bus Ticket Counter & Travel',
    icon: 'Bus',
    uiMode: 'bus_counter',
    posViewMode: 'compact',
    supportsPhotos: false,
    units: ['সিট', 'টিকেট', 'প্যাসেঞ্জার'],
    features: ['seat_map_visual', 'routes_destinations', 'trip_schedules', 'passenger_sms_ticket'],
    defaultCategories: ['ঢাকা ➔ চট্টগ্রাম', 'ঢাকা ➔ সিলেট', 'ঢাকা ➔ রাজশাহী', 'ঢাকা ➔ কক্সবাজার', 'লোকাল ট্রিপ'],
    sampleProducts: [
      { name: 'ঢাকা ➔ চট্টগ্রাম (এসি বিজনেস ক্লাস - সিট A1)', category: 'ঢাকা ➔ চট্টগ্রাম', costPrice: 900, sellPrice: 1400, unit: 'সিট', stock: 1 },
      { name: 'ঢাকা ➔ কক্সবাজার (স্লিপার কোচ - সিট B2)', category: 'ঢাকা ➔ কক্সবাজার', costPrice: 1200, sellPrice: 1800, unit: 'সিট', stock: 1 }
    ]
  },
  {
    id: 'travel_cinema_event',
    sectorId: 'entertainment_events',
    name: 'সিনেমা হল, থিয়েটার ও ইভেন্ট টিকিট',
    enName: 'Cinema & Event Ticketing',
    icon: 'Film',
    uiMode: 'cinema',
    posViewMode: 'compact',
    supportsPhotos: false,
    units: ['টিকেট', 'পাস', 'সিট'],
    features: ['showtime_slots', 'screen_classes', 'quick_qr_pass', 'gate_entry_scan'],
    defaultCategories: ['মর্নিং শো (১১:০০ AM)', 'ম্যাটিনি শো (৩:০০ PM)', 'ইভনিং শো (৬:৩০ PM)', 'নাইট শো (৯:০০ PM)'],
    sampleProducts: [
      { name: 'ইভনিং শো (ভিআইপি ব্যালকনি)', category: 'ইভনিং শো (৬:৩০ PM)', costPrice: 200, sellPrice: 500, unit: 'টিকেট', stock: 50 },
      { name: 'ম্যাটিনি শো (রেগুলার ডেক)', category: 'ম্যাটিনি শো (৩:০০ PM)', costPrice: 120, sellPrice: 300, unit: 'টিকেট', stock: 120 }
    ]
  },

  // ==========================================
  // 5. MOBILE & ELECTRONICS
  // ==========================================
  {
    id: 'elec_mobile_shop',
    sectorId: 'electronics_mobile',
    name: 'মোবাইল শপ, গ্যাজেট ও এক্সেসরিজ',
    enName: 'Mobile, Gadgets & Accessories',
    icon: 'Smartphone',
    uiMode: 'mobile',
    posViewMode: 'image_grid',
    supportsPhotos: true,
    units: ['পিস', 'বক্স', 'সেট'],
    features: ['imei_serial_tracking', 'warranty_duration', 'battery_health_record'],
    defaultCategories: ['স্মার্টফোন', 'ফিচার ফোন', 'ইয়ারবাডস ও হেডফোন', 'চার্জার ও কেবল', 'পাওয়ার ব্যাংক', 'কভার ও গ্লাস প্রটেক্টর'],
    sampleProducts: [
      { name: 'Redmi Note 13 (8GB/256GB)', category: 'স্মার্টফোন', costPrice: 21500, sellPrice: 24999, unit: 'পিস', stock: 8, image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=300' },
      { name: 'Realme T100 Wireless Earbuds', category: 'ইয়ারবাডস ও হেডফোন', costPrice: 1500, sellPrice: 2200, unit: 'পিস', stock: 18, image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300' }
    ]
  },
  {
    id: 'elec_computer_parts',
    sectorId: 'electronics_mobile',
    name: 'কম্পিউটার শোরুম ও ল্যাপটপ পার্টস',
    enName: 'Computer & Laptop Parts',
    icon: 'Laptop',
    uiMode: 'standard',
    posViewMode: 'hybrid',
    supportsPhotos: true,
    units: ['পিস', 'বক্স', 'সেট'],
    features: ['component_serial_scan', 'parts_warranty', 'custom_pc_build'],
    defaultCategories: ['প্রসেসর', 'মাদারবোর্ড', 'র‍্যাম ও এসএসডি', 'গ্রাফিক্স কার্ড', 'মনিটর', 'কীবোর্ড ও মাউস'],
    sampleProducts: [
      { name: 'Samsung 980 Pro 1TB NVMe SSD', category: 'র‍্যাম ও এসএসডি', costPrice: 9500, sellPrice: 11800, unit: 'পিস', stock: 14 }
    ]
  },

  // ==========================================
  // 6. FASHION & APPAREL
  // ==========================================
  {
    id: 'fashion_clothing',
    sectorId: 'fashion_apparel',
    name: 'রেডিমেড গার্মেন্টস ও ফ্যাশন আউটলেট',
    enName: 'Clothing & Fashion Store',
    icon: 'Shirt',
    uiMode: 'standard',
    posViewMode: 'image_grid',
    supportsPhotos: true,
    units: ['পিস', 'সেট', 'জোড়া'],
    features: ['size_color_matrix', 'barcode_tag_print', 'exchange_policy'],
    defaultCategories: ['পুরুষদের শার্ট', 'টি-শার্ট ও পোলো', 'জিন্স ও গ্যাবার্ডিন', 'পাঞ্জাবি ও পায়জামা', 'মহিলাদের থ্রি-পিস', 'শিশুদের পোশাক'],
    sampleProducts: [
      { name: 'প্রিমিয়াম কটন ফর্মাল শার্ট (L)', category: 'পুরুষদের শার্ট', costPrice: 650, sellPrice: 1250, unit: 'পিস', stock: 25, image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=300' },
      { name: 'স্লিম ফিট স্ট্রেচ জিন্স (৩২")', category: 'জিন্স ও গ্যাবার্ডিন', costPrice: 850, sellPrice: 1650, unit: 'পিস', stock: 30, image: 'https://images.unsplash.com/photo-1542272604-780c96856592?w=300' }
    ]
  },
  {
    id: 'fashion_tailors',
    sectorId: 'fashion_apparel',
    name: 'টেইলার্স ও দর্জির দোকান',
    enName: 'Tailoring & Custom Stitching',
    icon: 'Scissors',
    uiMode: 'standard',
    posViewMode: 'compact',
    supportsPhotos: false,
    units: ['সেট', 'পিস', 'জোড়া'],
    features: ['body_measurements', 'trial_delivery_date', 'advance_token'],
    defaultCategories: ['শার্ট সেলাই', 'প্যান্ট সেলাই', 'পাঞ্জাবি সেলাই', 'ব্লেজার ও স্যুট', 'ব্লাউজ ও সালোয়ার'],
    sampleProducts: [
      { name: 'ফর্মাল শার্ট সেলাই মজুরি', category: 'শার্ট সেলাই', costPrice: 150, sellPrice: 400, unit: 'পিস', stock: 100 }
    ]
  },

  // ==========================================
  // 7. CONSTRUCTION & MATERIALS
  // ==========================================
  {
    id: 'const_rod_cement',
    sectorId: 'construction_materials',
    name: 'রড, সিমেন্ট ও ইট সাপ্লায়ার',
    enName: 'Rod, Cement & Bricks Supplier',
    icon: 'Building2',
    uiMode: 'standard',
    posViewMode: 'compact',
    supportsPhotos: false,
    units: ['টন (Ton)', 'বস্তা/Bag', 'হাজার (১০০০)', 'পিস', 'কেজি'],
    features: ['truck_challan', 'site_delivery_tracking', 'bulk_discount', 'customer_ledger'],
    defaultCategories: ['রড (60/72 Grade)', 'সিমেন্ট (OPC/PCC)', 'পোড়া ইট ও ব্লক', 'বালু ও খোয়া'],
    sampleProducts: [
      { name: 'BSRM 16mm Xtreme Rod (১ টন)', category: 'রড (60/72 Grade)', costPrice: 88000, sellPrice: 93500, unit: 'টন (Ton)', stock: 25 },
      { name: 'Shah Cement Special (বস্তা)', category: 'সিমেন্ট (OPC/PCC)', costPrice: 480, sellPrice: 530, unit: 'বস্তা/Bag', stock: 400 }
    ]
  },
  {
    id: 'const_sand_stone',
    sectorId: 'construction_materials',
    name: 'বালু, পাথর ও ফিলিং সাপ্লাই',
    enName: 'Sand, Stone & Aggregate',
    icon: 'Layers',
    uiMode: 'standard',
    posViewMode: 'compact',
    supportsPhotos: false,
    units: ['সিএফটি (CFT)', 'ট্রাক', 'নৌকা', 'গাড়ি'],
    features: ['cft_calculator', 'boat_truck_challan'],
    defaultCategories: ['সিলেট বালু (CFT)', 'লোকাল বালু (CFT)', 'ভোলগঞ্জ পাথর (CFT)', 'পাথর কুচি'],
    sampleProducts: [
      { name: 'সিলেট লাল বালু (১০০ CFT)', category: 'সিলেট বালু (CFT)', costPrice: 4200, sellPrice: 5200, unit: 'সিএফটি (CFT)', stock: 5000 }
    ]
  },

  // ==========================================
  // 8. JEWELRY & GOLD
  // ==========================================
  {
    id: 'jewel_gold_shop',
    sectorId: 'jewelry_gold',
    name: 'সোনার অলংকার ও জুয়েলারি শপ',
    enName: 'Jewelry & Gold Ornament Store',
    icon: 'Gem',
    uiMode: 'standard',
    posViewMode: 'image_grid',
    supportsPhotos: true,
    units: ['ভরি', 'আনা', 'রতি', 'গ্রাম', 'পিস'],
    features: ['bhori_gram_calculator', 'making_charges', 'gold_carat_22k_21k', 'melting_wastage'],
    defaultCategories: ['সোনার চেইন ও হার', 'সোনার আংটি', 'কানের দুল ও ঝুমকা', 'সোনার চুড়ি ও বালা', 'রুপার গহনা', 'ডায়মন্ড নোজপিন'],
    sampleProducts: [
      { name: '২২ ক্যারেট সোনার নেকলেস (১ ভরি)', category: 'সোনার চেইন ও হার', costPrice: 118000, sellPrice: 125000, unit: 'ভরি', stock: 6, image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=300' }
    ]
  },

  // ==========================================
  // 9. AUTOMOTIVE & WORKSHOP
  // ==========================================
  {
    id: 'auto_parts_workshop',
    sectorId: 'transport_travel',
    name: 'অটো পার্টস ও মোটর মেকানিক গ্যারেজ',
    enName: 'Auto Parts & Garage Workshop',
    icon: 'Wrench',
    uiMode: 'standard',
    posViewMode: 'hybrid',
    supportsPhotos: true,
    units: ['পিস', 'লিটার', 'সেট', 'ঘণ্টা'],
    features: ['parts_plus_mechanic_labor', 'vehicle_reg_plate', 'service_history'],
    defaultCategories: ['ইঞ্জিন অয়েল ও লুব্রিকেন্ট', 'ব্রেক প্যাড ও ডিস্ক', 'ফিল্টার ও প্লাগ', 'মেকানিক সার্ভিস মজুরি', 'ব্যাটারি ও টায়ার'],
    sampleProducts: [
      { name: 'Mobil Super 20W-50 Engine Oil (4L)', category: 'ইঞ্জিন অয়েল ও লুব্রিকেন্ট', costPrice: 1950, sellPrice: 2400, unit: 'পিস', stock: 24 },
      { name: 'জেনারেল ইঞ্জিন টিউনিং ও ওয়াশ মজুরি', category: 'মেকানিক সার্ভিস মজুরি', costPrice: 200, sellPrice: 600, unit: 'সেট', stock: 999 }
    ]
  },

  // ==========================================
  // 10. SERVICES & SALON
  // ==========================================
  {
    id: 'serv_salon_parlour',
    sectorId: 'services_lifestyle',
    name: 'বিউটি পার্লার ও জেন্টস সেলুন',
    enName: 'Beauty Parlour & Mens Salon',
    icon: 'Sparkles',
    uiMode: 'standard',
    posViewMode: 'image_grid',
    supportsPhotos: true,
    units: ['সার্ভিস', 'প্যাকেজ', 'জন'],
    features: ['staff_stylist_commission', 'service_time_duration', 'membership_discount'],
    defaultCategories: ['হেয়ার কাট ও স্টাইল', 'দাড়ি ট্রিম ও শেভ', 'ফেসিয়াল ও স্কিন কেয়ার', 'হেয়ার কালার ও স্পা', 'ব্রাইডাল মেকআপ প্যাকেজ'],
    sampleProducts: [
      { name: 'ভিআইপি হেয়ার কাট ও ফেসিয়াল কম্বো', category: 'হেয়ার কাট ও স্টাইল', costPrice: 100, sellPrice: 450, unit: 'প্যাকেজ', stock: 999, image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=300' }
    ]
  },
  {
    id: 'serv_laundry',
    sectorId: 'services_lifestyle',
    name: 'লন্ড্রি ও ড্রাই ক্লিনিং শপ',
    enName: 'Laundry & Dry Cleaners',
    icon: 'Shirt',
    uiMode: 'standard',
    posViewMode: 'compact',
    supportsPhotos: false,
    units: ['পিস', 'সেট', 'জোড়া'],
    features: ['cloth_tag_tracking', 'delivery_date_sms', 'stain_notes'],
    defaultCategories: ['শার্ট ও প্যান্ট আয়রন', 'স্যুট ও ব্লেজার ড্রাই ক্লিন', 'শাড়ি ও লেহেঙ্গা ওয়াশ', 'কম্বল ও চাদর ধোলাই'],
    sampleProducts: [
      { name: 'স্যুট ড্রাই ক্লিন ও স্টিম প্রেস', category: 'স্যুট ও ব্লেজার ড্রাই ক্লিন', costPrice: 80, sellPrice: 250, unit: 'সেট', stock: 999 }
    ]
  },

  // ==========================================
  // 11. AGRO, FEED & POULTRY
  // ==========================================
  {
    id: 'agro_poultry_feed',
    sectorId: 'agro_poultry',
    name: 'পোল্ট্রি, ডেইরি ও মাছের খাদ্য ডিলার',
    enName: 'Poultry, Feed & Agro Dealer',
    icon: 'Wheat',
    uiMode: 'standard',
    posViewMode: 'compact',
    supportsPhotos: false,
    units: ['বস্তা/Bag', 'কেজি', 'বোতল', 'পিস'],
    features: ['farmer_credit_khata', 'batch_expiry', 'feed_commission'],
    defaultCategories: ['ব্রয়লার ফিড (৫০ কেজি)', 'লেয়ার ফিড (৫০ কেজি)', 'মাছের ভাসমান ফিড', 'পশু প্রিমিক্স ও মেডিসিন'],
    sampleProducts: [
      { name: 'সিপি ব্রয়লার স্টার্টার ফিড (৫০ কেজি)', category: 'ব্রয়লার ফিড (৫০ কেজি)', costPrice: 3200, sellPrice: 3450, unit: 'বস্তা/Bag', stock: 80 }
    ]
  },

  // ==========================================
  // EXPANDED POPULAR BANGLADESHI INDUSTRY TEMPLATES
  // ==========================================
  {
    id: 'food_biryani_kacchi',
    sectorId: 'food_dining',
    name: 'ঐতিহ্যবাহী কাচ্চি ও বিরিয়ানি হাউজ',
    enName: 'Kacchi & Biryani House',
    icon: 'UtensilsCrossed',
    uiMode: 'restaurant',
    posViewMode: 'image_grid',
    supportsPhotos: true,
    units: ['প্লেট', 'সার্ভিং', 'বোরহানি গ্লাস', 'হাফ', 'ফুল', 'হাঁড়ি'],
    features: ['table_system', 'kot_kitchen', 'borhani_addon', 'takeaway_box'],
    defaultCategories: ['কাচ্চি বিরিয়ানি', 'তেহারি ও পোলাও', 'চিকেন চাপ ও কাবাব', 'বোরহানি ও পানীয়', 'ফিরনি ও জর্দা'],
    sampleProducts: [
      { name: 'স্পেশাল বাসমতী মাটন কাচ্চি (ফুল)', category: 'কাচ্চি বিরিয়ানি', costPrice: 280, sellPrice: 390, unit: 'প্লেট', stock: 65, image: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=300' },
      { name: 'পুরান ঢাকার বিফ তেহারি (হাফ)', category: 'তেহারি ও পোলাও', costPrice: 150, sellPrice: 220, unit: 'প্লেট', stock: 45, image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300' },
      { name: 'স্পেশাল মাটির পাত্রের বোরহানি (২৫০ মিলি)', category: 'বোরহানি ও পানীয়', costPrice: 35, sellPrice: 70, unit: 'বোরহানি গ্লাস', stock: 80, image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=300' },
      { name: 'শাহী জাফরানি ফিরনি', category: 'ফিরনি ও জর্দা', costPrice: 40, sellPrice: 80, unit: 'প্লেট', stock: 50, image: 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=300' }
    ]
  },
  {
    id: 'food_chinese_thai',
    sectorId: 'food_dining',
    name: 'চাইনিজ, থাই ও সি-ফুড রেস্টুরেন্ট',
    enName: 'Chinese, Thai & Seafood Restaurant',
    icon: 'Flame',
    uiMode: 'restaurant',
    posViewMode: 'image_grid',
    supportsPhotos: true,
    units: ['সার্ভিং (১:৩)', 'প্লেট', 'বাটি', 'পিস'],
    features: ['table_system', 'kot_kitchen', 'sharing_portions', 'spiciness_level'],
    defaultCategories: ['স্যুপ ও অ্যাপেটাইজার', 'ফ্রাইড রাইস ও চাউমিন', 'চিকেন ও প্রন সিজলিং', 'সি-ফুড ও ফিশ কারি', 'মকতেল ও বেভারেজ'],
    sampleProducts: [
      { name: 'স্পেশাল থাই স্যুপ (১:৩ সার্ভিং)', category: 'স্যুপ ও অ্যাপেটাইজার', costPrice: 180, sellPrice: 380, unit: 'বাটি', stock: 35, image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=300' },
      { name: 'স্মোকি চিকেন চাউমিন (১:৩)', category: 'ফ্রাইড রাইস ও চাউমিন', costPrice: 160, sellPrice: 320, unit: 'প্লেট', stock: 40, image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=300' },
      { name: 'সিজলিং বিফ উইথ অনিয়ন (১:৩)', category: 'চিকেন ও প্রন সিজলিং', costPrice: 240, sellPrice: 480, unit: 'সার্ভিং (১:৩)', stock: 25, image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=300' }
    ]
  },
  {
    id: 'retail_cosmetics',
    sectorId: 'retail_grocery',
    name: 'কসমেটিকস, পারফিউম ও স্কিনকেয়ার শপ',
    enName: 'Cosmetics, Perfume & Skincare',
    icon: 'Sparkles',
    uiMode: 'standard',
    posViewMode: 'image_grid',
    supportsPhotos: true,
    units: ['পিস', 'বক্স', 'প্যাক', 'বোতল'],
    features: ['shade_variants', 'expiry_date', 'tester_tracking', 'brand_filter'],
    defaultCategories: ['ফেস ওয়াশ ও ময়েশ্চারাইজার', 'সানস্ক্রিন ও সিরাম', 'লিপস্টিক ও মেকআপ', 'অরিজিনাল পারফিউম ও আতর', 'হেয়ার অয়েল ও শ্যাম্পু'],
    sampleProducts: [
      { name: 'Aqua Sunscreen Gel SPF 50+', category: 'সানস্ক্রিন ও সিরাম', costPrice: 650, sellPrice: 950, unit: 'পিস', stock: 20, image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300' },
      { name: 'Matte Liquid Lipstick (Ruby Red)', category: 'লিপস্টিক ও মেকআপ', costPrice: 280, sellPrice: 550, unit: 'পিস', stock: 35, image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=300' }
    ]
  },
  {
    id: 'fashion_saree_boutique',
    sectorId: 'fashion_apparel',
    name: 'শাড়ি, জামদানি ও লেডিস বুটিক',
    enName: 'Saree, Jamdani & Ladies Boutique',
    icon: 'Shirt',
    uiMode: 'standard',
    posViewMode: 'image_grid',
    supportsPhotos: true,
    units: ['পিস', 'সেট', 'জোড়া'],
    features: ['fabric_material_tag', 'catalog_showcase', 'matching_blouse_addon'],
    defaultCategories: ['ঢাকাই জামদানি শাড়ি', 'কাতান ও বেনারসি', 'সুতি ও হ্যান্ডলুম শাড়ি', 'থ্রি-পিস ও কুর্তি', 'বোরকা ও হিজাব কালেকশন'],
    sampleProducts: [
      { name: 'অরিজিনাল ডাবল রেশম জামদানি শাড়ি', category: 'ঢাকাই জামদানি শাড়ি', costPrice: 4500, sellPrice: 6800, unit: 'পিস', stock: 12, image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=300' },
      { name: 'ডিজাইনার ডিজিটাল প্রিন্ট থ্রি-পিস', category: 'থ্রি-পিস ও কুর্তি', costPrice: 1250, sellPrice: 1950, unit: 'সেট', stock: 28, image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=300' }
    ]
  },
  {
    id: 'fashion_shoes',
    sectorId: 'fashion_apparel',
    name: 'জুতা, স্নিকার্স ও লেদার শোরুম',
    enName: 'Footwear & Leather Goods',
    icon: 'Package',
    uiMode: 'standard',
    posViewMode: 'image_grid',
    supportsPhotos: true,
    units: ['জোড়া', 'পিস'],
    features: ['size_matrix_39_44', 'shoe_box_barcode', 'replacement_warranty'],
    defaultCategories: ['ফর্মাল লেদার জুতা', 'স্নিকার্স ও কেডস', 'লেডিস হিল ও ফ্ল্যাট', 'স্যান্ডেল ও চটি', 'চামড়ার মানিব্যাগ ও বেল্ট'],
    sampleProducts: [
      { name: 'জেনুইন লেদার ফর্মাল অক্সফোর্ড জুতা (সাইজ ৪২)', category: 'ফর্মাল লেদার জুতা', costPrice: 1850, sellPrice: 2850, unit: 'জোড়া', stock: 15, image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300' },
      { name: 'স্পোর্টস রানিং স্নিকার্স (লাইটওয়েট)', category: 'স্নিকার্স ও কেডস', costPrice: 1100, sellPrice: 1750, unit: 'জোড়া', stock: 24, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300' }
    ]
  },
  {
    id: 'fashion_panjabi',
    sectorId: 'fashion_apparel',
    name: 'প্রিমিয়াম পাঞ্জাবি, কাবলি ও পায়জামা',
    enName: 'Panjabi, Kabli & Mens Ethnic',
    icon: 'Shirt',
    uiMode: 'standard',
    posViewMode: 'image_grid',
    supportsPhotos: true,
    units: ['পিস', 'সেট'],
    features: ['size_38_44', 'collar_design', 'festival_offers'],
    defaultCategories: ['সেমি ফর্মাল পাঞ্জাবি', 'সিল্ক ও এম্ব্রয়ডারি পাঞ্জাবি', 'কাবলি সেট', 'আলিগড়ি পায়জামা ও ট্রাউজার', 'কটি ও শেরওয়ানি'],
    sampleProducts: [
      { name: 'জ্যাকোয়ার্ড কটন পাঞ্জাবি (সাইজ ৪০)', category: 'সেমি ফর্মাল পাঞ্জাবি', costPrice: 950, sellPrice: 1650, unit: 'পিস', stock: 30, image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=300' }
    ]
  },
  {
    id: 'elec_home_appliances',
    sectorId: 'electronics_mobile',
    name: 'টিভি, ফ্রিজ, এসি ও হোম অ্যাপ্লায়েন্স',
    enName: 'Home Appliances & Electronics',
    icon: 'Tv',
    uiMode: 'standard',
    posViewMode: 'image_grid',
    supportsPhotos: true,
    units: ['পিস', 'সেট'],
    features: ['compressor_warranty', 'emi_installment', 'free_home_delivery'],
    defaultCategories: ['স্মার্ট অ্যান্ড্রয়েড টিভি', 'রেফ্রিজারেটর ও ডিপ ফ্রিজ', 'ইনভার্টার এয়ার কন্ডিশনার', 'মাইক্রোওয়েভ ওভন', 'ওয়াশিং মেশিন ও ব্লেন্ডার'],
    sampleProducts: [
      { name: '43" 4K Smart Voice Control TV', category: 'স্মার্ট অ্যান্ড্রয়েড টিভি', costPrice: 28500, sellPrice: 34900, unit: 'পিস', stock: 5, image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=300' },
      { name: '1.5 Ton Dual Inverter AC (5 Star)', category: 'ইনভার্টার এয়ার কন্ডিশনার', costPrice: 48000, sellPrice: 56500, unit: 'পিস', stock: 4, image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=300' }
    ]
  },
  {
    id: 'const_sanitary_tiles',
    sectorId: 'construction_materials',
    name: 'টাইলস, স্যানিটারি ও বাথ ফিটিংস',
    enName: 'Tiles, Sanitary & Bathroom Fittings',
    icon: 'Building2',
    uiMode: 'standard',
    posViewMode: 'image_grid',
    supportsPhotos: true,
    units: ['বক্স (Box)', 'এসকিউএফটি (SFT)', 'পিস', 'সেট'],
    features: ['sft_to_box_calc', 'commode_fitting_warranty', 'breakage_free_delivery'],
    defaultCategories: ['ফ্লোর টাইলস (১৬x১৬, ২৪x২৪)', 'ওয়াল টাইলস (১০x১৬)', 'কমোড ও বেসিন সেট', 'বাথ মিক্সার ও ঝরনা', 'গ্রাউট ও টাইলস আঠা'],
    sampleProducts: [
      { name: '২৪" x ২৪" গ্লসি ফ্লোর টাইলস (বক্স - ১৬ SFT)', category: 'ফ্লোর টাইলস (১৬x১৬, ২৪x২৪)', costPrice: 850, sellPrice: 1150, unit: 'বক্স (Box)', stock: 120, image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=300' },
      { name: 'ওয়ান পিস স্মার্ট কমোড (প্রিমিয়াম সাদা)', category: 'কমোড ও বেসিন সেট', costPrice: 6200, sellPrice: 8500, unit: 'পিস', stock: 10, image: 'https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=300' }
    ]
  },
  {
    id: 'const_paint_hardware',
    sectorId: 'construction_materials',
    name: 'রঙের দোকান ও পেইন্ট সলিউশন',
    enName: 'Paints & Coating Hardware Store',
    icon: 'Layers',
    uiMode: 'standard',
    posViewMode: 'hybrid',
    supportsPhotos: true,
    units: ['ড্রাম (১৮.২L)', 'গ্যালন (৩.৬৪L)', 'লিটার', 'কেজি'],
    features: ['color_code_matching', 'tinting_machine_shade', 'area_sqft_estimator'],
    defaultCategories: ['প্লাস্টিক ইমালশন (ইন্টেরিয়র)', 'ওয়েদারকোট (এক্সটেরিয়র)', 'ডিসটেম্পার ও পুটি', 'রঙের রোলার ও ব্রাশ', 'থিনার ও তারপিন'],
    sampleProducts: [
      { name: 'Asian Paints Apex Weathercoat (১৮.২ লিটার)', category: 'ওয়েদারকোট (এক্সটেরিয়র)', costPrice: 6800, sellPrice: 7600, unit: 'ড্রাম (১৮.২L)', stock: 18, image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=300' }
    ]
  },
  {
    id: 'auto_motorcycle_bike',
    sectorId: 'transport_travel',
    name: 'মোটরসাইকেল, স্কুটার ও বাইক এক্সেসরিজ',
    enName: 'Motorcycle, Bike & Accessories',
    icon: 'Wrench',
    uiMode: 'mobile',
    posViewMode: 'image_grid',
    supportsPhotos: true,
    units: ['পিস', 'সেট', 'লিটার'],
    features: ['chassis_engine_number', 'brta_registration_service', 'free_servicing_coupon'],
    defaultCategories: ['বাইকার্স হেলমেট (DOT/ECE)', 'ইঞ্জিন অয়েল (10W-40, 20W-50)', 'চেইন স্প্রোকেট ও ব্রেক সু', 'রাইডিং গ্লাভস ও জ্যাকেট', 'হর্ন, ফগলাইট ও ব্যাটারি'],
    sampleProducts: [
      { name: 'DOT সার্টিফাইড ফুল ফেস হেলমেট (ম্যাট ব্ল্যাক)', category: 'বাইকার্স হেলমেট (DOT/ECE)', costPrice: 1650, sellPrice: 2450, unit: 'পিস', stock: 16, image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=300' },
      { name: 'Motul 7100 10W40 4T 100% Synthetic (1L)', category: 'ইঞ্জিন অয়েল (10W-40, 20W-50)', costPrice: 1250, sellPrice: 1550, unit: 'লিটার', stock: 36, image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=300' }
    ]
  },
  {
    id: 'agro_plant_nursery',
    sectorId: 'agro_poultry',
    name: 'গাছের চারা, ফুল ও নার্সারি বাগান',
    enName: 'Plant Nursery & Garden Store',
    icon: 'Wheat',
    uiMode: 'standard',
    posViewMode: 'image_grid',
    supportsPhotos: true,
    units: ['চারা/পিস', 'টব', 'ব্যাগ', 'কেজি'],
    features: ['watering_maintenance_notes', 'exotic_fruit_tags', 'pot_plant_combo'],
    defaultCategories: ['কলম করা ফলের চারা', 'ইনডোর ও বারান্দার গাছ', 'গোলাপ ও মৌসুমি ফুল', 'মাটি, কোকোপিট ও টব', 'জৈব সার ও স্প্রেয়ার'],
    sampleProducts: [
      { name: 'হাইব্রিড বারোমাসি কাটিমন আম চারা (কলম)', category: 'কলম করা ফলের চারা', costPrice: 150, sellPrice: 350, unit: 'চারা/পিস', stock: 50, image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=300' },
      { name: 'মনস্টেরা ডেলিসিওসা ইনডোর প্ল্যান্ট (টবসহ)', category: 'ইনডোর ও বারান্দার গাছ', costPrice: 350, sellPrice: 750, unit: 'টব', stock: 20, image: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=300' }
    ]
  },
  {
    id: 'retail_gift_toys',
    sectorId: 'retail_grocery',
    name: 'গিফট শপ, খেলনা ও বেবি আইটেম',
    enName: 'Gift Shop, Toys & Baby World',
    icon: 'Sparkles',
    uiMode: 'standard',
    posViewMode: 'image_grid',
    supportsPhotos: true,
    units: ['পিস', 'বক্স', 'সেট'],
    features: ['gift_wrapping_addon', 'age_group_filter', 'battery_check'],
    defaultCategories: ['রিমোট কন্ট্রোল গাড়ি ও ড্রোন', 'টেডি বিয়ার ও প্লাশ টয়', 'গিফট বক্স ও ফটো ফ্রেম', 'ঘড়ি ও ওয়ালেট গিফট প্যাক', 'চকলেট ও উইশিং কার্ড'],
    sampleProducts: [
      { name: '4WD হাই স্পিড রিমোট কন্ট্রোল কার', category: 'রিমোট কন্ট্রোল গাড়ি ও ড্রোন', costPrice: 850, sellPrice: 1450, unit: 'পিস', stock: 18, image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=300' }
    ]
  },
  {
    id: 'food_shwarma_grill',
    sectorId: 'food_dining',
    name: 'শর্মা, গ্রিল ও তন্দুর হাউস',
    enName: 'Shawarma, Grill & Tandoori',
    icon: 'Flame',
    uiMode: 'restaurant',
    posViewMode: 'image_grid',
    supportsPhotos: true,
    units: ['পিস', 'প্লেট', 'কোয়ার্টার', 'হাফ', 'ফুল'],
    features: ['table_system', 'kot_kitchen', 'extra_mayo_sauce'],
    defaultCategories: ['চিকেন শর্মা', 'গ্রিল চিকেন ও নান', 'শিক ও বটি কাবাব', 'সফট ড্রিংকস'],
    sampleProducts: [
      { name: 'চিকেন শর্মা র‍্যাপ (স্পাইসি)', category: 'চিকেন শর্মা', costPrice: 70, sellPrice: 130, unit: 'পিস', stock: 40, image: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=300' },
      { name: 'গ্রিল চিকেন (কোয়ার্টার) উইথ ১ নান', category: 'গ্রিল চিকেন ও নান', costPrice: 85, sellPrice: 150, unit: 'প্লেট', stock: 30, image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=300' }
    ]
  },
  {
    id: 'food_juice_smoothie',
    sectorId: 'food_dining',
    name: 'ফ্রুট জুস, স্মুদি ও মিল্কশেক বার',
    enName: 'Fresh Juice & Smoothie Bar',
    icon: 'Coffee',
    uiMode: 'restaurant',
    posViewMode: 'image_grid',
    supportsPhotos: true,
    units: ['গ্লাস', 'বটল', 'সার্ভিং'],
    features: ['sugar_free_option', 'add_nuts_honey'],
    defaultCategories: ['ফ্রেশ ফ্রুট জুস', 'মিল্কশেক ও স্মুদি', 'স্পেশাল লাচ্ছি ও ফালুদা'],
    sampleProducts: [
      { name: 'স্পেশাল শাহী লাচ্ছি (মাটির গ্লাস)', category: 'স্পেশাল লাচ্ছি ও ফালুদা', costPrice: 40, sellPrice: 80, unit: 'গ্লাস', stock: 60, image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=300' }
    ]
  },
  {
    id: 'retail_stationery_books',
    sectorId: 'retail_grocery',
    name: 'লাইব্রেরি, বুকস্টোর ও স্টেশনারি',
    enName: 'Library, Books & Stationery',
    icon: 'BookOpen',
    uiMode: 'standard',
    posViewMode: 'compact',
    supportsPhotos: false,
    units: ['পিস', 'ডজন', 'রিম', 'প্যাক'],
    features: ['photocopy_page_counter', 'book_publisher_index'],
    defaultCategories: ['স্কুল ও কলেজের বই', 'খাতা ও ডায়েরি', 'কলম, পেন্সিল ও কালার', 'A4 কাগজ ও আর্ট পেপার', 'অফিস স্টেশনারি ফাইল'],
    sampleProducts: [
      { name: 'বসুন্ধরা A4 পেপার রিম (৮০ GSM)', category: 'A4 কাগজ ও আর্ট পেপার', costPrice: 380, sellPrice: 440, unit: 'রিম', stock: 50, barcode: '89411990011' }
    ]
  },
  {
    id: 'retail_crockery_melamine',
    sectorId: 'retail_grocery',
    name: 'মেলামাইন, ডিনার সেট ও ক্রোকারিজ শপ',
    enName: 'Crockery, Melamine & Kitchenware',
    icon: 'ShoppingBag',
    uiMode: 'standard',
    posViewMode: 'image_grid',
    supportsPhotos: true,
    units: ['পিস', 'সেট (৩২ পিস)', 'ডজন'],
    features: ['dinner_set_breakdown', 'gift_pack'],
    defaultCategories: ['মেলামাইন ডিনার সেট', 'গ্লাস ও সিরামিক কাপ', 'নন-স্টিক ফ্রাইপ্যান ও কুকার', 'প্লাস্টিক কিচেন বাস্কেট'],
    sampleProducts: [
      { name: 'শরীফ মেলামাইন ৩২ পিস ডিনার সেট', category: 'মেলামাইন ডিনার সেট', costPrice: 2800, sellPrice: 3800, unit: 'সেট (৩২ পিস)', stock: 8, image: 'https://images.unsplash.com/photo-1614735241165-6756e1df61ab?w=300' }
    ]
  },
  {
    id: 'health_homeopathy',
    sectorId: 'pharmacy_health',
    name: 'হোমিওপ্যাথি ও ভেষজ চিকিৎসালয়',
    enName: 'Homeopathy & Herbal Clinic',
    icon: 'HeartPulse',
    uiMode: 'pharmacy',
    posViewMode: 'compact',
    supportsPhotos: false,
    units: ['আউন্স', 'ড্রাম', 'শিশি', 'প্যাক'],
    features: ['german_dilution_potency', 'sugar_globules_mix'],
    defaultCategories: ['জার্মান ডিলিউশন', 'বায়োকেমিক ট্যাবলেট', 'মাদার টিংচার', 'ড্রপস ও সিরাপ'],
    sampleProducts: [
      { name: 'Dr. Reckeweg R1 Drops (22ml)', category: 'জার্মান ডিলিউশন', costPrice: 420, sellPrice: 520, unit: 'শিশি', stock: 15 }
    ]
  },
  {
    id: 'health_dental_clinic',
    sectorId: 'pharmacy_health',
    name: 'ডেন্টাল ক্লিনিক ও দাঁতের সেবা',
    enName: 'Dental Clinic & Care',
    icon: 'Pill',
    uiMode: 'standard',
    posViewMode: 'compact',
    supportsPhotos: false,
    units: ['সার্ভিস', 'পিস'],
    features: ['patient_history', 'teeth_chart_note', 'next_sitting_date'],
    defaultCategories: ['দাঁত স্কেলিং ও পলিশিং', 'দাঁতের ফিলিং ও আরসিটি', 'দাঁত তোলা ও ক্যাপ বসানো', 'মাউথওয়াশ ও ব্রাশ'],
    sampleProducts: [
      { name: 'ফুল মাউথ স্কেলিং ও পলিশিং', category: 'দাঁত স্কেলিং ও পলিশিং', costPrice: 200, sellPrice: 1200, unit: 'সার্ভিস', stock: 999 }
    ]
  },
  {
    id: 'fashion_ladies_burqa',
    sectorId: 'fashion_apparel',
    name: 'বোরকা, হিজাব ও আবায়া কালেকশন',
    enName: 'Burqa, Hijab & Abaya',
    icon: 'Shirt',
    uiMode: 'standard',
    posViewMode: 'image_grid',
    supportsPhotos: true,
    units: ['পিস', 'সেট'],
    features: ['size_52_56', 'dubai_cherry_fabric', 'matching_niqab'],
    defaultCategories: ['দুবাই চেরি বোরকা', 'ডিজাইনার গাউন আবায়া', 'জর্জেট ও শিফন হিজাব', 'নিকাব ও ইনার ক্যাপ'],
    sampleProducts: [
      { name: 'দুবাই চেরি স্টোন ওয়ার্ক আবায়া (সাইজ ৫৪)', category: 'দুবাই চেরি বোরকা', costPrice: 1800, sellPrice: 2800, unit: 'পিস', stock: 10, image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=300' }
    ]
  },
  {
    id: 'elec_cctv_security',
    sectorId: 'electronics_mobile',
    name: 'সিসিটিভি ক্যামেরা ও সিকিউরিটি সলিউশন',
    enName: 'CCTV Camera & Security',
    icon: 'Shield',
    uiMode: 'standard',
    posViewMode: 'hybrid',
    supportsPhotos: true,
    units: ['পিস', 'সেট', 'প্যাকেজ', 'মিটার'],
    features: ['package_cameras_dvr_harddisk', 'installation_charge', 'warranty_serial'],
    defaultCategories: ['আইপি ক্যামেরা', 'এইচডি অ্যানালগ ক্যামেরা', 'ডিভিআর ও এনভিআর', 'সার্ভেইল্যান্স হার্ডডিস্ক', 'ক্যাট৬ কেবল ও কানেক্টর'],
    sampleProducts: [
      { name: 'Hikvision 2MP HD Audio Dome Camera', category: 'এইচডি অ্যানালগ ক্যামেরা', costPrice: 1450, sellPrice: 1950, unit: 'পিস', stock: 25, image: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=300' }
    ]
  },
  {
    id: 'transport_launch_ticket',
    sectorId: 'transport_travel',
    name: 'লঞ্চ, স্টিমার ও কেবিন বুকিং কাউন্টার',
    enName: 'Launch & Cabin Booking Counter',
    icon: 'Bus',
    uiMode: 'bus_counter',
    posViewMode: 'compact',
    supportsPhotos: false,
    units: ['কেবিন', 'সিট', 'ডেক'],
    features: ['cabin_double_single_vip', 'launch_floor_deck', 'passenger_phone_sms'],
    defaultCategories: ['ঢাকা ➔ বরিশাল', 'ঢাকা ➔ ভোলা', 'ঢাকা ➔ পটুয়াখালী', 'ঢাকা ➔ বরগুনা'],
    sampleProducts: [
      { name: 'ঢাকা ➔ বরিশাল (ডাবল এসি কেবিন - ২য় তলা)', category: 'ঢাকা ➔ বরিশাল', costPrice: 1800, sellPrice: 2400, unit: 'কেবিন', stock: 1 }
    ]
  },
  {
    id: 'const_electrical_wiring',
    sectorId: 'construction_materials',
    name: 'ইলেকট্রিক ওয়্যারিং, কেবল ও লাইটিং শপ',
    enName: 'Electrical Wiring, Cable & Lighting',
    icon: 'Layers',
    uiMode: 'standard',
    posViewMode: 'image_grid',
    supportsPhotos: true,
    units: ['কয়েল (১০০ গজ)', 'পিস', 'বক্স'],
    features: ['coil_meter_cut', 'led_bulb_replacement_warranty'],
    defaultCategories: ['হাউজ ওয়্যারিং কেবল (BBS/BRB)', 'এলইডি লাইট ও টিউবলাইট', 'মডিউলার সুইচ ও সকেট', 'সার্কিট ব্রেকার ও ডিবি বক্স', 'সিলিং ও এক্সহস্ট ফ্যান'],
    sampleProducts: [
      { name: 'BRB 1.5 RM House Wiring Cable (100 Yards)', category: 'হাউজ ওয়্যারিং কেবল (BBS/BRB)', costPrice: 2850, sellPrice: 3200, unit: 'কয়েল (১০০ গজ)', stock: 20 },
      { name: '15W LED T-Bulb (Daylight - 1 Yr Warranty)', category: 'এলইডি লাইট ও টিউবলাইট', costPrice: 140, sellPrice: 220, unit: 'পিস', stock: 60, image: 'https://images.unsplash.com/photo-1550524514-9b6d85a08906?w=300' }
    ]
  },
  {
    id: 'jewel_silver_diamond',
    sectorId: 'jewelry_gold',
    name: 'রূপার গহনা ও ডায়মন্ড নাকফুল শপ',
    enName: 'Silver Jewelry & Diamond Nosepin',
    icon: 'Gem',
    uiMode: 'standard',
    posViewMode: 'image_grid',
    supportsPhotos: true,
    units: ['ভরি', 'গ্রাম', 'পিস'],
    features: ['925_chandi_silver', 'making_charge_gram'],
    defaultCategories: ['রূপার নুপুর ও পায়েল', 'রূপার ব্রেসলেট ও চেইন', 'রিয়েল ডায়মন্ড নোজপিন', 'রূপার আংটি ও রিং'],
    sampleProducts: [
      { name: '৯২৫ স্টার্লিং রূপার ডিজাইনার নুপুর (জোড়া)', category: 'রূপার নুপুর ও পায়েল', costPrice: 2200, sellPrice: 3200, unit: 'জোড়া', stock: 12, image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=300' }
    ]
  },
  {
    id: 'serv_fitness_gym',
    sectorId: 'services_lifestyle',
    name: 'ফিটনেস জিম, বডিবিল্ডিং ও হেলথ ক্লাব',
    enName: 'Fitness Gym & Health Club',
    icon: 'Sparkles',
    uiMode: 'standard',
    posViewMode: 'compact',
    supportsPhotos: false,
    units: ['মাসিক ফি', 'প্যাকেজ', 'সেশন'],
    features: ['monthly_due_sms', 'trainer_assigned', 'admission_fee'],
    defaultCategories: ['মাসিক জিম সাবস্ক্রিপশন', '৩ মাসের গোল্ড প্যাকেজ', 'ব্যক্তিগত ট্রেনার চার্জ', 'প্রোটিন ও সাপ্লিমেন্ট'],
    sampleProducts: [
      { name: 'জিম মাসিক রেগুলার মেম্বারশিপ', category: 'মাসিক জিম সাবস্ক্রিপশন', costPrice: 200, sellPrice: 1200, unit: 'মাসিক ফি', stock: 999 }
    ]
  },
  {
    id: 'serv_photo_studio',
    sectorId: 'services_lifestyle',
    name: 'ডিজিটাল ছবি প্রিন্ট ও ফটো স্টুডিও',
    enName: 'Photo Studio & Color Lab',
    icon: 'Sparkles',
    uiMode: 'standard',
    posViewMode: 'image_grid',
    supportsPhotos: true,
    units: ['কপি', 'সেট', 'ফ্রেম'],
    features: ['passport_stamp_size_print', 'glass_wooden_frame'],
    defaultCategories: ['পাসপোর্ট ও স্ট্যাম্প সাইজ ছবি', 'ফটো ল্যাব প্রিন্ট (৪R, ১২R)', 'ওয়াল ফটো ফ্রেম ও বাইন্ডিং'],
    sampleProducts: [
      { name: '৪ কপি পাসপোর্ট সাইজ ছবি (জরুরি ৫ মিনিট)', category: 'পাসপোর্ট ও স্ট্যাম্প সাইজ ছবি', costPrice: 15, sellPrice: 60, unit: 'সেট', stock: 999 }
    ]
  },
  {
    id: 'agro_dairy_milk',
    sectorId: 'agro_poultry',
    name: 'ডেইরি খামার ও খাঁটি গরুর তরল দুধ',
    enName: 'Dairy Farm & Fresh Milk',
    icon: 'Wheat',
    uiMode: 'standard',
    posViewMode: 'compact',
    supportsPhotos: false,
    units: ['লিটার', 'কেজি', 'বোতল'],
    features: ['daily_morning_evening_dispatch', 'customer_monthly_milk_khata', 'fat_percentage'],
    defaultCategories: ['খাঁটি গরুর দুধ (সকাল)', 'খাঁটি গরুর দুধ (বিকাল)', 'খাঁটি গাওয়া ঘি', 'মিষ্টি ছানা ও মাখন'],
    sampleProducts: [
      { name: 'খামারের খাঁটি গরুর কাঁচা দুধ (১ লিটার)', category: 'খাঁটি গরুর দুধ (সকাল)', costPrice: 65, sellPrice: 90, unit: 'লিটার', stock: 120 }
    ]
  }
];

// Helper to look up template
export const getTemplateById = (templateId) => {
  return MASTER_INDUSTRY_TEMPLATES.find(t => t.id === templateId) || MASTER_INDUSTRY_TEMPLATES[0];
};
