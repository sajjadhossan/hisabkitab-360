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
  Truck,
  Gift
} from 'lucide-react';
import { QuickFilterManagerModal } from '../pos/QuickFilterManagerModal';
import { POSProductCard } from '../pos/POSProductCard';
import { MasterHubModal } from '../common/MasterHubModal';
import { VoiceBillingModal } from '../pos/VoiceBillingModal';
import { VoiceInputButton } from '../common/VoiceInputButton';
import { TemplateReviewModal } from '../common/TemplateReviewModal';
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
import { requestScreenWakeLock, releaseScreenWakeLock } from '../../services/nativeAppService';

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

  // Screen Wake Lock: Keep phone screen on while in POS counter
  useEffect(() => {
    requestScreenWakeLock();
    return () => {
      releaseScreenWakeLock();
    };
  }, []);

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
          handleCheckout();
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

    // Confetti effect & Success Chime
    playSuccessChime();
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

  // Dedicated Mobile-First POS View for Android & Mobile Phones
  if (isMobileScreen && !forceDesktopMode) {
    return (
      <div className="animate-fade-in pos-terminal-view" style={{ width: '100%', boxSizing: 'border-box' }}>
        <MobilePOSView
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
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

        {/* Counter Closing / Handover Button (Swipeable on Mobile) */}
        <div className="horizontal-touch-strip" style={{ alignItems: 'center' }}>
          {isSalesman ? (
            <div style={{ fontSize: '0.78rem', color: '#f59e0b', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={14} />
              <span>{lang === 'bn' ? 'সেলসম্যান কার্ট মোড (কাস্টমার ট্রলি প্রস্তুত)' : 'Salesman Cart Mode'}</span>
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
                  gap: '6px',
                  padding: '6px 12px',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  border: isShiftActive ? '1px solid rgba(16, 185, 129, 0.4)' : '1.5px solid #f59e0b',
                  background: isShiftActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.15)',
                  color: isShiftActive ? '#10b981' : '#f59e0b'
                }}
                title={isShiftActive ? 'শিফট সক্রিয় রয়েছে' : 'সকালের শিফট শুরু ও ক্যাশ ড্রয়ার ওপেন'}
              >
                <Sun size={15} />
                <span>{isShiftActive ? (lang === 'bn' ? '🟢 শিফট সক্রিয়' : 'Shift Active') : (lang === 'bn' ? '🌅 ক্যাশ ওপেন' : 'Open Cash')}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowClosingModal(true)}
                className="btn btn-secondary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  border: '1px solid #10b981',
                  color: '#10b981'
                }}
                title={lang === 'bn' ? 'কাউন্টার শিফট ক্লোজিং ও নগদ ক্যাশ বুঝিয়ে দিন' : 'Counter shift closing and handover'}
              >
                <Banknote size={15} />
                <span>{lang === 'bn' ? 'শিফট ক্লোজিং / ক্যাশ হ্যান্ডওভার' : 'Shift Closing'}</span>
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
                gap: '6px',
                padding: '6px 12px',
                fontSize: '0.8rem',
                fontWeight: '800',
                border: '1.5px solid #10b981',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#10b981'
              }}
              title={lang === 'bn' ? 'মালিকের সেন্ট্রাল ক্যাশ ও ব্রাঞ্চ কন্ট্রোল হাব' : 'Owner Central Cash & Branch Control'}
            >
              <Building2 size={14} />
              <span>{lang === 'bn' ? '👑 ক্যাশ ও ব্রাঞ্চ হাব' : '👑 Cash Hub'}</span>
            </button>
          )}

          {/* Industry Template Review & Customizer Hub Button */}
          <button
            type="button"
            onClick={() => setShowTemplateReviewModal(true)}
            className="btn btn-secondary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '0.8rem',
              fontWeight: '700',
              border: '1.5px solid #6366f1',
              background: 'rgba(99, 102, 241, 0.12)',
              color: '#6366f1'
            }}
            title={lang === 'bn' ? 'ইন্ডাস্ট্রি টেমপ্লেট রিভিউ ও কাস্টমাইজ করুন' : 'Review & Customize Industry Template'}
          >
            <Sparkles size={14} />
            <span>{lang === 'bn' ? '🎨 টেমপ্লেট রিভিউ' : '🎨 Templates'}</span>
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
              gap: '6px',
              padding: '6px 12px',
              fontSize: '0.8rem',
              fontWeight: '700',
              border: soundboxActive ? '1.5px solid #10b981' : '1px solid var(--border-color)',
              background: soundboxActive ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
              color: soundboxActive ? '#10b981' : 'var(--text-muted)'
            }}
            title={soundboxActive ? 'ভয়েস সাউন্ডবক্স চালু আছে (ক্লিক করে বন্ধ করুন)' : 'ভয়েস সাউন্ডবক্স বন্ধ (ক্লিক করে চালু করুন)'}
          >
            {soundboxActive ? <Volume2 size={15} /> : <VolumeX size={15} />}
            <span>{soundboxActive ? (lang === 'bn' ? '🔊 সাউন্ডবক্স চালু' : 'Soundbox ON') : (lang === 'bn' ? '🔇 সাউন্ডবক্স' : 'Soundbox OFF')}</span>
          </button>

          {/* Dual Screen Customer Display Popout (Item 54) */}
          <button
            type="button"
            onClick={openCustomerMirrorWindow}
            className="btn btn-secondary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '0.8rem',
              fontWeight: '700',
              border: '1px solid #38bdf8',
              background: 'rgba(56, 189, 248, 0.1)',
              color: '#38bdf8'
            }}
            title={lang === 'bn' ? 'দ্বিতীয় গ্রাহক স্ক্রিন উইন্ডো খুলুন (F11)' : 'Open Customer Display Window (F11)'}
          >
            <Tv size={15} />
            <span>{lang === 'bn' ? '🖥️ গ্রাহক স্ক্রিন' : 'Dual Screen'}</span>
          </button>

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
              gap: '6px',
              padding: '6px 12px',
              fontSize: '0.8rem',
              fontWeight: '700',
              border: heldCartsCount > 0 ? '1.5px solid #f59e0b' : '1px solid var(--border-color)',
              background: heldCartsCount > 0 ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
              color: heldCartsCount > 0 ? '#f59e0b' : 'var(--text-muted)'
            }}
            title={lang === 'bn' ? 'হোল্ড করা বিলের তালিকা দেখুন ও কার্ট হোল্ড করুন (F6)' : 'View & manage held carts (F6)'}
          >
            <PauseCircle size={15} />
            <span>{lang === 'bn' ? `⏸️ হোল্ড (${heldCartsCount})` : `Hold (${heldCartsCount})`}</span>
          </button>

          {/* Digital Weight Scale Support (Item 55) */}
          <button
            type="button"
            onClick={() => setShowScaleModal(true)}
            className="btn btn-secondary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '0.8rem',
              fontWeight: '700',
              border: hwStatus.weightScale ? '1.5px solid #10b981' : '1px solid var(--border-color)',
              background: hwStatus.weightScale ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
              color: hwStatus.weightScale ? '#10b981' : 'var(--text-muted)'
            }}
            title={lang === 'bn' ? 'ডিজিটাল ওজন স্কেল টার্মিনাল খুলুন (F7)' : 'Digital Weight Scale Terminal (F7)'}
          >
            <Scale size={15} />
            <span>{hwStatus.weightScale ? '🟢 স্কেল যুক্ত' : (lang === 'bn' ? '⚖️ স্কেল' : 'Scale')}</span>
          </button>

          {/* Direct Thermal Label Printing (Item 60) */}
          <button
            type="button"
            onClick={() => setShowThermalLabelModal(true)}
            className="btn btn-secondary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '0.8rem',
              fontWeight: '700',
              border: '1px solid var(--border-color)',
              color: 'var(--text-muted)'
            }}
            title={lang === 'bn' ? '৫২x৩৮ থার্মাল স্টিকার ও বারকোড লেবেল প্রিন্টার' : 'Print Thermal Barcode Labels'}
          >
            <Printer size={15} />
            <span>{lang === 'bn' ? '🏷️ স্টিকার' : 'Labels'}</span>
          </button>

          {/* Electronic Cash Drawer Kick Button (Item 52) */}
          <button
            type="button"
            onClick={() => openCashDrawer('manual')}
            className="btn btn-secondary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '0.8rem',
              fontWeight: '700',
              border: '1px solid var(--border-color)',
              color: 'var(--text-muted)'
            }}
            title={lang === 'bn' ? 'ক্যাশ ড্রয়ার খুলুন (F9)' : 'Kick Cash Drawer (F9)'}
          >
            <span>🗄️ {lang === 'bn' ? 'ড্রয়ার (F9)' : 'Drawer'}</span>
          </button>

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
              gap: '6px',
              padding: '6px 12px',
              fontSize: '0.8rem',
              fontWeight: '700',
              border: hwStatus.serialPrinter ? '1.5px solid #10b981' : '1px solid var(--border-color)',
              background: hwStatus.serialPrinter ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
              color: hwStatus.serialPrinter ? '#10b981' : 'var(--text-muted)'
            }}
            title={hwStatus.serialPrinter ? 'সরাসরি USB প্রিন্টার সংযুক্ত (ক্লিক করে বিচ্ছিন্ন করুন)' : 'Web Serial দিয়ে USB থার্মাল প্রিন্টার সংযুক্ত করুন'}
          >
            <Printer size={15} />
            <span>{hwStatus.serialPrinter ? '🟢 USB প্রিন্টার' : (lang === 'bn' ? '🔌 USB প্রিন্ট' : 'USB Print')}</span>
          </button>

          {/* Screen Zoom Control (Desktop & Tablet) */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '4px 8px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              fontSize: '0.78rem'
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
                padding: '2px 5px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title={lang === 'bn' ? 'জুম আউট (স্ক্রিন ছোট করুন)' : 'Zoom Out'}
            >
              <ZoomOut size={14} />
            </button>

            <button
              type="button"
              onClick={handleResetZoom}
              style={{
                background: zoomLevel !== 100 ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                border: 'none',
                color: zoomLevel !== 100 ? '#818cf8' : 'var(--text-muted)',
                cursor: 'pointer',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: '700'
              }}
              title={lang === 'bn' ? 'রিসেট ১০০%' : 'Reset to 100%'}
            >
              🔍 {zoomLevel}%
            </button>

            <button
              type="button"
              onClick={() => handleZoomChange(5)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-main)',
                cursor: 'pointer',
                padding: '2px 5px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title={lang === 'bn' ? 'জুম ইন (স্ক্রিন বড় করুন)' : 'Zoom In'}
            >
              <ZoomIn size={14} />
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

          {/* Restaurant Dining & Table Selection Bar (Desktop Only) */}
          {(activeIndustryId?.includes('restaurant') || activeIndustryId?.includes('food')) && (
            <div className="hide-mobile" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              borderRadius: '10px',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              marginBottom: '0.75rem',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Utensils size={16} color="#f59e0b" />
                <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  {lang === 'bn' ? 'রেস্টুরেন্ট অর্ডার মোড:' : 'Order Mode:'}
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setOrderType('dine_in')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      border: 'none',
                      background: orderType === 'dine_in' ? '#f59e0b' : 'rgba(255,255,255,0.08)',
                      color: orderType === 'dine_in' ? '#000' : 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                  >
                    🍽️ ডাইন-ইন
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType('parcel')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      border: 'none',
                      background: orderType === 'parcel' ? '#10b981' : 'rgba(255,255,255,0.08)',
                      color: orderType === 'parcel' ? '#fff' : 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                  >
                    🛍️ পার্সেল / Takeaway
                  </button>
                </div>
              </div>

              {orderType === 'dine_in' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700' }}>টেবিল নম্বর:</span>
                  <select
                    value={selectedTable}
                    onChange={(e) => setSelectedTable(e.target.value)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '800',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-main)',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    {['T-1 (২ জন)', 'T-2 (৪ জন)', 'T-3 (৪ জন)', 'T-4 (৬ জন)', 'T-5 (পারিবারিক)', 'T-6 (ভিআইপি)', 'T-7 (ক্যাবানা)', 'T-8 (টেরাস)'].map(t => (
                      <option key={t} value={t.split(' ')[0]}>{t}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* MULTI-LAYER QUICK SHORTCUT & FILTER SYSTEM               */}
          {/* ======================================================== */}

          {/* LAYER 1: PRIMARY QUICK FILTER SHORTCUTS */}
          <div style={{ marginBottom: '8px' }}>
            {/* Desktop Layer 1 Header */}
            <div className="hide-mobile" style={{ marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Layers size={14} style={{ color: 'var(--business-primary)' }} />
                  <span style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    {lang === 'bn' ? '১ম স্তর: দ্রুত পণ্য গ্রুপ / শর্টকাট' : 'Layer 1: Quick Shortcuts'}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    ({quickFilters.length}টি)
                  </span>
                </div>

                {/* Company / Brand Filter Dropdown & Manager Button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {detectedBrands.length > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600' }}>কোম্পানি:</span>
                      <select
                        value={selectedBrand}
                        onChange={(e) => setSelectedBrand(e.target.value)}
                        style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: '700',
                          background: 'var(--bg-secondary)',
                          color: selectedBrand !== 'all' ? 'var(--business-primary)' : 'var(--text-main)',
                          border: selectedBrand !== 'all' ? '1px solid var(--business-primary)' : '1px solid var(--border-color)',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="all">🏢 {lang === 'bn' ? 'সকল কোম্পানি / ব্র্যান্ড' : 'All Brands'}</option>
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
                      gap: '4px',
                      padding: '3px 10px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: '800',
                      background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(16, 185, 129, 0.15))',
                      color: '#6366f1',
                      border: '1px solid rgba(99, 102, 241, 0.4)',
                      cursor: 'pointer'
                    }}
                    title={lang === 'bn' ? 'সকল ফোল্ডার, ইউনিট, ক্যাটাগরি ও ব্র্যান্ডের কেন্দ্রীয় সেটআপ হাব' : 'Open Master Setup Hub'}
                  >
                    <span>📁</span>
                    <span>{lang === 'bn' ? 'মাস্টার ডাটা হাব' : 'Master Hub'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowFilterManagerModal(true)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: '800',
                      background: 'rgba(99, 102, 241, 0.12)',
                      color: '#6366f1',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      cursor: 'pointer'
                    }}
                    title={lang === 'bn' ? 'নতুন শর্টকাট বাটন যোগ করুন বা ডিলিট করুন' : 'Manage & Add Shortcuts'}
                  >
                    <SlidersHorizontal size={12} />
                    <span>{lang === 'bn' ? '⚙️ ফিল্টার সাজান' : '⚙️ Manage'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile Layer 1 Header (Matching Reference Screenshot) */}
            <div className="show-mobile-only" style={{ marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.85rem' }}>🥞</span>
                <span style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  LAYER 1: QUICK SHORTCUTS ({quickFilters.length}টি)
                </span>
              </div>
            </div>

            {/* Layer 1 Buttons Scroll Row (Swipeable on Mobile) */}
            <div className="horizontal-touch-strip" style={{ paddingBottom: '4px' }}>
              {quickFilters.map((qf) => {
                const isActive = activeFilterId === qf.id;
                const count = getFilterItemCount(qf);
                return (
                  <button
                    key={qf.id}
                    type="button"
                    onClick={() => {
                      if (isActive && qf.id !== 'all') {
                        // toggle off to all
                        setActiveFilterId('all');
                        setActiveSubFilterKeyword('');
                      } else {
                        setActiveFilterId(qf.id);
                        setActiveSubFilterKeyword('');
                      }
                    }}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '10px',
                      fontSize: '0.78rem',
                      fontWeight: isActive ? '800' : '600',
                      border: '1.5px solid',
                      borderColor: isActive ? 'var(--business-primary)' : 'var(--border-color)',
                      background: isActive ? 'var(--business-primary)' : 'var(--bg-secondary)',
                      color: isActive ? '#ffffff' : 'var(--text-main)',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: isActive ? '0 2px 8px rgba(16, 185, 129, 0.3)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>{qf.icon || '🏷️'}</span>
                    <span>{qf.label}</span>
                    <span style={{
                      fontSize: '0.68rem',
                      padding: '1px 6px',
                      borderRadius: '8px',
                      background: isActive ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.08)',
                      color: isActive ? '#fff' : 'var(--text-muted)',
                      fontWeight: '700'
                    }}>
                      {count}
                    </span>
                  </button>
                );
              })}
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

          {/* Checkout Button */}
          <button
            className="btn btn-primary press-scale"
            disabled={cart.length === 0}
            onClick={handleCheckout}
            style={{
              width: '100%',
              padding: '11px',
              fontSize: '0.98rem',
              fontWeight: '800',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
              boxShadow: cart.length > 0 ? '0 4px 14px rgba(79, 70, 229, 0.35)' : 'none'
            }}
          >
            <CheckCircle2 size={18} />
            <span>{t.business.completeSale}</span>
          </button>
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
