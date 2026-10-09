import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Printer,
  Sparkles,
  Layers,
  Heart,
  Droplets,
  Zap,
  Users,
  Wheat,
  Activity,
  ShieldCheck,
  Bookmark,
  FileText,
  ShoppingCart,
  Eye,
  ArrowRight,
  Stethoscope,
  ChevronRight,
  Info,
  Phone,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { printElement } from '../../../services/printService';

const STORAGE_KEYS = {
  HERD: 'hk360_cattle_herd_data',
  MILK: 'hk360_cattle_milk_records',
  FEED: 'hk360_cattle_feed_logs',
  VACCINES: 'hk360_cattle_vaccine_logs',
  FINANCES: 'hk360_cattle_monthly_finances',
  INDIVIDUAL_FEEDS: 'hk360_cattle_individual_feeds',
  INDIVIDUAL_VACCINES: 'hk360_cattle_individual_vaccines',
  HERBAL: 'hk360_cattle_herbal_remedies',
  BREEDING: 'hk360_cattle_breeding_records'
};

const INITIAL_COWS = [
  { id: 'cow-1', tag: 'COW-101', name: 'রানি', breed: 'হলস্টাইন ফ্রিজিয়ান ক্রস', category: 'দুগ্ধবতী গাভী', purchasePrice: 185000, weightKg: 420, dailyMilk: 18, status: 'active', birthDate: '2023-01-15', marketValue: 245000 },
  { id: 'cow-2', tag: 'COW-102', name: 'শোভা', breed: 'শাহীওয়াল', category: 'গর্ভবতী গাভী', purchasePrice: 165000, weightKg: 380, dailyMilk: 12, status: 'pregnant', birthDate: '2023-04-10', marketValue: 210000 },
  { id: 'cow-3', tag: 'COW-103', name: 'বাহাদুর', breed: 'ব্রাহমা ক্রস', category: 'মোটাতাজাকরণ ষাঁড়', purchasePrice: 120000, weightKg: 510, dailyMilk: 0, status: 'fattening', birthDate: '2024-02-01', marketValue: 220000 },
  { id: 'cow-4', tag: 'COW-104', name: 'টুনটুনি', breed: 'ফ্রিজিয়ান বকনা', category: 'দুধের বাছুর', purchasePrice: 45000, weightKg: 95, dailyMilk: 0, status: 'calf', birthDate: '2025-11-20', marketValue: 75000 }
];

const INITIAL_INDIVIDUAL_VACCINES = [
  { id: 'iv-1', cowTag: 'COW-101', date: '2026-08-15', time: '10:30 AM', vaccineName: 'খুরা রোগ (FMD) ভ্যাকসিন', medicine: 'Aftovax Bivalent', doctorName: 'ডাঃ রফিকুল ইসলাম (ভেটেরিনারি সার্জন)', nextDueDate: '2026-12-15', costBdt: 450, isDone: true, note: 'ডান কাঁধের চামড়ার নিচে ইনজেকশন দেওয়া হয়েছে' },
  { id: 'iv-2', cowTag: 'COW-101', date: '2026-06-10', time: '09:00 AM', vaccineName: 'কৃমিনাশক ডোজ (Deworming)', medicine: 'Albendazole 2.5g Bolus', doctorName: 'ডাঃ রফিকুল ইসলাম', nextDueDate: '2026-09-10', costBdt: 220, isDone: true, note: 'সকালে খালি পেটে খাওয়ানো হয়েছে' },
  { id: 'iv-3', cowTag: 'COW-102', date: '2026-07-10', time: '11:15 AM', vaccineName: 'লাম্পি স্কিন ডিজিজ (LSD)', medicine: 'Lumpy Shield Live', doctorName: 'ডাঃ তানভীর আহমেদ', nextDueDate: '2026-11-10', costBdt: 550, isDone: true, note: 'বাৎসরিক বুস্টার ডোজ' },
  { id: 'iv-4', cowTag: 'COW-103', date: '2026-05-20', time: '08:45 AM', vaccineName: 'তড়কা ও বাদলা (BQ/Anthrax)', medicine: 'Blackleg Vaccine', doctorName: 'ডাঃ রফিকুল ইসলাম', nextDueDate: '2026-11-20', costBdt: 350, isDone: true, note: 'বর্ষার পূর্বে প্রটেকশন ডোজ' }
];

const INITIAL_INDIVIDUAL_FEEDS = [
  { id: 'if-1', cowTag: 'COW-101', date: '2026-10-08', time: 'সকাল ও বিকাল', feedType: 'দানাদার পুষ্টি খাদ্য (গম ভুসি, খৈল, ভুট্টা)', amountKg: 6, costBdt: 240, note: 'উচ্চ দুধ উৎপাদনের স্পেশাল রেশন' },
  { id: 'if-2', cowTag: 'COW-101', date: '2026-10-08', time: 'দুপুর', feedType: 'কাঁচা নেপিয়ার ঘাস ও সাইলেজ', amountKg: 20, costBdt: 120, note: 'তাজা সবুজ ঘাস' },
  { id: 'if-3', cowTag: 'COW-101', date: '2026-10-07', time: 'সকাল ও বিকাল', feedType: 'দানাদার পুষ্টি খাদ্য (গম ভুসি, খৈল, ভুট্টা)', amountKg: 6, costBdt: 240, note: 'দৈনিক নিয়মিত রেশন' },
  { id: 'if-4', cowTag: 'COW-102', date: '2026-10-08', time: 'সকাল ও বিকাল', feedType: 'গর্ভবতী গাভীর পুষ্টি খাদ্য ও ক্যালসিয়াম', amountKg: 5, costBdt: 210, note: 'গর্ভকালীন খাদ্য' },
  { id: 'if-5', cowTag: 'COW-103', date: '2026-10-08', time: 'সকাল ও বিকাল', feedType: 'মোটাতাজাকরণ স্পেশাল সাইলেজ ও খড়', amountKg: 8, costBdt: 320, note: 'দ্রুত মাংস বৃদ্ধির হাই-প্রোটিন রেশন' }
];

const INITIAL_HERBAL_REMEDIES = [
  {
    id: 'hr-1',
    title: 'লাম্পি স্কিন ডিজিজ (LSD) ঘরোয়া ভেষজ মলম',
    icon: '🌿',
    category: 'বাহ্যিক ক্ষত ও গোটা',
    ingredients: 'কাঁচা নিমপাতা ২৫০ গ্রাম, কাঁচা হলুদ ১০০ গ্রাম, মধু ৫০ গ্রাম, তুলসী পাতা ও খাঁটি নারকেল তেল।',
    instructions: 'সব উপাদান একসাথে মিহি করে বেটে গরুর শরীরের গোটা ও ক্ষতস্থানে দিনে ২ বার প্রলেপ দিন। ঘা দ্রুত শুকায় ও মাছি বসে না।',
    feedingTip: 'কালিজিরা, আদা ও লেবুর রস গুড়ের সাথে মিশিয়ে মুখে খাওয়ালে গরুর রোগ প্রতিরোধ ক্ষমতা দ্রুত বৃদ্ধি পায়।'
  },
  {
    id: 'hr-2',
    title: 'ওলান ফোলা / ম্যাসটাইটিস (Mastitis) ঘরোয়া যত্ন',
    icon: '🧊',
    category: 'ওলানের রোগ ও দুধ রক্ষা',
    ingredients: 'বরফ কুচি, ফিটকিরি অথবা পটাশ মিশ্রিত কুসুম গরম পানি, ঘৃতকুমারী (অ্যালোভেরা জেল)।',
    instructions: 'বরফ দিয়ে দিনে ৩-৪ বার ওলানে ঠান্ডা সেক দিন। আক্রান্ত বাটের দুধ ঘন ঘন বের করে ফেলে দিন। ফিটকিরি মিশ্রিত পানি দিয়ে ভালো করে পরিষ্কার রাখুন।',
    feedingTip: 'খাদ্যের সাথে ভিটামিন-ই, সেলেনিয়াম ও জিংক সমৃদ্ধ মিনারেল মিক্সচার খাওয়ান।'
  },
  {
    id: 'hr-3',
    title: 'পেট ফাঁপা ও বদহজম (Bloat & Indigestion)',
    icon: '🫚',
    category: 'পাচনতন্ত্র ও গ্যাস',
    ingredients: 'খাবার সোডা (সোডিয়াম বাইকার্বনেট) ৫০ গ্রাম, আদা বাটা ৫০ গ্রাম, জিরা গুঁড়া ২৫ গ্রাম, বিট লবণ ২০ গ্রাম, সরিষার তেল ১০০ মিলি।',
    instructions: 'সব উপাদান ৫০০ মিলি হালকা গরম পানিতে মিশিয়ে নলে করে মুখে খাইয়ে দিন। পেটের গ্যাস দ্রুত বের হয়ে পেট ফাঁপা কমে যাবে।',
    feedingTip: 'অতিরিক্ত ভেজা কাঁচা ঘাস না দিয়ে শুকনা খড়ের সাথে মিশিয়ে খেতে দিন।'
  },
  {
    id: 'hr-4',
    title: 'বাছুরের পাতলা পায়খানা ও দুর্বলতা',
    icon: '🍌',
    category: 'বাছুরের জরুরি যত্ন',
    ingredients: 'কাঁচা কলা সিদ্ধ ২-৩টি, ঘন ভাতের মাড়, খাবার স্যালাইন, ডাবের পানি।',
    instructions: 'কাঁচা কলা সিদ্ধ করে ভাতের মাড়ের সাথে চটকে বাছুরকে দিনে ২ বার খাওয়ান। খাবার স্যালাইন ও ডাবের পানি ঘন ঘন খাওয়ান।',
    feedingTip: 'দুধের মাত্রা সাময়িকভাবে অর্ধেক কমিয়ে দিন যাতে পেটের ওপর চাপ না পড়ে।'
  }
];

const INITIAL_BREEDINGS = [
  {
    id: 'br-1',
    cowTag: 'COW-102',
    cowName: 'শোভা',
    inseminationDate: '2026-02-10',
    semenBreed: '১০০% হলস্টাইন ফ্রিজিয়ান (বুল নং HF-89)',
    technicianName: 'মোঃ আব্দুল মান্নান (এআই কর্মী)',
    heatCheckDate: '2026-03-03',
    isPregnant: true,
    expectedCalvingDate: '2026-11-18',
    dryOffDate: '2026-09-18',
    status: 'pregnant',
    note: 'গাভীর পুষ্টি খাদ্য ও ক্যালসিয়াম চালু আছে'
  }
];

export const CattleFarmModal = ({ isOpen = true, onClose, initialTab = 'overview', isPageMode = false }) => {
  const { lang, showToast, addToCart, addExpense } = useApp();

  const [activeTab, setActiveTab] = useState(initialTab || 'overview');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  // Selected cow for Individual Dossier View
  const [selectedCowForDossier, setSelectedCowForDossier] = useState(null);
  const [dossierTab, setDossierTab] = useState('pnl'); // 'pnl' | 'vaccines' | 'feeds'

  // Herd state
  const [cows, setCows] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HERD);
      return saved ? JSON.parse(saved) : INITIAL_COWS;
    } catch {
      return INITIAL_COWS;
    }
  });

  // Daily Milk records
  const [milkLogs, setMilkLogs] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MILK);
      return saved ? JSON.parse(saved) : [
        { id: 'm-1', date: new Date().toISOString().split('T')[0], morningLiters: 22, eveningLiters: 16, soldLiters: 32, ratePerLiter: 80, calfLiters: 6 }
      ];
    } catch {
      return [];
    }
  });

  // General Feed logs
  const [feedLogs, setFeedLogs] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FEED);
      return saved ? JSON.parse(saved) : [
        { id: 'f-1', date: new Date().toISOString().split('T')[0], feedType: 'গম ভুসি ও ভুট্টা ভাঙা', amountKg: 45, costBdt: 1850, note: 'দৈনিক দানাদার পুষ্টি রেশন' },
        { id: 'f-2', date: new Date().toISOString().split('T')[0], feedType: 'কাঁচা নেপিয়ার ঘাস ও খড়', amountKg: 80, costBdt: 650, note: 'তাজা ঘাস ও শুকনো খড়' }
      ];
    } catch {
      return [];
    }
  });

  // Individual Cow Feeds
  const [individualFeeds, setIndividualFeeds] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INDIVIDUAL_FEEDS);
      return saved ? JSON.parse(saved) : INITIAL_INDIVIDUAL_FEEDS;
    } catch {
      return INITIAL_INDIVIDUAL_FEEDS;
    }
  });

  // Individual Cow Vaccines
  const [individualVaccines, setIndividualVaccines] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INDIVIDUAL_VACCINES);
      return saved ? JSON.parse(saved) : INITIAL_INDIVIDUAL_VACCINES;
    } catch {
      return INITIAL_INDIVIDUAL_VACCINES;
    }
  });

  // Herbal Remedies
  const [herbalRemedies, setHerbalRemedies] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HERBAL);
      return saved ? JSON.parse(saved) : INITIAL_HERBAL_REMEDIES;
    } catch {
      return INITIAL_HERBAL_REMEDIES;
    }
  });

  // Breeding & Pregnancy Records
  const [breedingRecords, setBreedingRecords] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BREEDING);
      return saved ? JSON.parse(saved) : INITIAL_BREEDINGS;
    } catch {
      return INITIAL_BREEDINGS;
    }
  });

  // Farm Utility & Monthly Overheads
  const [monthlyFinances, setMonthlyFinances] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FINANCES);
      return saved ? JSON.parse(saved) : {
        electricityBill: 4500,
        waterBill: 1200,
        staffSalary: 16000,
        vetDoctorFee: 2500,
        dungFertilizerSale: 4000
      };
    } catch {
      return {
        electricityBill: 4500,
        waterBill: 1200,
        staffSalary: 16000,
        vetDoctorFee: 2500,
        dungFertilizerSale: 4000
      };
    }
  });

  // --- Add / Edit Form States ---
  const [newCow, setNewCow] = useState({
    tag: '',
    name: '',
    breed: 'হলস্টাইন ফ্রিজিয়ান ক্রস',
    category: 'দুগ্ধবতী গাভী',
    purchasePrice: '',
    weightKg: '',
    dailyMilk: '',
    marketValue: ''
  });
  const [editingCow, setEditingCow] = useState(null);

  const [newGeneralFeed, setNewGeneralFeed] = useState({
    date: new Date().toISOString().split('T')[0],
    feedType: 'গম ভুসি ও ভুট্টা ভাঙা',
    amountKg: '',
    costBdt: '',
    note: ''
  });
  const [editingFeed, setEditingFeed] = useState(null);

  const [newGeneralVaccine, setNewGeneralVaccine] = useState({
    cowTag: 'COW-101',
    vaccineName: 'খুরা রোগ (FMD) ভ্যাকসিন',
    date: new Date().toISOString().split('T')[0],
    time: '10:00 AM',
    nextDueDate: '',
    doctorName: 'ডাঃ রফিকুল ইসলাম',
    medicine: '',
    costBdt: '450',
    isDone: true,
    note: ''
  });
  const [editingVaccine, setEditingVaccine] = useState(null);

  const [newHerbal, setNewHerbal] = useState({
    title: '',
    icon: '🌿',
    category: 'ঘরোয়া চিকিৎসা',
    ingredients: '',
    instructions: '',
    feedingTip: ''
  });
  const [editingHerbal, setEditingHerbal] = useState(null);

  const [newBreeding, setNewBreeding] = useState({
    cowTag: 'COW-101',
    inseminationDate: new Date().toISOString().split('T')[0],
    semenBreed: '১০০% হলস্টাইন ফ্রিজিয়ান',
    technicianName: 'মোঃ আব্দুল মান্নান',
    isPregnant: true,
    note: ''
  });
  const [editingBreeding, setEditingBreeding] = useState(null);

  const [newMilk, setNewMilk] = useState({
    date: new Date().toISOString().split('T')[0],
    morningLiters: '',
    eveningLiters: '',
    soldLiters: '',
    ratePerLiter: 80,
    calfLiters: 4
  });
  const [editingMilk, setEditingMilk] = useState(null);

  // New Individual Cow Dossier Vaccine & Feed Form
  const [newIndVaccine, setNewIndVaccine] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '10:00 AM',
    vaccineName: 'খুরা রোগ (FMD) ভ্যাকসিন',
    medicine: '',
    doctorName: 'ডাঃ রফিকুল ইসলাম',
    nextDueDate: '',
    costBdt: '450',
    note: ''
  });

  const [newIndFeed, setNewIndFeed] = useState({
    date: new Date().toISOString().split('T')[0],
    time: 'সকাল ও বিকাল',
    feedType: 'দানাদার পুষ্টি খাদ্য (গম ভুসি, খৈল, ভুট্টা)',
    amountKg: '6',
    costBdt: '240',
    note: 'দৈনিক পুষ্টি রেশন'
  });

  // LocalStorage Sync
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HERD, JSON.stringify(cows));
  }, [cows]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MILK, JSON.stringify(milkLogs));
  }, [milkLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FEED, JSON.stringify(feedLogs));
  }, [feedLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INDIVIDUAL_FEEDS, JSON.stringify(individualFeeds));
  }, [individualFeeds]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INDIVIDUAL_VACCINES, JSON.stringify(individualVaccines));
  }, [individualVaccines]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HERBAL, JSON.stringify(herbalRemedies));
  }, [herbalRemedies]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BREEDING, JSON.stringify(breedingRecords));
  }, [breedingRecords]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FINANCES, JSON.stringify(monthlyFinances));
  }, [monthlyFinances]);

  if (!isOpen && !isPageMode) return null;

  // --- Computations ---
  const totalMilkSoldLiters = milkLogs.reduce((sum, m) => sum + Number(m.soldLiters || 0), 0);
  const totalMilkRevenue = milkLogs.reduce((sum, m) => sum + (Number(m.soldLiters || 0) * Number(m.ratePerLiter || 80)), 0);
  const totalFeedCost = feedLogs.reduce((sum, f) => sum + Number(f.costBdt || 0), 0);
  const totalHerdCapital = cows.reduce((sum, c) => sum + Number(c.purchasePrice || 0), 0);
  const milkingCowsCount = cows.filter(c => c.category === 'দুগ্ধবতী গাভী').length;

  const monthlyOverhead =
    Number(monthlyFinances.electricityBill || 0) +
    Number(monthlyFinances.waterBill || 0) +
    Number(monthlyFinances.staffSalary || 0) +
    Number(monthlyFinances.vetDoctorFee || 0);

  const totalRevenue = totalMilkRevenue + Number(monthlyFinances.dungFertilizerSale || 0);
  const totalOperatingCost = totalFeedCost + monthlyOverhead;
  const netFarmProfit = totalRevenue - totalOperatingCost;

  // --- HERD HANDLERS ---
  const handleAddCow = (e) => {
    e.preventDefault();
    if (!newCow.tag || !newCow.name) {
      if (showToast) showToast('গরুর ট্যাগ ও নাম লিখুন', 'error');
      return;
    }

    const cowEntry = {
      id: `cow_${Date.now()}`,
      tag: newCow.tag.toUpperCase(),
      name: newCow.name,
      breed: newCow.breed,
      category: newCow.category,
      purchasePrice: Number(newCow.purchasePrice) || 0,
      weightKg: Number(newCow.weightKg) || 250,
      dailyMilk: Number(newCow.dailyMilk) || 0,
      marketValue: Number(newCow.marketValue) || (Number(newCow.purchasePrice) * 1.3),
      status: 'active',
      birthDate: new Date().toISOString().split('T')[0]
    };

    setCows(prev => [cowEntry, ...prev]);
    setNewCow({ tag: '', name: '', breed: 'হলস্টাইন ফ্রিজিয়ান ক্রস', category: 'দুগ্ধবতী গাভী', purchasePrice: '', weightKg: '', dailyMilk: '', marketValue: '' });
    if (showToast) showToast(`✅ গরু (${cowEntry.tag} - ${cowEntry.name}) সফলভাবে যুক্ত হয়েছে!`, 'success');
  };

  const handleUpdateCow = (e) => {
    e.preventDefault();
    if (!editingCow) return;

    setCows(prev => prev.map(c => c.id === editingCow.id ? {
      ...editingCow,
      purchasePrice: Number(editingCow.purchasePrice) || 0,
      weightKg: Number(editingCow.weightKg) || 0,
      dailyMilk: Number(editingCow.dailyMilk) || 0,
      marketValue: Number(editingCow.marketValue) || 0
    } : c));

    setEditingCow(null);
    if (showToast) showToast(`✅ গরুর তথ্য আপডেট সম্পন্ন!`, 'success');
  };

  const handleDeleteCow = (cowId, tag) => {
    if (window.confirm(`আপনি কি নিশ্চিতভাবে ${tag} মুছে ফেলতে চান?`)) {
      setCows(prev => prev.filter(c => c.id !== cowId));
      if (selectedCowForDossier?.id === cowId) setSelectedCowForDossier(null);
      if (showToast) showToast(`🗑️ গরু (${tag}) মুছে ফেলা হয়েছে`, 'info');
    }
  };

  // --- GENERAL FEED HANDLERS ---
  const handleAddGeneralFeed = (e) => {
    e.preventDefault();
    if (!newGeneralFeed.amountKg || !newGeneralFeed.costBdt) {
      if (showToast) showToast('খাবারের পরিমাণ ও খরচ উল্লেখ করুন', 'error');
      return;
    }

    const entry = {
      id: `f_${Date.now()}`,
      date: newGeneralFeed.date,
      feedType: newGeneralFeed.feedType,
      amountKg: Number(newGeneralFeed.amountKg) || 0,
      costBdt: Number(newGeneralFeed.costBdt) || 0,
      note: newGeneralFeed.note
    };

    setFeedLogs(prev => [entry, ...prev]);
    setNewGeneralFeed({ date: new Date().toISOString().split('T')[0], feedType: 'গম ভুসি ও ভুট্টা ভাঙা', amountKg: '', costBdt: '', note: '' });
    if (showToast) showToast(`🌾 খাদ্য খরচ (৳${entry.costBdt}) সফলভাবে যুক্ত হয়েছে!`, 'success');
  };

  const handleUpdateGeneralFeed = (e) => {
    e.preventDefault();
    if (!editingFeed) return;

    setFeedLogs(prev => prev.map(f => f.id === editingFeed.id ? {
      ...editingFeed,
      amountKg: Number(editingFeed.amountKg) || 0,
      costBdt: Number(editingFeed.costBdt) || 0
    } : f));

    setEditingFeed(null);
    if (showToast) showToast('✅ খাদ্য খরচের রেকর্ড আপডেট সম্পন্ন!', 'success');
  };

  const handleDeleteGeneralFeed = (feedId) => {
    if (window.confirm('আপনি কি এই খাদ্য খরচের রেকর্ডটি মুছতে চান?')) {
      setFeedLogs(prev => prev.filter(f => f.id !== feedId));
      if (showToast) showToast('🗑️ খাদ্য খরচ মুছে ফেলা হয়েছে', 'info');
    }
  };

  // --- VACCINE & HEALTH HANDLERS ---
  const handleAddGeneralVaccine = (e) => {
    e.preventDefault();
    if (!newGeneralVaccine.vaccineName) return;

    const entry = {
      id: `iv_${Date.now()}`,
      cowTag: newGeneralVaccine.cowTag,
      vaccineName: newGeneralVaccine.vaccineName,
      date: newGeneralVaccine.date,
      time: newGeneralVaccine.time,
      nextDueDate: newGeneralVaccine.nextDueDate,
      doctorName: newGeneralVaccine.doctorName,
      medicine: newGeneralVaccine.medicine || newGeneralVaccine.vaccineName,
      costBdt: Number(newGeneralVaccine.costBdt) || 0,
      isDone: newGeneralVaccine.isDone !== false,
      note: newGeneralVaccine.note
    };

    setIndividualVaccines(prev => [entry, ...prev]);
    setNewGeneralVaccine({ ...newGeneralVaccine, medicine: '', note: '', costBdt: '450' });
    if (showToast) showToast(`💉 ভ্যাকসিন ও চিকিৎসার তথ্য সংরক্ষিত হয়েছে!`, 'success');
  };

  const handleUpdateVaccine = (e) => {
    e.preventDefault();
    if (!editingVaccine) return;

    setIndividualVaccines(prev => prev.map(v => v.id === editingVaccine.id ? {
      ...editingVaccine,
      costBdt: Number(editingVaccine.costBdt) || 0
    } : v));

    setEditingVaccine(null);
    if (showToast) showToast('✅ ভ্যাকসিনের রেকর্ড আপডেট সম্পন্ন!', 'success');
  };

  const handleDeleteVaccine = (vacId) => {
    if (window.confirm('আপনি কি এই ভ্যাকসিন রেকর্ডটি মুছতে চান?')) {
      setIndividualVaccines(prev => prev.filter(v => v.id !== vacId));
      if (showToast) showToast('🗑️ ভ্যাকসিন রেকর্ড মুছে ফেলা হয়েছে', 'info');
    }
  };

  const handleToggleVaccineDone = (vacId) => {
    setIndividualVaccines(prev => prev.map(v => v.id === vacId ? { ...v, isDone: !v.isDone } : v));
  };

  // --- HERBAL REMEDIES HANDLERS ---
  const handleAddHerbalRemedy = (e) => {
    e.preventDefault();
    if (!newHerbal.title || !newHerbal.ingredients) {
      if (showToast) showToast('রোগের নাম ও প্রয়োজনীয় উপাদান উল্লেখ করুন', 'error');
      return;
    }

    const entry = {
      id: `hr_${Date.now()}`,
      title: newHerbal.title,
      icon: newHerbal.icon || '🌿',
      category: newHerbal.category || 'ঘরোয়া চিকিৎসা',
      ingredients: newHerbal.ingredients,
      instructions: newHerbal.instructions,
      feedingTip: newHerbal.feedingTip
    };

    setHerbalRemedies(prev => [entry, ...prev]);
    setNewHerbal({ title: '', icon: '🌿', category: 'ঘরোয়া চিকিৎসা', ingredients: '', instructions: '', feedingTip: '' });
    if (showToast) showToast(`🌿 নতুন ভেষজ চিকিৎসা পদ্ধতি সংরক্ষিত হয়েছে!`, 'success');
  };

  const handleUpdateHerbalRemedy = (e) => {
    e.preventDefault();
    if (!editingHerbal) return;

    setHerbalRemedies(prev => prev.map(h => h.id === editingHerbal.id ? editingHerbal : h));
    setEditingHerbal(null);
    if (showToast) showToast('✅ ভেষজ চিকিৎসা পদ্ধতি আপডেট হয়েছে!', 'success');
  };

  const handleDeleteHerbalRemedy = (remedyId) => {
    if (window.confirm('আপনি কি এই চিকিৎসা পদ্ধতিটি মুছে ফেলতে চান?')) {
      setHerbalRemedies(prev => prev.filter(h => h.id !== remedyId));
      if (showToast) showToast('🗑️ চিকিৎসা পদ্ধতি মুছে ফেলা হয়েছে', 'info');
    }
  };

  // --- BREEDING HANDLERS ---
  const handleAddBreeding = (e) => {
    e.preventDefault();
    if (!newBreeding.cowTag || !newBreeding.inseminationDate) return;

    const baseDate = new Date(newBreeding.inseminationDate);
    // Add 21 days for repeat heat check
    const heatDate = new Date(baseDate);
    heatDate.setDate(heatDate.getDate() + 21);
    // Add 280 days for expected calving
    const calveDate = new Date(baseDate);
    calveDate.setDate(calveDate.getDate() + 280);
    // Add 220 days for dry off (60 days before calving)
    const dryDate = new Date(baseDate);
    dryDate.setDate(dryDate.getDate() + 220);

    const targetCow = cows.find(c => c.tag === newBreeding.cowTag);

    const entry = {
      id: `br_${Date.now()}`,
      cowTag: newBreeding.cowTag,
      cowName: targetCow?.name || 'গাভী',
      inseminationDate: newBreeding.inseminationDate,
      semenBreed: newBreeding.semenBreed,
      technicianName: newBreeding.technicianName,
      heatCheckDate: heatDate.toISOString().split('T')[0],
      isPregnant: newBreeding.isPregnant,
      expectedCalvingDate: calveDate.toISOString().split('T')[0],
      dryOffDate: dryDate.toISOString().split('T')[0],
      status: newBreeding.isPregnant ? 'pregnant' : 'heat_check',
      note: newBreeding.note
    };

    setBreedingRecords(prev => [entry, ...prev]);
    setNewBreeding({ cowTag: cows[0]?.tag || 'COW-101', inseminationDate: new Date().toISOString().split('T')[0], semenBreed: '১০০% হলস্টাইন ফ্রিজিয়ান', technicianName: 'মোঃ আব্দুল মান্নান', isPregnant: true, note: '' });
    if (showToast) showToast(`🧬 প্রজনন রেকর্ড ও প্রসবের তারিখ স্বয়ংক্রিয়ভাবে সংরক্ষিত হয়েছে!`, 'success');
  };

  const handleUpdateBreeding = (e) => {
    e.preventDefault();
    if (!editingBreeding) return;

    setBreedingRecords(prev => prev.map(b => b.id === editingBreeding.id ? editingBreeding : b));
    setEditingBreeding(null);
    if (showToast) showToast('✅ প্রজনন রেকর্ড আপডেট সম্পন্ন!', 'success');
  };

  const handleDeleteBreeding = (breedingId) => {
    if (window.confirm('আপনি কি এই প্রজনন রেকর্ডটি মুছে ফেলতে চান?')) {
      setBreedingRecords(prev => prev.filter(b => b.id !== breedingId));
      if (showToast) showToast('🗑️ প্রজনন রেকর্ড মুছে ফেলা হয়েছে', 'info');
    }
  };

  // --- MILK HANDLERS ---
  const handleAddMilkLog = (e) => {
    e.preventDefault();
    const morning = Number(newMilk.morningLiters) || 0;
    const evening = Number(newMilk.eveningLiters) || 0;
    const totalToday = morning + evening;
    const sold = Number(newMilk.soldLiters) || totalToday;
    const rate = Number(newMilk.ratePerLiter) || 80;

    const entry = {
      id: `m_${Date.now()}`,
      date: newMilk.date,
      morningLiters: morning,
      eveningLiters: evening,
      soldLiters: sold,
      ratePerLiter: rate,
      calfLiters: Number(newMilk.calfLiters) || 0
    };

    setMilkLogs(prev => [entry, ...prev]);
    setNewMilk({ date: new Date().toISOString().split('T')[0], morningLiters: '', eveningLiters: '', soldLiters: '', ratePerLiter: 80, calfLiters: 4 });
    if (showToast) showToast(`🥛 ${newMilk.date}-এর দুধ উৎপাদন (${totalToday}L) রেকর্ড হয়েছে!`, 'success');
  };

  const handleUpdateMilkLog = (e) => {
    e.preventDefault();
    if (!editingMilk) return;

    setMilkLogs(prev => prev.map(m => m.id === editingMilk.id ? {
      ...editingMilk,
      morningLiters: Number(editingMilk.morningLiters) || 0,
      eveningLiters: Number(editingMilk.eveningLiters) || 0,
      soldLiters: Number(editingMilk.soldLiters) || 0,
      ratePerLiter: Number(editingMilk.ratePerLiter) || 80
    } : m));

    setEditingMilk(null);
    if (showToast) showToast('✅ দুধ উৎপাদনের রেকর্ড আপডেট সম্পন্ন!', 'success');
  };

  const handleDeleteMilkLog = (milkId) => {
    if (window.confirm('আপনি কি এই দুধের রেকর্ডটি মুছতে চান?')) {
      setMilkLogs(prev => prev.filter(m => m.id !== milkId));
      if (showToast) showToast('🗑️ রেকর্ড মুছে ফেলা হয়েছে', 'info');
    }
  };

  const handlePushMilkToPosCart = (log) => {
    const saleLiters = Number(log.soldLiters || 0);
    const rate = Number(log.ratePerLiter || 80);
    if (saleLiters <= 0) return;

    const product = {
      id: `milk_sale_${Date.now()}`,
      name: `খামারের খাঁটি গরুর দুধ (${saleLiters} লিটার)`,
      category: 'খাঁটি গরুর দুধ',
      costPrice: Math.round(rate * 0.7),
      sellPrice: saleLiters * rate,
      unit: `${saleLiters}L`,
      stock: 100,
      isDairyMilk: true
    };

    addToCart(product);
    if (showToast) showToast(`🛒 ৳${(saleLiters * rate).toLocaleString()} টাকার দুধ POS কার্টে যুক্ত হয়েছে!`, 'success');
  };

  // Individual Cow P&L calculation
  const getCowPnL = (cow) => {
    if (!cow) return null;
    const cowFeeds = individualFeeds.filter(f => f.cowTag === cow.tag);
    const cowVaccines = individualVaccines.filter(v => v.cowTag === cow.tag);

    const totalFeed = cowFeeds.reduce((sum, f) => sum + Number(f.costBdt || 0), 0);
    const totalMedical = cowVaccines.reduce((sum, v) => sum + Number(v.costBdt || 0), 0);
    const purchaseCost = Number(cow.purchasePrice || 0);
    const totalInvestment = purchaseCost + totalFeed + totalMedical;

    const estimatedMilkRevenue = cow.dailyMilk > 0 ? (cow.dailyMilk * 80 * 90) : 0;
    const estimatedMarketValue = Number(cow.marketValue || (purchaseCost * 1.35));
    const totalReturn = estimatedMilkRevenue + estimatedMarketValue;
    const netProfit = totalReturn - totalInvestment;

    return {
      cowFeeds,
      cowVaccines,
      totalFeedCost: totalFeed,
      totalMedicalCost: totalMedical,
      purchaseCost,
      totalInvestment,
      estimatedMilkRevenue,
      estimatedMarketValue,
      totalReturn,
      netProfit,
      roiPercent: totalInvestment > 0 ? Math.round((netProfit / totalInvestment) * 100) : 0
    };
  };

  const selectedCowPnL = selectedCowForDossier ? getCowPnL(selectedCowForDossier) : null;

  const innerModalCard = (
    <div className={isPageMode ? "glass-card" : "modal-content glass-card"} style={{
      maxWidth: isPageMode ? '1240px' : '1020px',
      margin: isPageMode ? '0 auto' : undefined,
      width: '100%',
      padding: isPageMode ? '1.5rem 1.25rem' : '1.25rem',
      maxHeight: isPageMode ? 'none' : '95vh',
      overflowY: 'auto'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
            <Wheat size={24} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '900', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>ক্যাটেল ও ডেইরি ফার্মিং হাব</span>
              <span style={{ fontSize: '0.7rem', background: '#10b981', color: '#fff', padding: '2px 8px', borderRadius: '10px', fontWeight: '800' }}>PRO</span>
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              খাদ্য, ভ্যাকসিন ও ভেষজ চিকিৎসা এন্ট্রি/এডিট, প্রজনন ক্যালেন্ডার এবং লাভ-লোকসান
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="btn btn-secondary press-scale"
            style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              fontWeight: '700',
              padding: '6px 12px',
              background: 'rgba(239, 68, 68, 0.1)',
              borderColor: 'rgba(239, 68, 68, 0.3)',
              color: '#ef4444'
            }}
          >
            {isPageMode ? <span>⬅️ ফিরে যান (Back)</span> : <><X size={18} /><span>বন্ধ করুন</span></>}
          </button>
        )}
      </div>

      {/* Top Navigation Tabs */}
      <div className="horizontal-touch-strip" style={{ display: 'flex', gap: '6px', marginBottom: '1.25rem', overflowX: 'auto', paddingBottom: '4px' }}>
        {[
          { id: 'overview', label: '📊 ড্যাশবোর্ড', icon: Activity },
          { id: 'herd', label: `🐄 গবাদিপশু (${cows.length})`, icon: Layers },
          { id: 'feed', label: `🌾 খাদ্য খরচ (${feedLogs.length})`, icon: Wheat },
          { id: 'health', label: `💉 ভ্যাকসিন ও চিকিৎসা (${individualVaccines.length})`, icon: ShieldCheck },
          { id: 'breeding', label: `🧬 প্রজনন ও গর্ভধারণ (${breedingRecords.length})`, icon: Sparkles },
          { id: 'milk', label: `🥛 দুধ সেলস (${milkLogs.length})`, icon: Droplets },
          { id: 'herbal', label: `🌿 ঘরোয়া চিকিৎসা (${herbalRemedies.length})`, icon: Heart },
          { id: 'finances', label: '💰 ফার্ম P&L', icon: DollarSign }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSelectedCowForDossier(null); }}
              style={{
                padding: '8px 13px',
                borderRadius: '10px',
                fontSize: '0.78rem',
                fontWeight: '800',
                whiteSpace: 'nowrap',
                border: isActive ? '1.5px solid #10b981' : '1px solid var(--border-color)',
                background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-secondary)',
                color: isActive ? '#10b981' : 'var(--text-main)',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div className="stat-card" style={{ padding: '12px', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>মোট গবাদিপশু ও মূলধন</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--text-main)', marginTop: '4px' }}>
                {cows.length}টি <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#10b981' }}>(দুধের: {milkingCowsCount}টি)</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                মূলধন: ৳{totalHerdCapital.toLocaleString()}
              </div>
            </div>

            <div className="stat-card" style={{ padding: '12px', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>মোট খাদ্য ও পুষ্টি খরচ</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#f59e0b', marginTop: '4px' }}>
                ৳{totalFeedCost.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                মোট এন্ট্রি: {feedLogs.length}টি খাদ্য লগ
              </div>
            </div>

            <div className="stat-card" style={{ padding: '12px', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>দুধ ও গোবর সার বিক্রয় আয়</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#10b981', marginTop: '4px' }}>
                ৳{totalRevenue.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                দুধ বিক্রি: {totalMilkSoldLiters}L (৳{totalMilkRevenue.toLocaleString()})
              </div>
            </div>

            <div className="stat-card" style={{
              padding: '12px',
              borderRadius: '12px',
              background: netFarmProfit >= 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              border: netFarmProfit >= 0 ? '1.5px solid #10b981' : '1.5px solid #ef4444'
            }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>খামারের নিট লাভ (Net Profit)</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '900', color: netFarmProfit >= 0 ? '#10b981' : '#ef4444', marginTop: '4px' }}>
                ৳{netFarmProfit.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.72rem', color: netFarmProfit >= 0 ? '#10b981' : '#ef4444', marginTop: '2px', fontWeight: '700' }}>
                {netFarmProfit >= 0 ? '🟢 খামার লাভজনক অবস্থায় আছে' : '🔴 খরচ আয়ের তুলনায় বেশি'}
              </div>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '14px' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={16} style={{ color: '#f59e0b' }} />
                <span>আসন্ন ভ্যাকসিন ও চিকিৎসা</span>
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {individualVaccines.slice(0, 3).map(v => (
                  <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-primary)', padding: '6px 10px', borderRadius: '8px', fontSize: '0.76rem' }}>
                    <div><strong>{v.cowTag}</strong> — {v.vaccineName}</div>
                    <span style={{ color: '#f59e0b', fontWeight: '800' }}>{v.nextDueDate || v.date}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '14px' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={16} style={{ color: '#8b5cf6' }} />
                <span>আসন্ন প্রসব ও গর্ভধারণ অ্যালার্ট</span>
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {breedingRecords.slice(0, 3).map(b => (
                  <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-primary)', padding: '6px 10px', borderRadius: '8px', fontSize: '0.76rem' }}>
                    <div><strong>{b.cowTag}</strong> ({b.cowName})</div>
                    <span style={{ color: '#8b5cf6', fontWeight: '800' }}>প্রসব: {b.expectedCalvingDate}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HERD & CATTLE REGISTRY */}
      {activeTab === 'herd' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Add / Edit Cow Form */}
          <form onSubmit={editingCow ? handleUpdateCow : handleAddCow} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-main)' }}>
                {editingCow ? `✏️ গরুর তথ্য পরিবর্তন (${editingCow.tag})` : '➕ নতুন গরু বা বাছুর যুক্ত করুন'}
              </h4>
              {editingCow && (
                <button type="button" onClick={() => setEditingCow(null)} className="btn btn-secondary" style={{ padding: '3px 8px', fontSize: '0.72rem' }}>
                  বাতিল করুন
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginBottom: '10px' }}>
              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>ট্যাগ নম্বর (ID) *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="COW-105"
                  value={editingCow ? editingCow.tag : newCow.tag}
                  onChange={(e) => editingCow ? setEditingCow({ ...editingCow, tag: e.target.value }) : setNewCow({ ...newCow, tag: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>নাম / পরিচয় *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="যেমন: শাপলা"
                  value={editingCow ? editingCow.name : newCow.name}
                  onChange={(e) => editingCow ? setEditingCow({ ...editingCow, name: e.target.value }) : setNewCow({ ...newCow, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>জাত (Breed)</label>
                <select
                  className="input-field"
                  value={editingCow ? editingCow.breed : newCow.breed}
                  onChange={(e) => editingCow ? setEditingCow({ ...editingCow, breed: e.target.value }) : setNewCow({ ...newCow, breed: e.target.value })}
                >
                  <option value="হলস্টাইন ফ্রিজিয়ান ক্রস">হলস্টাইন ফ্রিজিয়ান ক্রস</option>
                  <option value="১০০% পিওর ফ্রিজিয়ান">১০০% পিওর ফ্রিজিয়ান</option>
                  <option value="শাহীওয়াল জাত">শাহীওয়াল জাত</option>
                  <option value="রেড চিটাগাং ক্যাটেল (RCC)">রেড চিটাগাং ক্যাটেল (RCC)</option>
                  <option value="ব্রাহমা মিট ক্রস">ব্রাহমা মিট ক্রস</option>
                  <option value="দেশি উন্নত জাত">দেশি উন্নত জাত</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>ক্যাটাগরি</label>
                <select
                  className="input-field"
                  value={editingCow ? editingCow.category : newCow.category}
                  onChange={(e) => editingCow ? setEditingCow({ ...editingCow, category: e.target.value }) : setNewCow({ ...newCow, category: e.target.value })}
                >
                  <option value="দুগ্ধবতী গাভী">দুগ্ধবতী গাভী</option>
                  <option value="গর্ভবতী গাভী">গর্ভবতী গাভী</option>
                  <option value="মোটাতাজাকরণ ষাঁড়">মোটাতাজাকরণ ষাঁড়</option>
                  <option value="দুধের বাছুর">দুধের বাছুর</option>
                  <option value="বকনা গরু">বকনা গরু</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>ক্রয়মূল্য (টাকা)</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="150000"
                  value={editingCow ? editingCow.purchasePrice : newCow.purchasePrice}
                  onChange={(e) => editingCow ? setEditingCow({ ...editingCow, purchasePrice: e.target.value }) : setNewCow({ ...newCow, purchasePrice: e.target.value })}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>ওজন (কেজি)</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="350"
                  value={editingCow ? editingCow.weightKg : newCow.weightKg}
                  onChange={(e) => editingCow ? setEditingCow({ ...editingCow, weightKg: e.target.value }) : setNewCow({ ...newCow, weightKg: e.target.value })}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>দৈনিক দুধ (লিটার)</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="15"
                  value={editingCow ? editingCow.dailyMilk : newCow.dailyMilk}
                  onChange={(e) => editingCow ? setEditingCow({ ...editingCow, dailyMilk: e.target.value }) : setNewCow({ ...newCow, dailyMilk: e.target.value })}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>বর্তমান আনুমানিক মূল্য</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="200000"
                  value={editingCow ? editingCow.marketValue : newCow.marketValue}
                  onChange={(e) => editingCow ? setEditingCow({ ...editingCow, marketValue: e.target.value }) : setNewCow({ ...newCow, marketValue: e.target.value })}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem', fontWeight: '800' }}>
              {editingCow ? <span>আপডেট করুন</span> : <><Plus size={16} /><span>গরু সেভ করুন</span></>}
            </button>
          </form>

          {/* Herd Table */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-color)', fontWeight: '800', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>খামারের নিবন্ধিত পশু তালিকা (মোট মূলধন: ৳{totalHerdCapital.toLocaleString()})</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-primary)', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '10px' }}>ট্যাগ আইডি</th>
                    <th style={{ padding: '10px' }}>নাম ও জাত</th>
                    <th style={{ padding: '10px' }}>ক্যাটাগরি</th>
                    <th style={{ padding: '10px' }}>ওজন</th>
                    <th style={{ padding: '10px' }}>ক্রয়মূল্য</th>
                    <th style={{ padding: '10px' }}>দৈনিক দুধ</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>খতিয়ান ও পাসপোর্ট</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody>
                  {cows.map(cow => (
                    <tr key={cow.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '10px', fontWeight: '800', fontFamily: 'monospace', color: '#10b981' }}>{cow.tag}</td>
                      <td style={{ padding: '10px' }}>
                        <strong>{cow.name}</strong>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{cow.breed}</div>
                      </td>
                      <td style={{ padding: '10px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '800', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
                          {cow.category}
                        </span>
                      </td>
                      <td style={{ padding: '10px', fontWeight: '700' }}>{cow.weightKg} কেজি</td>
                      <td style={{ padding: '10px', fontWeight: '800' }}>৳{cow.purchasePrice.toLocaleString()}</td>
                      <td style={{ padding: '10px', color: '#06b6d4', fontWeight: '700' }}>{cow.dailyMilk > 0 ? `${cow.dailyMilk}L` : '—'}</td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => { setSelectedCowForDossier(cow); setDossierTab('pnl'); }}
                          className="btn btn-secondary press-scale"
                          style={{ padding: '4px 8px', fontSize: '0.74rem', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.4)', background: 'rgba(16, 185, 129, 0.12)' }}
                        >
                          📋 খতিয়ান
                        </button>
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => setEditingCow(cow)}
                            className="btn-icon"
                            style={{ color: '#06b6d4', cursor: 'pointer' }}
                            title="এডিট করুন"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCow(cow.id, cow.tag)}
                            className="btn-icon"
                            style={{ color: '#ef4444', cursor: 'pointer' }}
                            title="মুছে ফেলুন"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FEED & NUTRITION EXPENSE */}
      {activeTab === 'feed' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Add / Edit Feed Expense Form */}
          <form onSubmit={editingFeed ? handleUpdateGeneralFeed : handleAddGeneralFeed} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Wheat size={16} style={{ color: '#f59e0b' }} />
                <span>{editingFeed ? '✏️ খাদ্য খরচের রেকর্ড এডিট করুন' : '➕ নতুন খাদ্য ও পুষ্টি খরচের হিসাব এন্ট্রি'}</span>
              </h4>
              {editingFeed && (
                <button type="button" onClick={() => setEditingFeed(null)} className="btn btn-secondary" style={{ padding: '3px 8px', fontSize: '0.72rem' }}>
                  বাতিল
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', marginBottom: '10px' }}>
              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>তারিখ</label>
                <input
                  type="date"
                  className="input-field"
                  value={editingFeed ? editingFeed.date : newGeneralFeed.date}
                  onChange={(e) => editingFeed ? setEditingFeed({ ...editingFeed, date: e.target.value }) : setNewGeneralFeed({ ...newGeneralFeed, date: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>খাদ্যের ধরন / নাম</label>
                <select
                  className="input-field"
                  value={editingFeed ? editingFeed.feedType : newGeneralFeed.feedType}
                  onChange={(e) => editingFeed ? setEditingFeed({ ...editingFeed, feedType: e.target.value }) : setNewGeneralFeed({ ...newGeneralFeed, feedType: e.target.value })}
                >
                  <option value="গম ভুসি ও ভুট্টা ভাঙা">গম ভুসি ও ভুট্টা ভাঙা</option>
                  <option value="সরিষার খৈল / সয়াবিন মিল">সরিষার খৈল / সয়াবিন মিল</option>
                  <option value="কাঁচা নেপিয়ার ঘাস ও সাইলেজ">কাঁচা নেপিয়ার ঘাস ও সাইলেজ</option>
                  <option value="শুকনো খড় (কুটা)">শুকনো খড় (কুটা)</option>
                  <option value="ডিবিপি ও মিনারেল মিক্সচার">ডিবিপি ও মিনারেল মিক্সচার</option>
                  <option value="মোটাতাজাকরণ ক্যাটেল ফিড">মোটাতাজাকরণ ক্যাটেল ফিড</option>
                  <option value="অন্যান্য খাদ্য">অন্যান্য খাদ্য</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>পরিমাণ (কেজি)</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="যেমন: ৫০"
                  value={editingFeed ? editingFeed.amountKg : newGeneralFeed.amountKg}
                  onChange={(e) => editingFeed ? setEditingFeed({ ...editingFeed, amountKg: e.target.value }) : setNewGeneralFeed({ ...newGeneralFeed, amountKg: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>মোট খরচ (টাকা) *</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="যেমন: ১৮৫০"
                  value={editingFeed ? editingFeed.costBdt : newGeneralFeed.costBdt}
                  onChange={(e) => editingFeed ? setEditingFeed({ ...editingFeed, costBdt: e.target.value }) : setNewGeneralFeed({ ...newGeneralFeed, costBdt: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>নোট / সরবরাহকারী</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="ফিড মিল বা লোকাল বাজার"
                  value={editingFeed ? editingFeed.note : newGeneralFeed.note}
                  onChange={(e) => editingFeed ? setEditingFeed({ ...editingFeed, note: e.target.value }) : setNewGeneralFeed({ ...newGeneralFeed, note: e.target.value })}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem', fontWeight: '800' }}>
              {editingFeed ? <span>আপডেট করুন</span> : <><Plus size={16} /><span>খাদ্য খরচ সেভ করুন</span></>}
            </button>
          </form>

          {/* Feed Expenses Table */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '0.9rem' }}>🌾 সর্বমোট খাবার খরচ: ৳{totalFeedCost.toLocaleString()}</strong>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>মোট {feedLogs.length}টি এন্ট্রি</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-primary)', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '10px' }}>তারিখ</th>
                    <th style={{ padding: '10px' }}>খাবারের নাম</th>
                    <th style={{ padding: '10px' }}>পরিমাণ (কেজি)</th>
                    <th style={{ padding: '10px' }}>মোট খরচ</th>
                    <th style={{ padding: '10px' }}>নোট</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody>
                  {feedLogs.map(feed => (
                    <tr key={feed.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '10px', fontWeight: '700' }}>{feed.date}</td>
                      <td style={{ padding: '10px', fontWeight: '800' }}>{feed.feedType}</td>
                      <td style={{ padding: '10px' }}>{feed.amountKg} কেজি</td>
                      <td style={{ padding: '10px', fontWeight: '900', color: '#ef4444' }}>৳{Number(feed.costBdt).toLocaleString()}</td>
                      <td style={{ padding: '10px', color: 'var(--text-muted)' }}>{feed.note || '—'}</td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => setEditingFeed(feed)}
                            className="btn-icon"
                            style={{ color: '#06b6d4', cursor: 'pointer' }}
                            title="এডিট করুন"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteGeneralFeed(feed.id)}
                            className="btn-icon"
                            style={{ color: '#ef4444', cursor: 'pointer' }}
                            title="মুছে ফেলুন"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: VACCINE & HEALTH */}
      {activeTab === 'health' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Add / Edit Vaccine Form */}
          <form onSubmit={editingVaccine ? handleUpdateVaccine : handleAddGeneralVaccine} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={16} style={{ color: '#10b981' }} />
                <span>{editingVaccine ? '✏️ ভ্যাকসিন / চিকিৎসার তথ্য এডিট করুন' : '➕ নতুন টিকা বা চিকিৎসা রেকর্ড যোগ করুন'}</span>
              </h4>
              {editingVaccine && (
                <button type="button" onClick={() => setEditingVaccine(null)} className="btn btn-secondary" style={{ padding: '3px 8px', fontSize: '0.72rem' }}>
                  বাতিল
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginBottom: '10px' }}>
              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>গরুর ট্যাগ নির্বাচন</label>
                <select
                  className="input-field"
                  value={editingVaccine ? editingVaccine.cowTag : newGeneralVaccine.cowTag}
                  onChange={(e) => editingVaccine ? setEditingVaccine({ ...editingVaccine, cowTag: e.target.value }) : setNewGeneralVaccine({ ...newGeneralVaccine, cowTag: e.target.value })}
                >
                  <option value="সকল গরু (Flock)">সকল গরু (সম্পূর্ণ খামার)</option>
                  {cows.map(c => (
                    <option key={c.id} value={c.tag}>{c.tag} ({c.name})</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>ভ্যাকসিন / চিকিৎসার নাম *</label>
                <select
                  className="input-field"
                  value={editingVaccine ? editingVaccine.vaccineName : newGeneralVaccine.vaccineName}
                  onChange={(e) => editingVaccine ? setEditingVaccine({ ...editingVaccine, vaccineName: e.target.value }) : setNewGeneralVaccine({ ...newGeneralVaccine, vaccineName: e.target.value })}
                >
                  <option value="খুরা রোগ (FMD) ভ্যাকসিন">খুরা রোগ (FMD) ভ্যাকসিন</option>
                  <option value="অ্যানথ্রাক্স / তড়কা ভ্যাকসিন">অ্যানথ্রাক্স / তড়কা ভ্যাকসিন</option>
                  <option value="বাদলা (Blackleg BQ) ভ্যাকসিন">বাদলা (Blackleg BQ) ভ্যাকসিন</option>
                  <option value="লাম্পি স্কিন ডিজিজ (LSD)">লাম্পি স্কিন ডিজিজ (LSD)</option>
                  <option value="কৃমিনাশক ডোজ (Deworming)">কৃমিনাশক ডোজ (Deworming)</option>
                  <option value="ওলান ফোলা / ম্যাসটাইটিস চিকিৎসা">ওলান ফোলা / ম্যাসটাইটিস চিকিৎসা</option>
                  <option value="ক্যালসিয়াম ও ভিটামিন থেরাপি">ক্যালসিয়াম ও ভিটামিন থেরাপি</option>
                  <option value="সাধারণ চিকিৎসা ও ড্রিপ">সাধারণ চিকিৎসা ও ড্রিপ</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>প্রদানের তারিখ</label>
                <input
                  type="date"
                  className="input-field"
                  value={editingVaccine ? editingVaccine.date : newGeneralVaccine.date}
                  onChange={(e) => editingVaccine ? setEditingVaccine({ ...editingVaccine, date: e.target.value }) : setNewGeneralVaccine({ ...newGeneralVaccine, date: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>পরবর্তী বুস্টার ডোজের তারিখ</label>
                <input
                  type="date"
                  className="input-field"
                  value={editingVaccine ? editingVaccine.nextDueDate : newGeneralVaccine.nextDueDate}
                  onChange={(e) => editingVaccine ? setEditingVaccine({ ...editingVaccine, nextDueDate: e.target.value }) : setNewGeneralVaccine({ ...newGeneralVaccine, nextDueDate: e.target.value })}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>ডাক্তার / ভেটেরিনারি সার্জন</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="ডাঃ রফিকুল ইসলাম"
                  value={editingVaccine ? editingVaccine.doctorName : newGeneralVaccine.doctorName}
                  onChange={(e) => editingVaccine ? setEditingVaccine({ ...editingVaccine, doctorName: e.target.value }) : setNewGeneralVaccine({ ...newGeneralVaccine, doctorName: e.target.value })}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>চিকিৎসা খরচ (টাকা)</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="450"
                  value={editingVaccine ? editingVaccine.costBdt : newGeneralVaccine.costBdt}
                  onChange={(e) => editingVaccine ? setEditingVaccine({ ...editingVaccine, costBdt: e.target.value }) : setNewGeneralVaccine({ ...newGeneralVaccine, costBdt: e.target.value })}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem', fontWeight: '800' }}>
              {editingVaccine ? <span>আপডেট করুন</span> : <><Plus size={16} /><span>ভ্যাকসিন রেকর্ড সেভ করুন</span></>}
            </button>
          </form>

          {/* Vaccines Table */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-primary)', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '10px' }}>গরুর ট্যাগ</th>
                    <th style={{ padding: '10px' }}>ভ্যাকসিন / চিকিৎসা</th>
                    <th style={{ padding: '10px' }}>প্রদানের তারিখ</th>
                    <th style={{ padding: '10px' }}>পরবর্তী তারিখ</th>
                    <th style={{ padding: '10px' }}>চিকিৎসক</th>
                    <th style={{ padding: '10px' }}>খরচ</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>স্ট্যাটাস</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody>
                  {individualVaccines.map(vac => (
                    <tr key={vac.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '10px', fontWeight: '800', fontFamily: 'monospace', color: '#10b981' }}>{vac.cowTag}</td>
                      <td style={{ padding: '10px', fontWeight: '700' }}>{vac.vaccineName}</td>
                      <td style={{ padding: '10px' }}>{vac.date}</td>
                      <td style={{ padding: '10px', color: '#f59e0b', fontWeight: '800' }}>{vac.nextDueDate || '—'}</td>
                      <td style={{ padding: '10px' }}>{vac.doctorName || 'খামার চিকিৎসক'}</td>
                      <td style={{ padding: '10px', fontWeight: '800', color: '#818cf8' }}>৳{vac.costBdt}</td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleToggleVaccineDone(vac.id)}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '10px',
                            border: 'none',
                            fontSize: '0.72rem',
                            fontWeight: '800',
                            cursor: 'pointer',
                            background: vac.isDone !== false ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: vac.isDone !== false ? '#10b981' : '#f59e0b'
                          }}
                        >
                          {vac.isDone !== false ? '✓ সম্পন্ন' : '⏳ বাকি'}
                        </button>
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => setEditingVaccine(vac)}
                            className="btn-icon"
                            style={{ color: '#06b6d4', cursor: 'pointer' }}
                            title="এডিট করুন"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteVaccine(vac.id)}
                            className="btn-icon"
                            style={{ color: '#ef4444', cursor: 'pointer' }}
                            title="মুছে ফেলুন"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: BREEDING & CALVING TRACKER */}
      {activeTab === 'breeding' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Add / Edit Breeding Form */}
          <form onSubmit={editingBreeding ? handleUpdateBreeding : handleAddBreeding} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={16} style={{ color: '#8b5cf6' }} />
                <span>{editingBreeding ? '✏️ প্রজনন ও গর্ভধারণ রেকর্ড এডিট' : '➕ নতুন কৃত্রিম প্রজনন (AI) ও গর্ভধারণ এন্ট্রি'}</span>
              </h4>
              {editingBreeding && (
                <button type="button" onClick={() => setEditingBreeding(null)} className="btn btn-secondary" style={{ padding: '3px 8px', fontSize: '0.72rem' }}>
                  বাতিল
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', marginBottom: '10px' }}>
              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>গাভীর ট্যাগ</label>
                <select
                  className="input-field"
                  value={editingBreeding ? editingBreeding.cowTag : newBreeding.cowTag}
                  onChange={(e) => editingBreeding ? setEditingBreeding({ ...editingBreeding, cowTag: e.target.value }) : setNewBreeding({ ...newBreeding, cowTag: e.target.value })}
                >
                  {cows.map(c => (
                    <option key={c.id} value={c.tag}>{c.tag} ({c.name})</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>বীজ দেওয়ার তারিখ</label>
                <input
                  type="date"
                  className="input-field"
                  value={editingBreeding ? editingBreeding.inseminationDate : newBreeding.inseminationDate}
                  onChange={(e) => editingBreeding ? setEditingBreeding({ ...editingBreeding, inseminationDate: e.target.value }) : setNewBreeding({ ...newBreeding, inseminationDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>সিমেন / বুলের জাত</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="১০০% হলস্টাইন ফ্রিজিয়ান HF-89"
                  value={editingBreeding ? editingBreeding.semenBreed : newBreeding.semenBreed}
                  onChange={(e) => editingBreeding ? setEditingBreeding({ ...editingBreeding, semenBreed: e.target.value }) : setNewBreeding({ ...newBreeding, semenBreed: e.target.value })}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>এআই কর্মী / ডাক্তার</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="মোঃ আব্দুল মান্নান"
                  value={editingBreeding ? editingBreeding.technicianName : newBreeding.technicianName}
                  onChange={(e) => editingBreeding ? setEditingBreeding({ ...editingBreeding, technicianName: e.target.value }) : setNewBreeding({ ...newBreeding, technicianName: e.target.value })}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>গর্ভধারণ স্ট্যাটাস</label>
                <select
                  className="input-field"
                  value={editingBreeding ? editingBreeding.status : (newBreeding.isPregnant ? 'pregnant' : 'heat_check')}
                  onChange={(e) => editingBreeding ? setEditingBreeding({ ...editingBreeding, status: e.target.value }) : setNewBreeding({ ...newBreeding, isPregnant: e.target.value === 'pregnant' })}
                >
                  <option value="pregnant">🟢 গর্ভবতী কনফার্ম (Pregnant)</option>
                  <option value="heat_check">🟡 হিট চেক অপেক্ষা (Heat Checking)</option>
                  <option value="calved">🍼 বাচ্চা প্রসব সম্পন্ন (Calved)</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem', fontWeight: '800' }}>
              {editingBreeding ? <span>আপডেট করুন</span> : <><Plus size={16} /><span>প্রজনন রেকর্ড সেভ করুন</span></>}
            </button>
          </form>

          {/* Breeding Records Table */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-primary)', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '10px' }}>গাভী</th>
                    <th style={{ padding: '10px' }}>সিমেন প্রদানের তারিখ</th>
                    <th style={{ padding: '10px' }}>বীজের জাত</th>
                    <th style={{ padding: '10px' }}>হিট চেক (২১ দিন)</th>
                    <th style={{ padding: '10px' }}>প্রসবের সম্ভাব্য তারিখ (২৮০ দিন)</th>
                    <th style={{ padding: '10px' }}>দুধ বন্ধ (৬০ দিন পূর্বে)</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>স্ট্যাটাস</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody>
                  {breedingRecords.map(b => (
                    <tr key={b.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '10px', fontWeight: '800', color: '#10b981' }}>{b.cowTag} ({b.cowName})</td>
                      <td style={{ padding: '10px' }}>{b.inseminationDate}</td>
                      <td style={{ padding: '10px', fontWeight: '700' }}>{b.semenBreed}</td>
                      <td style={{ padding: '10px', color: '#f59e0b' }}>{b.heatCheckDate}</td>
                      <td style={{ padding: '10px', fontWeight: '900', color: '#8b5cf6' }}>{b.expectedCalvingDate}</td>
                      <td style={{ padding: '10px', color: '#06b6d4' }}>{b.dryOffDate}</td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '10px',
                          fontSize: '0.72rem',
                          fontWeight: '800',
                          background: b.status === 'pregnant' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: b.status === 'pregnant' ? '#10b981' : '#f59e0b'
                        }}>
                          {b.status === 'pregnant' ? '🟢 গর্ভবতী' : '🟡 হিট চেক'}
                        </span>
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => setEditingBreeding(b)}
                            className="btn-icon"
                            style={{ color: '#06b6d4', cursor: 'pointer' }}
                            title="এডিট করুন"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBreeding(b.id)}
                            className="btn-icon"
                            style={{ color: '#ef4444', cursor: 'pointer' }}
                            title="মুছে ফেলুন"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: MILK YIELD & SALES */}
      {activeTab === 'milk' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Add / Edit Milk Form */}
          <form onSubmit={editingMilk ? handleUpdateMilkLog : handleAddMilkLog} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Droplets size={16} style={{ color: '#06b6d4' }} />
                <span>{editingMilk ? '✏️ দুধ উৎপাদনের রেকর্ড এডিট' : '➕ দৈনিক দুধ উৎপাদন ও বিক্রির হিসাব এন্ট্রি'}</span>
              </h4>
              {editingMilk && (
                <button type="button" onClick={() => setEditingMilk(null)} className="btn btn-secondary" style={{ padding: '3px 8px', fontSize: '0.72rem' }}>
                  বাতিল
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '10px' }}>
              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>তারিখ</label>
                <input
                  type="date"
                  className="input-field"
                  value={editingMilk ? editingMilk.date : newMilk.date}
                  onChange={(e) => editingMilk ? setEditingMilk({ ...editingMilk, date: e.target.value }) : setNewMilk({ ...newMilk, date: e.target.value })}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>সকালের দুধ (L)</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="20"
                  value={editingMilk ? editingMilk.morningLiters : newMilk.morningLiters}
                  onChange={(e) => editingMilk ? setEditingMilk({ ...editingMilk, morningLiters: e.target.value }) : setNewMilk({ ...newMilk, morningLiters: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>বিকালের দুধ (L)</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="15"
                  value={editingMilk ? editingMilk.eveningLiters : newMilk.eveningLiters}
                  onChange={(e) => editingMilk ? setEditingMilk({ ...editingMilk, eveningLiters: e.target.value }) : setNewMilk({ ...newMilk, eveningLiters: e.target.value })}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>বিক্রির দুধ (L)</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="30"
                  value={editingMilk ? editingMilk.soldLiters : newMilk.soldLiters}
                  onChange={(e) => editingMilk ? setEditingMilk({ ...editingMilk, soldLiters: e.target.value }) : setNewMilk({ ...newMilk, soldLiters: e.target.value })}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>দর (টাকা / L)</label>
                <input
                  type="number"
                  className="input-field"
                  value={editingMilk ? editingMilk.ratePerLiter : newMilk.ratePerLiter}
                  onChange={(e) => editingMilk ? setEditingMilk({ ...editingMilk, ratePerLiter: e.target.value }) : setNewMilk({ ...newMilk, ratePerLiter: e.target.value })}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem', fontWeight: '800' }}>
              {editingMilk ? <span>আপডেট করুন</span> : <span>রেকর্ড সেভ করুন</span>}
            </button>
          </form>

          {/* Milk Table */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-primary)', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '10px' }}>তারিখ</th>
                    <th style={{ padding: '10px' }}>সকাল (L)</th>
                    <th style={{ padding: '10px' }}>বিকাল (L)</th>
                    <th style={{ padding: '10px' }}>মোট উৎপাদন</th>
                    <th style={{ padding: '10px' }}>বিক্রির দুধ</th>
                    <th style={{ padding: '10px' }}>মোট আয়</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>POS কার্টে যোগ</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody>
                  {milkLogs.map(log => {
                    const totalDaily = Number(log.morningLiters || 0) + Number(log.eveningLiters || 0);
                    const revenue = Number(log.soldLiters || 0) * Number(log.ratePerLiter || 80);

                    return (
                      <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '10px', fontWeight: '700' }}>{log.date}</td>
                        <td style={{ padding: '10px' }}>{log.morningLiters}L</td>
                        <td style={{ padding: '10px' }}>{log.eveningLiters}L</td>
                        <td style={{ padding: '10px', fontWeight: '800', color: '#06b6d4' }}>{totalDaily}L</td>
                        <td style={{ padding: '10px', fontWeight: '700' }}>{log.soldLiters}L @ ৳{log.ratePerLiter}</td>
                        <td style={{ padding: '10px', fontWeight: '900', color: '#10b981' }}>৳{revenue.toLocaleString()}</td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handlePushMilkToPosCart(log)}
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '0.74rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <ShoppingCart size={13} />
                            <span>কার্টে নিন</span>
                          </button>
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => setEditingMilk(log)}
                              className="btn-icon"
                              style={{ color: '#06b6d4', cursor: 'pointer' }}
                              title="এডিট করুন"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteMilkLog(log.id)}
                              className="btn-icon"
                              style={{ color: '#ef4444', cursor: 'pointer' }}
                              title="মুছে ফেলুন"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: HERBAL HOME REMEDIES DIARY */}
      {activeTab === 'herbal' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Add / Edit Herbal Form */}
          <form onSubmit={editingHerbal ? handleUpdateHerbalRemedy : handleAddHerbalRemedy} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Heart size={16} style={{ color: '#10b981' }} />
                <span>{editingHerbal ? '✏️ ভেষজ চিকিৎসা পদ্ধতি এডিট করুন' : '➕ নতুন ঘরোয়া ভেষজ চিকিৎসা পদ্ধতি যোগ করুন'}</span>
              </h4>
              {editingHerbal && (
                <button type="button" onClick={() => setEditingHerbal(null)} className="btn btn-secondary" style={{ padding: '3px 8px', fontSize: '0.72rem' }}>
                  বাতিল
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '10px' }}>
              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>রোগের নাম *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="যেমন: ওলান ফোলা বা ঘা"
                  value={editingHerbal ? editingHerbal.title : newHerbal.title}
                  onChange={(e) => editingHerbal ? setEditingHerbal({ ...editingHerbal, title: e.target.value }) : setNewHerbal({ ...newHerbal, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>ক্যাটাগরি / ধরন</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="মলম, সেবন বা ওয়াশ"
                  value={editingHerbal ? editingHerbal.category : newHerbal.category}
                  onChange={(e) => editingHerbal ? setEditingHerbal({ ...editingHerbal, category: e.target.value }) : setNewHerbal({ ...newHerbal, category: e.target.value })}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>ইমোজি আইকন</label>
                <select
                  className="input-field"
                  value={editingHerbal ? editingHerbal.icon : newHerbal.icon}
                  onChange={(e) => editingHerbal ? setEditingHerbal({ ...editingHerbal, icon: e.target.value }) : setNewHerbal({ ...newHerbal, icon: e.target.value })}
                >
                  <option value="🌿">🌿 ভেষজ পাতা</option>
                  <option value="🧊">🧊 ঠান্ডা সেক</option>
                  <option value="🫚">🫚 আদা / সোডা</option>
                  <option value="🍌">🍌 কলা ও খাদ্য</option>
                  <option value="🍯">🍯 মধু ও হলুদ</option>
                  <option value="🩹">🩹 ক্ষত মলম</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px', marginBottom: '10px' }}>
              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>প্রয়োজনীয় উপাদানসমূহ *</label>
                <textarea
                  className="input-field"
                  rows={2}
                  placeholder="যেমন: কাঁচা নিমপাতা ২৫০ গ্রাম, কাঁচা হলুদ ১০০ গ্রাম, ফিটকিরি..."
                  value={editingHerbal ? editingHerbal.ingredients : newHerbal.ingredients}
                  onChange={(e) => editingHerbal ? setEditingHerbal({ ...editingHerbal, ingredients: e.target.value }) : setNewHerbal({ ...newHerbal, ingredients: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>প্রস্তুত প্রণালী ও প্রয়োগের নিয়ম</label>
                <textarea
                  className="input-field"
                  rows={2}
                  placeholder="সব উপাদান মিহি করে বেটে দিনে ২ বার লাগান..."
                  value={editingHerbal ? editingHerbal.instructions : newHerbal.instructions}
                  onChange={(e) => editingHerbal ? setEditingHerbal({ ...editingHerbal, instructions: e.target.value }) : setNewHerbal({ ...newHerbal, instructions: e.target.value })}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>খাওয়ানোর টোটকা / বিশেষ সতর্কতা</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="যেমন: সাথে গুড় ও কালিজিরা খাওয়ালে রোগ প্রতিরোধ ক্ষমতা বাড়ে"
                  value={editingHerbal ? editingHerbal.feedingTip : newHerbal.feedingTip}
                  onChange={(e) => editingHerbal ? setEditingHerbal({ ...editingHerbal, feedingTip: e.target.value }) : setNewHerbal({ ...newHerbal, feedingTip: e.target.value })}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem', fontWeight: '800' }}>
              {editingHerbal ? <span>আপডেট করুন</span> : <><Plus size={16} /><span>ভেষজ চিকিৎসা সেভ করুন</span></>}
            </button>
          </form>

          {/* Herbal Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {herbalRemedies.map(remedy => (
              <div key={remedy.id} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '14px', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.3rem' }}>{remedy.icon || '🌿'}</span>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: '800', color: '#10b981' }}>
                        {remedy.title}
                      </h4>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{remedy.category}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => setEditingHerbal(remedy)}
                      className="btn-icon"
                      style={{ color: '#06b6d4', cursor: 'pointer', padding: '2px' }}
                      title="এডিট"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteHerbalRemedy(remedy.id)}
                      className="btn-icon"
                      style={{ color: '#ef4444', cursor: 'pointer', padding: '2px' }}
                      title="মুছুন"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                  <div style={{ marginBottom: '4px' }}>
                    <strong>🌿 উপাদান:</strong> {remedy.ingredients}
                  </div>
                  {remedy.instructions && (
                    <div style={{ marginBottom: '4px' }}>
                      <strong>📋 প্রয়োগ:</strong> {remedy.instructions}
                    </div>
                  )}
                  {remedy.feedingTip && (
                    <div>
                      <strong>💡 টোটকা:</strong> {remedy.feedingTip}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 8: COMPLETE FARM P&L STATEMENT */}
      {activeTab === 'finances' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div id="cattle-pnl-sheet" style={{ background: '#fff', color: '#0f172a', padding: '1.5rem', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f172a', paddingBottom: '12px', marginBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '900', color: '#0f172a' }}>
                  খামারের মাসিক সমন্বিত আয়-ব্যয় ও নিট লাভ স্টেটমেন্ট
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                  তারিখ: {new Date().toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', background: '#e0f2fe', color: '#0369a1', padding: '4px 8px', borderRadius: '6px' }}>
                  CATTLE FINANCIAL AUDIT
                </span>
              </div>
            </div>

            {/* Income & Expense Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#16a34a', borderBottom: '1px solid #cbd5e1', paddingBottom: '6px' }}>
                  🟢 খামারের মোট আয় (Revenue)
                </h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                  <span>দুধ বিক্রির মোট রাজস্ব:</span>
                  <strong>৳{totalMilkRevenue.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                  <span>গোবর ও জৈব সার বিক্রয়:</span>
                  <strong>৳{Number(monthlyFinances.dungFertilizerSale || 0).toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', fontWeight: '900', color: '#16a34a', borderTop: '1px solid #cbd5e1', paddingTop: '6px', marginTop: '6px' }}>
                  <span>সর্বমোট আয়:</span>
                  <span>৳{totalRevenue.toLocaleString()}</span>
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#dc2626', borderBottom: '1px solid #cbd5e1', paddingBottom: '6px' }}>
                  🔴 খামারের মোট পরিচালন খরচ (Operating Costs)
                </h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                  <span>খাদ্য ও পুষ্টি খরচ:</span>
                  <strong>৳{totalFeedCost.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                  <span>বিদ্যুৎ ও মোটর বিল:</span>
                  <strong>৳{Number(monthlyFinances.electricityBill || 0).toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                  <span>পানি ও শেড পরিষ্কার:</span>
                  <strong>৳{Number(monthlyFinances.waterBill || 0).toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                  <span>কর্মচারী / রাখাল বেতন:</span>
                  <strong>৳{Number(monthlyFinances.staffSalary || 0).toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                  <span>পশু চিকিৎসক ফি:</span>
                  <strong>৳{Number(monthlyFinances.vetDoctorFee || 0).toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', fontWeight: '900', color: '#dc2626', borderTop: '1px solid #cbd5e1', paddingTop: '6px', marginTop: '6px' }}>
                  <span>সর্বমোট খরচ:</span>
                  <span>৳{totalOperatingCost.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Bottom Net Profit */}
            <div style={{ padding: '14px', borderRadius: '8px', background: netFarmProfit >= 0 ? '#f0fdf4' : '#fef2f2', border: netFarmProfit >= 0 ? '2px solid #16a34a' : '2px solid #dc2626', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.82rem', color: '#475569', fontWeight: '700' }}>মাসিক নিট লাভ / ক্ষতি (Net Farm Profit)</div>
                <div style={{ fontSize: '0.74rem', color: '#64748b' }}>সর্বমোট রাজস্ব বিয়োগ সর্বমোট পরিচালন ব্যয়</div>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: '900', color: netFarmProfit >= 0 ? '#16a34a' : '#dc2626', fontFamily: 'monospace' }}>
                ৳{netFarmProfit.toLocaleString()}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => printElement('cattle-pnl-sheet', { title: 'Cattle-Farm-Financial-Report' })}
              className="btn btn-primary"
              style={{ flex: 1, padding: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <Printer size={18} />
              <span>রিপোর্ট প্রিন্ট বা PDF ডাউনলোড করুন</span>
            </button>
          </div>
        </div>
      )}

      {/* INDIVIDUAL COW DOSSIER VIEW MODAL */}
      {selectedCowForDossier && selectedCowPnL && (
        <div className="modal-overlay" style={{ zIndex: 10005 }}>
          <div className="modal-content glass-card" style={{ maxWidth: '850px', width: '96%', padding: '1.25rem', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.5rem' }}>🐄</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '900', color: 'var(--text-main)' }}>
                    {selectedCowForDossier.name} ({selectedCowForDossier.tag}) — ব্যক্তিগত খতিয়ান ও পাসপোর্ট
                  </h3>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    জাত: {selectedCowForDossier.breed} | ওজন: {selectedCowForDossier.weightKg} কেজি | ক্যাটাগরি: {selectedCowForDossier.category}
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedCowForDossier(null)} className="btn-icon" style={{ cursor: 'pointer', background: 'transparent', border: 'none', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            {/* Dossier Tabs */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
              <button
                type="button"
                onClick={() => setDossierTab('pnl')}
                style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '800', background: dossierTab === 'pnl' ? '#10b981' : 'transparent', color: dossierTab === 'pnl' ? '#fff' : 'var(--text-main)', border: 'none', cursor: 'pointer' }}
              >
                💰 লাভ-ক্ষতি ও ROI
              </button>
              <button
                type="button"
                onClick={() => setDossierTab('vaccines')}
                style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '800', background: dossierTab === 'vaccines' ? '#10b981' : 'transparent', color: dossierTab === 'vaccines' ? '#fff' : 'var(--text-main)', border: 'none', cursor: 'pointer' }}
              >
                💉 টিকার তারিখ ও চিকিৎসা ({selectedCowPnL.cowVaccines.length})
              </button>
              <button
                type="button"
                onClick={() => setDossierTab('feeds')}
                style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '800', background: dossierTab === 'feeds' ? '#10b981' : 'transparent', color: dossierTab === 'feeds' ? '#fff' : 'var(--text-main)', border: 'none', cursor: 'pointer' }}
              >
                🌾 আলাদা খাদ্য হিস্ট্রি ({selectedCowPnL.cowFeeds.length})
              </button>
            </div>

            {/* Dossier Content */}
            {dossierTab === 'pnl' && (
              <div id="printable-cow-dossier" style={{ background: '#fff', color: '#0f172a', padding: '1.25rem', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0f172a', paddingBottom: '8px', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '900' }}>পশুর ব্যক্তিগত স্বাস্থ্য ও লাভ-ক্ষতি সনদ</h3>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>আইডি: {selectedCowForDossier.tag} | নাম: {selectedCowForDossier.name}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#16a34a' }}>VERIFIED HERD PASSPORT</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.8rem' }}>
                    <strong>বিনিয়োগ (Investment):</strong>
                    <div>ক্রয়মূল্য: ৳{selectedCowPnL.purchaseCost.toLocaleString()}</div>
                    <div>খাদ্য খরচ: ৳{selectedCowPnL.totalFeedCost.toLocaleString()}</div>
                    <div>চিকিৎসা ও টিকা: ৳{selectedCowPnL.totalMedicalCost.toLocaleString()}</div>
                    <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '4px', marginTop: '4px', fontWeight: '800', color: '#dc2626' }}>
                      মোট খরচ: ৳{selectedCowPnL.totalInvestment.toLocaleString()}
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.8rem' }}>
                    <strong>রিটার্ন (Returns):</strong>
                    <div>দুধ থেকে আয়: ৳{selectedCowPnL.estimatedMilkRevenue.toLocaleString()}</div>
                    <div>বর্তমান আনুমানিক বাজারদর: ৳{selectedCowPnL.estimatedMarketValue.toLocaleString()}</div>
                    <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '4px', marginTop: '4px', fontWeight: '800', color: '#16a34a' }}>
                      মোট রিটার্ন: ৳{selectedCowPnL.totalReturn.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div style={{ padding: '10px', borderRadius: '6px', background: selectedCowPnL.netProfit >= 0 ? '#f0fdf4' : '#fef2f2', border: selectedCowPnL.netProfit >= 0 ? '1.5px solid #16a34a' : '1.5px solid #dc2626', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: '800' }}>এই গরু থেকে নিট লাভ (ROI)</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>বিনিয়োগের ওপর লাভ: {selectedCowPnL.roiPercent}%</div>
                  </div>
                  <div style={{ fontSize: '1.3rem', fontWeight: '900', color: selectedCowPnL.netProfit >= 0 ? '#16a34a' : '#dc2626' }}>
                    ৳{selectedCowPnL.netProfit.toLocaleString()}
                  </div>
                </div>

                <div style={{ marginTop: '12px', textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={() => printElement('printable-cow-dossier', { title: `Cow-Passport-${selectedCowForDossier.tag}` })}
                    className="btn btn-primary"
                    style={{ padding: '8px 16px', fontSize: '0.82rem', fontWeight: '800' }}
                  >
                    <Printer size={15} style={{ marginRight: '6px' }} />
                    <span>পাসপোর্ট প্রিন্ট বা PDF ডাউনলোড</span>
                  </button>
                </div>
              </div>
            )}

            {dossierTab === 'vaccines' && (
              <div>
                <form onSubmit={handleAddIndividualVaccine} style={{ background: 'var(--bg-secondary)', padding: '10px', borderRadius: '8px', marginBottom: '10px' }}>
                  <h5 style={{ margin: '0 0 6px 0', fontSize: '0.82rem', fontWeight: '800' }}>➕ নতুন টিকা যুক্ত করুন ({selectedCowForDossier.tag})</h5>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                    <input type="text" className="input-field" placeholder="টিকার নাম" value={newIndVaccine.vaccineName} onChange={(e) => setNewIndVaccine({ ...newIndVaccine, vaccineName: e.target.value })} required />
                    <input type="date" className="input-field" value={newIndVaccine.date} onChange={(e) => setNewIndVaccine({ ...newIndVaccine, date: e.target.value })} required />
                    <input type="date" className="input-field" placeholder="পরবর্তী তারিখ" value={newIndVaccine.nextDueDate} onChange={(e) => setNewIndVaccine({ ...newIndVaccine, nextDueDate: e.target.value })} />
                    <input type="number" className="input-field" placeholder="খরচ (টাকা)" value={newIndVaccine.costBdt} onChange={(e) => setNewIndVaccine({ ...newIndVaccine, costBdt: e.target.value })} />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ marginTop: '8px', padding: '6px 12px', fontSize: '0.78rem', fontWeight: '800' }}>টিকা সংরক্ষণ</button>
                </form>

                <div style={{ background: 'var(--bg-secondary)', borderRadius: '8px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', fontSize: '0.78rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-primary)', textAlign: 'left' }}>
                        <th style={{ padding: '8px' }}>ভ্যাকসিন</th>
                        <th style={{ padding: '8px' }}>তারিখ</th>
                        <th style={{ padding: '8px' }}>পরবর্তী তারিখ</th>
                        <th style={{ padding: '8px' }}>খরচ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCowPnL.cowVaccines.map(v => (
                        <tr key={v.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '8px', fontWeight: '700' }}>{v.vaccineName}</td>
                          <td style={{ padding: '8px' }}>{v.date}</td>
                          <td style={{ padding: '8px', color: '#f59e0b', fontWeight: '800' }}>{v.nextDueDate || '—'}</td>
                          <td style={{ padding: '8px', fontWeight: '800' }}>৳{v.costBdt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {dossierTab === 'feeds' && (
              <div>
                <form onSubmit={handleAddIndividualFeed} style={{ background: 'var(--bg-secondary)', padding: '10px', borderRadius: '8px', marginBottom: '10px' }}>
                  <h5 style={{ margin: '0 0 6px 0', fontSize: '0.82rem', fontWeight: '800' }}>➕ খাদ্য লগ যুক্ত করুন ({selectedCowForDossier.tag})</h5>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                    <input type="text" className="input-field" placeholder="খাদ্যের ধরন" value={newIndFeed.feedType} onChange={(e) => setNewIndFeed({ ...newIndFeed, feedType: e.target.value })} required />
                    <input type="number" className="input-field" placeholder="কেজি" value={newIndFeed.amountKg} onChange={(e) => setNewIndFeed({ ...newIndFeed, amountKg: e.target.value })} required />
                    <input type="number" className="input-field" placeholder="খরচ (টাকা)" value={newIndFeed.costBdt} onChange={(e) => setNewIndFeed({ ...newIndFeed, costBdt: e.target.value })} required />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ marginTop: '8px', padding: '6px 12px', fontSize: '0.78rem', fontWeight: '800' }}>খাদ্য লগ সংরক্ষণ</button>
                </form>

                <div style={{ background: 'var(--bg-secondary)', borderRadius: '8px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', fontSize: '0.78rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-primary)', textAlign: 'left' }}>
                        <th style={{ padding: '8px' }}>তারিখ</th>
                        <th style={{ padding: '8px' }}>খাদ্যের ধরন</th>
                        <th style={{ padding: '8px' }}>পরিমাণ</th>
                        <th style={{ padding: '8px' }}>খরচ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCowPnL.cowFeeds.map(f => (
                        <tr key={f.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '8px' }}>{f.date}</td>
                          <td style={{ padding: '8px', fontWeight: '700' }}>{f.feedType}</td>
                          <td style={{ padding: '8px' }}>{f.amountKg} কেজি</td>
                          <td style={{ padding: '8px', fontWeight: '800', color: '#ef4444' }}>৳{f.costBdt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  if (isPageMode) {
    return (
      <div style={{ padding: '0.75rem', width: '100%', minHeight: '80vh' }}>
        {innerModalCard}
      </div>
    );
  }

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      {innerModalCard}
    </div>
  );
};

export const CattleFarmHubView = (props) => <CattleFarmModal isPageMode={true} {...props} />;
