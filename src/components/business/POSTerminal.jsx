import React, { useState, useEffect, useRef, useMemo, useCallback, useDeferredValue } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { CounterShiftClosingModal } from '../pos/CounterShiftClosingModal';
import { CounterShiftOpeningModal } from '../pos/CounterShiftOpeningModal';
import { MobilePOSView } from '../pos/MobilePOSView';
import confetti from 'canvas-confetti';
import {
  ScanLine,
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  User,
  CreditCard,
  Banknote,
  Smartphone,
  FileText,
  AlertCircle,
  CheckCircle2,
  Package,
  FolderOpen,
  Store,
  Monitor,
  Clock,
  Shield,
  Sparkles,
  Building2,
  Sun,
  TrendingUp,
  X,
  Image as ImageIcon,
  Grid,
  List,
  Utensils,
  Layers,
  SlidersHorizontal,
  Filter,
  Tag,
  Eye,
  EyeOff,
  Mic,
  Volume2,
  VolumeX,
  Keyboard,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Scale,
  PauseCircle,
  Divide,
  Printer,
  Coins,
  Tv,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Truck,
  Gift,
  Zap
} from 'lucide-react';
import { QuickFilterManagerModal } from '../pos/QuickFilterManagerModal';
import { POSProductCard } from '../pos/POSProductCard';
import { MasterHubModal } from '../common/MasterHubModal';
import { VoiceBillingModal } from '../pos/VoiceBillingModal';
import { VoiceInputButton } from '../common/VoiceInputButton';
import { TemplateReviewModal } from '../common/TemplateReviewModal';
import { IndustryVariationsBar } from '../pos/IndustryVariationsBar';
import { AdaptivePosSwitcherBar } from '../pos/AdaptivePosSwitcherBar';
import { CattleFarmModal, CattleFarmHubView, FARM_POS_CATALOG } from '../pos/modals/CattleFarmModal';
import PharmacyFEFOManager from '../healthcare/PharmacyFEFOManager';
import { HoldCartManagerModal } from '../pos/HoldCartManagerModal';
import { DenominationCalculatorModal } from '../pos/DenominationCalculatorModal';
import { SplitPaymentModal } from '../pos/SplitPaymentModal';
import { ThermalLabelPrinterModal } from '../pos/ThermalLabelPrinterModal';
import { DigitalScaleModal } from '../pos/DigitalScaleModal';
import { SupplierPurchaseOrderModal } from './SupplierPurchaseOrderModal';
import { SalesReturnModal } from './SalesReturnModal';
import { broadcastCartToCustomerDisplay, openCustomerMirrorWindow } from '../../services/customerMirrorService';
import {
  connectSerialPrinter,
  disconnectSerialPrinter,
  connectBluetoothPrinter,
  disconnectBluetoothPrinter,
  subscribeHardwareStatus,
  triggerCashDrawerHardware,
  printEscPosReceiptDirect,
  getHardwareStatus
} from '../../services/hardwareService';
import { triggerSoundboxPayment, isSoundboxEnabled, setSoundboxEnabled, playSoundboxChime } from '../../services/soundboxService';
import {
  playCartPop,
  playScanBeep,
  playSuccessChime,
  playButtonClick,
  playWarningTone
} from '../../services/soundFeedback';
import { requestScreenWakeLock, releaseScreenWakeLock, registerBackAction, hapticFeedback } from '../../services/nativeAppService';

const DEFAULT_QUICK_FILTERS = [
  {
    id: 'all',
    label: 'সব পণ্য',
    enLabel: 'All Products',
    icon: '📦',
    keywords: [],
    subFilters: []
  },
  {
    id: 'oil',
    label: 'তেল ও ঘি',
    enLabel: 'Edible Oil',
    icon: '🛢️',
    keywords: ['তেল', 'oil', 'ঘি', 'ghee', 'সয়াবিন', 'সরিষা', 'soyabean', 'mustard'],
    subFilters: [
      { label: 'সব তেল', keyword: '' },
      { label: 'রূপচাঁদা (Rupchanda)', keyword: 'রূপচাঁদা' },
      { label: 'তীর (Teer)', keyword: 'তীর' },
      { label: 'ফ্রেশ (Fresh)', keyword: 'ফ্রেশ' },
      { label: 'বসুন্ধরা (Bashundhara)', keyword: 'বসুন্ধরা' },
      { label: 'সয়াবিন তেল', keyword: 'সয়াবিন' },
      { label: 'সরিষার তেল', keyword: 'সরিষা' },
      { label: 'সানফ্লাওয়ার তেল', keyword: 'সানফ্লাওয়ার' },
      { label: 'ঘি ও বাটার', keyword: 'ঘি' }
    ]
  },
  {
    id: 'rice',
    label: 'চাল ও শস্য',
    enLabel: 'Rice & Grains',
    icon: '🍚',
    keywords: ['চাল', 'rice', 'নাজিরশাইল', 'মিনিকেট', 'বাসমতী', 'পোলাও', 'চিনিগুঁড়া', 'আমন'],
    subFilters: [
      { label: 'সব চাল', keyword: '' },
      { label: 'নাজিরশাইল', keyword: 'নাজিরশাইল' },
      { label: 'মিনিকেট', keyword: 'মিনিকেট' },
      { label: 'বাসমতী', keyword: 'বাসমতী' },
      { label: 'চিনিগুঁড়া', keyword: 'চিনিগুঁড়া' },
      { label: 'প্রাণ চাল', keyword: 'প্রাণ' },
      { label: 'আকিজ চাল', keyword: 'আকিজ' }
    ]
  },
  {
    id: 'dal',
    label: 'ডাল ও ডালজাতীয়',
    enLabel: 'Lentils & Pulses',
    icon: '🫘',
    keywords: ['ডাল', 'dal', 'মসুর', 'মুগ', 'খেসারি', 'ছোলা', 'বুট', 'মটর'],
    subFilters: [
      { label: 'সব ডাল', keyword: '' },
      { label: 'মসুর ডাল', keyword: 'মসুর' },
      { label: 'মুগ ডাল', keyword: 'মুগ' },
      { label: 'খেসারি ডাল', keyword: 'খেসারি' },
      { label: 'ছোলা ও বুট', keyword: 'ছোলা' }
    ]
  },
  {
    id: 'dairy',
    label: 'দুধ ও মিষ্টি',
    enLabel: 'Milk & Dairy',
    icon: '🥛',
    keywords: ['দুধ', 'milk', 'দই', 'curd', 'মাখন', 'ড্যানো', 'আড়ং', 'মিল্ক ভিটা', 'মিষ্টি', 'রসগোল্লা', 'আইসক্রিম'],
    subFilters: [
      { label: 'সব দুগ্ধজাত', keyword: '' },
      { label: 'তরল দুধ', keyword: 'দুধ' },
      { label: 'গুঁড়ো দুধ', keyword: 'পাউডার' },
      { label: 'মিষ্টি দই', keyword: 'দই' },
      { label: 'আড়ং (Aarong)', keyword: 'আড়ং' },
      { label: 'মিল্ক ভিটা', keyword: 'মিল্ক ভিটা' },
      { label: 'ড্যানো (Dano)', keyword: 'ড্যানো' }
    ]
  },
  {
    id: 'drinks',
    label: 'পানীয় ও ড্রিংকস',
    enLabel: 'Drinks & Soda',
    icon: '🥤',
    keywords: ['পানীয়', 'ড্রিংকস', 'drink', 'juice', 'cola', 'কোক', 'মোজো', 'পানি', 'লাচ্ছি', 'কফি', 'চা', 'স্প্রাইট'],
    subFilters: [
      { label: 'সব পানীয়', keyword: '' },
      { label: 'কোল্ড ড্রিংকস / সোডা', keyword: 'কোল্ড' },
      { label: 'মিনারেল ওয়াটার', keyword: 'পানি' },
      { label: 'ফ্রুট জুস', keyword: 'জুস' },
      { label: 'মোজো (Mojo)', keyword: 'মোজো' },
      { label: 'কোকাকোলা (Coke)', keyword: 'কোক' },
      { label: '৭আপ / স্প্রাইট', keyword: 'স্প্রাইট' },
      { label: 'প্রাণ ড্রিংকস', keyword: 'প্রাণ' }
    ]
  },
  {
    id: 'spices',
    label: 'মসলা ও নিত্যপণ্য',
    enLabel: 'Spices & Essentials',
    icon: '🧂',
    keywords: ['মসলা', 'spice', 'হলুদ', 'মরিচ', 'লবণ', 'চিনি', 'রসুন', 'আদা', 'ধনে', 'জিরা', 'রাধুনী'],
    subFilters: [
      { label: 'সব মসলা', keyword: '' },
      { label: 'রাধুনী (Radhuni)', keyword: 'রাধুনী' },
      { label: 'প্রাণ (Pran)', keyword: 'প্রাণ' },
      { label: 'হলুদ ও মরিচ গুঁড়ো', keyword: 'মরিচ' },
      { label: 'লবণ ও চিনি', keyword: 'লবণ' }
    ]
  },
  {
    id: 'snacks',
    label: 'স্ন্যাক্স ও বেকারি',
    enLabel: 'Snacks & Bakery',
    icon: '🍪',
    keywords: ['স্ন্যাক্স', 'বিস্কুট', 'চিপস', 'কেক', 'কুকিজ', 'নুডলস', 'biscuit', 'cake', 'বার্গার', 'পিৎজা'],
    subFilters: [
      { label: 'সব স্ন্যাক্স', keyword: '' },
      { label: 'বিস্কুট ও কুকিজ', keyword: 'বিস্কুট' },
      { label: 'কেক ও পেস্ট্রি', keyword: 'কেক' },
      { label: 'নুডলস ও পাস্তা', keyword: 'নুডলস' },
      { label: 'চিপস ও চানাচুর', keyword: 'চিপস' }
    ]
  },
  {
    id: 'cosmetics',
    label: 'কসমেটিকস ও কেয়ার',
    enLabel: 'Cosmetics & Care',
    icon: '🧴',
    keywords: ['কসমেটিকস', 'সাবান', 'শ্যাম্পু', 'ক্রিম', 'লোশন', 'লিপস্টিক', 'soap', 'shampoo', 'oil', 'পেস্ট', 'ব্রাশ'],
    subFilters: [
      { label: 'সব কসমেটিকস', keyword: '' },
      { label: 'সাবান ও বডি ওয়াশ', keyword: 'সাবান' },
      { label: 'শ্যাম্পু ও হেয়ার অয়েল', keyword: 'শ্যাম্পু' },
      { label: 'ফেস ওয়াশ ও স্কিনকেয়ার', keyword: 'ফেস' },
      { label: 'ইউনিলিভার (Unilever)', keyword: 'ইউনিলিভার' }
    ]
  }
];

const POPULAR_BRANDS = [
  'রূপচাঁদা', 'তীর', 'ফ্রেশ', 'প্রাণ', 'আকিজ', 'বসুন্ধরা', 'এসিআই', 'স্কয়ার', 
  'আড়ং', 'মিল্ক ভিটা', 'ড্যানো', 'নেসলে', 'ইউনিলিভার', 'মোজো', 'কোকাকোলা', 
  'রাধুনী', 'বিএসআরএম', 'বাটা', 'এপেক্স'
];

export const POSTerminal = () => {
  const {
    products,
    cart,
    salesHistory,
    addToCart,
    updateCartQty,
    removeFromCart,
    clearCart,
    completeSale,
    customers,
    businessSettings,
    openScanner,
    openInvoicePrint,
    openCashDrawer,
    playScannerBeep,
    showToast,
    branches,
    activeBranchId,
    activeCounterId,
    activeBranch,
    activeCounter,
    switchBranch,
    switchCounter,
    setActiveTab,
    t,
    lang,
    posDisplayMode = 'image_grid',
    updatePosDisplayMode,
    activeIndustryId
  } = useApp();

  const [selectedTable, setSelectedTable] = useState('T-1');
  const [orderType, setOrderType] = useState('dine_in'); // 'dine_in' | 'parcel'
  const [selectedWaiter, setSelectedWaiter] = useState('করিম');

  const { user, isOwner, isCashier, isSalesman, role } = useAuth();
  const [showClosingModal, setShowClosingModal] = useState(false);
  const [showRecentSalesModal, setShowRecentSalesModal] = useState(false);
  const [lastCompletedSale, setLastCompletedSale] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showVoiceBillingModal, setShowVoiceBillingModal] = useState(false);
  const [showPOModal, setShowPOModal] = useState(false);
  const [showSalesReturnModal, setShowSalesReturnModal] = useState(false);
  const [showLiveProfit, setShowLiveProfit] = useState(false);
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);
  const [showFastCashModal, setShowFastCashModal] = useState(false);
  const [fastCashTendered, setFastCashTendered] = useState(0);
  const [showCattleModal, setShowCattleModal] = useState(false);
  const [cattleModalInitialTab, setCattleModalInitialTab] = useState('overview');

  // --- TEMPLATE-ADAPTIVE POS ENGINE ARCHITECTURE ---
  const isCattleIndustry = Boolean(
    activeIndustryId?.includes('cattle') ||
    activeIndustryId?.includes('dairy') ||
    activeIndustryId?.includes('milk') ||
    activeIndustryId?.includes('agro') ||
    activeIndustryId?.includes('cow')
  );

  const isPharmacyIndustry = Boolean(
    activeIndustryId?.includes('pharmacy') ||
    activeIndustryId?.includes('health') ||
    activeIndustryId?.includes('medic')
  );

  const autoDefaultEngine = isCattleIndustry ? 'cattle' : (isPharmacyIndustry ? 'pharmacy' : 'retail');

  const [activePosEngine, setActivePosEngine] = useState(() => {
    try {
      const saved = localStorage.getItem('hk360_active_pos_engine');
      if (saved && ['retail', 'cattle', 'pharmacy'].includes(saved)) {
        return saved;
      }
    } catch {}
    return autoDefaultEngine;
  });

  // Automatically adapt POS engine when business template switches
  useEffect(() => {
    const targetEngine = isCattleIndustry ? 'cattle' : (isPharmacyIndustry ? 'pharmacy' : 'retail');
    setActivePosEngine(targetEngine);
    try {
      localStorage.setItem('hk360_active_pos_engine', targetEngine);
    } catch {}
  }, [activeIndustryId, isCattleIndustry, isPharmacyIndustry]);

  const handleSwitchPosEngine = (engine) => {
    hapticFeedback.light();
    playButtonClick();
    setActivePosEngine(engine);
    try {
      localStorage.setItem('hk360_active_pos_engine', engine);
    } catch {}
    if (showToast) {
      const label = engine === 'cattle' ? '🐄 খামার ও ডেইরি POS' : engine === 'pharmacy' ? '💊 ফার্মেসি ও মেডিকেল POS' : '🏪 সাধারণ রিটেইল POS';
      showToast(`${label} সক্রিয় হয়েছে`, 'info');
    }
  };

  const isCattleMode = isCattleIndustry;
  const [cattlePosSubTab, setCattlePosSubTab] = useState('milk'); // 'milk' | 'live' | 'compost_feed' | 'custom_milk'
  const [customMilkLiters, setCustomMilkLiters] = useState('10');
  const [customMilkRate, setCustomMilkRate] = useState('80');
  const [customMilkFat, setCustomMilkFat] = useState('4.2');

  const [showQuickAddCowModal, setShowQuickAddCowModal] = useState(false);
  const [herdRefreshKey, setHerdRefreshKey] = useState(0);
  const [quickCowData, setQuickCowData] = useState({
    tag: `COW-${Math.floor(100 + Math.random() * 900)}`,
    name: 'শাপলা',
    breed: 'হলস্টাইন ফ্রিজিয়ান ক্রস',
    category: 'দুগ্ধবতী গাভী',
    weightKg: '420',
    purchasePrice: '180000',
    marketValue: '235000',
    dailyMilk: '16'
  });

  const handleSelectCowPreset = (presetType) => {
    const randomTag = `COW-${Math.floor(100 + Math.random() * 900)}`;
    if (presetType === 'holstein') {
      setQuickCowData({
        tag: randomTag,
        name: 'রানি ২',
        breed: 'হলস্টাইন ফ্রিজিয়ান ক্রস',
        category: 'দুগ্ধবতী গাভী',
        weightKg: '460',
        purchasePrice: '195000',
        marketValue: '260000',
        dailyMilk: '22'
      });
    } else if (presetType === 'heifer') {
      setQuickCowData({
        tag: randomTag,
        name: 'ময়না',
        breed: 'ফ্রিজিয়ান বকনা বাছুর',
        category: 'বকনা গরু',
        weightKg: '160',
        purchasePrice: '55000',
        marketValue: '85000',
        dailyMilk: '0'
      });
    } else if (presetType === 'bull') {
      setQuickCowData({
        tag: randomTag,
        name: 'সুলতান',
        breed: 'ব্রাহমা মোটাতাজাকরণ ষাঁড়',
        category: 'মোটাতাজাকরণ ষাঁড়',
        weightKg: '540',
        purchasePrice: '135000',
        marketValue: '240000',
        dailyMilk: '0'
      });
    } else if (presetType === 'sahiwal') {
      setQuickCowData({
        tag: randomTag,
        name: 'কাজলী',
        breed: 'শাহীওয়াল জাতের দেশি গরু',
        category: 'দুগ্ধবতী গাভী',
        weightKg: '380',
        purchasePrice: '160000',
        marketValue: '215000',
        dailyMilk: '14'
      });
    }
  };

  const handleSaveQuickCow = (e) => {
    e?.preventDefault();
    if (!quickCowData.tag || !quickCowData.name) {
      if (showToast) showToast('গরুর ট্যাগ এবং নাম লিখুন', 'error');
      return;
    }
    const newAnimal = {
      id: `cow_${Date.now()}`,
      tag: quickCowData.tag.trim(),
      name: quickCowData.name.trim(),
      breed: quickCowData.breed,
      category: quickCowData.category,
      weightKg: Number(quickCowData.weightKg) || 350,
      purchasePrice: Number(quickCowData.purchasePrice) || 120000,
      marketValue: Number(quickCowData.marketValue) || (Number(quickCowData.purchasePrice) * 1.3),
      dailyMilk: Number(quickCowData.dailyMilk) || 0,
      status: 'active',
      birthDate: new Date().toISOString().split('T')[0]
    };

    try {
      const saved = localStorage.getItem('hk360_cattle_herd_data');
      const herd = saved ? JSON.parse(saved) : [
        { id: 'cow-1', tag: 'COW-101', name: 'রানি', breed: 'হলস্টাইন ফ্রিজিয়ান ক্রস', category: 'দুগ্ধবতী গাভী', purchasePrice: 185000, weightKg: 420, dailyMilk: 18, status: 'active', birthDate: '2023-01-15', marketValue: 245000 },
        { id: 'cow-2', tag: 'COW-102', name: 'শোভা', breed: 'শাহীওয়াল', category: 'গর্ভবতী গাভী', purchasePrice: 165000, weightKg: 380, dailyMilk: 12, status: 'pregnant', birthDate: '2023-04-10', marketValue: 210000 },
        { id: 'cow-3', tag: 'COW-103', name: 'বাহাদুর', breed: 'ব্রাহমা ক্রস', category: 'মোটাতাজাকরণ ষাঁড়', purchasePrice: 120000, weightKg: 510, dailyMilk: 0, status: 'fattening', birthDate: '2024-02-01', marketValue: 220000 },
        { id: 'cow-4', tag: 'COW-104', name: 'টুনটুনি', breed: 'ফ্রিজিয়ান বকনা', category: 'দুধের বাছুর', purchasePrice: 45000, weightKg: 95, dailyMilk: 0, status: 'calf', birthDate: '2025-11-20', marketValue: 75000 }
      ];
      herd.unshift(newAnimal);
      localStorage.setItem('hk360_cattle_herd_data', JSON.stringify(herd));
      setHerdRefreshKey(prev => prev + 1);
      setShowQuickAddCowModal(false);
      setQuickCowData({
        tag: `COW-${Math.floor(100 + Math.random() * 900)}`,
        name: '',
        breed: 'হলস্টাইন ফ্রিজিয়ান ক্রস',
        category: 'দুগ্ধবতী গাভী',
        weightKg: '400',
        purchasePrice: '',
        marketValue: '',
        dailyMilk: '15'
      });
      if (showToast) showToast(`✅ নতুন গরু (${newAnimal.tag} - ${newAnimal.name}) সফলভাবে যুক্ত হয়েছে!`, 'success');
    } catch (err) {
      console.error(err);
    }
  };

  // Load live cows for quick sale in POS
  const liveCattleHerd = useMemo(() => {
    try {
      const saved = localStorage.getItem('hk360_cattle_herd_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.filter(c => c.status !== 'sold');
      }
    } catch {}
    return [
      { id: 'cow-1', tag: 'COW-101', name: 'রানি', breed: 'হলস্টাইন ফ্রিজিয়ান ক্রস', category: 'দুগ্ধবতী গাভী', purchasePrice: 185000, weightKg: 420, marketValue: 245000, status: 'active' },
      { id: 'cow-2', tag: 'COW-102', name: 'শোভা', breed: 'শাহীওয়াল', category: 'গর্ভবতী গাভী', purchasePrice: 165000, weightKg: 380, marketValue: 210000, status: 'pregnant' },
      { id: 'cow-3', tag: 'COW-103', name: 'বাহাদুর', breed: 'ব্রাহমা ক্রস', category: 'মোটাতাজাকরণ ষাঁড়', purchasePrice: 120000, weightKg: 510, marketValue: 220000, status: 'fattening' },
      { id: 'cow-4', tag: 'COW-104', name: 'টুনটুনি', breed: 'ফ্রিজিয়ান বকনা', category: 'দুধের বাছুর', purchasePrice: 45000, weightKg: 95, marketValue: 75000, status: 'calf' }
    ];
  }, [showCattleModal, herdRefreshKey]);

  const handleAddLiveCowToCart = (cow) => {
    const cowItem = {
      id: `live_cow_${cow.id}`,
      name: `গরু [${cow.tag} - ${cow.name} (${cow.breed})]`,
      sellPrice: cow.marketValue || cow.purchasePrice || 150000,
      costPrice: cow.purchasePrice || 100000,
      stock: 1,
      unit: 'টি',
      category: 'লাইভ গবাদিপশু',
      cowId: cow.id,
      cowTag: cow.tag,
      isLiveCow: true,
      image: null
    };
    addToCart(cowItem);
    if (showToast) showToast(`🐂 গরু (${cow.tag} - ${cow.name}) বিলে যোগ হয়েছে!`, 'success');
  };

  const handleQuickAddMilk = (liters, rate = 80) => {
    const milkItem = {
      id: `farm_raw_milk_${rate}`,
      name: `খামারের খাঁটি কাঁচা দুধ (${liters} লিটার)`,
      sellPrice: rate * liters,
      costPrice: 60 * liters,
      stock: 500,
      unit: 'লিটার',
      category: 'দুধ ও ডেইরি',
      image: null
    };
    addToCart(milkItem);
    if (showToast) showToast(`🥛 ${liters} লিটার দুধ (৳${(liters * rate).toLocaleString()}) বিলে যোগ হয়েছে!`, 'success');
  };

  const handleAddFarmProductToCart = (prod) => {
    const item = {
      id: `farm_item_${prod.id}`,
      name: prod.name,
      sellPrice: prod.price,
      costPrice: Math.round(prod.price * 0.75),
      stock: 100,
      unit: prod.unit,
      category: prod.category
    };
    addToCart(item);
    if (showToast) showToast(`🛒 ${prod.name} বিলে যোগ হয়েছে`, 'success');
  };

  const handleAddFatMilkToCart = () => {
    const ltr = Number(customMilkLiters) || 1;
    const fat = Number(customMilkFat) || 4.0;
    const rate = Number(customMilkRate) || 80;
    const item = {
      id: `farm_fat_milk_${Date.now()}`,
      name: `খাঁটি দুধ (${ltr}L, ফ্যাট ${fat}%)`,
      sellPrice: rate * ltr,
      costPrice: (rate - 20) * ltr,
      stock: 100,
      unit: 'লট',
      category: 'দুধ ও ডেইরি'
    };
    addToCart(item);
    if (showToast) showToast(`🥛 ${ltr} লিটার দুধ (ফ্যাট ${fat}%) বিলে যোগ হয়েছে!`, 'success');
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const [isShiftActive, setIsShiftActive] = useState(() => {
    return localStorage.getItem(`hk360_shift_active_${activeCounterId}_${todayStr}`) === 'true';
  });

  const [showOpeningModal, setShowOpeningModal] = useState(() => {
    return isCashier && localStorage.getItem(`hk360_shift_active_${activeCounterId}_${todayStr}`) !== 'true';
  });

  // Calculate today's sales and current drawer cash for this active counter (Memoized)
  const todayCounterSales = useMemo(() => {
    return (salesHistory || []).filter(s => 
      (s.counterId === activeCounterId || !s.counterId) &&
      (String(s?.date || '').startsWith(todayStr))
    );
  }, [salesHistory, activeCounterId, todayStr]);

  const todayCounterSalesTotal = useMemo(() => {
    return todayCounterSales.reduce((sum, s) => sum + (Number(s.paidAmount) || 0), 0);
  }, [todayCounterSales]);

  const currentDrawerCash = useMemo(() => {
    return (Number(activeCounter?.openingFloat) || 1000) + todayCounterSales
      .filter(s => s.paymentMethod === 'cash')
      .reduce((sum, s) => sum + (Number(s.paidAmount) || 0), 0);
  }, [activeCounter?.openingFloat, todayCounterSales]);

  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash'); // cash | bkash | card | due
  const [discountAmount, setDiscountAmount] = useState('');
  const [isPartialPayment, setIsPartialPayment] = useState(false);
  const [partialPaidInput, setPartialPaidInput] = useState('');
  const [mobileTab, setMobileTab] = useState('catalog'); // 'catalog' | 'cart'
  const [soundboxActive, setSoundboxActive] = useState(() => isSoundboxEnabled());

  const [isMobileScreen, setIsMobileScreen] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth <= 768 : false;
  });
  const [forceDesktopMode, setForceDesktopMode] = useState(false);
  const [isMobileHeaderExpanded, setIsMobileHeaderExpanded] = useState(false);

  // Responsive Screen Zoom Level (Auto 85% on mobile for comfortable overview, 100% on PC)
  const [zoomLevel, setZoomLevel] = useState(() => {
    try {
      const saved = localStorage.getItem('hk360_pos_zoom_level');
      if (saved) return Number(saved);
      return typeof window !== 'undefined' && window.innerWidth <= 768 ? 85 : 100;
    } catch {
      return 100;
    }
  });

  const handleZoomChange = (delta) => {
    setZoomLevel((prev) => {
      const next = Math.min(130, Math.max(65, prev + delta));
      try {
        localStorage.setItem('hk360_pos_zoom_level', String(next));
      } catch {}
      return next;
    });
  };

  const handleResetZoom = () => {
    const defaultVal = isMobileScreen ? 85 : 100;
    setZoomLevel(defaultVal);
    try {
      localStorage.setItem('hk360_pos_zoom_level', String(defaultVal));
    } catch {}
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Android Hardware / Gesture Back Action: Gracefully return to Dashboard
  useEffect(() => {
    return registerBackAction(() => {
      setActiveTab('dashboard');
      return true;
    });
  }, [setActiveTab]);

  // Graceful Crash Recovery: Notify cashier of recovered draft cart
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem('hk360_pos_draft_cart');
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed && parsed.length > 0) {
          showToast(
            lang === 'bn'
              ? `🛡️ ক্র্যাশ রিকভারি: পূর্বের সেশনের ড্রাফট কার্ট উদ্ধার করা হয়েছে (${parsed.length} টি পণ্য)`
              : `Crash recovery: Restored ${parsed.length} items from previous session`,
            'info'
          );
        }
      }
    } catch {}
  }, []);

  // Multi-Layer Filter States (Layer 1, Layer 2, Brand & Custom Manager)
  const [quickFilters, setQuickFilters] = useState(() => {
    try {
      const saved = localStorage.getItem('hk360_pos_quick_filters');
      return saved ? JSON.parse(saved) : DEFAULT_QUICK_FILTERS;
    } catch {
      return DEFAULT_QUICK_FILTERS;
    }
  });

  const [activeFilterId, setActiveFilterId] = useState('all');
  const [activeSubFilterKeyword, setActiveSubFilterKeyword] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [showFilterManagerModal, setShowFilterManagerModal] = useState(false);
  const [showMasterHubModal, setShowMasterHubModal] = useState(false);
  const [showTemplateReviewModal, setShowTemplateReviewModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [lastAddedItem, setLastAddedItem] = useState(null);

  // Batch 6: POS Hardware & Supercharge Modal States (Items 51-60)
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [showDenominationModal, setShowDenominationModal] = useState(false);
  const [showSplitPaymentModal, setShowSplitPaymentModal] = useState(false);
  const [showThermalLabelModal, setShowThermalLabelModal] = useState(false);
  const [showScaleModal, setShowScaleModal] = useState(false);
  const [pendingSplitPayments, setPendingSplitPayments] = useState(null);

  const [heldCartsCount, setHeldCartsCount] = useState(() => {
    try {
      const saved = localStorage.getItem('hk360_held_carts');
      return saved ? JSON.parse(saved).length : 0;
    } catch {
      return 0;
    }
  });

  const [hwStatus, setHwStatus] = useState(() => (typeof getHardwareStatus === 'function' ? getHardwareStatus() : {
    serialPrinter: false,
    bluetoothPrinter: false,
    weightScale: false
  }));

  const refreshHeldCount = () => {
    try {
      const saved = localStorage.getItem('hk360_held_carts');
      setHeldCartsCount(saved ? JSON.parse(saved).length : 0);
    } catch {
      setHeldCartsCount(0);
    }
  };

  useEffect(() => {
    const unsub = subscribeHardwareStatus((status) => {
      setHwStatus(status);
    });
    return unsub;
  }, []);

  // Mobile Progressive Loading (renders initial chunk to guarantee smooth 60fps and zero WebView freezing)
  const [visibleCount, setVisibleCount] = useState(24);

  // Reset visibleCount whenever search term or filters change
  useEffect(() => {
    setVisibleCount(24);
  }, [searchTerm, selectedCategory, activeFilterId, activeSubFilterKeyword, selectedBrand]);

  // Active UX: Search ref, Undo state & Sound Feedback
  const searchInputRef = useRef(null);
  const layer1ScrollRef = useRef(null);
  const [undoState, setUndoState] = useState(null);

  useEffect(() => {
    if (undoState) {
      const timer = setTimeout(() => {
        setUndoState(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [undoState]);

  const handleProductSelect = (product) => {
    if (product.stock <= 0) {
      playWarningTone();
      showToast(lang === 'bn' ? `⚠️ "${product.name}" এর স্টক শেষ!` : `⚠️ "${product.name}" is out of stock!`, 'warning');
      return;
    }
    playCartPop();
    addToCart(product);
    setLastAddedItem({
      ...product,
      timestamp: Date.now()
    });
  };

  const handleDecrement = (product, e) => {
    e?.stopPropagation();
    const inCart = cart.find(ci => ci.id === product.id);
    if (!inCart) return;
    playButtonClick();
    if (inCart.qty > 1) {
      updateCartQty(product.id, inCart.qty - 1);
    } else {
      removeFromCart(product.id);
    }
  };

  const handleRemoveWithUndo = (item) => {
    playButtonClick();
    removeFromCart(item.id);
    setUndoState({
      type: 'item',
      data: item,
      message: lang === 'bn' ? `"${item.name}" কার্ট থেকে সরানো হয়েছে` : `"${item.name}" removed from cart`
    });
  };

  const handleClearCartWithUndo = () => {
    if (cart.length === 0) return;
    playButtonClick();
    const backupCart = [...cart];
    clearCart();
    setUndoState({
      type: 'cart',
      data: backupCart,
      message: lang === 'bn' ? `${backupCart.length}টি পণ্য কার্ট থেকে ক্লিয়ার করা হয়েছে` : `${backupCart.length} items cleared from cart`
    });
  };

  const handleRestoreUndo = () => {
    if (!undoState) return;
    playSuccessChime();
    if (undoState.type === 'item') {
      addToCart(undoState.data, undoState.data.qty || 1);
    } else if (undoState.type === 'cart' && Array.isArray(undoState.data)) {
      undoState.data.forEach(it => {
        addToCart(it, it.qty || 1);
      });
    }
    setUndoState(null);
    showToast(lang === 'bn' ? '✓ সফলভাবে ফিরিয়ে আনা হয়েছে!' : 'Restored successfully!', 'success');
  };

  const handleCloseMasterHub = () => {
    setShowMasterHubModal(false);
    try {
      const saved = localStorage.getItem('hk360_pos_quick_filters');
      if (saved) setQuickFilters(JSON.parse(saved));
    } catch (e) {
      console.error(e);
    }
  };

  // Save custom filters
  const handleSaveQuickFilters = (newFilters) => {
    setQuickFilters(newFilters);
    try {
      localStorage.setItem('hk360_pos_quick_filters', JSON.stringify(newFilters));
    } catch (e) {
      console.error(e);
    }
    showToast(lang === 'bn' ? 'ফিল্টার শর্টকাট সংরক্ষিত হয়েছে' : 'Filter shortcuts saved');
  };

  const handleResetDefaultFilters = () => {
    setQuickFilters(DEFAULT_QUICK_FILTERS);
    localStorage.removeItem('hk360_pos_quick_filters');
    setActiveFilterId('all');
    setActiveSubFilterKeyword('');
    setSelectedBrand('all');
    showToast(lang === 'bn' ? 'ডিফল্ট শর্টকাটে রিসেট করা হয়েছে' : 'Reset to default shortcuts');
  };

  // Helper to get matching item count for a filter
  const getFilterItemCount = (filter) => {
    if (filter.id === 'all') return products.length;
    if (!filter.keywords || filter.keywords.length === 0) return 0;
    return products.filter(p => {
      const pName = p.name.toLowerCase();
      const pCat = (p.category || '').toLowerCase();
      return filter.keywords.some(kw => pName.includes(kw.toLowerCase()) || pCat.includes(kw.toLowerCase()));
    }).length;
  };

  // Extract unique categories & detected brands (Memoized)
  const categories = useMemo(() => {
    return ['all', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];
  }, [products]);

  const detectedBrands = useMemo(() => {
    return ['all', ...POPULAR_BRANDS.filter(b => 
      products.some(p => p.name.toLowerCase().includes(b.toLowerCase()))
    )];
  }, [products]);

  const activeGroup = useMemo(() => {
    return quickFilters.find(f => f.id === activeFilterId);
  }, [quickFilters, activeFilterId]);

  // Multi-tier filtered products (Memoized with deferred search for instant keystrokes)
  const filteredProducts = useMemo(() => {
    const q = deferredSearchTerm.trim().toLowerCase();
    const hasActiveGroup = activeFilterId !== 'all' && activeGroup && activeGroup.keywords?.length > 0;
    const subKeyword = activeSubFilterKeyword.toLowerCase();
    const brandKeyword = selectedBrand !== 'all' ? selectedBrand.toLowerCase() : null;

    return products.filter(p => {
      const matchesSearch = !q ||
        p.name.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      if (!matchesCategory) return false;

      // Layer 1 Quick Filter
      if (hasActiveGroup) {
        const pName = p.name.toLowerCase();
        const pCat = (p.category || '').toLowerCase();
        const matchesQuickFilter = activeGroup.keywords.some(kw => pName.includes(kw.toLowerCase()) || pCat.includes(kw.toLowerCase()));
        if (!matchesQuickFilter) return false;
      }

      // Layer 2 Sub-Filter
      if (subKeyword) {
        const pName = p.name.toLowerCase();
        const pCat = (p.category || '').toLowerCase();
        const matchesSubFilter = pName.includes(subKeyword) || pCat.includes(subKeyword);
        if (!matchesSubFilter) return false;
      }

      // Brand filter
      if (brandKeyword) {
        if (!p.name.toLowerCase().includes(brandKeyword)) return false;
      }

      return true;
    });
  }, [products, deferredSearchTerm, selectedCategory, activeFilterId, activeGroup, activeSubFilterKeyword, selectedBrand]);

  // Progressive slice of products for optimal touch device performance
  const visibleProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);

  // Seamless auto-load on scroll near bottom (Zero scroll freeze / trap)
  const loadMoreRef = useRef(null);
  const totalFilteredLen = filteredProducts.length;

  useEffect(() => {
    if (!loadMoreRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((prev) => (prev < totalFilteredLen ? Math.min(prev + 30, totalFilteredLen) : prev));
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [totalFilteredLen]);

  // Handle enter key in search (e.g. from USB barcode scanner gun)
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const clean = searchTerm.trim();
      if (!clean) return;
      const matched = products.find(
        p => p.barcode === clean || p.sku.toLowerCase() === clean.toLowerCase() || p.name.toLowerCase() === clean.toLowerCase()
      );
      if (matched) {
        playScanBeep();
        addToCart(matched);
        setSearchTerm('');
      } else {
        playWarningTone();
      }
    }
  };

  const handleOpenScanner = (initialMode = 'barcode') => {
    openScanner((barcode, matchedProduct) => {
      if (matchedProduct) {
        playScanBeep();
        addToCart(matchedProduct);
      }
    }, 'pos', initialMode);
  };

  const handleCheckoutRef = useRef(null);

  // GLOBAL HOTKEYS ENGINE & BARCODE SCANNER (HID WEDGE)
  useEffect(() => {
    let barcodeBuffer = '';
    let lastKeyTime = 0;

    const handleGlobalKeyDown = (e) => {
      // F2: Quick Focus Search Input
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        playButtonClick();
        return;
      }

      // F4: Cycle POS Display Mode (Image Grid -> Hybrid -> Compact)
      if (e.key === 'F4') {
        e.preventDefault();
        const modes = ['image_grid', 'hybrid', 'compact'];
        const currentIdx = modes.indexOf(posDisplayMode);
        const nextMode = modes[(currentIdx + 1) % modes.length];
        if (updatePosDisplayMode) updatePosDisplayMode(nextMode);
        playButtonClick();
        showToast(lang === 'bn' ? `ভিউ মোড: ${nextMode}` : `Display mode: ${nextMode}`);
        return;
      }

      // F6: Hold Cart Manager
      if (e.key === 'F6') {
        e.preventDefault();
        setShowHoldModal(prev => !prev);
        return;
      }

      // F7: Digital Weight Scale Terminal
      if (e.key === 'F7') {
        e.preventDefault();
        setShowScaleModal(prev => !prev);
        return;
      }

      // F8: Instant Cash Checkout Trigger
      if (e.key === 'F8') {
        e.preventDefault();
        if (cart.length > 0) {
          if (handleCheckoutRef.current) {
            handleCheckoutRef.current();
          }
        } else {
          playWarningTone();
          showToast(lang === 'bn' ? '⚠️ কার্ট ফাঁকা! পণ্য যোগ করুন' : 'Cart is empty!', 'warning');
        }
        return;
      }

      // F9 Shortcut: Quick Open Cash Drawer
      if (e.key === 'F9') {
        e.preventDefault();
        openCashDrawer('manual');
        return;
      }

      // F10: Cash Denomination Calculator
      if (e.key === 'F10') {
        e.preventDefault();
        setShowDenominationModal(prev => !prev);
        return;
      }

      // F11 / Alt+D: Customer Mirror Display Window
      if (e.key === 'F11' || (e.altKey && e.key.toLowerCase() === 'd')) {
        e.preventDefault();
        openCustomerMirrorWindow();
        return;
      }

      // Alt+C: Quick Clear Cart with Undo
      if (e.altKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleClearCartWithUndo();
        return;
      }

      // Alt+V or Ctrl+Shift+V: Quick Voice Billing
      if ((e.altKey && e.key.toLowerCase() === 'v') || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'v')) {
        e.preventDefault();
        setShowVoiceBillingModal(prev => !prev);
        return;
      }

      // Escape: Clear active search or close modals
      if (e.key === 'Escape') {
        if (searchTerm) {
          e.preventDefault();
          setSearchTerm('');
        }
      }

      // Check if global scanner is enabled
      if (businessSettings.enableGlobalScanner === false) return;

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime;
      lastKeyTime = currentTime;

      // Detect if user is focused inside a text input or textarea
      const activeTag = document.activeElement?.tagName;
      const isInputFocused = activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT';

      // Barcode scanner guns type at superhuman speed (typically 10ms - 35ms per character)
      // If typing speed is slower than 65ms, clear previous buffer unless it was the very first char
      if (timeDiff > 65 && barcodeBuffer.length > 0) {
        barcodeBuffer = '';
      }

      if (e.key === 'Enter') {
        if (barcodeBuffer.length >= 3) {
          const cleanCode = barcodeBuffer.trim();
          barcodeBuffer = '';

          const matched = products.find(
            p => p.barcode === cleanCode || p.sku.toLowerCase() === cleanCode.toLowerCase()
          );

          if (matched) {
            e.preventDefault();
            playScannerBeep();
            addToCart(matched);
            showToast(
              lang === 'bn'
                ? `⚡ হ্যান্ড স্ক্যানার: ${matched.name} কার্টে যোগ হয়েছে`
                : `⚡ Scanner: ${matched.name} added to cart`,
              'success'
            );
          } else if (!isInputFocused) {
            e.preventDefault();
            showToast(
              lang === 'bn'
                ? `বারকোড (${cleanCode}) দিয়ে কোনো পণ্য মেলেনি`
                : `No product found for scanned code: ${cleanCode}`,
              'warning'
            );
          }
        }
      } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        // Collect single characters into scanner buffer
        barcodeBuffer += e.key;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [products, businessSettings.enableGlobalScanner, lang, addToCart, playScannerBeep, openCashDrawer, showToast, cart]);

  // Customer Loyalty Points (1 point per ৳100 spent, 1 point = ৳1 discount)
  const selectedCustomerObj = useMemo(() => customers.find(c => c.id === selectedCustomerId), [customers, selectedCustomerId]);
  const availableLoyaltyPoints = selectedCustomerObj?.loyaltyPoints || 0;

  // Calculate totals
  const subtotal = cart.reduce((acc, item) => acc + (item.sellPrice * item.qty), 0);
  const totalCartCost = useMemo(() => {
    return cart.reduce((acc, item) => acc + ((Number(item.costPrice) || 0) * item.qty), 0);
  }, [cart]);
  const baseDiscount = Math.min(subtotal, Number(discountAmount) || 0);
  const loyaltyDiscount = (useLoyaltyPoints && availableLoyaltyPoints > 0) ? Math.min(availableLoyaltyPoints, Math.max(0, subtotal - baseDiscount)) : 0;
  const discount = Math.min(subtotal, baseDiscount + loyaltyDiscount);
  const taxableAmount = Math.max(0, subtotal - discount);
  const vat = Math.round(taxableAmount * (businessSettings.vatRate / 100));
  const grandTotal = taxableAmount + vat;

  // Live Gross Profit & Margin (Item 73)
  const liveGrossProfit = Math.max(0, taxableAmount - totalCartCost);
  const liveProfitMarginPct = taxableAmount > 0 ? Math.round((liveGrossProfit / taxableAmount) * 100) : 0;

  const actualPaid = isPartialPayment
    ? Math.min(grandTotal, Math.max(0, Number(partialPaidInput) || 0))
    : (paymentMethod === 'due' ? 0 : grandTotal);
  const remainingDue = Math.max(0, grandTotal - actualPaid);

  // Synchronize cart with Secondary Customer Display in real-time
  useEffect(() => {
    broadcastCartToCustomerDisplay({
      cart,
      subtotal,
      discount,
      vat,
      grandTotal,
      paidAmount: actualPaid,
      changeAmount: Math.max(0, actualPaid - grandTotal),
      paymentMethod,
      storeName: businessSettings.companyName || 'হিসাবকিতাব ৩৬০',
      customerName: customers.find(c => c.id === selectedCustomerId)?.name || ''
    });
  }, [cart, subtotal, discount, vat, grandTotal, actualPaid, paymentMethod, businessSettings.companyName, selectedCustomerId, customers]);

  const handleCheckout = (splitList = null) => {
    if (cart.length === 0) return;

    // Confetti effect & Success Chime & Native Haptics
    playSuccessChime();
    hapticFeedback.success();
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch {}

    const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
    const activeSplit = splitList || pendingSplitPayments;

    const saleRecord = completeSale({
      customerId: selectedCustomer ? selectedCustomer.id : null,
      customerName: selectedCustomer ? selectedCustomer.name : (lang === 'bn' ? 'সাধারণ ক্রেতা (Walk-in)' : 'Walk-in Customer'),
      customerPhone: selectedCustomer ? selectedCustomer.phone : '',
      paymentMethod: activeSplit ? 'split' : paymentMethod,
      discount,
      paidAmount: actualPaid,
      cashierName: user?.name || (user?.email ? user.email.split('@')[0] : 'কাউন্টার ক্যাশিয়ার'),
      table: orderType === 'dine_in' ? selectedTable : (lang === 'bn' ? 'পার্সেল' : 'Parcel/Takeaway'),
      orderType,
      splitPayments: activeSplit,
      usedLoyaltyPoints: loyaltyDiscount
    });

    if (saleRecord) {
      setLastCompletedSale(saleRecord);
      setShowSuccessModal(true);

      // Auto-update status of any live cattle sold in this invoice
      try {
        const soldLiveCows = cart.filter(it => it.isLiveCow || it.cowId);
        if (soldLiveCows.length > 0) {
          const savedHerd = localStorage.getItem('hk360_cattle_herd_data');
          if (savedHerd) {
            const herd = JSON.parse(savedHerd);
            const updated = herd.map(c => {
              const match = soldLiveCows.find(sc => sc.cowId === c.id);
              if (match) {
                return { ...c, status: 'sold', soldPrice: match.sellPrice || match.price, soldDate: new Date().toISOString().split('T')[0] };
              }
              return c;
            });
            localStorage.setItem('hk360_cattle_herd_data', JSON.stringify(updated));
          }
        }
      } catch (err) {
        console.warn('Error marking live cattle as sold:', err);
      }

      // Trigger Smart Digital Voice Soundbox announcement
      triggerSoundboxPayment({
        amount: actualPaid > 0 ? actualPaid : grandTotal,
        method: activeSplit ? 'split' : paymentMethod,
        customerName: selectedCustomer ? selectedCustomer.name : '',
        type: 'sale'
      });

      // Direct Raw ESC/POS Thermal Printing if USB/Bluetooth Printer Connected (Item 51)
      if (hwStatus.serialPrinter || hwStatus.bluetoothPrinter) {
        printEscPosReceiptDirect(saleRecord, businessSettings)
          .then(res => {
            if (res.success && showToast) {
              showToast(lang === 'bn' ? '⚡ সরাসরি থার্মাল প্রিন্টারে রসিদ পাঠানো হয়েছে!' : '⚡ Sent direct ESC/POS print!', 'success');
            }
          })
          .catch(() => {});
      }

      // Customer display sale completion event
      broadcastCartToCustomerDisplay({
        cart: [],
        subtotal: 0,
        discount: 0,
        vat: 0,
        grandTotal: 0,
        paidAmount: actualPaid,
        changeAmount: Math.max(0, actualPaid - grandTotal),
        paymentMethod: activeSplit ? 'split' : paymentMethod,
        isCompleted: true,
        storeName: businessSettings.companyName || 'হিসাবকিতাব ৩৬০',
        customerName: selectedCustomer ? selectedCustomer.name : ''
      });
    }

    setDiscountAmount('');
    setIsPartialPayment(false);
    setPartialPaidInput('');
    setPendingSplitPayments(null);
  };

  // ====================================================
  // 1. TEMPLATE-ADAPTIVE SPECIALIZED POS ENGINES ROUTING
  // ====================================================

  // If Cattle Farm POS Engine is active (Auto from Cattle/Dairy template or switched manually)
  if (activePosEngine === 'cattle') {
    return (
      <div className="animate-fade-in pos-terminal-view" style={{ width: '100%', boxSizing: 'border-box' }}>
        <AdaptivePosSwitcherBar
          activeEngine={activePosEngine}
          onSwitchEngine={handleSwitchPosEngine}
          activeIndustryId={activeIndustryId}
          onOpenTemplateManager={() => setShowTemplateReviewModal(true)}
          onBackToDashboard={() => setActiveTab('dashboard')}
        />
        <CattleFarmHubView
          isPageMode={true}
          initialTab="farm_pos"
          onClose={() => handleSwitchPosEngine('retail')}
        />

        {/* Counter Shift Closing Modal */}
        {showClosingModal && (
          <CounterShiftClosingModal
            isOpen={showClosingModal}
            onClose={() => setShowClosingModal(false)}
          />
        )}

        {/* Counter Shift Opening Modal */}
        {showOpeningModal && (
          <CounterShiftOpeningModal
            isOpen={showOpeningModal}
            onClose={() => setShowOpeningModal(false)}
            onShiftOpened={() => setIsShiftActive(true)}
          />
        )}

        {/* Template Review Modal */}
        {showTemplateReviewModal && (
          <TemplateReviewModal
            isOpen={showTemplateReviewModal}
            onClose={() => setShowTemplateReviewModal(false)}
          />
        )}
      </div>
    );
  }

  // If Pharmacy & Healthcare FEFO POS Engine is active (Auto from Pharmacy template or switched manually)
  if (activePosEngine === 'pharmacy') {
    return (
      <div className="animate-fade-in pos-terminal-view" style={{ width: '100%', boxSizing: 'border-box' }}>
        <AdaptivePosSwitcherBar
          activeEngine={activePosEngine}
          onSwitchEngine={handleSwitchPosEngine}
          activeIndustryId={activeIndustryId}
          onOpenTemplateManager={() => setShowTemplateReviewModal(true)}
          onBackToDashboard={() => setActiveTab('dashboard')}
        />
        <PharmacyFEFOManager
          initialTab="pos"
          isPageMode={true}
          onBackToRetail={() => handleSwitchPosEngine('retail')}
        />

        {/* Counter Shift Closing Modal */}
        {showClosingModal && (
          <CounterShiftClosingModal
            isOpen={showClosingModal}
            onClose={() => setShowClosingModal(false)}
          />
        )}

        {/* Counter Shift Opening Modal */}
        {showOpeningModal && (
          <CounterShiftOpeningModal
            isOpen={showOpeningModal}
            onClose={() => setShowOpeningModal(false)}
            onShiftOpened={() => setIsShiftActive(true)}
          />
        )}

        {/* Template Review Modal */}
        {showTemplateReviewModal && (
          <TemplateReviewModal
            isOpen={showTemplateReviewModal}
            onClose={() => setShowTemplateReviewModal(false)}
          />
        )}
      </div>
    );
  }

  // Dedicated Mobile-First Retail POS View for Android & Mobile Phones
  if (isMobileScreen && !forceDesktopMode) {
    return (
      <div className="animate-fade-in pos-terminal-view" style={{ width: '100%', boxSizing: 'border-box' }}>
        <MobilePOSView
          activePosEngine={activePosEngine}
          onSwitchPosEngine={handleSwitchPosEngine}
          cart={cart}
          addToCart={addToCart}
          updateCartQty={updateCartQty}
          removeFromCart={removeFromCart}
          clearCart={clearCart}
          products={products}
          customers={customers}
          selectedCustomerId={selectedCustomerId}
          setSelectedCustomerId={setSelectedCustomerId}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          discountAmount={discountAmount}
          setDiscountAmount={setDiscountAmount}
          isPartialPayment={isPartialPayment}
          setIsPartialPayment={setIsPartialPayment}
          partialPaidInput={partialPaidInput}
          setPartialPaidInput={setPartialPaidInput}
          handleCheckout={handleCheckout}
          openScanner={openScanner}
          setShowVoiceBillingModal={setShowVoiceBillingModal}
          soundboxActive={soundboxActive}
          setSoundboxActive={setSoundboxActive}
          activeBranch={activeBranch}
          activeCounter={activeCounter}
          isShiftActive={isShiftActive}
          setShowClosingModal={setShowClosingModal}
          setShowOpeningModal={setShowOpeningModal}
          onSwitchToDesktop={() => setForceDesktopMode(true)}
          quickFilters={quickFilters}
          orderType={orderType}
          setOrderType={setOrderType}
          selectedTable={selectedTable}
          setSelectedTable={setSelectedTable}
          selectedWaiter={selectedWaiter}
          setSelectedWaiter={setSelectedWaiter}
          onOpenTemplateManager={() => setShowTemplateReviewModal(true)}
          onClose={() => setActiveTab('dashboard')}
          onNavigate={(targetTab) => setActiveTab(targetTab)}
        />

        {/* Counter Shift Closing Modal */}
        {showClosingModal && (
          <CounterShiftClosingModal
            isOpen={showClosingModal}
            onClose={() => setShowClosingModal(false)}
          />
        )}

        {/* Counter Shift Opening Modal (Morning Cash Register Open) */}
        {showOpeningModal && (
          <CounterShiftOpeningModal
            isOpen={showOpeningModal}
            onClose={() => setShowOpeningModal(false)}
            onShiftOpened={() => setIsShiftActive(true)}
          />
        )}

        {/* MODAL: INSTANT SALE SUCCESS CONFIRMATION */}
        {showSuccessModal && lastCompletedSale && (
          <div className="modal-overlay animate-fade-in" style={{ zIndex: 1200 }}>
            <div className="glass-card modal-container" style={{ maxWidth: '440px', width: '92%', padding: '1.75rem', borderRadius: '16px', textAlign: 'center' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
                <CheckCircle2 size={36} />
              </div>

              <h3 style={{ margin: '0 0 6px 0', fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-main)' }}>
                {lang === 'bn' ? 'বিক্রি সফলভাবে সম্পন্ন হয়েছে!' : 'Sale Completed Successfully!'}
              </h3>
              <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {lang === 'bn' ? 'ইনভয়েস নম্বর:' : 'Invoice No:'} <strong style={{ color: '#10b981', fontFamily: 'var(--font-mono)' }}>#{lastCompletedSale.id}</strong>
              </p>

              {/* Summary Box */}
              <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '1.25rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{lang === 'bn' ? 'ক্রেতার নাম:' : 'Customer:'}</span>
                  <strong style={{ color: 'var(--text-main)' }}>{lastCompletedSale.customerName}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{lang === 'bn' ? 'পণ্যের সংখ্যা:' : 'Items Count:'}</span>
                  <strong style={{ color: 'var(--text-main)' }}>{lastCompletedSale.items?.reduce((s, it) => s + it.qty, 0) || 0} টি</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderTop: '1px dashed var(--border-color)', paddingTop: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{lang === 'bn' ? 'মোট বিল:' : 'Grand Total:'}</span>
                  <strong style={{ color: 'var(--text-main)', fontSize: '1rem', fontFamily: 'var(--font-mono)' }}>৳{Number(lastCompletedSale.grandTotal).toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{lang === 'bn' ? 'পরিশোধ:' : 'Paid:'}</span>
                  <strong style={{ color: '#10b981', fontFamily: 'var(--font-mono)' }}>৳{Number(lastCompletedSale.paidAmount).toLocaleString()} ({lastCompletedSale.paymentMethod?.toUpperCase()})</strong>
                </div>
                {Number(lastCompletedSale.dueAmount) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#ef4444' }}>
                    <span>{lang === 'bn' ? 'অবশিষ্ট বকেয়া:' : 'Remaining Due:'}</span>
                    <strong style={{ fontFamily: 'var(--font-mono)' }}>৳{Number(lastCompletedSale.dueAmount).toLocaleString()}</strong>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    openInvoicePrint(lastCompletedSale);
                    setShowSuccessModal(false);
                  }}
                  className="btn btn-primary"
                  style={{ flex: 1.2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: '800', background: 'linear-gradient(135deg, #10b981, #059669)' }}
                >
                  <FileText size={16} />
                  <span>{lang === 'bn' ? 'রিসিট প্রিন্ট করুন' : 'Print Receipt'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowSuccessModal(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1, fontWeight: '700' }}
                >
                  {lang === 'bn' ? 'পরবর্তী বিল' : 'Next Sale'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* BENGALI AI VOICE BILLING MODAL */}
        <VoiceBillingModal
          isOpen={showVoiceBillingModal}
          onClose={() => setShowVoiceBillingModal(false)}
          onAddToCart={addToCart}
          onPOSAction={(action) => {
            if (action.type === 'discount') {
              setDiscountAmount(String(action.amount));
            } else if (action.type === 'clear_cart') {
              clearCart();
            } else if (action.type === 'open_drawer') {
              openCashDrawer('manual');
            } else if (action.type === 'checkout') {
              handleCheckout();
            } else if (action.type === 'payment_method') {
              setPaymentMethod(action.method);
            }
          }}
        />
      </div>
    );
  }

  handleCheckoutRef.current = handleCheckout;

  return (
    <div
      className="animate-fade-in pos-terminal-view"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem',
        width: '100%',
        zoom: zoomLevel !== 100 ? `${zoomLevel}%` : undefined
      }}
    >
      {/* 🌟 TEMPLATE-ADAPTIVE POS MODE SWITCHER BAR */}
      <AdaptivePosSwitcherBar
        activeEngine={activePosEngine}
        onSwitchEngine={handleSwitchPosEngine}
        activeIndustryId={activeIndustryId}
        onOpenTemplateManager={() => setShowTemplateReviewModal(true)}
        onBackToDashboard={() => setActiveTab('dashboard')}
      />

      {/* Floating Return-to-Mobile Pill when Desktop Mode is forced on Mobile */}
      {isMobileScreen && forceDesktopMode && (
        <button
          type="button"
          onClick={() => {
            hapticFeedback.light();
            setForceDesktopMode(false);
          }}
          style={{
            position: 'fixed',
            top: '72px',
            right: '12px',
            zIndex: 9995,
            padding: '7px 14px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#ffffff',
            border: '2px solid rgba(255, 255, 255, 0.45)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45), 0 0 12px rgba(99, 102, 241, 0.5)',
            fontSize: '0.8rem',
            fontWeight: '800',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
          title={lang === 'bn' ? 'মোবাইল মোডে ফিরুন' : 'Back to Mobile Mode'}
        >
          <span>📱 {lang === 'bn' ? 'মোবাইল মোড' : 'Mobile Mode'}</span>
        </button>
      )}

      {/* MOBILE COMPACT HEADER BAR */}
      {isMobileScreen && (
        <div
          className="glass-card"
          style={{
            padding: '0.55rem 0.85rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--bg-secondary)',
            borderLeft: '4px solid var(--business-primary)',
            borderRadius: '12px',
            gap: '8px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flexWrap: 'wrap' }}>
            {/* Quick 1-Tap Back to Dashboard Button */}
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className="btn btn-secondary"
              style={{
                padding: '4px 8px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                fontSize: '0.75rem',
                fontWeight: '800',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: 'var(--bg-primary)',
                cursor: 'pointer'
              }}
              title={lang === 'bn' ? 'ড্যাশবোর্ডে ফিরে যান' : 'Back to Dashboard'}
            >
              <ArrowLeft size={14} />
              <span>{lang === 'bn' ? 'ড্যাশবোর্ড' : 'Home'}</span>
            </button>

            <span style={{ fontSize: '0.84rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Store size={15} style={{ color: 'var(--business-primary)' }} />
              {activeBranch?.name || (lang === 'bn' ? 'প্রধান শাখা' : 'Main Branch')} • {activeCounter?.name || (lang === 'bn' ? 'কাউন্টার ১' : 'Counter 1')}
            </span>
            <span
              className="badge"
              style={{
                fontSize: '0.65rem',
                background: isShiftActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                color: isShiftActive ? '#10b981' : '#f59e0b',
                border: isShiftActive ? '1px solid #10b981' : '1px solid #f59e0b',
                flexShrink: 0
              }}
            >
              {isShiftActive ? (lang === 'bn' ? '🟢 শিফট চালু' : 'Shift Active') : (lang === 'bn' ? '🌅 শিফট বন্ধ' : 'Closed')}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* Mobile Screen Zoom In / Out Controls */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '2px 4px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)'
              }}
            >
              <button
                type="button"
                onClick={() => handleZoomChange(-5)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                  padding: '3px 5px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title={lang === 'bn' ? 'জুম আউট (স্ক্রিন ছোট করুন)' : 'Zoom Out'}
              >
                <ZoomOut size={13} />
              </button>

              <button
                type="button"
                onClick={handleResetZoom}
                style={{
                  background: zoomLevel !== 100 ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                  border: 'none',
                  color: zoomLevel !== 100 ? '#818cf8' : 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px 4px',
                  borderRadius: '4px',
                  fontSize: '0.68rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: '700'
                }}
                title={lang === 'bn' ? 'রিসেট' : 'Reset'}
              >
                {zoomLevel}%
              </button>

              <button
                type="button"
                onClick={() => handleZoomChange(5)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                  padding: '3px 5px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title={lang === 'bn' ? 'জুম ইন (স্ক্রিন বড় করুন)' : 'Zoom In'}
              >
                <ZoomIn size={13} />
              </button>
            </div>

            {forceDesktopMode && (
              <button
                type="button"
                onClick={() => setForceDesktopMode(false)}
                className="btn btn-primary"
                style={{
                  padding: '5px 10px',
                  fontSize: '0.72rem',
                  fontWeight: '800',
                  borderRadius: '7px',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                }}
                title={lang === 'bn' ? 'মোবাইল মোডে ফিরুন' : 'Back to Mobile Mode'}
              >
                <span>📱 {lang === 'bn' ? 'মোবাইল মোড' : 'Mobile'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsMobileHeaderExpanded(!isMobileHeaderExpanded)}
              className="btn btn-secondary"
              style={{
                padding: '5px 8px',
                fontSize: '0.72rem',
                fontWeight: '700',
                borderRadius: '7px',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <SlidersHorizontal size={12} />
              <span>{isMobileHeaderExpanded ? (lang === 'bn' ? '▲ লুকান' : 'Hide') : (lang === 'bn' ? '⚙️ টুলস' : 'Tools')}</span>
            </button>

            {/* 1-Tap Quick Exit Cross Button */}
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                border: '1.5px solid rgba(239, 68, 68, 0.45)',
                background: 'rgba(239, 68, 68, 0.12)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0
              }}
              title={lang === 'bn' ? 'পজ থেকে বের হয়ে ড্যাশবোর্ডে যান' : 'Exit POS to Dashboard'}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* MULTI-BRANCH & CASH COUNTER HEADER BAR (Collapsible on Mobile) */}
      {(!isMobileScreen || isMobileHeaderExpanded) && (
        <>
        <div
          className="glass-card"
          style={{
            padding: '0.75rem 1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
            background: 'var(--bg-secondary)',
            borderLeft: '4px solid var(--business-primary)'
          }}
        >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Back to Dashboard Button */}
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className="btn btn-secondary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '0.82rem',
              fontWeight: '700',
              borderRadius: '8px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              cursor: 'pointer'
            }}
            title={lang === 'bn' ? 'ড্যাশবোর্ডে ফিরে যান' : 'Back to Dashboard'}
          >
            <ArrowLeft size={16} />
            <span>{lang === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard'}</span>
          </button>

          {/* Branch Selector or Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Store size={18} style={{ color: 'var(--business-primary)' }} />
            {isOwner ? (
              <select
                className="input-field"
                value={activeBranchId}
                onChange={(e) => switchBranch(e.target.value)}
                style={{ padding: '4px 10px', fontSize: '0.82rem', fontWeight: '700', borderRadius: '6px', background: 'var(--bg-primary)' }}
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    🏢 {b.name}
                  </option>
                ))}
              </select>
            ) : (
              <span style={{ fontSize: '0.88rem', fontWeight: '800', color: 'var(--text-main)' }}>
                🏢 {activeBranch?.name}
              </span>
            )}
          </div>

          {/* Counter Selector or Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Monitor size={18} style={{ color: '#10b981' }} />
            {isOwner ? (
              <select
                className="input-field"
                value={activeCounterId}
                onChange={(e) => switchCounter(e.target.value)}
                style={{ padding: '4px 10px', fontSize: '0.82rem', fontWeight: '700', borderRadius: '6px', background: 'var(--bg-primary)' }}
              >
                {(activeBranch?.counters || []).map((c) => (
                  <option key={c.id} value={c.id}>
                    🖥️ {c.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid #10b981', fontSize: '0.78rem', fontWeight: '700' }}>
                🖥️ {activeCounter?.name}
              </span>
            )}
          </div>

          {/* Cashier / Staff Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            <User size={15} />
            <span>
              {lang === 'bn' ? 'অপারেটর:' : 'Operator:'} <strong style={{ color: 'var(--text-main)' }}>{user?.name || (lang === 'bn' ? 'কাউন্টার ক্যাশিয়ার' : 'Cashier')}</strong>
            </span>
            <span
              className="badge"
              style={{
                fontSize: '0.68rem',
                textTransform: 'uppercase',
                background: isOwner ? 'rgba(99, 102, 241, 0.15)' : (isSalesman ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)'),
                color: isOwner ? '#6366f1' : (isSalesman ? '#f59e0b' : '#10b981')
              }}
            >
              {isOwner ? 'মালিক' : (isSalesman ? 'সেলসম্যান' : (role === 'sr' ? 'এসআর' : 'ক্যাশিয়ার'))}
            </span>
          </div>
        </div>

        {/* Top Action Clusters: Shift, Operations, Hardware & Utilities */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          
          {/* Cluster 1: Shift & Cash Management */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingRight: '8px', borderRight: '1px solid var(--border-color)' }}>
            {isSalesman ? (
              <div style={{ fontSize: '0.78rem', color: '#f59e0b', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Sparkles size={14} />
                <span>{lang === 'bn' ? 'সেলসম্যান ট্রলি মোড' : 'Salesman Mode'}</span>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setShowOpeningModal(true)}
                  className="btn btn-secondary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '5px 10px',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    borderRadius: '8px',
                    border: isShiftActive ? '1px solid rgba(16, 185, 129, 0.4)' : '1.5px solid #f59e0b',
                    background: isShiftActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.15)',
                    color: isShiftActive ? '#10b981' : '#f59e0b'
                  }}
                  title={isShiftActive ? 'শিফট সক্রিয় রয়েছে' : 'সকালের শিফট শুরু ও ক্যাশ ড্রয়ার ওপেন'}
                >
                  <Sun size={14} />
                  <span>{isShiftActive ? (lang === 'bn' ? '🟢 শিফট সক্রিয়' : 'Shift Active') : (lang === 'bn' ? '🌅 ক্যাশ ওপেন' : 'Open Cash')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowClosingModal(true)}
                  className="btn btn-secondary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '5px 10px',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    borderRadius: '8px',
                    border: '1px solid #10b981',
                    color: '#10b981'
                  }}
                  title={lang === 'bn' ? 'কাউন্টার শিফট ক্লোজিং ও নগদ ক্যাশ বুঝিয়ে দিন' : 'Counter shift closing and handover'}
                >
                  <Banknote size={14} />
                  <span>{lang === 'bn' ? 'শিফট ক্লোজিং' : 'Closing'}</span>
                </button>
              </>
            )}

            {isOwner && (
              <button
                type="button"
                onClick={() => setActiveTab('branch_control')}
                className="btn btn-secondary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 10px',
                  fontSize: '0.78rem',
                  fontWeight: '800',
                  borderRadius: '8px',
                  border: '1.5px solid #10b981',
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: '#10b981'
                }}
                title={lang === 'bn' ? 'মালিকের সেন্ট্রাল ক্যাশ ও ব্রাঞ্চ কন্ট্রোল হাব' : 'Owner Central Cash & Branch Control'}
              >
                <Building2 size={13} />
                <span>{lang === 'bn' ? '👑 ক্যাশ হাব' : '👑 Cash Hub'}</span>
              </button>
            )}
          </div>

          {/* Cluster 2: POS Operational Quick Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingRight: '8px', borderRight: '1px solid var(--border-color)' }}>
            {/* Hold Cart / Split Bill Manager (Item 56) */}
            <button
              type="button"
              onClick={() => {
                refreshHeldCount();
                setShowHoldModal(true);
              }}
              className="btn btn-secondary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                fontSize: '0.78rem',
                fontWeight: '700',
                borderRadius: '8px',
                border: heldCartsCount > 0 ? '1.5px solid #f59e0b' : '1px solid var(--border-color)',
                background: heldCartsCount > 0 ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                color: heldCartsCount > 0 ? '#f59e0b' : 'var(--text-muted)'
              }}
              title={lang === 'bn' ? 'হোল্ড করা বিলের তালিকা দেখুন ও কার্ট হোল্ড করুন (F6)' : 'View & manage held carts (F6)'}
            >
              <PauseCircle size={14} />
              <span>{lang === 'bn' ? `হোল্ড (${heldCartsCount})` : `Hold (${heldCartsCount})`}</span>
            </button>

            {/* Electronic Cash Drawer Kick Button (Item 52) */}
            <button
              type="button"
              onClick={() => openCashDrawer('manual')}
              className="btn btn-secondary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                fontSize: '0.78rem',
                fontWeight: '700',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                color: 'var(--text-muted)'
              }}
              title={lang === 'bn' ? 'ক্যাশ ড্রয়ার খুলুন (F9)' : 'Kick Cash Drawer (F9)'}
            >
              <span>🗄️ {lang === 'bn' ? 'ড্রয়ার (F9)' : 'Drawer'}</span>
            </button>

            {/* Dual Screen Customer Display Popout (Item 54) */}
            <button
              type="button"
              onClick={openCustomerMirrorWindow}
              className="btn btn-secondary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                fontSize: '0.78rem',
                fontWeight: '700',
                borderRadius: '8px',
                border: '1px solid #38bdf8',
                background: 'rgba(56, 189, 248, 0.1)',
                color: '#38bdf8'
              }}
              title={lang === 'bn' ? 'দ্বিতীয় গ্রাহক স্ক্রিন উইন্ডো খুলুন (F11)' : 'Open Customer Display Window (F11)'}
            >
              <Tv size={14} />
              <span>{lang === 'bn' ? 'গ্রাহক স্ক্রিন' : 'Dual Screen'}</span>
            </button>
          </div>

          {/* Cluster 3: Hardware & Peripherals */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingRight: '8px', borderRight: '1px solid var(--border-color)' }}>
            {/* Direct USB/Bluetooth ESC/POS Thermal Printer Connect (Item 51) */}
            <button
              type="button"
              onClick={async () => {
                if (hwStatus.serialPrinter) {
                  await disconnectSerialPrinter();
                  showToast(lang === 'bn' ? 'USB প্রিন্টার সংযোগ বিচ্ছিন্ন করা হয়েছে' : 'Serial printer disconnected', 'info');
                } else {
                  try {
                    await connectSerialPrinter();
                    showToast(lang === 'bn' ? '✓ USB থার্মাল প্রিন্টার সরাসরি কানেক্ট হয়েছে!' : 'Serial printer connected!', 'success');
                  } catch (err) {
                    showToast(err.message || 'Printer connect failed', 'warning');
                  }
                }
              }}
              className="btn btn-secondary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                fontSize: '0.78rem',
                fontWeight: '700',
                borderRadius: '8px',
                border: hwStatus.serialPrinter ? '1.5px solid #10b981' : '1px solid var(--border-color)',
                background: hwStatus.serialPrinter ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                color: hwStatus.serialPrinter ? '#10b981' : 'var(--text-muted)'
              }}
              title={hwStatus.serialPrinter ? 'সরাসরি USB প্রিন্টার সংযুক্ত (ক্লিক করে বিচ্ছিন্ন করুন)' : 'Web Serial দিয়ে USB থার্মাল প্রিন্টার সংযুক্ত করুন'}
            >
              <Printer size={14} />
              <span>{hwStatus.serialPrinter ? '🟢 USB প্রিন্টার' : (lang === 'bn' ? '🔌 USB' : 'USB')}</span>
            </button>

            {/* Smart Soundbox Payment Chime & Voice Announcer Toggle */}
            <button
              type="button"
              onClick={() => {
                const next = !soundboxActive;
                setSoundboxActive(next);
                setSoundboxEnabled(next);
                if (next) {
                  playSoundboxChime();
                  showToast(lang === 'bn' ? '🔊 ডিজিটাল ভয়েস সাউন্ডবক্স সক্রিয় করা হয়েছে' : 'Digital Soundbox Enabled', 'success');
                } else {
                  showToast(lang === 'bn' ? '🔇 সাউন্ডবক্স নিঃশব্দ করা হয়েছে' : 'Soundbox Muted', 'info');
                }
              }}
              className="btn btn-secondary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                fontSize: '0.78rem',
                fontWeight: '700',
                borderRadius: '8px',
                border: soundboxActive ? '1.5px solid #10b981' : '1px solid var(--border-color)',
                background: soundboxActive ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                color: soundboxActive ? '#10b981' : 'var(--text-muted)'
              }}
              title={soundboxActive ? 'ভয়েস সাউন্ডবক্স চালু আছে (ক্লিক করে বন্ধ করুন)' : 'ভয়েস সাউন্ডবক্স বন্ধ (ক্লিক করে চালু করুন)'}
            >
              {soundboxActive ? <Volume2 size={14} /> : <VolumeX size={14} />}
              <span>{soundboxActive ? (lang === 'bn' ? 'সাউন্ডবক্স' : 'Sound ON') : (lang === 'bn' ? 'নিঃশব্দ' : 'Muted')}</span>
            </button>

            {/* Digital Weight Scale Support (Item 55) */}
            <button
              type="button"
              onClick={() => setShowScaleModal(true)}
              className="btn btn-secondary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                fontSize: '0.78rem',
                fontWeight: '700',
                borderRadius: '8px',
                border: hwStatus.weightScale ? '1.5px solid #10b981' : '1px solid var(--border-color)',
                background: hwStatus.weightScale ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                color: hwStatus.weightScale ? '#10b981' : 'var(--text-muted)'
              }}
              title={lang === 'bn' ? 'ডিজিটাল ওজন স্কেল টার্মিনাল খুলুন (F7)' : 'Digital Weight Scale Terminal (F7)'}
            >
              <Scale size={14} />
              <span>{hwStatus.weightScale ? '🟢 স্কেল' : (lang === 'bn' ? '⚖️ স্কেল' : 'Scale')}</span>
            </button>

            {/* Direct Thermal Label Printing (Item 60) */}
            <button
              type="button"
              onClick={() => setShowThermalLabelModal(true)}
              className="btn btn-secondary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                fontSize: '0.78rem',
                fontWeight: '700',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                color: 'var(--text-muted)'
              }}
              title={lang === 'bn' ? '৫২x৩৮ থার্মাল স্টিকার ও বারকোড লেবেল প্রিন্টার' : 'Print Thermal Barcode Labels'}
            >
              <Tag size={13} />
              <span>{lang === 'bn' ? 'স্টিকার' : 'Labels'}</span>
            </button>

            {/* Industry Template Review Button */}
            <button
              type="button"
              onClick={() => setShowTemplateReviewModal(true)}
              className="btn btn-secondary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                fontSize: '0.78rem',
                fontWeight: '700',
                borderRadius: '8px',
                border: '1px solid #6366f1',
                background: 'rgba(99, 102, 241, 0.1)',
                color: '#6366f1'
              }}
              title={lang === 'bn' ? 'ইন্ডাস্ট্রি টেমপ্লেট রিভিউ ও কাস্টমাইজ করুন' : 'Review & Customize Industry Template'}
            >
              <Sparkles size={13} />
              <span>{lang === 'bn' ? 'টেমপ্লেট' : 'Templates'}</span>
            </button>
          </div>

          {/* Cluster 4: Screen Zoom & Exit Utility Dock */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Screen Zoom Control (Desktop & Tablet) */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '3px 6px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                fontSize: '0.75rem'
              }}
            >
              <button
                type="button"
                onClick={() => handleZoomChange(-5)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                  padding: '2px 4px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title={lang === 'bn' ? 'জুম আউট' : 'Zoom Out'}
              >
                <ZoomOut size={13} />
              </button>

              <button
                type="button"
                onClick={handleResetZoom}
                style={{
                  background: zoomLevel !== 100 ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                  border: 'none',
                  color: zoomLevel !== 100 ? '#818cf8' : 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px 5px',
                  borderRadius: '4px',
                  fontSize: '0.72rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: '700'
                }}
                title={lang === 'bn' ? 'রিসেট ১০০%' : 'Reset to 100%'}
              >
                {zoomLevel}%
              </button>

              <button
                type="button"
                onClick={() => handleZoomChange(5)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                  padding: '2px 4px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title={lang === 'bn' ? 'জুম ইন' : 'Zoom In'}
              >
                <ZoomIn size={13} />
              </button>
            </div>

            {/* Prominent Red Exit Cross Button for Desktop POS */}
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1.5px solid rgba(239, 68, 68, 0.4)',
                color: '#ef4444',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                flexShrink: 0
              }}
              title={lang === 'bn' ? 'পজ বন্ধ করে ড্যাশবোর্ডে ফিরে যান' : 'Exit POS Terminal to Dashboard'}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* LIVE COUNTER SUMMARY BAR (TODAY'S BILLS, SALES, AND DRAWER CASH) */}
      <div
        className="glass-card pos-counter-summary-bar"
        style={{
          padding: '0.65rem 1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.08), rgba(99, 102, 241, 0.05))',
          borderRadius: '12px',
          border: '1px solid var(--border-color)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
          {/* Invoices Count */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
              <FileText size={17} />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                {lang === 'bn' ? 'আজকের মোট বিল' : "Today's Invoices"}
              </div>
              <div style={{ fontSize: '0.98rem', fontWeight: '800', color: 'var(--text-main)' }}>
                {todayCounterSales.length} {lang === 'bn' ? 'টি' : 'bills'}
              </div>
            </div>
          </div>

          {/* Today's Sales Total */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <TrendingUp size={17} />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                {lang === 'bn' ? 'কাউন্টার মোট বিক্রি' : "Counter Sales"}
              </div>
              <div style={{ fontSize: '0.98rem', fontWeight: '800', color: '#10b981' }}>
                ৳{todayCounterSalesTotal.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Cash Drawer Current Balance */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
              <Banknote size={17} />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                {lang === 'bn' ? 'ক্যাশ ড্রয়ার (ইন হ্যান্ড)' : 'Drawer Cash in Hand'}
              </div>
              <div style={{ fontSize: '0.98rem', fontWeight: '800', color: '#f59e0b' }}>
                ৳{currentDrawerCash.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Action: Open Recent Sales Feed */}
        <button
          type="button"
          onClick={() => setShowRecentSalesModal(true)}
          className="btn btn-secondary"
          style={{
            fontSize: '0.8rem',
            fontWeight: '700',
            padding: '7px 14px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            borderRadius: '8px',
            background: 'var(--card-bg)',
            border: '1.5px solid var(--border-color)',
            color: 'var(--text-main)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
          }}
        >
          <Clock size={15} style={{ color: '#6366f1' }} />
          <span>{lang === 'bn' ? `সাম্প্রতিক বিক্রির তালিকা (${todayCounterSales.length})` : `Recent Sales (${todayCounterSales.length})`}</span>
        </button>
      </div>
      </>
      )}

      {/* Mobile & Tablet Segmented Tab Bar (Hidden on Desktop/Laptop) */}
      <div className="pos-mobile-tab-bar">
        <button
          type="button"
          className={`pos-mobile-tab-btn ${mobileTab === 'catalog' ? 'active' : ''}`}
          onClick={() => setMobileTab('catalog')}
        >
          <Package size={17} />
          <span>{lang === 'bn' ? '📦 পণ্য তালিকা' : '📦 Products'}</span>
        </button>

        <button
          type="button"
          className={`pos-mobile-tab-btn ${mobileTab === 'cart' ? 'active' : ''}`}
          onClick={() => setMobileTab('cart')}
        >
          <ShoppingCart size={17} />
          <span>{lang === 'bn' ? '🛒 ক্যাশিয়ার কার্ট' : '🛒 Cart'}</span>
          {cart.length > 0 && (
            <span className="pos-mobile-cart-badge">
              {cart.reduce((sum, item) => sum + item.qty, 0)}
            </span>
          )}
        </button>
      </div>

      <div className="pos-terminal-grid">

      {/* Left Column: Product Catalog & Search */}
      <div className={`pos-catalog-col ${mobileTab === 'catalog' ? 'active' : ''}`}>
        
        {/* Real-time Item Addition Feedback Banner (Dual Display) */}
        {lastAddedItem && (
          <div
            className="animate-fade-in"
            style={{
              padding: '10px 14px',
              borderRadius: '12px',
              background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.18), rgba(99, 102, 241, 0.12))',
              border: '1.5px solid #10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px',
              gap: '12px',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.15)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(16, 185, 129, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  flexShrink: 0
                }}
              >
                {lastAddedItem.image ? (
                  <img src={lastAddedItem.image} alt={lastAddedItem.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <ShoppingCart size={18} style={{ color: '#10b981' }} />
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.86rem', fontWeight: '800', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  ✓ "{lastAddedItem.name}" কার্টে যোগ হয়েছে
                </div>
                <div style={{ fontSize: '0.74rem', color: '#10b981', fontWeight: '700' }}>
                  মূল্য: ৳{lastAddedItem.sellPrice} / {lastAddedItem.unit || 'পিস'} | মোট আইটেম: {cart.reduce((s, it) => s + it.qty, 0)} টি
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => setMobileTab('cart')}
                className="btn btn-primary"
                style={{ padding: '4px 10px', fontSize: '0.75rem', fontWeight: '700', borderRadius: '8px' }}
              >
                কার্ট দেখুন →
              </button>
              <button
                type="button"
                onClick={() => setLastAddedItem(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Search & Action Bar */}
        <div className="glass-card" style={{ padding: '0.85rem', marginBottom: '0.75rem' }}>
          
          {/* ======================================================== */}
          {/* 1. PC / DESKTOP VERSION SEARCH & QUICK ACTIONS (ORIGINAL) */}
          {/* ======================================================== */}
          <div className="pos-search-actions-bar hide-mobile">
            <div className="pos-search-input-wrapper">
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                ref={searchInputRef}
                type="text"
                autoFocus={typeof window !== 'undefined' && window.innerWidth > 768}
                className="input-field"
                style={{ paddingLeft: '38px', paddingRight: '76px', fontSize: '0.95rem' }}
                placeholder={lang === 'bn' ? 'পণ্য, বারকোড বা SKU দিয়ে খুঁজুন [F2]...' : 'Search by name, barcode or SKU [F2]...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
              <div style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                <button
                  type="button"
                  onClick={() => handleOpenScanner('barcode')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--mode-color)',
                    cursor: 'pointer',
                    padding: '4px 6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '6px'
                  }}
                  title={lang === 'bn' ? 'ক্যামেরা স্ক্যানার' : 'Camera Scanner'}
                >
                  <ScanLine size={17} />
                </button>
                <VoiceInputButton
                  onTranscript={(text) => setSearchTerm(text)}
                  title={lang === 'bn' ? 'মুখে পণ্যের নাম বলুন' : 'Voice search product'}
                  size={15}
                  style={{ padding: '4px 6px', background: 'transparent', border: 'none' }}
                />
              </div>
            </div>

            {/* Quick Actions Strip (PC / Desktop) */}
            <div className="pos-quick-action-strip">
              <button
                type="button"
                onClick={() => handleOpenScanner('barcode')}
                className="btn btn-primary pos-action-btn"
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 11px', fontSize: '0.82rem', fontWeight: '800', flexShrink: 0 }}
                title={lang === 'bn' ? 'ক্যামেরা দিয়ে বারকোড স্ক্যান করুন' : 'Scan barcode using camera'}
              >
                <ScanLine size={16} />
                <span>{lang === 'bn' ? '📷 ক্যামেরা' : '📷 Camera'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenScanner('visual_ai')}
                className="btn pos-action-btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '7px 11px',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(99, 102, 241, 0.15))',
                  color: 'var(--mode-color)',
                  border: '1.5px solid var(--mode-color)',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  flexShrink: 0
                }}
                title={lang === 'bn' ? 'ক্যামেরায় পণ্য দেখিয়ে বা ছবি দেখে খুঁজুন' : 'Recognize product packaging using Visual AI'}
              >
                <Eye size={16} />
                <span>{lang === 'bn' ? '👁️ AI ভিশন' : '👁️ Visual AI'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowVoiceBillingModal(true)}
                className="btn pos-action-btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '7px 11px',
                  fontSize: '0.82rem',
                  fontWeight: '800',
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.16), rgba(249, 115, 22, 0.16))',
                  color: '#ef4444',
                  border: '1.5px solid #ef4444',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  boxShadow: '0 2px 10px rgba(239, 68, 68, 0.15)',
                  flexShrink: 0
                }}
                title={lang === 'bn' ? 'মুখে বাংলায় বলে কার্টে পণ্য যোগ করুন (কিবোর্ড শর্টকাট: Alt+V)' : 'Voice Billing in Bengali (Alt+V)'}
              >
                <Mic size={16} style={{ color: '#ef4444' }} />
                <span>{lang === 'bn' ? '🎙️ ভয়েস বিল' : '🎙️ Voice POS'}</span>
              </button>

              <button
                type="button"
                onClick={() => openCashDrawer('manual')}
                className="btn pos-action-btn hide-mobile-sm"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
                title={lang === 'bn' ? 'ক্যাশ ড্রয়ার খুলুন (কিবোর্ড শর্টকাট: F9)' : 'Open Cash Drawer (Shortcut: F9)'}
              >
                <FolderOpen size={16} />
                <span>{lang === 'bn' ? '🗄️ ড্রয়ার (F9)' : '🗄️ Drawer (F9)'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPOModal(true)}
                className="btn pos-action-btn hide-mobile-sm"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  background: 'rgba(59, 130, 246, 0.12)',
                  color: '#3b82f6',
                  border: '1px solid rgba(59, 130, 246, 0.35)',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
                title={lang === 'bn' ? 'সাপ্লায়ার অর্ডার ও চালান (PO to Stock)' : 'Supplier Purchase Order (PO)'}
              >
                <Truck size={16} />
                <span>{lang === 'bn' ? '🚚 সাপ্লায়ার PO' : '🚚 Supplier PO'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowSalesReturnModal(true)}
                className="btn pos-action-btn hide-mobile-sm"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  background: 'rgba(239, 68, 68, 0.12)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
                title={lang === 'bn' ? 'বিক্রিত পণ্য ফেরত ও নষ্ট মালের হিসাব' : 'Sales Return & Damage'}
              >
                <RotateCcw size={16} />
                <span>{lang === 'bn' ? '↩️ ফেরত/ড্যামেজ' : '↩️ Return'}</span>
              </button>

              {/* POS View Mode Switcher (Photos / Hybrid / Compact) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', background: 'var(--bg-secondary)', padding: '3px', borderRadius: '10px', border: '1px solid var(--border-color)', flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => updatePosDisplayMode && updatePosDisplayMode('image_grid')}
                  className="btn"
                  style={{
                    padding: '5px 10px',
                    borderRadius: '7px',
                    fontSize: '0.74rem',
                    fontWeight: '700',
                    background: posDisplayMode === 'image_grid' ? 'var(--business-primary)' : 'transparent',
                    color: posDisplayMode === 'image_grid' ? '#fff' : 'var(--text-muted)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title={lang === 'bn' ? 'ছবি কার্ড মোড' : 'Photo Cards'}
                >
                  <ImageIcon size={14} />
                  <span>{lang === 'bn' ? 'ছবি' : 'Photos'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => updatePosDisplayMode && updatePosDisplayMode('hybrid')}
                  className="btn"
                  style={{
                    padding: '5px 10px',
                    borderRadius: '7px',
                    fontSize: '0.74rem',
                    fontWeight: '700',
                    background: posDisplayMode === 'hybrid' ? 'var(--business-primary)' : 'transparent',
                    color: posDisplayMode === 'hybrid' ? '#fff' : 'var(--text-muted)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title={lang === 'bn' ? 'হাইব্রিড মোড (ছবি + তথ্য)' : 'Hybrid'}
                >
                  <Grid size={14} />
                  <span>{lang === 'bn' ? 'হাইব্রিড' : 'Hybrid'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => updatePosDisplayMode && updatePosDisplayMode('compact')}
                  className="btn"
                  style={{
                    padding: '5px 10px',
                    borderRadius: '7px',
                    fontSize: '0.74rem',
                    fontWeight: '700',
                    background: posDisplayMode === 'compact' ? 'var(--business-primary)' : 'transparent',
                    color: posDisplayMode === 'compact' ? '#fff' : 'var(--text-muted)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title={lang === 'bn' ? 'তালিকা মোড (শুধু টেক্সট ও বারকোড)' : 'List'}
                >
                  <List size={14} />
                  <span>{lang === 'bn' ? 'তালিকা' : 'List'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* 2. MOBILE ONLY: REFERENCE SCREENSHOT UI STRIPS           */}
          {/* ======================================================== */}
          <div className="show-mobile-only">
            {/* Mobile Row 1: Search Input + 3 Colorful Square Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '150px' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  type="text"
                  className="input-field"
                  style={{
                    paddingLeft: '38px',
                    paddingRight: '12px',
                    fontSize: '0.92rem',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                  placeholder="Search by name, barcode..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                />
              </div>

              {/* 1. Barcode Scanner Button (Purple) */}
              <button
                type="button"
                onClick={() => handleOpenScanner('barcode')}
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'rgba(99, 102, 241, 0.22)',
                  border: '1.5px solid #6366f1',
                  color: '#818cf8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  boxShadow: '0 0 10px rgba(99, 102, 241, 0.25)'
                }}
                title={lang === 'bn' ? 'ক্যামেরা বারকোড স্ক্যানার' : 'Barcode Scanner'}
              >
                <ScanLine size={19} />
              </button>

              {/* 2. Visual AI Preview Button (Blue) */}
              <button
                type="button"
                onClick={() => handleOpenScanner('visual_ai')}
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'rgba(59, 130, 246, 0.18)',
                  border: '1.5px solid rgba(59, 130, 246, 0.5)',
                  color: '#60a5fa',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
                title={lang === 'bn' ? 'ভিজ্যুয়াল AI পণ্য রিকগনিশন' : 'Visual AI Recognition'}
              >
                <Eye size={19} />
              </button>

              {/* 3. Voice POS Button (Red/Coral) */}
              <button
                type="button"
                onClick={() => setShowVoiceBillingModal(true)}
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.18)',
                  border: '1.5px solid rgba(239, 68, 68, 0.5)',
                  color: '#f87171',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
                title={lang === 'bn' ? 'ভয়েস বিলিং' : 'Voice POS'}
              >
                <Mic size={19} />
              </button>

              {/* 4. PO Button (Blue) */}
              <button
                type="button"
                onClick={() => setShowPOModal(true)}
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'rgba(59, 130, 246, 0.18)',
                  border: '1.5px solid rgba(59, 130, 246, 0.5)',
                  color: '#60a5fa',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
                title={lang === 'bn' ? 'সাপ্লায়ার PO' : 'Supplier PO'}
              >
                <Truck size={19} />
              </button>

              {/* 5. Return & Damage Button (Red) */}
              <button
                type="button"
                onClick={() => setShowSalesReturnModal(true)}
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.18)',
                  border: '1.5px solid rgba(239, 68, 68, 0.5)',
                  color: '#f87171',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
                title={lang === 'bn' ? 'পণ্য ফেরত ও ড্যামেজ' : 'Return & Damage'}
              >
                <RotateCcw size={19} />
              </button>
            </div>

            {/* Mobile Row 2: Order Mode Bar (Matching Reference Screenshot) */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '6px 12px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              marginBottom: '0.5rem',
              gap: '10px',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b', fontSize: '0.8rem', fontWeight: '800' }}>
                <Utensils size={15} />
                <span>Order Mode:</span>
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setOrderType('dine_in')}
                  style={{
                    padding: '4px 14px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: '800',
                    border: 'none',
                    background: orderType === 'dine_in' ? '#f59e0b' : 'rgba(255, 255, 255, 0.06)',
                    color: orderType === 'dine_in' ? '#18181b' : 'var(--text-muted)',
                    cursor: 'pointer',
                    boxShadow: orderType === 'dine_in' ? '0 0 12px rgba(245, 158, 11, 0.4)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <span>●</span>
                  <span>{lang === 'bn' ? 'ডাইন-ইন' : 'ডাইন-ইন'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('parcel')}
                  style={{
                    padding: '4px 14px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    border: 'none',
                    background: orderType === 'parcel' ? '#10b981' : 'rgba(255, 255, 255, 0.06)',
                    color: orderType === 'parcel' ? '#ffffff' : 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <span>🛍️</span>
                  <span>{lang === 'bn' ? 'পার্সেল / Takeaway' : 'পার্সেল / Takeaway'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* POS Hardware & Power-User Hotkeys Micro-bar (Hidden on mobile) */}
          <div
            className="hide-mobile"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 12px',
              marginBottom: '0.75rem',
              borderRadius: '8px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              fontSize: '0.74rem',
              color: 'var(--text-muted)',
              flexWrap: 'wrap',
              gap: '8px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 6px #10b981' }}></span>
                <strong style={{ color: 'var(--text-main)' }}>
                  {lang === 'bn' ? 'স্ক্যানার প্রস্তুত' : 'Scanner Ready'}
                </strong>
              </div>

              {/* Power-User Keyboard Badges */}
              <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <span className="kbd-badge">F2</span> {lang === 'bn' ? 'খুঁজুন' : 'Search'}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <span className="kbd-badge">F4</span> {lang === 'bn' ? 'ভিউ' : 'View'}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <span className="kbd-badge">F8</span> {lang === 'bn' ? 'ক্যাশ চেকআউট' : 'Pay'}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <span className="kbd-badge">F9</span> {lang === 'bn' ? 'ড্রয়ার' : 'Drawer'}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <span className="kbd-badge">Alt+C</span> {lang === 'bn' ? 'ক্লিয়ার' : 'Clear'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>
                {lang === 'bn' ? 'ক্যাশ বক্স অটো-ওপেন: ' : 'Cash Box Auto-Kick: '}
                <strong style={{ color: businessSettings.autoOpenCashDrawer !== false ? '#10b981' : '#f59e0b' }}>
                  {businessSettings.autoOpenCashDrawer !== false ? (lang === 'bn' ? 'চালু' : 'Active') : (lang === 'bn' ? 'বন্ধ' : 'Off')}
                </strong>
              </span>
            </div>
          </div>

          {/* Dynamic Industry Adaptive Bar (Gold, Bus, Food, Construction, Pharmacy, etc.) */}
          <IndustryVariationsBar
            orderType={orderType}
            setOrderType={setOrderType}
            selectedTable={selectedTable}
            setSelectedTable={setSelectedTable}
            selectedWaiter={selectedWaiter}
            setSelectedWaiter={setSelectedWaiter}
            cart={cart}
            onOpenTemplateManager={() => setShowTemplateReviewModal(true)}
          />

          {/* DEDICATED CATTLE & DAIRY FARM POS SYSTEM */}
          <div
            className="cattle-pos-terminal-bar"
            style={{
              padding: '12px 14px',
              marginBottom: '12px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(6, 182, 212, 0.08), rgba(245, 158, 11, 0.08))',
              border: '1.5px solid rgba(16, 185, 129, 0.45)',
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.08)'
            }}
          >
            {/* Farm POS Header Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)' }}>
                  🐄
                </div>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: '900', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{lang === 'bn' ? 'খামার ও ডেইরি পিওএস কাউন্টার' : 'Cattle & Dairy Dedicated POS'}</span>
                    <span style={{ fontSize: '0.66rem', padding: '2px 7px', borderRadius: '6px', background: '#10b981', color: '#fff', fontWeight: '800' }}>
                      FARM POS
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {lang === 'bn' ? 'দুধ, লাইভ পশু বিক্রয়, জৈব সার ও এআই ক্যামেরা ওজন পরিমাপ' : 'Live Cattle, Raw Milk, Ghee, Compost & AI Weight'}
                  </div>
                </div>
              </div>

              {/* Action Buttons for AI Scanner, Herd & Dashboard */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => { setCattleModalInitialTab('ai_scanner'); setShowCattleModal(true); }}
                  className="press-scale"
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.75rem',
                    fontWeight: '800',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #06b6d4, #0284c7)',
                    border: 'none',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    boxShadow: '0 2px 8px rgba(6, 182, 212, 0.3)'
                  }}
                  title="ক্যামেরা দিয়ে গরুর সম্ভাব্য ওজন মাপুন"
                >
                  <span>📸</span>
                  <span>{lang === 'bn' ? 'এআই ক্যামেরা ওজন মাপক' : 'Camera AI Weight'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setCattleModalInitialTab('overview'); setShowCattleModal(true); }}
                  className="press-scale"
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.75rem',
                    fontWeight: '800',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    border: 'none',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                  }}
                  title="খামার ড্যাশবোর্ড ও খতিয়ান খুলুন"
                >
                  <span>📊</span>
                  <span>{lang === 'bn' ? 'খামার ড্যাশবোর্ড' : 'Farm Dashboard'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setCattleModalInitialTab('feed'); setShowCattleModal(true); }}
                  className="press-scale"
                  style={{
                    padding: '6px 10px',
                    fontSize: '0.73rem',
                    fontWeight: '700',
                    borderRadius: '8px',
                    background: 'rgba(245, 158, 11, 0.15)',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    color: '#d97706',
                    cursor: 'pointer'
                  }}
                >
                  🌾 {lang === 'bn' ? 'খাদ্য খরচ' : 'Feed'}
                </button>

                <button
                  type="button"
                  onClick={() => { setCattleModalInitialTab('health'); setShowCattleModal(true); }}
                  className="press-scale"
                  style={{
                    padding: '6px 10px',
                    fontSize: '0.73rem',
                    fontWeight: '700',
                    borderRadius: '8px',
                    background: 'rgba(139, 92, 246, 0.15)',
                    border: '1px solid rgba(139, 92, 246, 0.4)',
                    color: '#7c3aed',
                    cursor: 'pointer'
                  }}
                >
                  💉 {lang === 'bn' ? 'টিকা' : 'Vaccine'}
                </button>

                <button
                  type="button"
                  onClick={() => { setCattleModalInitialTab('finances'); setShowCattleModal(true); }}
                  className="press-scale"
                  style={{
                    padding: '6px 10px',
                    fontSize: '0.73rem',
                    fontWeight: '700',
                    borderRadius: '8px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    color: '#059669',
                    cursor: 'pointer'
                  }}
                >
                  💰 {lang === 'bn' ? 'P&L লাভ-ক্ষতি' : 'P&L'}
                </button>
              </div>
            </div>

            {/* Farm POS Quick Selling Sub-tabs */}
            <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid rgba(16, 185, 129, 0.25)', paddingBottom: '8px', marginBottom: '10px', overflowX: 'auto' }}>
              {[
                { id: 'milk', label: '🥛 কাঁচা দুধ ও ডেইরি পণ্য', icon: '🥛' },
                { id: 'live', label: `🐂 সরাসরি লাইভ গরু বিক্রয় (${liveCattleHerd.length}টি)`, icon: '🐂' },
                { id: 'compost_feed', label: '🌱 গোবর সার ও ঘাস/ফিড', icon: '🌱' },
                { id: 'custom_milk', label: '🔬 ফ্যাট/SNF স্পেশাল ক্যালকুলেটর', icon: '🔬' }
              ].map(sub => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setCattlePosSubTab(sub.id)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '8px',
                    fontSize: '0.76rem',
                    fontWeight: '800',
                    border: cattlePosSubTab === sub.id ? '1.5px solid #10b981' : '1px solid var(--border-color)',
                    background: cattlePosSubTab === sub.id ? '#10b981' : 'var(--bg-secondary)',
                    color: cattlePosSubTab === sub.id ? '#fff' : 'var(--text-main)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {sub.label}
                </button>
              ))}
            </div>

            {/* SUB-VIEW 1: RAW MILK & DAIRY */}
            {cattlePosSubTab === 'milk' && (
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  ⚡ দ্রুত কাঁচা দুধ যোগ করুন (লিটার ভিত্তিক):
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  {[
                    { ltr: 1, rate: 80 },
                    { ltr: 2, rate: 80 },
                    { ltr: 5, rate: 80 },
                    { ltr: 10, rate: 80 },
                    { ltr: 20, rate: 80 },
                    { ltr: 50, rate: 80 }
                  ].map(m => (
                    <button
                      key={m.ltr}
                      type="button"
                      onClick={() => handleQuickAddMilk(m.ltr, m.rate)}
                      className="press-scale"
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid rgba(16, 185, 129, 0.4)',
                        color: '#10b981',
                        fontSize: '0.76rem',
                        fontWeight: '800',
                        cursor: 'pointer'
                      }}
                    >
                      🥛 +{m.ltr} লিটার (৳{(m.ltr * m.rate).toLocaleString()})
                    </button>
                  ))}
                </div>

                <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  🧈 খামারের দুগ্ধজাত পণ্য:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
                  {(FARM_POS_CATALOG || []).filter(p => p.category === 'দুধ ও দুগ্ধজাত').map(prod => (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => handleAddFarmProductToCart(prod)}
                      className="press-scale"
                      style={{
                        padding: '8px',
                        borderRadius: '10px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px'
                      }}
                    >
                      <div style={{ fontSize: '1.1rem' }}>{prod.icon}</div>
                      <div style={{ fontSize: '0.76rem', fontWeight: '800', color: 'var(--text-main)' }}>{prod.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: '800' }}>৳{prod.price} / {prod.unit}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* SUB-VIEW 2: LIVE CATTLE SALES */}
            {cattlePosSubTab === 'live' && (
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  🐂 খামারের নিবন্ধিত জীবন্ত পশু তালিকা (ক্লিক করলেই সরাসরি বিক্রয় বিলে যোগ হবে):
                </div>
                {liveCattleHerd.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    সব পশু ইতিমধ্যে বিক্রি হয়েছে অথবা নতুন কোনো পশু রেজিস্টার নেই।
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
                    {liveCattleHerd.map(cow => {
                      const estMeat = Math.round((cow.weightKg || 350) * 0.54);
                      return (
                        <div
                          key={cow.id}
                          style={{
                            padding: '10px',
                            borderRadius: '10px',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '5px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: '900', color: 'var(--text-main)' }}>
                              🏷️ {cow.tag} - {cow.name}
                            </span>
                            <span style={{ fontSize: '0.64rem', padding: '2px 6px', borderRadius: '4px', background: '#10b981', color: '#fff', fontWeight: '800' }}>
                              {cow.category}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            জাত: {cow.breed} | ওজন: <strong>{cow.weightKg} কেজি</strong>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#06b6d4' }}>
                            মাংসের ফলন: ~{estMeat} কেজি
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                            <div style={{ fontSize: '0.88rem', fontWeight: '900', color: '#10b981' }}>
                              ৳{(cow.marketValue || cow.purchasePrice || 150000).toLocaleString()}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleAddLiveCowToCart(cow)}
                              className="press-scale"
                              style={{
                                padding: '4px 10px',
                                borderRadius: '6px',
                                background: '#10b981',
                                border: 'none',
                                color: '#fff',
                                fontSize: '0.72rem',
                                fontWeight: '800',
                                cursor: 'pointer'
                              }}
                            >
                              🛒 বিক্রি করুন
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* BOTTOM ACTION BAR: ADD NEW CATTLE & QUICK PRESETS */}
                <div style={{ marginTop: '12px', borderTop: '1px dashed rgba(16, 185, 129, 0.35)', paddingTop: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--text-muted)' }}>
                        ⚡ দ্রুত জাত সিলেক্ট করুন:
                      </span>
                      <button
                        type="button"
                        onClick={() => { handleSelectCowPreset('holstein'); setShowQuickAddCowModal(true); }}
                        className="press-scale"
                        style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '800', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#10b981', cursor: 'pointer' }}
                      >
                        🐄 হলস্টাইন গাভী
                      </button>
                      <button
                        type="button"
                        onClick={() => { handleSelectCowPreset('bull'); setShowQuickAddCowModal(true); }}
                        className="press-scale"
                        style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '800', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.4)', color: '#d97706', cursor: 'pointer' }}
                      >
                        🐂 মোটাতাজাকরণ ষাঁড়
                      </button>
                      <button
                        type="button"
                        onClick={() => { handleSelectCowPreset('heifer'); setShowQuickAddCowModal(true); }}
                        className="press-scale"
                        style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '800', background: 'rgba(6, 182, 212, 0.12)', border: '1px solid rgba(6, 182, 212, 0.4)', color: '#0891b2', cursor: 'pointer' }}
                      >
                        🍼 বকনা গরু
                      </button>
                      <button
                        type="button"
                        onClick={() => { handleSelectCowPreset('sahiwal'); setShowQuickAddCowModal(true); }}
                        className="press-scale"
                        style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '800', background: 'rgba(139, 92, 246, 0.12)', border: '1px solid rgba(139, 92, 246, 0.4)', color: '#7c3aed', cursor: 'pointer' }}
                      >
                        🐃 শাহীওয়াল গরু
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowQuickAddCowModal(prev => !prev)}
                      className="btn press-scale"
                      style={{
                        padding: '6px 14px',
                        fontSize: '0.78rem',
                        fontWeight: '900',
                        borderRadius: '8px',
                        background: showQuickAddCowModal ? 'rgba(239, 68, 68, 0.15)' : 'linear-gradient(135deg, #10b981, #059669)',
                        color: showQuickAddCowModal ? '#ef4444' : '#fff',
                        border: showQuickAddCowModal ? '1px solid rgba(239, 68, 68, 0.4)' : 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <span>{showQuickAddCowModal ? '✖ ফর্ম বন্ধ করুন' : '➕ নতুন গরু / গবাদিপশু যুক্ত করুন (Add Animal)'}</span>
                    </button>
                  </div>

                  {/* INLINE QUICK ADD COW FORM */}
                  {showQuickAddCowModal && (
                    <form
                      onSubmit={handleSaveQuickCow}
                      style={{
                        background: 'var(--bg-secondary)',
                        border: '1.5px solid rgba(16, 185, 129, 0.4)',
                        borderRadius: '12px',
                        padding: '12px',
                        marginTop: '8px',
                        animation: 'fadeIn 0.2s ease-in'
                      }}
                    >
                      <div style={{ fontSize: '0.84rem', fontWeight: '900', color: '#10b981', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>🐄 নতুন গবাদিপশু দ্রুত এন্ট্রি ফর্ম (Instant Herd Registration)</span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', marginBottom: '10px' }}>
                        <div>
                          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ট্যাগ নম্বর (ID) *</label>
                          <input
                            type="text"
                            className="input-field"
                            value={quickCowData.tag}
                            onChange={(e) => setQuickCowData({ ...quickCowData, tag: e.target.value })}
                            required
                            style={{ padding: '5px 8px', fontSize: '0.78rem' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>নাম / পরিচয় *</label>
                          <input
                            type="text"
                            className="input-field"
                            placeholder="যেমন: শাপলা"
                            value={quickCowData.name}
                            onChange={(e) => setQuickCowData({ ...quickCowData, name: e.target.value })}
                            required
                            style={{ padding: '5px 8px', fontSize: '0.78rem' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>গরুর জাত (Breed)</label>
                          <select
                            className="input-field"
                            value={quickCowData.breed}
                            onChange={(e) => setQuickCowData({ ...quickCowData, breed: e.target.value })}
                            style={{ padding: '5px 8px', fontSize: '0.78rem' }}
                          >
                            <option value="হলস্টাইন ফ্রিজিয়ান ক্রস">হলস্টাইন ফ্রিজিয়ান ক্রস</option>
                            <option value="শাহীওয়াল জাতের দেশি গরু">শাহীওয়াল জাতের গরু</option>
                            <option value="ব্রাহমা মোটাতাজাকরণ ষাঁড়">ব্রাহমা জাতের ষাঁড়</option>
                            <option value="ফ্রিজিয়ান বকনা বাছুর">ফ্রিজিয়ান বকনা বাছুর</option>
                            <option value="জার্সি জাতের গাভী">জার্সি জাতের গাভী</option>
                            <option value="দেশি লাল সিন্ধি / পাবনা জাত">দেশি লাল সিন্ধি / পাবনা জাত</option>
                            <option value="মুন্ডি / সংকর জাত">মুন্ডি / সংকর জাত</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ক্যাটাগরি</label>
                          <select
                            className="input-field"
                            value={quickCowData.category}
                            onChange={(e) => setQuickCowData({ ...quickCowData, category: e.target.value })}
                            style={{ padding: '5px 8px', fontSize: '0.78rem' }}
                          >
                            <option value="দুগ্ধবতী গাভী">দুগ্ধবতী গাভী</option>
                            <option value="বকনা গরু">বকনা গরু</option>
                            <option value="মোটাতাজাকরণ ষাঁড়">মোটাতাজাকরণ ষাঁড়</option>
                            <option value="দুধের বাছুর">দুধের বাছুর</option>
                            <option value="গর্ভবতী গাভী">গর্ভবতী গাভী</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ওজন (কেজি)</label>
                          <input
                            type="number"
                            className="input-field"
                            value={quickCowData.weightKg}
                            onChange={(e) => setQuickCowData({ ...quickCowData, weightKg: e.target.value })}
                            style={{ padding: '5px 8px', fontSize: '0.78rem' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ক্রয়মূল্য / খরচ (৳)</label>
                          <input
                            type="number"
                            className="input-field"
                            placeholder="120000"
                            value={quickCowData.purchasePrice}
                            onChange={(e) => setQuickCowData({ ...quickCowData, purchasePrice: e.target.value })}
                            style={{ padding: '5px 8px', fontSize: '0.78rem' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>প্রত্যাশিত বিক্রয়মূল্য (৳)</label>
                          <input
                            type="number"
                            className="input-field"
                            placeholder="210000"
                            value={quickCowData.marketValue}
                            onChange={(e) => setQuickCowData({ ...quickCowData, marketValue: e.target.value })}
                            style={{ padding: '5px 8px', fontSize: '0.78rem' }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => setShowQuickAddCowModal(false)}
                          className="btn btn-secondary press-scale"
                          style={{ padding: '5px 12px', fontSize: '0.74rem' }}
                        >
                          বাতিল
                        </button>
                        <button
                          type="submit"
                          className="btn btn-primary press-scale"
                          style={{ padding: '5px 16px', fontSize: '0.76rem', fontWeight: '900', background: '#10b981', borderColor: '#10b981' }}
                        >
                          💾 গরু সেভ করুন ও তালিকায় যোগ করুন
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* SUB-VIEW 3: COMPOST & FEED */}
            {cattlePosSubTab === 'compost_feed' && (
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  🌱 গোবর জৈব সার ও পশুখাদ্য বিক্রয়:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px' }}>
                  {(FARM_POS_CATALOG || []).filter(p => p.category !== 'দুধ ও দুগ্ধজাত').map(prod => (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => handleAddFarmProductToCart(prod)}
                      className="press-scale"
                      style={{
                        padding: '8px',
                        borderRadius: '10px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px'
                      }}
                    >
                      <div style={{ fontSize: '1.1rem' }}>{prod.icon}</div>
                      <div style={{ fontSize: '0.76rem', fontWeight: '800', color: 'var(--text-main)' }}>{prod.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: '800' }}>৳{prod.price} / {prod.unit}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* SUB-VIEW 4: FAT & SNF CUSTOM CALCULATOR */}
            {cattlePosSubTab === 'custom_milk' && (
              <div style={{ background: 'var(--bg-secondary)', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '8px' }}>
                  🔬 দুধের ফ্যাট (Fat%) ও পরিমাণ অনুযায়ী স্পেশাল দর হিসাব:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px', marginBottom: '8px' }}>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>দুধের পরিমাণ (লিটার)</label>
                    <input
                      type="number"
                      className="input-field"
                      style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                      value={customMilkLiters}
                      onChange={(e) => setCustomMilkLiters(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ফ্যাট হার (Fat %)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="input-field"
                      style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                      value={customMilkFat}
                      onChange={(e) => setCustomMilkFat(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>দর প্রতি লিটার (৳)</label>
                    <input
                      type="number"
                      className="input-field"
                      style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                      value={customMilkRate}
                      onChange={(e) => setCustomMilkRate(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={handleAddFatMilkToCart}
                      className="press-scale"
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        background: '#10b981',
                        border: 'none',
                        color: '#fff',
                        fontSize: '0.76rem',
                        fontWeight: '800',
                        cursor: 'pointer',
                        height: '32px'
                      }}
                    >
                      ➕ বিলে যোগ করুন (৳{(Number(customMilkLiters) * Number(customMilkRate)).toLocaleString()})
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* MULTI-LAYER QUICK SHORTCUT & FILTER SYSTEM               */}
          {/* ======================================================== */}

          {/* LAYER 1: MODERN PROFESSIONAL QUICK FILTER SHORTCUTS */}
          <div
            className="pos-layer1-shortcuts-card"
            style={{
              marginBottom: '10px',
              padding: '10px 14px',
              borderRadius: '14px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)'
            }}
          >
            {/* Header: Title, Total Groups, Reset Button & Controls */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Layers size={15} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '0.02em' }}>
                    {lang === 'bn' ? 'কুইক শর্টকাট ও পণ্য গ্রুপ' : 'Quick Category Shortcuts'}
                  </span>
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: '700',
                    padding: '2px 7px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border-color)'
                  }}>
                    {quickFilters.length}টি গ্রুপ
                  </span>
                </div>

                {/* Quick Reset Button when an active filter is selected */}
                {activeFilterId !== 'all' && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveFilterId('all');
                      setActiveSubFilterKeyword('');
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '0.7rem',
                      fontWeight: '700',
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#ef4444',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      cursor: 'pointer'
                    }}
                    title={lang === 'bn' ? 'সকল পণ্য দেখুন' : 'Reset filter'}
                  >
                    <X size={12} />
                    <span>{lang === 'bn' ? 'সব পণ্য' : 'Clear'}</span>
                  </button>
                )}
              </div>

              {/* Controls: Company Filter Dropdown, Master Hub, and Filter Manager */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                {detectedBrands.length > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <select
                      value={selectedBrand}
                      onChange={(e) => setSelectedBrand(e.target.value)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontSize: '0.74rem',
                        fontWeight: '700',
                        background: 'var(--bg-primary)',
                        color: selectedBrand !== 'all' ? 'var(--business-primary)' : 'var(--text-main)',
                        border: selectedBrand !== 'all' ? '1.5px solid var(--business-primary)' : '1px solid var(--border-color)',
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                    >
                      <option value="all">🏢 {lang === 'bn' ? 'সকল ব্র্যান্ড' : 'All Brands'}</option>
                      {detectedBrands.filter(b => b !== 'all').map(b => (
                        <option key={b} value={b}>🏢 {b}</option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setShowMasterHubModal(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '0.73rem',
                    fontWeight: '800',
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(16, 185, 129, 0.12))',
                    color: '#6366f1',
                    border: '1px solid rgba(99, 102, 241, 0.35)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  title={lang === 'bn' ? 'সকল ফোল্ডার, ইউনিট, ক্যাটাগরি ও ব্র্যান্ডের কেন্দ্রীয় সেটআপ হাব' : 'Open Master Setup Hub'}
                >
                  <FolderOpen size={13} />
                  <span>{lang === 'bn' ? 'মাস্টার ডাটা হাব' : 'Master Hub'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowFilterManagerModal(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '0.73rem',
                    fontWeight: '800',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-main)',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  title={lang === 'bn' ? 'নতুন শর্টকাট বাটন যোগ করুন বা ডিলিট করুন' : 'Manage & Add Shortcuts'}
                >
                  <SlidersHorizontal size={13} />
                  <span>{lang === 'bn' ? 'ফিল্টার সাজান' : 'Manage'}</span>
                </button>
              </div>
            </div>

            {/* Layer 1 Buttons Scroll Row with Smooth Left/Right Navigator */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={() => layer1ScrollRef.current?.scrollBy({ left: -220, behavior: 'smooth' })}
                className="hide-mobile"
                style={{
                  flexShrink: 0,
                  width: '28px',
                  height: '34px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease'
                }}
                title={lang === 'bn' ? 'বামে স্ক্রোল করুন' : 'Scroll left'}
              >
                <ChevronLeft size={16} />
              </button>

              <div
                ref={layer1ScrollRef}
                className="horizontal-touch-strip"
                style={{
                  flex: 1,
                  padding: '4px 2px',
                  gap: '8px',
                  scrollBehavior: 'smooth'
                }}
              >
                {quickFilters.map((qf) => {
                  const isActive = activeFilterId === qf.id;
                  const count = getFilterItemCount(qf);
                  return (
                    <button
                      key={qf.id}
                      type="button"
                      onClick={() => {
                        if (isActive && qf.id !== 'all') {
                          setActiveFilterId('all');
                          setActiveSubFilterKeyword('');
                        } else {
                          setActiveFilterId(qf.id);
                          setActiveSubFilterKeyword('');
                        }
                      }}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '10px',
                        fontSize: '0.8rem',
                        fontWeight: isActive ? '800' : '600',
                        border: isActive ? '1.5px solid var(--business-primary)' : '1px solid var(--border-color)',
                        background: isActive
                          ? 'linear-gradient(135deg, var(--business-primary), #059669)'
                          : 'var(--bg-primary)',
                        color: isActive ? '#ffffff' : 'var(--text-main)',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '7px',
                        boxShadow: isActive ? '0 3px 12px rgba(16, 185, 129, 0.3)' : '0 1px 3px rgba(0,0,0,0.03)',
                        transition: 'all 0.16s ease',
                        flexShrink: 0
                      }}
                    >
                      <span style={{ fontSize: '0.95rem', lineHeight: 1 }}>{qf.icon || '🏷️'}</span>
                      <span>{qf.label}</span>
                      <span style={{
                        fontSize: '0.68rem',
                        padding: '1px 6px',
                        borderRadius: '8px',
                        background: isActive ? 'rgba(0,0,0,0.24)' : 'rgba(255,255,255,0.08)',
                        color: isActive ? '#ffffff' : 'var(--text-muted)',
                        fontWeight: '700'
                      }}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => layer1ScrollRef.current?.scrollBy({ left: 220, behavior: 'smooth' })}
                className="hide-mobile"
                style={{
                  flexShrink: 0,
                  width: '28px',
                  height: '34px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease'
                }}
                title={lang === 'bn' ? 'ডানে স্ক্রোল করুন' : 'Scroll right'}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* LAYER 2: SUB-FILTERS / BRANDS / VARIETIES */}
          {activeGroup?.subFilters?.length > 0 && (
            <div
              className="animate-fade-in"
              style={{
                marginTop: '4px',
                marginBottom: '8px',
                padding: '8px 12px',
                borderRadius: '10px',
                background: 'rgba(99, 102, 241, 0.06)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#6366f1', fontSize: '0.72rem', fontWeight: '800', flexShrink: 0 }}>
                <span>↳</span>
                <span>{lang === 'bn' ? `২য় স্তর (${activeGroup.label} কোম্পানি ও ধরণ):` : `Layer 2 (${activeGroup.label}):`}</span>
              </div>

              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', flex: 1 }}>
                {activeGroup.subFilters.map((sub, idx) => {
                  const isSubActive = activeSubFilterKeyword === sub.keyword;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveSubFilterKeyword(isSubActive ? '' : sub.keyword)}
                      style={{
                        padding: '3px 10px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: isSubActive ? '800' : '600',
                        border: isSubActive ? '1px solid #6366f1' : '1px solid var(--border-color)',
                        background: isSubActive ? '#6366f1' : 'var(--bg-primary)',
                        color: isSubActive ? '#ffffff' : 'var(--text-main)',
                        cursor: 'pointer',
                        transition: 'all 0.12s ease'
                      }}
                    >
                      {sub.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ACTIVE FILTER SUMMARY & CLEAR ALL BUTTON (WHEN FILTERS ARE APPLIED) */}
          {(activeFilterId !== 'all' || activeSubFilterKeyword || selectedBrand !== 'all' || searchTerm) && (
            <div
              className="animate-fade-in"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '5px 10px',
                marginBottom: '6px',
                borderRadius: '8px',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                fontSize: '0.73rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: '800', color: '#f59e0b' }}>
                  {lang === 'bn' ? 'ফিল্টার সক্রিয়:' : 'Active Filter:'}
                </span>
                {activeFilterId !== 'all' && (
                  <span style={{ background: 'var(--bg-secondary)', padding: '1px 6px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                    {activeGroup?.icon} {activeGroup?.label}
                  </span>
                )}
                {activeSubFilterKeyword && (
                  <span style={{ background: '#6366f1', color: '#fff', padding: '1px 6px', borderRadius: '4px', fontWeight: '700' }}>
                    ↳ {activeSubFilterKeyword}
                  </span>
                )}
                {selectedBrand !== 'all' && (
                  <span style={{ background: 'var(--business-primary)', color: '#fff', padding: '1px 6px', borderRadius: '4px', fontWeight: '700' }}>
                    🏢 {selectedBrand}
                  </span>
                )}
                {searchTerm && (
                  <span style={{ color: 'var(--text-muted)' }}>
                    "{searchTerm}"
                  </span>
                )}
                <span style={{ fontWeight: '700', color: 'var(--text-main)', marginLeft: '4px' }}>
                  ({filteredProducts.length}টি পণ্য পাওয়া গেছে)
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveFilterId('all');
                  setActiveSubFilterKeyword('');
                  setSelectedBrand('all');
                  setSearchTerm('');
                  setSelectedCategory('all');
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ef4444',
                  fontWeight: '800',
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <X size={13} />
                <span>{lang === 'bn' ? 'সব মুছুন (Reset)' : 'Clear Filter'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Product Catalog Header Strip & View Switcher (Matching Reference Screenshot) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 4px 10px',
          marginTop: '4px',
          marginBottom: '6px'
        }}>
          <div style={{ fontSize: '0.92rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>{lang === 'bn' ? 'পণ্য তালিকা' : 'পণ্য তালিকা'}</span>
          </div>

          {/* Segmented View Switcher: Photos | Hybrid | List */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '3px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <button
              type="button"
              onClick={() => updatePosDisplayMode && updatePosDisplayMode('image_grid')}
              style={{
                padding: '4px 10px',
                borderRadius: '7px',
                fontSize: '0.74rem',
                fontWeight: '700',
                background: posDisplayMode === 'image_grid' ? 'var(--business-primary)' : 'transparent',
                color: posDisplayMode === 'image_grid' ? '#fff' : 'var(--text-muted)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title={lang === 'bn' ? 'ছবি কার্ড মোড' : 'Photo Cards'}
            >
              <ImageIcon size={13} />
              <span>Photos</span>
            </button>
            <button
              type="button"
              onClick={() => updatePosDisplayMode && updatePosDisplayMode('hybrid')}
              style={{
                padding: '4px 10px',
                borderRadius: '7px',
                fontSize: '0.74rem',
                fontWeight: '700',
                background: posDisplayMode === 'hybrid' ? 'var(--business-primary)' : 'transparent',
                color: posDisplayMode === 'hybrid' ? '#fff' : 'var(--text-muted)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: posDisplayMode === 'hybrid' ? '0 2px 8px rgba(99, 102, 241, 0.35)' : 'none'
              }}
              title={lang === 'bn' ? 'হাইব্রিড মোড (ছবি + তথ্য)' : 'Hybrid Mode'}
            >
              <RotateCcw size={13} style={{ transform: 'rotate(90deg)' }} />
              <span>Hybrid</span>
            </button>
            <button
              type="button"
              onClick={() => updatePosDisplayMode && updatePosDisplayMode('compact')}
              style={{
                padding: '4px 10px',
                borderRadius: '7px',
                fontSize: '0.74rem',
                fontWeight: '700',
                background: posDisplayMode === 'compact' ? 'var(--business-primary)' : 'transparent',
                color: posDisplayMode === 'compact' ? '#fff' : 'var(--text-muted)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title={lang === 'bn' ? 'তালিকা মোড' : 'List Mode'}
            >
              <List size={13} />
              <span>List</span>
            </button>
          </div>
        </div>

        {/* Product Cards Grid with Switchable View Modes */}
        <div
          className={`product-card-grid mode-${posDisplayMode}`}
        >
          {(() => {
            const cartQtyMap = new Map((cart || []).map(ci => [ci.id, ci.qty]));
            return visibleProducts.map((p) => (
              <POSProductCard
                key={p.id}
                product={p}
                inCartQty={cartQtyMap.get(p.id) || 0}
                posDisplayMode={posDisplayMode}
                onSelect={handleProductSelect}
                lang={lang}
              />
            ));
          })()}
        </div>

        {/* Load More Button for Progressive Chunking & Auto-Scroll Sentinel */}
        {filteredProducts.length > visibleCount && (
          <div ref={loadMoreRef} style={{ textAlign: 'center', margin: '16px 0 32px', width: '100%' }}>
            <button
              type="button"
              onClick={() => setVisibleCount(prev => Math.min(prev + 30, filteredProducts.length))}
              className="btn btn-secondary press-scale"
              style={{
                padding: '11px 24px',
                borderRadius: '12px',
                fontWeight: '800',
                fontSize: '0.85rem',
                border: '1.5px solid var(--business-primary)',
                color: 'var(--business-primary)',
                background: 'var(--bg-secondary)',
                boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              <span>⬇️ {lang === 'bn' ? `আরও পণ্য লোড করুন (${visibleCount} / ${filteredProducts.length} দেখানো হয়েছে)` : `Load More (${visibleCount} of ${filteredProducts.length})`}</span>
            </button>
          </div>
        )}
      </div>

      {/* Right Column: POS Cashier Billing Cart */}
      <div className={`glass-card pos-cart-col ${mobileTab === 'cart' ? 'active' : ''}`}>
        
        {/* Cart Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingCart size={18} style={{ color: 'var(--business-primary)' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: '700', margin: 0 }}>
              {t.business.cart} ({cart.length})
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {isMobileScreen && (
              <button
                type="button"
                onClick={() => setMobileTab('catalog')}
                className="btn btn-secondary"
                style={{ padding: '4px 10px', fontSize: '0.75rem', fontWeight: '700', borderRadius: '8px' }}
              >
                ← {lang === 'bn' ? 'পণ্য যোগ করুন' : 'Add Items'}
              </button>
            )}

            {cart.length > 0 && (
              <button
                onClick={handleClearCartWithUndo}
                className="btn btn-icon press-scale"
                title={lang === 'bn' ? 'কার্ট খালি করুন (Alt+C)' : 'Clear Cart (Alt+C)'}
                style={{ color: '#ef4444', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Trash2 size={14} />
                <span className="kbd-badge" style={{ fontSize: '0.62rem' }}>Alt+C</span>
              </button>
            )}
          </div>
        </div>

        {/* Customer Selector */}
        <div style={{ marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px', margin: 0 }}>
              <User size={13} />
              {t.business.selectCustomer}
            </label>
            <VoiceInputButton
              onTranscript={(transcript) => {
                const query = transcript.toLowerCase().trim();
                const matched = customers.find(c =>
                  c.name.toLowerCase().includes(query) ||
                  c.phone.replace(/[^0-9]/g, '').includes(query.replace(/[^0-9]/g, ''))
                );
                if (matched) {
                  setSelectedCustomerId(matched.id);
                } else if (query.includes('নগদ') || query.includes('সাধারণ') || query.includes('ওয়াক ইন') || query.includes('নতুন')) {
                  setSelectedCustomerId('');
                }
              }}
              title={lang === 'bn' ? 'কাস্টমারের নাম বা ফোন মুখে বলুন' : 'Speak customer name or phone'}
              size={13}
              style={{ padding: '2px 6px', fontSize: '0.72rem' }}
            />
          </div>
          <select
            className="select-field"
            style={{ fontSize: '0.825rem', padding: '6px 8px' }}
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
          >
            <option value="">{t.business.walkInCustomer}</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.phone}) - {c.outstandingDue > 0 ? `[বাকি: ৳${c.outstandingDue.toLocaleString()}]` : '[বাকি নেই]'}
              </option>
            ))}
          </select>
        </div>

        {/* Middle Scrollable Body: Cart Items + Calculation Details */}
        <div style={{ flex: '1 1 auto', overflowY: 'auto', minHeight: 0, paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Cart Items List - Full Itemized Detail Breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {cart.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
              <ShoppingCart size={38} style={{ marginBottom: '8px', opacity: 0.35, color: 'var(--business-primary)' }} />
              <p style={{ fontSize: '0.88rem', margin: 0, fontWeight: '600' }}>{t.business.cartEmpty}</p>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                পণ্য তালিকায় ক্লিক বা ট্যাপ করে কার্টে যোগ করুন
              </span>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  background: 'var(--bg-card)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  gap: '8px',
                  transition: 'all 0.15s ease'
                }}
              >
                {/* Product Thumbnail / Icon */}
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-color)',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <span style={{ fontSize: '1.25rem' }}>📦</span>
                  )}
                </div>

                {/* Name, Unit & Unit Price Breakdown */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: '700',
                      color: 'var(--text-main)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                    title={item.name}
                  >
                    {item.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    <span className="badge" style={{ padding: '1px 5px', fontSize: '0.65rem', background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1', borderRadius: '4px' }}>
                      {item.unit || 'পিস'}
                    </span>
                    <span>৳{item.sellPrice.toLocaleString()} / {item.unit || 'পিস'}</span>
                  </div>
                </div>

                {/* Tactile Qty Controls & Subtotal */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  <button
                    className="btn-icon press-scale"
                    style={{ padding: '2px', height: '26px', width: '26px', borderRadius: '6px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => {
                      playButtonClick();
                      updateCartQty(item.id, item.qty - 1);
                    }}
                    title="পরিমাণ ১ কমান"
                  >
                    <Minus size={12} />
                  </button>

                  <div style={{ minWidth: '36px', textAlign: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '800', fontSize: '0.88rem', color: 'var(--text-main)' }}>
                      {item.qty}
                    </span>
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-dim)', display: 'block', lineHeight: 1 }}>
                      {item.unit || 'টি'}
                    </span>
                  </div>

                  <button
                    className="btn-icon press-scale"
                    style={{ padding: '2px', height: '26px', width: '26px', borderRadius: '6px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => {
                      playCartPop();
                      updateCartQty(item.id, item.qty + 1);
                    }}
                    title="পরিমাণ ১ বাড়ান"
                  >
                    <Plus size={12} />
                  </button>

                  <div style={{ minWidth: '60px', textAlign: 'right' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '800', fontSize: '0.9rem', color: 'var(--business-primary)', display: 'block' }}>
                      ৳{(item.sellPrice * item.qty).toLocaleString()}
                    </span>
                  </div>

                  {/* Remove Item Button with Undo */}
                  <button
                    onClick={() => handleRemoveWithUndo(item)}
                    className="press-scale"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#ef4444',
                      padding: '4px',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      opacity: 0.75,
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '0.75'}
                    title="কার্ট থেকে পণ্যটি মুছে ফেলুন (মুছলে ফিরিয়ে আনা যাবে)"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
          </div>

          {/* Calculation & Payment Area */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px', color: 'var(--text-muted)' }}>
            <span>{t.business.subtotal}</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>৳{subtotal.toLocaleString()}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', marginBottom: '4px' }}>
            <span style={{ color: 'var(--text-muted)' }}>{t.business.discount}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '0.75rem' }}>৳</span>
              <input
                type="number"
                min="0"
                placeholder="0"
                className="input-field"
                style={{ width: '80px', padding: '2px 6px', fontSize: '0.8rem', textAlign: 'right' }}
                value={discountAmount}
                onChange={(e) => setDiscountAmount(e.target.value)}
              />
            </div>
          </div>

          {/* Multi-Rate Instant Discount Keys (Item 58) */}
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '6px', justifyContent: 'flex-end' }}>
            {[
              { label: '৫%', type: 'pct', val: 0.05 },
              { label: '১০%', type: 'pct', val: 0.10 },
              { label: '১৫%', type: 'pct', val: 0.15 },
              { label: '৳৫০', type: 'flat', val: 50 },
              { label: '৳১০০', type: 'flat', val: 100 },
              { label: '০%', type: 'flat', val: 0 }
            ].map((btn, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  playButtonClick();
                  const amt = btn.type === 'pct' ? Math.round(subtotal * btn.val) : btn.val;
                  setDiscountAmount(amt > 0 ? String(amt) : '');
                }}
                style={{
                  padding: '2px 6px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'var(--text-muted)',
                  fontSize: '0.68rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Customer Loyalty Points (Item 75) */}
          {selectedCustomerObj && availableLoyaltyPoints > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 8px', background: 'rgba(236, 72, 153, 0.08)', borderRadius: '8px', border: '1px solid rgba(236, 72, 153, 0.25)', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#ec4899', fontWeight: 600 }}>
                <Gift size={14} />
                <span>{lang === 'bn' ? `জমা পয়েন্ট: ${availableLoyaltyPoints}` : `Points: ${availableLoyaltyPoints}`}</span>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 700 }}>
                <input
                  type="checkbox"
                  checked={useLoyaltyPoints}
                  onChange={e => setUseLoyaltyPoints(e.target.checked)}
                  style={{ width: '14px', height: '14px', cursor: 'pointer' }}
                />
                <span>{lang === 'bn' ? `ভাঙান (-৳${loyaltyDiscount})` : `Redeem (-৳${loyaltyDiscount})`}</span>
              </label>
            </div>
          )}

          {/* Real-time Profit Margin on Cart for Manager (Item 73) */}
          {cart.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '8px', border: '1px dashed rgba(16, 185, 129, 0.3)', marginBottom: '6px' }}>
              <button
                type="button"
                onClick={() => setShowLiveProfit(prev => !prev)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.76rem', color: '#10b981', fontWeight: 700 }}
                title={lang === 'bn' ? 'মালিকের জন্য লাভ ও মার্জিন ভিউ (গোপন রাখুন)' : 'Owner Profit View'}
              >
                {showLiveProfit ? <EyeOff size={13} /> : <Eye size={13} />}
                <span>{lang === 'bn' ? (showLiveProfit ? 'লাইভ লাভ: ' : 'লাইভ প্রফিট ভিউ') : 'Live Profit View'}</span>
              </button>
              {showLiveProfit && (
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#10b981' }}>
                  ৳{liveGrossProfit.toLocaleString()} ({liveProfitMarginPct}%)
                </span>
              )}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-muted)' }}>
            <span>{t.business.vatTax} ({businessSettings.vatRate}%)</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>+৳{vat.toLocaleString()}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: '800', borderTop: '1px dashed var(--border-color)', paddingTop: '6px', marginBottom: '10px' }}>
            <span>{t.business.grandTotal}</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--business-primary)' }}>৳{grandTotal.toLocaleString()}</span>
          </div>

          {/* Payment Method Selector with Multi-Payment Split (Item 59) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', marginBottom: '10px' }}>
            <button
              onClick={() => {
                setPaymentMethod('cash');
                setPendingSplitPayments(null);
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                padding: '6px 2px',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: paymentMethod === 'cash' && !pendingSplitPayments ? 'var(--business-primary)' : 'var(--border-color)',
                background: paymentMethod === 'cash' && !pendingSplitPayments ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                color: paymentMethod === 'cash' && !pendingSplitPayments ? 'var(--business-primary)' : 'var(--text-muted)',
                fontSize: '0.68rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <Banknote size={14} />
              <span>{t.business.cash}</span>
            </button>

            <button
              onClick={() => {
                setPaymentMethod('bkash');
                setPendingSplitPayments(null);
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                padding: '6px 2px',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: paymentMethod === 'bkash' && !pendingSplitPayments ? '#e2136e' : 'var(--border-color)',
                background: paymentMethod === 'bkash' && !pendingSplitPayments ? 'rgba(226, 19, 110, 0.15)' : 'transparent',
                color: paymentMethod === 'bkash' && !pendingSplitPayments ? '#e2136e' : 'var(--text-muted)',
                fontSize: '0.68rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <Smartphone size={14} />
              <span>{t.business.bkash}</span>
            </button>

            <button
              onClick={() => {
                setPaymentMethod('card');
                setPendingSplitPayments(null);
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                padding: '6px 2px',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: paymentMethod === 'card' && !pendingSplitPayments ? '#06b6d4' : 'var(--border-color)',
                background: paymentMethod === 'card' && !pendingSplitPayments ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                color: paymentMethod === 'card' && !pendingSplitPayments ? '#06b6d4' : 'var(--text-muted)',
                fontSize: '0.68rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <CreditCard size={14} />
              <span>{t.business.card}</span>
            </button>

            <button
              onClick={() => {
                setPaymentMethod('due');
                setPendingSplitPayments(null);
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                padding: '6px 2px',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: paymentMethod === 'due' && !pendingSplitPayments ? '#f59e0b' : 'var(--border-color)',
                background: paymentMethod === 'due' && !pendingSplitPayments ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                color: paymentMethod === 'due' && !pendingSplitPayments ? '#f59e0b' : 'var(--text-muted)',
                fontSize: '0.68rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <FileText size={14} />
              <span>{t.business.duePay}</span>
            </button>

            {/* Multi-Payment Split Button */}
            <button
              onClick={() => setShowSplitPaymentModal(true)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                padding: '6px 2px',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: pendingSplitPayments ? '#8b5cf6' : 'var(--border-color)',
                background: pendingSplitPayments ? 'rgba(139, 92, 246, 0.18)' : 'transparent',
                color: pendingSplitPayments ? '#8b5cf6' : 'var(--text-muted)',
                fontSize: '0.68rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
              title="ক্যাশ, বিকাশ ও কার্ডে ভাগ করে পেমেন্ট নিন"
            >
              <Divide size={14} />
              <span>{pendingSplitPayments ? '✓ স্প্লিট' : (lang === 'bn' ? 'স্প্লিট' : 'Split')}</span>
            </button>
          </div>

          {/* Partial Payment Option & Denomination Counter (Item 57) */}
          {paymentMethod !== 'due' && (
            <div style={{ padding: '8px 10px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={isPartialPayment}
                    onChange={(e) => {
                      setIsPartialPayment(e.target.checked);
                      if (e.target.checked && !partialPaidInput) {
                        setPartialPaidInput(Math.round(grandTotal / 2));
                      }
                    }}
                  />
                  <span>{lang === 'bn' ? 'আংশিক পেমেন্ট (বাকি খাতা)' : 'Partial Payment'}</span>
                </label>

                {/* Quick BDT Note Counter Button */}
                <button
                  type="button"
                  onClick={() => setShowDenominationModal(true)}
                  style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#10b981',
                    padding: '2px 6px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="নোট গুনে ক্যাশ হিসাব করুন (F10)"
                >
                  <Coins size={12} />
                  <span>{lang === 'bn' ? 'নোট কাউন্টার' : 'Cash Tally'}</span>
                </button>
              </div>

              {isPartialPayment && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: '800' }}>
                    {lang === 'bn' ? 'বাকি: ৳' : 'Due: ৳'}{remainingDue.toLocaleString()}
                  </span>
                </div>
              )}

              {isPartialPayment && (
                <div style={{ marginTop: '6px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {lang === 'bn' ? 'নগদ জমা:' : 'Paid Now:'}
                  </span>
                  <input
                    type="number"
                    min="0"
                    max={grandTotal}
                    className="input-field"
                    placeholder="0"
                    style={{ width: '90px', padding: '3px 8px', fontSize: '0.85rem', fontWeight: '800', color: '#10b981', textAlign: 'right' }}
                    value={partialPaidInput}
                    onChange={(e) => setPartialPaidInput(e.target.value)}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>৳</span>
                </div>
              )}
            </div>
          )}
          </div>
        </div>

        {/* Pinned Bottom Sticky Checkout Section (Always 100% visible & accessible) */}
        <div
          style={{
            flexShrink: 0,
            borderTop: '2px solid var(--border-color)',
            paddingTop: '8px',
            marginTop: 'auto',
            background: 'var(--bg-card)',
            boxShadow: '0 -4px 14px rgba(0, 0, 0, 0.18)'
          }}
        >
          {/* Prominent Grand Total Display */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.15rem', fontWeight: '800', marginBottom: '8px', padding: '0 4px' }}>
            <span style={{ color: 'var(--text-main)' }}>{t.business.grandTotal}</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--business-primary)', fontSize: '1.25rem' }}>৳{grandTotal.toLocaleString()}</span>
          </div>

          {/* Checkout & Fast Cash Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '6px' }}>
            <button
              className="btn btn-primary press-scale"
              disabled={cart.length === 0}
              onClick={handleCheckout}
              style={{
                padding: '11px',
                fontSize: '0.92rem',
                fontWeight: '800',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: cart.length === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              <CheckCircle2 size={16} />
              <span>{t.business.completeSale}</span>
            </button>

            <button
              type="button"
              className="btn press-scale"
              disabled={cart.length === 0}
              onClick={() => {
                setFastCashTendered(grandTotal);
                setShowFastCashModal(true);
              }}
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#ffffff',
                border: 'none',
                padding: '11px',
                fontSize: '0.92rem',
                fontWeight: '800',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
                boxShadow: cart.length > 0 ? '0 4px 14px rgba(16, 185, 129, 0.35)' : 'none'
              }}
              title="⚡ ফাস্ট ক্যাশ মোড: ১-ক্লিকে ক্যাশ গ্রহণ ও ফেরত হিসাব"
            >
              <Zap size={16} fill="#ffffff" />
              <span>{lang === 'bn' ? '⚡ ফাস্ট ক্যাশ' : '⚡ Fast Cash'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile & Tablet Floating Sticky Checkout Bar */}
      {cart.length > 0 && mobileTab === 'catalog' && (
        <div className="pos-floating-checkout-bar" onClick={() => setMobileTab('cart')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.25rem' }}>🛒</span>
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: '800', lineHeight: 1.1 }}>
                {cart.reduce((sum, item) => sum + item.qty, 0)} items in cart
              </div>
              <div style={{ fontSize: '0.72rem', opacity: 0.9 }}>
                Tap to checkout
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', fontSize: '1.05rem', fontFamily: 'var(--font-mono)' }}>
            <span>৳{grandTotal.toLocaleString()}</span>
            <span style={{ fontSize: '1.2rem' }}>→</span>
          </div>
        </div>
      )}
      </div>

      {/* Counter Shift Closing Modal */}
      {showClosingModal && (
        <CounterShiftClosingModal
          isOpen={showClosingModal}
          onClose={() => setShowClosingModal(false)}
        />
      )}

      {/* Counter Shift Opening Modal (Morning Cash Register Open) */}
      {showOpeningModal && (
        <CounterShiftOpeningModal
          isOpen={showOpeningModal}
          onClose={() => setShowOpeningModal(false)}
          onShiftOpened={() => setIsShiftActive(true)}
        />
      )}

      {/* ========================================================= */}
      {/* MODAL: INSTANT SALE SUCCESS CONFIRMATION */}
      {/* ========================================================= */}
      {showSuccessModal && lastCompletedSale && (
        <div className="modal-overlay animate-fade-in" style={{ zIndex: 1200 }}>
          <div className="glass-card modal-container" style={{ maxWidth: '440px', width: '92%', padding: '1.75rem', borderRadius: '16px', textAlign: 'center' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
              <CheckCircle2 size={36} />
            </div>

            <h3 style={{ margin: '0 0 6px 0', fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-main)' }}>
              {lang === 'bn' ? 'বিক্রি সফলভাবে সম্পন্ন হয়েছে!' : 'Sale Completed Successfully!'}
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {lang === 'bn' ? 'ইনভয়েস নম্বর:' : 'Invoice No:'} <strong style={{ color: '#10b981', fontFamily: 'var(--font-mono)' }}>#{lastCompletedSale.id}</strong>
            </p>

            {/* Summary Box */}
            <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '1.25rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{lang === 'bn' ? 'ক্রেতার নাম:' : 'Customer:'}</span>
                <strong style={{ color: 'var(--text-main)' }}>{lastCompletedSale.customerName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{lang === 'bn' ? 'পণ্যের সংখ্যা:' : 'Items Count:'}</span>
                <strong style={{ color: 'var(--text-main)' }}>{lastCompletedSale.items?.reduce((s, it) => s + it.qty, 0) || 0} টি</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderTop: '1px dashed var(--border-color)', paddingTop: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>{lang === 'bn' ? 'মোট বিল:' : 'Grand Total:'}</span>
                <strong style={{ color: 'var(--text-main)', fontSize: '1rem', fontFamily: 'var(--font-mono)' }}>৳{Number(lastCompletedSale.grandTotal).toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{lang === 'bn' ? 'পরিশোধ:' : 'Paid:'}</span>
                <strong style={{ color: '#10b981', fontFamily: 'var(--font-mono)' }}>৳{Number(lastCompletedSale.paidAmount).toLocaleString()} ({lastCompletedSale.paymentMethod?.toUpperCase()})</strong>
              </div>
              {Number(lastCompletedSale.dueAmount) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#ef4444' }}>
                  <span>{lang === 'bn' ? 'অবশিষ্ট বকেয়া:' : 'Remaining Due:'}</span>
                  <strong style={{ fontFamily: 'var(--font-mono)' }}>৳{Number(lastCompletedSale.dueAmount).toLocaleString()}</strong>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  openInvoicePrint(lastCompletedSale);
                  setShowSuccessModal(false);
                }}
                className="btn btn-primary"
                style={{ flex: 1.2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: '800', background: 'linear-gradient(135deg, #10b981, #059669)' }}
              >
                <FileText size={16} />
                <span>{lang === 'bn' ? 'রিসিট প্রিন্ট করুন' : 'Print Receipt'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="btn btn-secondary"
                style={{ flex: 1, fontWeight: '700' }}
              >
                {lang === 'bn' ? 'পরবর্তী বিল' : 'Next Sale'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: FAST CASH DIALPAD & INSTANT CHECKOUT               */}
      {/* ========================================================= */}
      {showFastCashModal && (
        <div className="modal-overlay animate-fade-in" style={{ zIndex: 1200, backdropFilter: 'blur(6px)', background: 'rgba(0, 0, 0, 0.75)' }}>
          <div
            className="glass-card modal-container"
            style={{
              maxWidth: '460px',
              width: '94%',
              padding: '1.25rem',
              borderRadius: '20px',
              background: 'var(--bg-card)',
              border: '1.5px solid rgba(16, 185, 129, 0.4)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <Zap size={20} fill="#fff" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>
                    {lang === 'bn' ? '⚡ ফাস্ট ক্যাশ ডায়ালপ্যাড' : '⚡ Fast Cash Checkout'}
                  </h3>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {lang === 'bn' ? 'দ্রুত ক্যাশ গ্রহণ ও ফেরত হিসাব' : 'Instant Cash Tender & Change Calculator'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setShowFastCashModal(false)}
                style={{ borderRadius: '50%', background: 'var(--bg-secondary)' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Bill and Tendered Display */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1rem' }}>
              <div style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700' }}>
                  {lang === 'bn' ? 'মোট বিল' : 'Grand Total'}
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: '900', color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                  ৳{grandTotal.toLocaleString()}
                </div>
              </div>

              <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px 12px', borderRadius: '14px', border: '1.5px solid rgba(16, 185, 129, 0.4)' }}>
                <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: '800' }}>
                  {lang === 'bn' ? 'ক্যাশ গ্রহণ (টাকা)' : 'Cash Tendered'}
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: '900', color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                  ৳{Number(fastCashTendered).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Change Due / বকেয়া ব্যালেন্স */}
            <div
              style={{
                background: fastCashTendered >= grandTotal ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                border: fastCashTendered >= grandTotal ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(245, 158, 11, 0.35)',
                borderRadius: '12px',
                padding: '8px 12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem'
              }}
            >
              <span style={{ fontSize: '0.82rem', fontWeight: '800', color: fastCashTendered >= grandTotal ? '#10b981' : '#f59e0b' }}>
                {fastCashTendered >= grandTotal 
                  ? (lang === 'bn' ? '🔄 গ্রাহককে ফেরত দিন:' : '🔄 Change to Return:') 
                  : (lang === 'bn' ? '⚠️ বকেয়া থাকবে:' : '⚠️ Remaining Due:')}
              </span>
              <span style={{ fontSize: '1.15rem', fontWeight: '900', fontFamily: 'var(--font-mono)', color: fastCashTendered >= grandTotal ? '#10b981' : '#f59e0b' }}>
                ৳{Math.abs(Number(fastCashTendered) - grandTotal).toLocaleString()}
              </span>
            </div>

            {/* Quick Cash Banknotes */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '10px' }}>
              <button
                type="button"
                onClick={() => setFastCashTendered(grandTotal)}
                style={{ padding: '8px 4px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-main)', cursor: 'pointer' }}
              >
                এক্সেক্ট
              </button>
              {[100, 500, 1000].map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setFastCashTendered(amt)}
                  style={{ padding: '8px 4px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-main)', cursor: 'pointer' }}
                >
                  ৳{amt}
                </button>
              ))}
            </div>

            {/* Numeric Keypad */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '1rem' }}>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '00'].map(key => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    hapticFeedback.light();
                    if (key === 'C') {
                      setFastCashTendered(0);
                    } else {
                      const str = String(fastCashTendered === 0 ? '' : fastCashTendered) + key;
                      setFastCashTendered(Number(str) || 0);
                    }
                  }}
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    background: key === 'C' ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-secondary)',
                    color: key === 'C' ? '#ef4444' : 'var(--text-main)',
                    border: '1px solid var(--border-color)',
                    fontSize: '1.05rem',
                    fontWeight: '800',
                    cursor: 'pointer'
                  }}
                >
                  {key}
                </button>
              ))}
            </div>

            {/* Complete Sale Button */}
            <button
              type="button"
              className="btn press-scale"
              onClick={() => {
                setShowFastCashModal(false);
                handleCheckout();
              }}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#ffffff',
                border: 'none',
                fontWeight: '800',
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 6px 18px rgba(16, 185, 129, 0.4)',
                cursor: 'pointer'
              }}
            >
              <CheckCircle2 size={18} />
              <span>{lang === 'bn' ? 'বিলিং সম্পন্ন ও রসিদ প্রিন্ট' : 'Complete Sale & Print'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: RECENT SALES FEED AT THIS COUNTER */}
      {/* ========================================================= */}
      {showRecentSalesModal && (
        <div className="modal-overlay animate-fade-in" style={{ zIndex: 1100 }}>
          <div className="glass-card modal-container" style={{ maxWidth: '780px', width: '95%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: '1.5rem', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
                  <Clock size={20} style={{ color: '#6366f1' }} />
                  <span>{lang === 'bn' ? 'আজকের কাউন্টার বিক্রির তালিকা' : "Today's Counter Sales Feed"}</span>
                  <span className="badge" style={{ fontSize: '0.72rem', background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' }}>
                    {activeCounter?.name}
                  </span>
                </h3>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {lang === 'bn' ? `মোট ${todayCounterSales.length} টি ইনভয়েস | বিক্রয় মূল্য: ৳${todayCounterSalesTotal.toLocaleString()}` : `${todayCounterSales.length} Invoices | Total: ৳${todayCounterSalesTotal.toLocaleString()}`}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRecentSalesModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
              {todayCounterSales.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  <ShoppingCart size={40} style={{ opacity: 0.3, marginBottom: '8px' }} />
                  <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '600' }}>
                    {lang === 'bn' ? 'এই কাউন্টারে আজ এখনও কোনো বিক্রি হয়নি।' : 'No sales made at this counter today.'}
                  </p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem' }}>
                    {lang === 'bn' ? 'বিল সম্পন্ন করার সাথে সাথে প্রতিটি ইনভয়েস এখানে ও মালিকের ড্যাশবোর্ডে যোগ হবে।' : 'Invoices will show up here instantly once checked out.'}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {todayCounterSales.map((sale) => (
                    <div
                      key={sale.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 14px',
                        background: 'var(--bg-secondary)',
                        borderRadius: '10px',
                        border: '1px solid var(--border-color)',
                        flexWrap: 'wrap',
                        gap: '10px'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ fontSize: '0.88rem', color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                            #{sale.id}
                          </strong>
                          <span
                            style={{
                              fontSize: '0.68rem',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontWeight: '700',
                              background: sale.status === 'paid' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              color: sale.status === 'paid' ? '#10b981' : '#ef4444'
                            }}
                          >
                            {sale.status === 'paid' ? 'পরিশোধিত' : (sale.status === 'partial' ? 'আংশিক' : 'বকেয়া')}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            💳 {sale.paymentMethod?.toUpperCase()}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          👤 {sale.customerName} | 📦 {sale.items?.length || 0} আইটেম | ⏰ {sale.date?.split(' ')[1] || 'Today'}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                            ৳{Number(sale.grandTotal).toLocaleString()}
                          </div>
                          {Number(sale.dueAmount) > 0 && (
                            <div style={{ fontSize: '0.7rem', color: '#ef4444' }}>
                              বাকি: ৳{Number(sale.dueAmount).toLocaleString()}
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => openInvoicePrint(sale)}
                          className="btn btn-secondary"
                          style={{
                            padding: '6px 10px',
                            fontSize: '0.75rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontWeight: '700'
                          }}
                          title="রিসিট প্রিন্ট করুন"
                        >
                          <FileText size={13} />
                          <span>প্রিন্ট</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowRecentSalesModal(false)}
                style={{ fontSize: '0.82rem', fontWeight: '700' }}
              >
                {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Filter & Shortcut Manager Modal */}
      {showFilterManagerModal && (
        <QuickFilterManagerModal
          isOpen={showFilterManagerModal}
          onClose={() => setShowFilterManagerModal(false)}
          quickFilters={quickFilters}
          onSaveFilters={handleSaveQuickFilters}
          onResetDefaults={handleResetDefaultFilters}
          lang={lang}
        />
      )}

      {/* Centralized Master Setup & Folder Hub Modal */}
      {showMasterHubModal && (
        <MasterHubModal
          isOpen={showMasterHubModal}
          onClose={handleCloseMasterHub}
        />
      )}

      {/* BENGALI AI VOICE BILLING MODAL */}
      {showVoiceBillingModal && (
        <VoiceBillingModal
          isOpen={showVoiceBillingModal}
          onClose={() => setShowVoiceBillingModal(false)}
          onAddToCart={addToCart}
          onPOSAction={(action) => {
            if (action.type === 'discount') {
              setDiscountAmount(String(action.amount));
            } else if (action.type === 'clear_cart') {
              clearCart();
            } else if (action.type === 'open_drawer') {
              openCashDrawer('manual');
            } else if (action.type === 'checkout') {
              handleCheckout();
            } else if (action.type === 'payment_method') {
              setPaymentMethod(action.method);
            }
          }}
        />
      )}

      {/* INDUSTRY TEMPLATE REVIEW & CUSTOMIZER MODAL */}
      {showTemplateReviewModal && (
        <TemplateReviewModal
          isOpen={showTemplateReviewModal}
          onClose={() => setShowTemplateReviewModal(false)}
        />
      )}

      {/* HOLD CART & BILL SPLIT MODAL (ITEM 56) */}
      {showHoldModal && (
        <HoldCartManagerModal
          isOpen={showHoldModal}
          onClose={() => {
            setShowHoldModal(false);
            refreshHeldCount();
          }}
          currentCart={cart}
          onRestoreCart={(restoredCart) => {
            clearCart();
            restoredCart.forEach(item => addToCart(item, item.qty || 1));
            refreshHeldCount();
          }}
          onHoldCurrentCart={() => {
            clearCart();
            refreshHeldCount();
          }}
          lang={lang}
          showToast={showToast}
        />
      )}

      {/* CASH DENOMINATION COUNTER MODAL (ITEM 57) */}
      {showDenominationModal && (
        <DenominationCalculatorModal
          isOpen={showDenominationModal}
          onClose={() => setShowDenominationModal(false)}
          targetAmount={grandTotal}
          onApplyCountedAmount={(countedSum) => {
            setIsPartialPayment(true);
            setPartialPaidInput(String(countedSum));
          }}
          lang={lang}
          showToast={showToast}
        />
      )}

      {/* MULTI-PAYMENT SPLIT CHECKOUT MODAL (ITEM 59) */}
      {showSplitPaymentModal && (
        <SplitPaymentModal
          isOpen={showSplitPaymentModal}
          onClose={() => setShowSplitPaymentModal(false)}
          grandTotal={grandTotal}
          onConfirmSplitPayment={(splitList, totalAllocated) => {
            setPendingSplitPayments(splitList);
            setPaymentMethod('split');
            handleCheckout(splitList);
          }}
          lang={lang}
          showToast={showToast}
        />
      )}

      {/* DIRECT THERMAL LABEL & BARCODE PRINTER MODAL (ITEM 60) */}
      {showThermalLabelModal && (
        <ThermalLabelPrinterModal
          isOpen={showThermalLabelModal}
          onClose={() => setShowThermalLabelModal(false)}
          products={products}
          businessSettings={businessSettings}
          initialProduct={cart[0] || products[0]}
          lang={lang}
          showToast={showToast}
        />
      )}

      {/* DIGITAL WEIGHING SCALE TERMINAL MODAL (ITEM 55) */}
      {showScaleModal && (
        <DigitalScaleModal
          isOpen={showScaleModal}
          onClose={() => setShowScaleModal(false)}
          cart={cart}
          onApplyWeightToCartItem={(itemId, measuredWeight) => {
            updateCartQty(itemId, measuredWeight);
          }}
          lang={lang}
          showToast={showToast}
        />
      )}

      {/* SUPPLIER PURCHASE ORDER MODAL (ITEM 74) */}
      {showPOModal && (
        <SupplierPurchaseOrderModal
          isOpen={showPOModal}
          onClose={() => setShowPOModal(false)}
          lang={lang}
          showToast={showToast}
        />
      )}

      {/* SALES RETURN & DAMAGE MANAGEMENT MODAL (ITEM 80) */}
      {showSalesReturnModal && (
        <SalesReturnModal
          isOpen={showSalesReturnModal}
          onClose={() => setShowSalesReturnModal(false)}
          lang={lang}
          showToast={showToast}
        />
      )}

      {/* INDUSTRY TEMPLATE REVIEW & FEATURE TOGGLE MODAL */}
      {showTemplateReviewModal && (
        <TemplateReviewModal
          isOpen={showTemplateReviewModal}
          onClose={() => setShowTemplateReviewModal(false)}
        />
      )}

      {/* CATTLE & DAIRY FARM MODAL */}
      <CattleFarmModal
        isOpen={showCattleModal}
        initialTab={cattleModalInitialTab}
        onClose={() => setShowCattleModal(false)}
      />

      {/* FLOATING ACTIVE UNDO BANNER */}
      {undoState && (
        <div
          className="undo-banner"
          role="alert"
          aria-live="polite"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.1rem' }}>🗑️</span>
            <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>
              {undoState.message}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handleRestoreUndo}
              className="undo-btn"
              title="পূর্বাবস্থায় ফিরিয়ে নিন"
            >
              <RotateCcw size={14} />
              <span>{lang === 'bn' ? 'ফিরিয়ে আনুন (Undo)' : 'Undo'}</span>
            </button>
            <button
              type="button"
              onClick={() => setUndoState(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.7)',
                cursor: 'pointer',
                padding: '2px 4px',
                display: 'flex',
                alignItems: 'center'
              }}
              title="মুছে ফেলুন"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
