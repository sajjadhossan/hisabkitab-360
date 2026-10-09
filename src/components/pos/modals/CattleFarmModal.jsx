import React, { useState, useEffect } from 'react';
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
  Info
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
  INDIVIDUAL_VACCINES: 'hk360_cattle_individual_vaccines'
};

const INITIAL_COWS = [
  { id: 'cow-1', tag: 'COW-101', name: 'রানি', breed: 'হলস্টাইন ফ্রিজিয়ান ক্রস', category: 'দুগ্ধবতী গাভী', purchasePrice: 185000, weightKg: 420, dailyMilk: 18, status: 'active', birthDate: '2023-01-15', marketValue: 245000 },
  { id: 'cow-2', tag: 'COW-102', name: 'শোভা', breed: 'শাহীওয়াল', category: 'গর্ভবতী গাভী', purchasePrice: 165000, weightKg: 380, dailyMilk: 12, status: 'pregnant', birthDate: '2023-04-10', marketValue: 210000 },
  { id: 'cow-3', tag: 'COW-103', name: 'বাহাদুর', breed: 'ব্রাহমা ক্রস', category: 'মোটাতাজাকরণ ষাঁড়', purchasePrice: 120000, weightKg: 510, dailyMilk: 0, status: 'fattening', birthDate: '2024-02-01', marketValue: 220000 },
  { id: 'cow-4', tag: 'COW-104', name: 'টুনটুনি', breed: 'ফ্রিজিয়ান বকনা', category: 'দুধের বাছুর', purchasePrice: 45000, weightKg: 95, dailyMilk: 0, status: 'calf', birthDate: '2025-11-20', marketValue: 75000 }
];

const INITIAL_INDIVIDUAL_VACCINES = [
  { id: 'iv-1', cowTag: 'COW-101', date: '2026-08-15', time: '10:30 AM', vaccineName: 'খুরা রোগ (FMD) ভ্যাকসিন', medicine: 'Aftovax Bivalent', doctorName: 'ডাঃ রফিকুল ইসলাম (ভেটেরিনারি সার্জন)', nextDueDate: '2026-12-15', costBdt: 450, note: 'ডান কাঁধের চামড়ার নিচে ইনজেকশন দেওয়া হয়েছে' },
  { id: 'iv-2', cowTag: 'COW-101', date: '2026-06-10', time: '09:00 AM', vaccineName: 'কৃমিনাশক ডোজ (Deworming)', medicine: 'Albendazole 2.5g Bolus', doctorName: 'ডাঃ রফিকুল ইসলাম', nextDueDate: '2026-09-10', costBdt: 220, note: 'সকালে খালি পেটে খাওয়ানো হয়েছে' },
  { id: 'iv-3', cowTag: 'COW-102', date: '2026-07-10', time: '11:15 AM', vaccineName: 'লাম্পি স্কিন ডিজিজ (LSD)', medicine: 'Lumpy Shield Live', doctorName: 'ডাঃ তানভীর আহমেদ', nextDueDate: '2026-11-10', costBdt: 550, note: 'বাৎসরিক বুস্টার ডোজ' },
  { id: 'iv-4', cowTag: 'COW-103', date: '2026-05-20', time: '08:45 AM', vaccineName: 'তড়কা ও বাদলা (BQ/Anthrax)', medicine: 'Blackleg Vaccine', doctorName: 'ডাঃ রফিকুল ইসলাম', nextDueDate: '2026-11-20', costBdt: 350, note: 'বর্ষার পূর্বে প্রটেকশন ডোজ' }
];

const INITIAL_INDIVIDUAL_FEEDS = [
  { id: 'if-1', cowTag: 'COW-101', date: '2026-10-08', time: 'সকাল ও বিকাল', feedType: 'দানাদার পুষ্টি খাদ্য (গম ভুসি, খৈল, ভুট্টা)', amountKg: 6, costBdt: 240, note: 'উচ্চ দুধ উৎপাদনের স্পেশাল রেশন' },
  { id: 'if-2', cowTag: 'COW-101', date: '2026-10-08', time: 'দুপুর', feedType: 'কাঁচা নেপিয়ার ঘাস ও সাইলেজ', amountKg: 20, costBdt: 120, note: 'তাজা সবুজ ঘাস' },
  { id: 'if-3', cowTag: 'COW-101', date: '2026-10-07', time: 'সকাল ও বিকাল', feedType: 'দানাদার পুষ্টি খাদ্য (গম ভুসি, খৈল, ভুট্টা)', amountKg: 6, costBdt: 240, note: 'দৈনিক নিয়মিত রেশন' },
  { id: 'if-4', cowTag: 'COW-102', date: '2026-10-08', time: 'সকাল ও বিকাল', feedType: 'গর্ভবতী গাভীর পুষ্টি খাদ্য ও ক্যালসিয়াম', amountKg: 5, costBdt: 210, note: 'গর্ভকালীন খাদ্য' },
  { id: 'if-5', cowTag: 'COW-103', date: '2026-10-08', time: 'সকাল ও বিকাল', feedType: 'মোটাতাজাকরণ স্পেশাল সাইলেজ ও খড়', amountKg: 8, costBdt: 320, note: 'দ্রুত মাংস বৃদ্ধির হাই-প্রোটিন রেশন' }
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
        { id: 'f-1', date: new Date().toISOString().split('T')[0], feedType: 'গম ভুসি ও ভুট্টা ভাঙা', amountKg: 45, costBdt: 1850 },
        { id: 'f-2', date: new Date().toISOString().split('T')[0], feedType: 'কাঁচা নেপিয়ার ঘাস ও খড়', amountKg: 80, costBdt: 650 }
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

  // Forms
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

  const [newMilk, setNewMilk] = useState({
    date: new Date().toISOString().split('T')[0],
    morningLiters: '',
    eveningLiters: '',
    soldLiters: '',
    ratePerLiter: 80,
    calfLiters: 4
  });

  // New Individual Vaccine Entry Form
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

  // New Individual Feed Entry Form
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
    localStorage.setItem(STORAGE_KEYS.FINANCES, JSON.stringify(monthlyFinances));
  }, [monthlyFinances]);

  if (!isOpen) return null;

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

  // Handle Add Cow
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

  // Handle Add Milk Log
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

  // Handle Add Individual Vaccine for Selected Cow
  const handleAddIndividualVaccine = (e) => {
    e.preventDefault();
    if (!selectedCowForDossier) return;

    const vacEntry = {
      id: `iv_${Date.now()}`,
      cowTag: selectedCowForDossier.tag,
      date: newIndVaccine.date,
      time: newIndVaccine.time,
      vaccineName: newIndVaccine.vaccineName,
      medicine: newIndVaccine.medicine || newIndVaccine.vaccineName,
      doctorName: newIndVaccine.doctorName,
      nextDueDate: newIndVaccine.nextDueDate,
      costBdt: Number(newIndVaccine.costBdt) || 0,
      note: newIndVaccine.note
    };

    setIndividualVaccines(prev => [vacEntry, ...prev]);
    setNewIndVaccine({ ...newIndVaccine, medicine: '', note: '', costBdt: '450' });
    if (showToast) showToast(`💉 ${selectedCowForDossier.tag}-এর জন্য ${vacEntry.vaccineName} সফলভাবে যুক্ত হয়েছে!`, 'success');
  };

  // Handle Add Individual Feed for Selected Cow
  const handleAddIndividualFeed = (e) => {
    e.preventDefault();
    if (!selectedCowForDossier) return;

    const feedEntry = {
      id: `if_${Date.now()}`,
      cowTag: selectedCowForDossier.tag,
      date: newIndFeed.date,
      time: newIndFeed.time,
      feedType: newIndFeed.feedType,
      amountKg: Number(newIndFeed.amountKg) || 0,
      costBdt: Number(newIndFeed.costBdt) || 0,
      note: newIndFeed.note
    };

    setIndividualFeeds(prev => [feedEntry, ...prev]);
    setNewIndFeed({ ...newIndFeed, note: '' });
    if (showToast) showToast(`🌾 ${selectedCowForDossier.tag}-এর খাদ্য খরচ (৳${feedEntry.costBdt}) রেকর্ড হয়েছে!`, 'success');
  };

  // Push Milk Sales directly to POS Cart
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

  // Calculate Individual Cow P&L
  const getCowPnL = (cow) => {
    if (!cow) return null;
    const cowFeeds = individualFeeds.filter(f => f.cowTag === cow.tag);
    const cowVaccines = individualVaccines.filter(v => v.cowTag === cow.tag);

    const totalFeedCost = cowFeeds.reduce((sum, f) => sum + Number(f.costBdt || 0), 0);
    const totalMedicalCost = cowVaccines.reduce((sum, v) => sum + Number(v.costBdt || 0), 0);
    const purchaseCost = Number(cow.purchasePrice || 0);
    const totalInvestment = purchaseCost + totalFeedCost + totalMedicalCost;

    // Estimated milk revenue if cow is milking
    const estimatedMilkRevenue = cow.dailyMilk > 0 ? (cow.dailyMilk * 80 * 90) : 0; // 3 months milk approximation
    const estimatedMarketValue = Number(cow.marketValue || (purchaseCost * 1.35));
    const totalReturn = estimatedMilkRevenue + estimatedMarketValue;
    const netProfit = totalReturn - totalInvestment;

    return {
      cowFeeds,
      cowVaccines,
      totalFeedCost,
      totalMedicalCost,
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

  if (!isOpen && !isPageMode) return null;

  const innerModalCard = (
    <div className={isPageMode ? "glass-card" : "modal-content glass-card"} style={{
      maxWidth: isPageMode ? '1200px' : '980px',
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
              গরুর খামার, প্রতি গরুর আলাদা খাদ্য ও ভ্যাকসিন খতিয়ান এবং সম্পূর্ণ লাভ-লোকসান
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
            { id: 'overview', label: '📊 খামার ড্যাশবোর্ড', icon: Activity },
            { id: 'herd', label: `🐄 গবাদিপশু তালিকা ও খতিয়ান (${cows.length})`, icon: Layers },
            { id: 'milk', label: '🥛 দুধ উৎপাদন ও সেলস', icon: Droplets },
            { id: 'feed', label: '🌾 খাবার ও পুষ্টি খরচ', icon: Wheat },
            { id: 'health', label: '💉 ভ্যাকসিন ও প্রজনন', icon: ShieldCheck },
            { id: 'herbal', label: '🌿 ঘরোয়া ভেষজ চিকিৎসা', icon: Heart },
            { id: 'finances', label: '💰 খামারের মোট P&L', icon: DollarSign }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSelectedCowForDossier(null); }}
                style={{
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontSize: '0.8rem',
                  fontWeight: '800',
                  whiteSpace: 'nowrap',
                  border: isActive ? '1.5px solid #10b981' : '1px solid var(--border-color)',
                  background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-secondary)',
                  color: isActive ? '#10b981' : 'var(--text-main)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ==================================================== */}
        {/* SUB-MODAL: INDIVIDUAL COW DOSSIER & HISTORY VIEW     */}
        {/* ==================================================== */}
        {selectedCowForDossier && selectedCowPnL && (
          <div style={{ background: 'var(--bg-secondary)', border: '2px solid #10b981', borderRadius: '16px', padding: '16px', marginBottom: '1.25rem', position: 'relative' }} className="animate-fade-in">
            {/* Dossier Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '1.4rem' }}>
                  🐄
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '900', color: 'var(--text-main)' }}>
                      {selectedCowForDossier.name}
                    </h3>
                    <span style={{ background: 'rgba(16, 185, 129, 0.18)', color: '#10b981', padding: '2px 8px', borderRadius: '6px', fontWeight: '800', fontFamily: 'monospace', fontSize: '0.82rem' }}>
                      {selectedCowForDossier.tag}
                    </span>
                    <span style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', padding: '2px 8px', borderRadius: '6px', fontWeight: '800', fontSize: '0.75rem' }}>
                      {selectedCowForDossier.category}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    জাত: <strong>{selectedCowForDossier.breed}</strong> • বর্তমান ওজন: <strong>{selectedCowForDossier.weightKg} কেজি</strong> • ক্রয়মূল্য: <strong>৳{selectedCowForDossier.purchasePrice.toLocaleString()}</strong>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => printElement('printable-cow-dossier', { title: `Cow-Passport-${selectedCowForDossier.tag}` })}
                  className="btn btn-primary"
                  style={{ padding: '6px 12px', fontSize: '0.78rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Printer size={15} />
                  <span>🖨️ গরুর পাসপোর্ট প্রিন্ট</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCowForDossier(null)}
                  className="btn btn-secondary"
                  style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Dossier Tabs */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
              <button
                type="button"
                onClick={() => setDossierTab('pnl')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: '800',
                  border: dossierTab === 'pnl' ? '1.5px solid #10b981' : '1px solid var(--border-color)',
                  background: dossierTab === 'pnl' ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-primary)',
                  color: dossierTab === 'pnl' ? '#10b981' : 'var(--text-main)',
                  cursor: 'pointer'
                }}
              >
                💰 এই গরুর লাভ-লোকসান ও ROI
              </button>
              <button
                type="button"
                onClick={() => setDossierTab('vaccines')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: '800',
                  border: dossierTab === 'vaccines' ? '1.5px solid #818cf8' : '1px solid var(--border-color)',
                  background: dossierTab === 'vaccines' ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-primary)',
                  color: dossierTab === 'vaccines' ? '#818cf8' : 'var(--text-main)',
                  cursor: 'pointer'
                }}
              >
                💉 টিকা, ইনজেকশন ও স্বাস্থ্য হিস্ট্রি ({selectedCowPnL.cowVaccines.length})
              </button>
              <button
                type="button"
                onClick={() => setDossierTab('feeds')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: '800',
                  border: dossierTab === 'feeds' ? '1.5px solid #f59e0b' : '1px solid var(--border-color)',
                  background: dossierTab === 'feeds' ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-primary)',
                  color: dossierTab === 'feeds' ? '#f59e0b' : 'var(--text-main)',
                  cursor: 'pointer'
                }}
              >
                🌾 খাদ্য গ্রহণ ও খাবার খরচ খাতা ({selectedCowPnL.cowFeeds.length})
              </button>
            </div>

            {/* DOSSIER TAB 1: INDIVIDUAL COW P&L */}
            {dossierTab === 'pnl' && (
              <div id="printable-cow-dossier">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px', marginBottom: '14px' }}>
                  <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>ক্রয়মূল্য</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '900', color: 'var(--text-main)' }}>
                      ৳{selectedCowPnL.purchaseCost.toLocaleString()}
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>মোট খাবার খরচ</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '900', color: '#f59e0b' }}>
                      ৳{selectedCowPnL.totalFeedCost.toLocaleString()}
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>চিকিৎসা ও টিকা ব্যয়</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '900', color: '#818cf8' }}>
                      ৳{selectedCowPnL.totalMedicalCost.toLocaleString()}
                    </div>
                  </div>
                  <div style={{ background: selectedCowPnL.netProfit >= 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)', border: selectedCowPnL.netProfit >= 0 ? '1.5px solid #10b981' : '1.5px solid #ef4444', borderRadius: '10px', padding: '10px' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>এই গরুর নিট লাভ (ROI: {selectedCowPnL.roiPercent}%)</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: '900', color: selectedCowPnL.netProfit >= 0 ? '#10b981' : '#ef4444' }}>
                      ৳{selectedCowPnL.netProfit.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '12px', fontSize: '0.82rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px dashed var(--border-color)' }}>
                    <span>সর্বমোট ব্যয় ও বিনিয়োগ (ক্রয়মূল্য + খাদ্য + চিকিৎসা):</span>
                    <strong>৳{selectedCowPnL.totalInvestment.toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px dashed var(--border-color)' }}>
                    <span>দুধ বিক্রির আনুমানিক মোট আয়:</span>
                    <strong style={{ color: '#06b6d4' }}>৳{selectedCowPnL.estimatedMilkRevenue.toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px dashed var(--border-color)' }}>
                    <span>বর্তমান আনুমানিক বাজারমূল্য / বিক্রয়মূল্য:</span>
                    <strong style={{ color: '#10b981' }}>৳{selectedCowPnL.estimatedMarketValue.toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '0.92rem', fontWeight: '900', color: selectedCowPnL.netProfit >= 0 ? '#10b981' : '#ef4444' }}>
                    <span>প্রত্যাশিত নিট মুনাফা:</span>
                    <span>৳{selectedCowPnL.netProfit.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* DOSSIER TAB 2: VACCINES & MEDICAL TIMELINE */}
            {dossierTab === 'vaccines' && (
              <div>
                {/* Add Vaccine Form */}
                <form onSubmit={handleAddIndividualVaccine} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '12px', marginBottom: '12px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Plus size={14} />
                    <span>এই গরুর জন্য নতুন টিকা বা ইনজেকশন এন্ট্রি</span>
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', marginBottom: '8px' }}>
                    <div>
                      <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>তারিখ</label>
                      <input type="date" className="input-field" value={newIndVaccine.date} onChange={e => setNewIndVaccine({ ...newIndVaccine, date: e.target.value })} required />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>সময়</label>
                      <input type="text" className="input-field" placeholder="10:30 AM" value={newIndVaccine.time} onChange={e => setNewIndVaccine({ ...newIndVaccine, time: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>ভ্যাকসিন / ইনজেকশন</label>
                      <select className="input-field" value={newIndVaccine.vaccineName} onChange={e => setNewIndVaccine({ ...newIndVaccine, vaccineName: e.target.value })}>
                        <option value="খুরা রোগ (FMD) ভ্যাকসিন">খুরা রোগ (FMD) ভ্যাকসিন</option>
                        <option value="লাম্পি স্কিন ডিজিজ (LSD)">লাম্পি স্কিন ডিজিজ (LSD)</option>
                        <option value="তড়কা ও বাদলা (BQ/Anthrax)">তড়কা ও বাদলা (BQ/Anthrax)</option>
                        <option value="কৃমিনাশক ডোজ (Deworming)">কৃমিনাশক ডোজ (Deworming)</option>
                        <option value="ক্যালসিয়াম ও ভিটামিন ইনজেকশন">ক্যালসিয়াম ও ভিটামিন ইনজেকশন</option>
                        <option value="অ্যান্টিবায়োটিক চিকিৎসা">অ্যান্টিবায়োটিক চিকিৎসা</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>ওষুধের নাম</label>
                      <input type="text" className="input-field" placeholder="যেমন: Aftovax / Renamycin" value={newIndVaccine.medicine} onChange={e => setNewIndVaccine({ ...newIndVaccine, medicine: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>পরবর্তী তারিখ (Next Due)</label>
                      <input type="date" className="input-field" value={newIndVaccine.nextDueDate} onChange={e => setNewIndVaccine({ ...newIndVaccine, nextDueDate: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>খরচ (টাকা)</label>
                      <input type="number" className="input-field" value={newIndVaccine.costBdt} onChange={e => setNewIndVaccine({ ...newIndVaccine, costBdt: e.target.value })} />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.78rem', fontWeight: '800' }}>
                    সেভ করুন
                  </button>
                </form>

                {/* Timeline */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedCowPnL.cowVaccines.map(vac => (
                    <div key={vac.id} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px 12px', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>💉 {vac.vaccineName}</span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>({vac.medicine})</span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          📅 <strong>{vac.date}</strong> ({vac.time}) • ডাক্তার: <strong>{vac.doctorName || 'খামার চিকিৎসক'}</strong>
                          {vac.nextDueDate && <span style={{ color: '#f59e0b', marginLeft: '8px' }}>⏰ পরবর্তী ডোজ: {vac.nextDueDate}</span>}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <strong style={{ color: '#818cf8', fontSize: '0.9rem' }}>৳{vac.costBdt}</strong>
                      </div>
                    </div>
                  ))}
                  {selectedCowPnL.cowVaccines.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      এই গরুর জন্য কোনো ভ্যাকসিন রেকর্ড করা নেই
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* DOSSIER TAB 3: INDIVIDUAL FEEDS */}
            {dossierTab === 'feeds' && (
              <div>
                {/* Add Feed Form */}
                <form onSubmit={handleAddIndividualFeed} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '12px', marginBottom: '12px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Plus size={14} />
                    <span>এই গরুর খাদ্য খরচ এন্ট্রি</span>
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px', marginBottom: '8px' }}>
                    <div>
                      <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>তারিখ</label>
                      <input type="date" className="input-field" value={newIndFeed.date} onChange={e => setNewIndFeed({ ...newIndFeed, date: e.target.value })} required />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>খাবারের ধরণ</label>
                      <select className="input-field" value={newIndFeed.feedType} onChange={e => setNewIndFeed({ ...newIndFeed, feedType: e.target.value })}>
                        <option value="দানাদার পুষ্টি খাদ্য (গম ভুসি, খৈল, ভুট্টা)">দানাদার পুষ্টি খাদ্য (গম ভুসি, খৈল, ভুট্টা)</option>
                        <option value="কাঁচা নেপিয়ার ঘাস ও সাইলেজ">কাঁচা নেপিয়ার ঘাস ও সাইলেজ</option>
                        <option value="শুকনো খড় ও চিটাগুড় মিশ্রণ">শুকনো খড় ও চিটাগুড় মিশ্রণ</option>
                        <option value="মিনারেল ও ক্যালসিয়াম মিক্স">মিনারেল ও ক্যালসিয়াম মিক্স</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>পরিমাণ (কেজি)</label>
                      <input type="number" className="input-field" value={newIndFeed.amountKg} onChange={e => setNewIndFeed({ ...newIndFeed, amountKg: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>খরচ (টাকা)</label>
                      <input type="number" className="input-field" value={newIndFeed.costBdt} onChange={e => setNewIndFeed({ ...newIndFeed, costBdt: e.target.value })} />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.78rem', fontWeight: '800' }}>
                    সেভ করুন
                  </button>
                </form>

                {/* Feed logs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedCowPnL.cowFeeds.map(feed => (
                    <div key={feed.id} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px 12px', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: '800', color: 'var(--text-main)' }}>
                          🌾 {feed.feedType} — <span>{feed.amountKg} কেজি</span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          📅 {feed.date} ({feed.time}) {feed.note && `• ${feed.note}`}
                        </div>
                      </div>
                      <strong style={{ color: '#f59e0b', fontSize: '0.9rem' }}>৳{feed.costBdt}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* MAIN TAB 1: OVERVIEW & KPIS                          */}
        {/* ==================================================== */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              <div className="stat-card" style={{ padding: '12px', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>খামারে মোট গরু</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--text-main)', marginTop: '4px' }}>
                  {cows.length} টি
                </div>
                <div style={{ fontSize: '0.72rem', color: '#10b981', marginTop: '2px' }}>
                  দুগ্ধবতী: {milkingCowsCount} টি | বাছুর: {cows.filter(c => c.category === 'দুধের বাছুর').length} টি
                </div>
              </div>

              <div className="stat-card" style={{ padding: '12px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>মোট দুধ বিক্রি</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#06b6d4', marginTop: '4px' }}>
                  {totalMilkSoldLiters} লিটার
                </div>
                <div style={{ fontSize: '0.72rem', color: '#06b6d4', marginTop: '2px' }}>
                  আয়: ৳{totalMilkRevenue.toLocaleString()}
                </div>
              </div>

              <div className="stat-card" style={{ padding: '12px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>মোট পরিচালন খরচ</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#ef4444', marginTop: '4px' }}>
                  ৳{totalOperatingCost.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  খাদ্য: ৳{totalFeedCost.toLocaleString()} | ইউটিলিটি ও স্টাফ: ৳{monthlyOverhead.toLocaleString()}
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
                  {netFarmProfit >= 0 ? '🟢 খামার লাভজনক অবস্থায় আছে' : '🔴 খামার খরচের তুলনায় পিছিয়ে আছে'}
                </div>
              </div>
            </div>

            {/* Quick Actions & Herd Snapshot */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '14px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={16} style={{ color: '#f59e0b' }} />
                  <span>আসন্ন ভ্যাকসিন ও স্বাস্থ্য সতর্কতা</span>
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {individualVaccines.slice(0, 4).map(v => (
                    <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-primary)', padding: '8px 10px', borderRadius: '8px', fontSize: '0.78rem' }}>
                      <div>
                        <strong>{v.cowTag}</strong> — <span>{v.vaccineName}</span>
                      </div>
                      <span style={{ color: '#f59e0b', fontWeight: '800' }}>তারিখ: {v.nextDueDate || v.date}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '14px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Droplets size={16} style={{ color: '#06b6d4' }} />
                  <span>সর্বশেষ দুধ উৎপাদন রেকর্ড</span>
                </h4>
                {milkLogs.slice(0, 3).map(m => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-primary)', padding: '8px 10px', borderRadius: '8px', fontSize: '0.78rem', marginBottom: '6px' }}>
                    <div>
                      <span>📅 {m.date}</span> — সকাল: {m.morningLiters}L | বিকাল: {m.eveningLiters}L
                    </div>
                    <strong style={{ color: '#10b981' }}>বিক্রি: {m.soldLiters}L (৳{m.soldLiters * m.ratePerLiter})</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* MAIN TAB 2: HERD & CATTLE REGISTRY                   */}
        {/* ==================================================== */}
        {activeTab === 'herd' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Add Cow Form */}
            <form onSubmit={handleAddCow} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '14px' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-main)' }}>
                ➕ নতুন গরু বা বাছুর যুক্ত করুন
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>ট্যাগ নম্বর (ID) *</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="COW-105"
                    value={newCow.tag}
                    onChange={(e) => setNewCow({ ...newCow, tag: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>নাম / পরিচয় *</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="যেমন: শাপলা"
                    value={newCow.name}
                    onChange={(e) => setNewCow({ ...newCow, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>জাত (Breed)</label>
                  <select
                    className="input-field"
                    value={newCow.breed}
                    onChange={(e) => setNewCow({ ...newCow, breed: e.target.value })}
                  >
                    <option value="হলস্টাইন ফ্রিজিয়ান ক্রস">হলস্টাইন ফ্রিজিয়ান ক্রস</option>
                    <option value="শাহীওয়াল">শাহীওয়াল</option>
                    <option value="ব্রাহমা ক্রস">ব্রাহমা ক্রস</option>
                    <option value="রেড চিটাগাং (RCK)">রেড চিটাগাং (RCK)</option>
                    <option value="দেশি উন্নত জাত">দেশি উন্নত জাত</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>ক্যাটাগরি</label>
                  <select
                    className="input-field"
                    value={newCow.category}
                    onChange={(e) => setNewCow({ ...newCow, category: e.target.value })}
                  >
                    <option value="দুগ্ধবতী গাভী">দুগ্ধবতী গাভী</option>
                    <option value="গর্ভবতী গাভী">গর্ভবতী গাভী</option>
                    <option value="মোটাতাজাকরণ ষাঁড়">মোটাতাজাকরণ ষাঁড়</option>
                    <option value="দুধের বাছুর">দুধের বাছুর</option>
                    <option value="বকনা বাছুর">বকনা বাছুর</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>ক্রয়মূল্য (টাকা)</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="150000"
                    value={newCow.purchasePrice}
                    onChange={(e) => setNewCow({ ...newCow, purchasePrice: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>ওজন (কেজি)</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="350"
                    value={newCow.weightKg}
                    onChange={(e) => setNewCow({ ...newCow, weightKg: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>বাজারমূল্য (সম্ভাব্য)</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="200000"
                    value={newCow.marketValue}
                    onChange={(e) => setNewCow({ ...newCow, marketValue: e.target.value })}
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem', fontWeight: '800' }}>
                <Plus size={16} />
                <span>গরু সেভ করুন</span>
              </button>
            </form>

            {/* Cattle Table */}
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-color)', fontWeight: '800', fontSize: '0.92rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>খামারে নিবন্ধিত গবাদিপশুর তালিকা (মোট মূলধন: ৳{totalHerdCapital.toLocaleString()})</span>
                <span style={{ fontSize: '0.74rem', color: '#10b981' }}>💡 যেকোনো গরুর নামের পাশে "খতিয়ান" চাপুন</span>
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
                      <th style={{ padding: '10px', textAlign: 'center' }}>গরুর খতিয়ান ও হিস্ট্রি</th>
                      <th style={{ padding: '10px', textAlign: 'center' }}>অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cows.map(cow => {
                      const pnl = getCowPnL(cow);

                      return (
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
                              style={{
                                padding: '5px 10px',
                                fontSize: '0.76rem',
                                fontWeight: '800',
                                color: '#10b981',
                                borderColor: 'rgba(16, 185, 129, 0.4)',
                                background: 'rgba(16, 185, 129, 0.12)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px'
                              }}
                            >
                              <FileText size={14} />
                              <span>📋 বিস্তারিত খতিয়ান ও টিকা</span>
                            </button>
                          </td>
                          <td style={{ padding: '10px', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`আপনি কি ${cow.tag} ডিলিট করতে চান?`)) {
                                  setCows(prev => prev.filter(c => c.id !== cow.id));
                                }
                              }}
                              className="btn-icon"
                              style={{ color: '#ef4444' }}
                            >
                              <Trash2 size={15} />
                            </button>
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

        {/* ==================================================== */}
        {/* MAIN TAB 3: MILK YIELD & SALES                       */}
        {/* ==================================================== */}
        {activeTab === 'milk' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <form onSubmit={handleAddMilkLog} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '14px' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Droplets size={16} style={{ color: '#06b6d4' }} />
                <span>দৈনিক দুধ উৎপাদন ও সরাসরি বিক্রির হিসাব এন্ট্রি</span>
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>তারিখ</label>
                  <input
                    type="date"
                    className="input-field"
                    value={newMilk.date}
                    onChange={(e) => setNewMilk({ ...newMilk, date: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>সকালের দুধ (লিটার)</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="20"
                    value={newMilk.morningLiters}
                    onChange={(e) => setNewMilk({ ...newMilk, morningLiters: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>বিকালের দুধ (লিটার)</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="15"
                    value={newMilk.eveningLiters}
                    onChange={(e) => setNewMilk({ ...newMilk, eveningLiters: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>বিক্রির দুধ (লিটার)</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="30"
                    value={newMilk.soldLiters}
                    onChange={(e) => setNewMilk({ ...newMilk, soldLiters: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>লিটার প্রতি দর (টাকা)</label>
                  <input
                    type="number"
                    className="input-field"
                    value={newMilk.ratePerLiter}
                    onChange={(e) => setNewMilk({ ...newMilk, ratePerLiter: e.target.value })}
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem', fontWeight: '800' }}>
                <span>রেকর্ড সেভ করুন</span>
              </button>
            </form>

            {/* Milk Records Table */}
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
                      <th style={{ padding: '10px' }}>মোট আয় (টাকা)</th>
                      <th style={{ padding: '10px', textAlign: 'center' }}>POS কার্টে যোগ</th>
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
                              title="এই সেলস মেমোটি POS ক্যাশ কার্টে যোগ করুন"
                            >
                              <ShoppingCart size={13} />
                              <span>কার্টে নিন</span>
                            </button>
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

        {/* ==================================================== */}
        {/* MAIN TAB 4: FEED & NUTRITION                         */}
        {/* ==================================================== */}
        {activeTab === 'feed' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  🌾 দানাদার খাদ্য ও কাঁচা ঘাসের খরচ রেজিস্টার
                </h4>
                <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#ef4444' }}>
                  মোট খাবার খরচ: ৳{totalFeedCost.toLocaleString()}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {feedLogs.map(feed => (
                  <div key={feed.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-primary)', padding: '10px 12px', borderRadius: '8px', fontSize: '0.82rem' }}>
                    <div>
                      <strong>{feed.feedType}</strong> — <span>{feed.amountKg} কেজি</span>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>তারিখ: {feed.date}</div>
                    </div>
                    <strong style={{ color: '#ef4444', fontSize: '0.92rem' }}>৳{feed.costBdt.toLocaleString()}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* MAIN TAB 5: VACCINE & BREEDING CALENDAR              */}
        {/* ==================================================== */}
        {activeTab === 'health' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)', borderRadius: '12px', padding: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              💡 <strong>টিপস:</strong> খামারে খুরা রোগ (FMD) প্রতি ৪-৬ মাসে, তড়কা ও বাদলা বর্ষার পূর্বে এবং লাম্পি স্কিন ডিজিজ (LSD) বছরে ১ বার অবশ্যই দিতে হবে। কোনো গরুর আলাদা খতিয়ান দেখতে <strong>"🐄 গবাদিপশু তালিকা"</strong> ট্যাবে যান।
            </div>

            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-primary)', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '10px' }}>গরুর ট্যাগ</th>
                    <th style={{ padding: '10px' }}>ভ্যাকসিন / চিকিৎসার নাম</th>
                    <th style={{ padding: '10px' }}>প্রদানের তারিখ ও সময়</th>
                    <th style={{ padding: '10px' }}>পরবর্তী তারিখ (Due Date)</th>
                    <th style={{ padding: '10px' }}>ডাক্তার</th>
                    <th style={{ padding: '10px' }}>খরচ</th>
                  </tr>
                </thead>
                <tbody>
                  {individualVaccines.map(vac => (
                    <tr key={vac.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '10px', fontWeight: '800', fontFamily: 'monospace', color: '#10b981' }}>{vac.cowTag}</td>
                      <td style={{ padding: '10px', fontWeight: '700' }}>
                        {vac.vaccineName}
                        {vac.medicine && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{vac.medicine}</div>}
                      </td>
                      <td style={{ padding: '10px' }}>{vac.date} ({vac.time})</td>
                      <td style={{ padding: '10px', color: '#f59e0b', fontWeight: '800' }}>{vac.nextDueDate || '—'}</td>
                      <td style={{ padding: '10px' }}>{vac.doctorName || 'খামার চিকিৎসক'}</td>
                      <td style={{ padding: '10px', fontWeight: '800', color: '#818cf8' }}>৳{vac.costBdt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* MAIN TAB 6: HERBAL HOME REMEDIES DIARY              */}
        {/* ==================================================== */}
        {activeTab === 'herbal' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>🌿</span>
                <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: '800', color: '#10b981' }}>
                  লাম্পি স্কিন ডিজিজ (LSD) ঘরোয়া ভেষজ মলম
                </h4>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                • <strong>উপাদান:</strong> কাঁচা নিমপাতা ২৫০ গ্রাম, কাঁচা হলুদ ১০০ গ্রাম, মধু ৫০ গ্রাম, তুলসী পাতা ও নারকেল তেল।<br />
                • <strong>প্রয়োগ:</strong> সব উপাদান একসাথে মিহি করে বেটে গরুর শরীরের গোটা ও ক্ষতস্থানে দিনে ২ বার প্রলেপ দিন।<br />
                • <strong>খাওয়ানোর টোটকা:</strong> কালিজিরা, আদা ও লেবুর রস গুড়ের সাথে মিশিয়ে খাওয়ালে রোগ প্রতিরোধ ক্ষমতা বাড়ে।
              </p>
            </div>

            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>🧊</span>
                <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: '800', color: '#06b6d4' }}>
                  ওলান ফোলা / ম্যাসটাইটিস (Mastitis)
                </h4>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                • <strong>লক্ষণ:</strong> ওলান গরম ও শক্ত হওয়া, দুধ ছানা ছানা বা রক্ত আসা।<br />
                • <strong>প্রাথমিক ব্যবস্থা:</strong> বরফ দিয়ে দিনে ৩-৪ বার ঠান্ডা সেক দিন। আক্রান্ত বাটের দুধ ঘন ঘন বের করে ফেলুন।<br />
                • <strong>ঘরোয়া ওয়াশ:</strong> পটাশ বা ফিটকিরি মিশ্রিত হালকা কুসুম গরম পানি দিয়ে ওলান পরিষ্কার রাখুন।
              </p>
            </div>

            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>🫚</span>
                <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: '800', color: '#f59e0b' }}>
                  পেট ফাঁপা ও বদহজম (Bloat & Indigestion)
                </h4>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                • <strong>উপাদান:</strong> খাবার সোডা ৫০ গ্রাম, আদা বাটা ৫০ গ্রাম, জিরা গুঁড়া ২৫ গ্রাম, বিট লবণ ২০ গ্রাম।<br />
                • <strong>প্রয়োগ:</strong> ৫০০ মিলি হালকা গরম পানিতে মিশিয়ে অথবা সরিষার তেলের সাথে নলে করে খাইয়ে দিন। পেটে গ্যাস কমবে।
              </p>
            </div>

            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>🍌</span>
                <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: '800', color: '#8b5cf6' }}>
                  বাছুরের পাতলা পায়খানা ও দুর্বলতা
                </h4>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                • কাঁচা কলা সিদ্ধ করে ভাতের মাড়ের সাথে মিশিয়ে বাছুরকে খাওয়ান।<br />
                • ওরস্যালাইন বা ডাবের পানি দিনে বারবার খাওয়ান যাতে পানিশূন্যতা না হয়।
              </p>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* MAIN TAB 7: COMPLETE FARM P&L STATEMENT              */}
        {/* ==================================================== */}
        {activeTab === 'finances' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div id="cattle-pnl-sheet" style={{ background: '#fff', color: '#0f172a', padding: '1.5rem', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f172a', paddingBottom: '12px', marginBottom: '14px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '900', color: '#0f172a' }}>
                    খামারের মাসিক সমন্বিত আয়-ব্যয় ও নিট লাভ স্টেটমেন্ট
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    হিসাবকিতাব ৩৬০ — ক্যাটেল ও ডেইরি ফার্ম ফাইন্যান্সিয়াল রিপোর্ট
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>তারিখ:</div>
                  <strong style={{ fontSize: '0.85rem' }}>{new Date().toLocaleDateString('en-GB')}</strong>
                </div>
              </div>

              {/* Income Section */}
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.92rem', color: '#10b981', fontWeight: '800', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                  ➕ মোট খামার আয় (Total Incomes)
                </h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.85rem' }}>
                  <span>১. দুধ বিক্রির মোট আয় ({totalMilkSoldLiters}L)</span>
                  <strong>৳{totalMilkRevenue.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.85rem' }}>
                  <span>২. গোবর ও জৈব সার বিক্রি</span>
                  <strong>৳{Number(monthlyFinances.dungFertilizerSale || 0).toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.9rem', fontWeight: '800', borderTop: '1px dashed #cbd5e1', marginTop: '4px' }}>
                  <span>মোট খামার রেভিনিউ:</span>
                  <span style={{ color: '#10b981' }}>৳{totalRevenue.toLocaleString()}</span>
                </div>
              </div>

              {/* Expense Section */}
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.92rem', color: '#ef4444', fontWeight: '800', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                  ➖ মোট পরিচালন ব্যয় (Operating Expenses)
                </h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.85rem' }}>
                  <span>১. দানাদার খাদ্য, সাইলেজ ও ঘাস খরচ</span>
                  <strong>৳{totalFeedCost.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.85rem' }}>
                  <span>২. কর্মচারীর মাসিক বেতন ও স্টাফ খরচ</span>
                  <strong>৳{Number(monthlyFinances.staffSalary || 0).toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.85rem' }}>
                  <span>৩. খামারের বিদ্যুৎ বিল (ফ্যান ও মিল্ক কুলার)</span>
                  <strong>৳{Number(monthlyFinances.electricityBill || 0).toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.85rem' }}>
                  <span>৪. পানির বিল ও মোটর পাম্প পরিচালন</span>
                  <strong>৳{Number(monthlyFinances.waterBill || 0).toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.85rem' }}>
                  <span>৫. পশু চিকিৎসক ফি ও ওষুধ খরচ</span>
                  <strong>৳{Number(monthlyFinances.vetDoctorFee || 0).toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.9rem', fontWeight: '800', borderTop: '1px dashed #cbd5e1', marginTop: '4px' }}>
                  <span>মোট পরিচালন ব্যয়:</span>
                  <span style={{ color: '#ef4444' }}>৳{totalOperatingCost.toLocaleString()}</span>
                </div>
              </div>

              {/* Net Profit Summary */}
              <div style={{ background: netFarmProfit >= 0 ? '#f0fdf4' : '#fef2f2', border: netFarmProfit >= 0 ? '2px solid #10b981' : '2px solid #ef4444', borderRadius: '8px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: '700', color: netFarmProfit >= 0 ? '#10b981' : '#ef4444' }}>
                    খামারের নিট লাভ / মুনাফা (Net Profit)
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                    মোট আয় থেকে খাদ্য, স্টাফ, বিদ্যুৎ ও চিকিৎসা খরচ বাদে
                  </div>
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: '900', color: netFarmProfit >= 0 ? '#10b981' : '#ef4444', fontFamily: 'monospace' }}>
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
