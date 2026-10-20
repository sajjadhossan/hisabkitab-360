import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { showConfirmDialog } from '../../services/dialogService';
import { registerBackAction, hapticFeedback } from '../../services/nativeAppService';
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
  CheckCircle2,
  Package,
  Store,
  Monitor,
  Mic,
  Volume2,
  VolumeX,
  X,
  Boxes,
  HandCoins,
  LayoutDashboard,
  Sparkles,
  ArrowLeft,
  Sun,
  LayoutGrid,
  PauseCircle,
  PlayCircle,
  History,
  RotateCcw,
  ShieldAlert,
  TrendingUp,
  Clock,
  SlidersHorizontal,
  ChevronDown,
  Check,
  Settings,
  PlusCircle,
  Building2
} from 'lucide-react';
import { playCartPop, playButtonClick } from '../../services/soundFeedback';
import { VoiceInputButton } from '../common/VoiceInputButton';
import { broadcastCartToCustomerDisplay } from '../../services/customerMirrorService';
import { ScreenWakeLockToggle } from './ScreenWakeLockToggle';
import { NetworkQualityIndicator } from '../common/NetworkQualityIndicator';
import { DigitalMemoShareModal } from './DigitalMemoShareModal';
import { MobilePOSProductCard } from './MobilePOSProductCard';
import { IndustryVariationsBar } from './IndustryVariationsBar';
import { AdaptivePosSwitcherBar } from './AdaptivePosSwitcherBar';

export const MobilePOSView = ({
  activePosEngine = 'retail',
  onSwitchPosEngine,
  cart,
  addToCart,
  updateCartQty,
  removeFromCart,
  clearCart,
  products,
  customers,
  selectedCustomerId,
  setSelectedCustomerId,
  paymentMethod,
  setPaymentMethod,
  discountAmount,
  setDiscountAmount,
  isPartialPayment,
  setIsPartialPayment,
  partialPaidInput,
  setPartialPaidInput,
  handleCheckout,
  openScanner,
  setShowVoiceBillingModal,
  soundboxActive,
  setSoundboxActive,
  activeBranch,
  activeCounter,
  isShiftActive,
  setShowClosingModal,
  setShowOpeningModal,
  onSwitchToDesktop,
  quickFilters = [],
  orderType = 'dine_in',
  setOrderType,
  selectedTable = 'T-1',
  setSelectedTable,
  selectedWaiter = 'করিম',
  setSelectedWaiter,
  onOpenTemplateManager,
  onClose,
  onNavigate
}) => {
  const {
    lang,
    t,
    showToast,
    cashMovements = [],
    salesHistory = [],
    setCart,
    businessSettings = {},
    setActiveTab: setGlobalTab,
    activeIndustryId,
    switchCounter,
    addCounter,
    branches = []
  } = useApp();
  const { user, role, isOwner, isCashier } = useAuth();
  const posPerms = businessSettings?.posPermissions || {};

  // Live Clock for Header Display
  const [currentTime, setCurrentTime] = useState(() => {
    const d = new Date();
    return d.toLocaleTimeString(lang === 'bn' ? 'bn-BD' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setCurrentTime(d.toLocaleTimeString(lang === 'bn' ? 'bn-BD' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, [lang]);

  // Configured Branch Counters & Active Terminal Resolution
  const branchCounters = useMemo(() => {
    return activeBranch?.counters || [];
  }, [activeBranch?.counters]);

  // Assigned Cashier Name Resolution
  const assignedCashierName = useMemo(() => {
    if (activeCounter?.assignedCashierName) return activeCounter.assignedCashierName;
    if (user?.name) return user.name;
    if (isOwner) return lang === 'bn' ? 'মালিক' : 'Owner';
    if (isCashier) return lang === 'bn' ? 'ক্যাশিয়ার' : 'Cashier';
    return lang === 'bn' ? 'স্টাফ' : 'Staff';
  }, [activeCounter?.assignedCashierName, user?.name, isOwner, isCashier, lang]);

  // Quick Tools & Terminal Setup Drawer/Modal States
  const [showToolsModal, setShowToolsModal] = useState(false);
  const [showTerminalSetupModal, setShowTerminalSetupModal] = useState(false);
  const [newCounterName, setNewCounterName] = useState('');
  const [newCounterCode, setNewCounterCode] = useState('');
  const [newCounterFloat, setNewCounterFloat] = useState('1000');
  const [newCounterCashier, setNewCounterCashier] = useState('');

  const handleSelectCounter = (counterId) => {
    hapticFeedback.light();
    playButtonClick();
    if (typeof switchCounter === 'function') {
      switchCounter(counterId);
    }
  };

  const handleCreateCounter = (e) => {
    e?.preventDefault();
    if (!newCounterName.trim()) {
      showToast(lang === 'bn' ? 'কাউন্টারের নাম লিখুন' : 'Enter counter name', 'warning');
      return;
    }
    if (typeof addCounter === 'function' && activeBranch?.id) {
      const code = newCounterCode.trim() || `POS-0${(branchCounters.length || 0) + 1}`;
      const created = addCounter(activeBranch.id, {
        name: newCounterName.trim(),
        code: code,
        openingFloat: Number(newCounterFloat) || 1000,
        assignedCashierName: newCounterCashier.trim() || user?.name || ''
      });
      if (created?.id && typeof switchCounter === 'function') {
        switchCounter(created.id);
      }
      setShowTerminalSetupModal(false);
      setNewCounterName('');
      setNewCounterCode('');
      setNewCounterFloat('1000');
      setNewCounterCashier('');
      hapticFeedback.success();
      showToast(lang === 'bn' ? 'নতুন কাউন্টার ও ক্যাশিয়ার সফলভাবে যুক্ত হয়েছে!' : 'Counter & Cashier added successfully!', 'success');
    }
  };

  const handleExit = () => {
    hapticFeedback.light();
    playButtonClick();
    if (onClose) {
      onClose();
    } else if (setGlobalTab) {
      setGlobalTab('dashboard');
    }
  };

  const handleNavigate = (tabId) => {
    hapticFeedback.light();
    playButtonClick();
    if (onNavigate) {
      onNavigate(tabId);
    } else if (setGlobalTab) {
      setGlobalTab(tabId);
    }
  };

  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' | 'cart'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilterId, setSelectedFilterId] = useState('all');
  const [cashReceived, setCashReceived] = useState('');

  // POS Hold & Recall Cart State
  const [heldCarts, setHeldCarts] = useState(() => {
    try {
      const saved = localStorage.getItem('hk360_held_carts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showRecallModal, setShowRecallModal] = useState(false);

  // Cash Drawer Float Reconciliation State
  const [showDrawerFloatModal, setShowDrawerFloatModal] = useState(false);
  const [actualDrawerCashInput, setActualDrawerCashInput] = useState('');
  const [showDigitalMemoModal, setShowDigitalMemoModal] = useState(false);

  // Seamless Android Hardware & Gesture Back Button Handling
  useEffect(() => {
    const unregister = registerBackAction(() => {
      if (showTerminalSetupModal) {
        setShowTerminalSetupModal(false);
        return true;
      }
      if (showToolsModal) {
        setShowToolsModal(false);
        return true;
      }
      if (showRecallModal) {
        setShowRecallModal(false);
        return true;
      }
      if (showDrawerFloatModal) {
        setShowDrawerFloatModal(false);
        return true;
      }
      if (showDigitalMemoModal) {
        setShowDigitalMemoModal(false);
        return true;
      }
      if (activeTab === 'cart') {
        setActiveTab('catalog');
        return true;
      }
      if (searchTerm.trim()) {
        setSearchTerm('');
        return true;
      }
      if (onClose) {
        onClose();
        return true;
      }
      if (setGlobalTab) {
        setGlobalTab('dashboard');
        return true;
      }
      return false;
    });
    return () => unregister();
  }, [showTerminalSetupModal, showToolsModal, showRecallModal, showDrawerFloatModal, showDigitalMemoModal, activeTab, searchTerm, onClose, setGlobalTab]);

  const saveHeldCarts = (list) => {
    setHeldCarts(list);
    try {
      localStorage.setItem('hk360_held_carts', JSON.stringify(list));
    } catch {}
  };

  const handleHoldCart = () => {
    if (!cart || cart.length === 0) {
      showToast(lang === 'bn' ? 'হোল্ড করার মতো কোনো পণ্য কার্টে নেই!' : 'Cart is empty!', 'warning');
      return;
    }
    const newHold = {
      id: `hold-${Date.now()}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString(),
      items: [...cart],
      selectedCustomerId,
      discountAmount,
      totalQty: cart.reduce((sum, i) => sum + i.qty, 0),
      totalAmount: cart.reduce((sum, i) => sum + i.qty * i.price, 0) - (Number(discountAmount) || 0)
    };
    const updated = [newHold, ...heldCarts];
    saveHeldCarts(updated);
    clearCart();
    hapticFeedback.medium();
    showToast(lang === 'bn' ? '🛒 কার্ট সফলভাবে হোল্ড করা হয়েছে!' : 'Cart put on hold!', 'success');
  };

  const handleRecallCart = async (heldItem) => {
    if (cart.length > 0) {
      const ok = await showConfirmDialog({
        title: lang === 'bn' ? 'বর্তমান কার্ট প্রতিস্থাপন করবেন?' : 'Replace current cart?',
        message: lang === 'bn'
          ? 'বর্তমান কার্টে পণ্য রয়েছে। হোল্ড করা কার্ট লোড করলে বর্তমান কার্টটি প্রতিস্থাপিত হবে।'
          : 'Current cart contains items. Loading held cart will replace current cart.',
        confirmText: lang === 'bn' ? 'হ্যাঁ, প্রতিস্থাপন করুন' : 'Replace Cart',
        type: 'warning'
      });
      if (!ok) return;
    }
    clearCart();
    setTimeout(() => {
      heldItem.items.forEach(item => {
        addToCart(item, item.qty);
      });
      if (heldItem.selectedCustomerId && setSelectedCustomerId) {
        setSelectedCustomerId(heldItem.selectedCustomerId);
      }
      if (heldItem.discountAmount && setDiscountAmount) {
        setDiscountAmount(heldItem.discountAmount);
      }
      const remaining = heldCarts.filter(h => h.id !== heldItem.id);
      saveHeldCarts(remaining);
      setShowRecallModal(false);
      setActiveTab('cart');
      hapticFeedback.success();
      showToast(lang === 'bn' ? 'হোল্ড কার্ট ফিরিয়ে আনা হয়েছে!' : 'Cart restored!', 'success');
    }, 50);
  };

  const handleDeleteHeldCart = (heldId) => {
    const remaining = heldCarts.filter(h => h.id !== heldId);
    saveHeldCarts(remaining);
    hapticFeedback.light();
    showToast(lang === 'bn' ? 'হোল্ড কার্ট মুছে ফেলা হয়েছে' : 'Held cart deleted');
  };

  // Drawer Float Calculations
  const todayStr = new Date().toISOString().split('T')[0];
  const openingFloat = Number(activeCounter?.openingFloat) || 1000;

  const todayCashSales = useMemo(() => {
    return (salesHistory || []).filter(s => {
      const matchDate = String(s?.date || '').startsWith(todayStr);
      const isCash = !s.paymentMethod || s.paymentMethod === 'cash';
      return matchDate && isCash;
    }).reduce((sum, s) => sum + (Number(s.paidAmount) || Number(s.grandTotal) || 0), 0);
  }, [salesHistory, todayStr]);

  const todayCashMovements = useMemo(() => {
    return (cashMovements || []).filter(m => !m.date || m.date === todayStr);
  }, [cashMovements, todayStr]);

  const totalCashDeposited = todayCashMovements.filter(m => m.type === 'deposit').reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
  const totalCashWithdrawn = todayCashMovements.filter(m => m.type === 'withdraw').reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
  const expectedDrawerCash = openingFloat + todayCashSales + totalCashDeposited - totalCashWithdrawn;
  const actualCountNum = actualDrawerCashInput !== '' ? Number(actualDrawerCashInput) : null;
  const drawerDiscrepancy = actualCountNum !== null ? actualCountNum - expectedDrawerCash : 0;



  // Filter products by search and category
  const filteredProducts = useMemo(() => {
    let list = products || [];

    // Filter by quick category chip
    if (selectedFilterId !== 'all') {
      const activeFilter = quickFilters.find((f) => f.id === selectedFilterId);
      if (activeFilter && activeFilter.keywords && activeFilter.keywords.length > 0) {
        list = list.filter((p) => {
          const text = `${p.name} ${p.category || ''} ${p.brand || ''}`.toLowerCase();
          return activeFilter.keywords.some((kw) => text.includes(kw.toLowerCase()));
        });
      }
    }

    // Filter by search query
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase().trim();
      list = list.filter((p) => {
        return (
          (p.name && p.name.toLowerCase().includes(query)) ||
          (p.barcode && String(p.barcode).toLowerCase().includes(query)) ||
          (p.sku && String(p.sku).toLowerCase().includes(query)) ||
          (p.category && p.category.toLowerCase().includes(query))
        );
      });
    }

    return list;
  }, [products, searchTerm, selectedFilterId, quickFilters]);

  // Windowed Lazy Loading (Increases mobile FPS from 25fps to 120fps on low-end Android phones)
  const [displayLimit, setDisplayLimit] = useState(40);

  useEffect(() => {
    setDisplayLimit(40);
  }, [searchTerm, selectedFilterId]);

  const visibleProducts = useMemo(() => {
    return filteredProducts.slice(0, displayLimit);
  }, [filteredProducts, displayLimit]);

  // Totals calculations
  const totalItemsCount = useMemo(() => {
    return cart.reduce((acc, it) => acc + (Number(it.qty) || 0), 0);
  }, [cart]);

  const subtotal = useMemo(() => {
    return cart.reduce((acc, it) => {
      const itemTotal = (Number(it.sellPrice) || 0) * (Number(it.qty) || 1);
      return acc + (it.isReturn ? -itemTotal : itemTotal);
    }, 0);
  }, [cart]);

  const discount = Math.min(Math.max(0, subtotal), Number(discountAmount) || 0);
  const grandTotal = Math.max(0, subtotal - discount);

  // Live Mirror Broadcast to Customer Display
  const activeCustomer = useMemo(() => {
    return (customers || []).find(c => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  useEffect(() => {
    broadcastCartToCustomerDisplay({
      cart,
      subtotal,
      discount,
      vat: 0,
      grandTotal,
      paidAmount: isPartialPayment ? (Number(partialPaidInput) || 0) : (paymentMethod === 'due' ? 0 : grandTotal),
      changeAmount: 0,
      paymentMethod,
      storeName: activeBranch?.name || 'হিসাবকিতাব ৩৬০',
      customerName: activeCustomer?.name || ''
    });
  }, [cart, subtotal, discount, grandTotal, activeBranch?.name, activeCustomer?.name, isPartialPayment, partialPaidInput, paymentMethod]);

  // Live Sales Ticker Totals
  const todaySalesTotal = useMemo(() => {
    return (salesHistory || []).filter(s => {
      return String(s?.date || '').startsWith(todayStr);
    }).reduce((sum, s) => sum + (Number(s.paidAmount) || Number(s.grandTotal) || 0), 0);
  }, [salesHistory, todayStr]);

  const todaySalesCount = useMemo(() => {
    return (salesHistory || []).filter(s => String(s?.date || '').startsWith(todayStr)).length;
  }, [salesHistory, todayStr]);

  // Favorites Fast Matrix (Top 8 items for 1-tap addition)
  const favoriteProducts = useMemo(() => {
    if (!products || products.length === 0) return [];
    return products.slice(0, 8);
  }, [products]);

  // Currency Note Breakdown Recommendation (৳1000, ৳500, ৳100, ৳50, ৳20, ৳10, ৳5, ৳2, ৳1)
  const changeAmount = Math.max(0, Number(cashReceived) - grandTotal);
  const noteBreakdown = useMemo(() => {
    if (changeAmount <= 0) return [];
    const denominations = [1000, 500, 100, 50, 20, 10, 5, 2, 1];
    let rem = Math.floor(changeAmount);
    const result = [];
    for (const d of denominations) {
      if (rem >= d) {
        const count = Math.floor(rem / d);
        result.push({ note: d, count });
        rem = rem % d;
      }
    }
    return result;
  }, [changeAmount]);

  // Return / Damage item adjustment toggle
  const handleToggleReturn = (itemId) => {
    if (setCart) {
      setCart(prev => prev.map(it => it.id === itemId ? { ...it, isReturn: !it.isReturn } : it));
      hapticFeedback.medium();
      showToast(lang === 'bn' ? 'পণ্য ফেরত / ড্যামেজ অ্যাডজাস্টমেন্ট টগল হয়েছে' : 'Return mode toggled');
    }
  };

  const handleItemCardClick = (product) => {
    playCartPop();
    addToCart(product);
    hapticFeedback.light();
  };

  return (
    <div
      className="mobile-pos-view animate-fade-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        maxWidth: '100vw',
        paddingBottom: activeTab === 'catalog' && cart.length > 0 ? '90px' : '30px',
        boxSizing: 'border-box'
      }}
    >
      {/* 1. TOP MOBILE HEADER BAR (ULTRA-SLIM SINGLE-BAR MODERN POS HEADER) */}
      <div
        className="glass-card"
        style={{
          padding: '0.45rem 0.65rem',
          marginBottom: '0.5rem',
          borderRadius: '12px',
          background: 'var(--bg-secondary)',
          borderLeft: '4px solid var(--business-primary)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '6px',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        {/* Left: Home Navigation & Branch Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flexShrink: 1 }}>
          <button
            type="button"
            onClick={handleExit}
            className="btn btn-secondary"
            style={{
              padding: '4px 7px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-primary)',
              color: 'var(--text-main)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.72rem',
              fontWeight: '800',
              cursor: 'pointer',
              flexShrink: 0
            }}
            title={lang === 'bn' ? 'ড্যাশবোর্ডে ফিরে যান' : 'Back to Dashboard'}
          >
            <ArrowLeft size={13} />
            <span>{lang === 'bn' ? 'হোম' : 'Home'}</span>
          </button>

          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: '700',
              color: 'var(--text-muted)',
              maxWidth: '90px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
            title={activeBranch?.name}
          >
            🏢 {activeBranch?.name || (lang === 'bn' ? 'শাখা' : 'Branch')}
          </span>
        </div>

        {/* Right Action Cluster: Corner Terminal & Cashier Badge + Clock + Tools + Shift */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
          {/* Active Terminal & Assigned Cashier Corner Badge */}
          <div
            onClick={() => {
              hapticFeedback.light();
              playButtonClick();
              setShowToolsModal(true);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: 'var(--text-main)',
              cursor: 'pointer',
              fontSize: '0.7rem',
              fontWeight: '800'
            }}
            title={lang === 'bn' ? `শাখা: ${activeBranch?.name || 'প্রধান শাখা'} • কাউন্টার: ${activeCounter?.code || activeCounter?.name || 'POS-০১'} • ক্যাশিয়ার: ${assignedCashierName}` : 'Click to manage terminal & cashier'}
          >
            <Building2 size={11} style={{ color: '#10b981' }} />
            <span style={{ maxWidth: '85px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#10b981' }}>
              {activeBranch?.name?.replace(/ শাখা.*$/, '') || (lang === 'bn' ? 'প্রধান' : 'Main')}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>•</span>
            <Monitor size={11} style={{ color: '#818cf8' }} />
            <span style={{ color: '#818cf8', fontFamily: 'var(--font-mono)' }}>
              {activeCounter?.code || 'POS-01'}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>•</span>
            <User size={11} style={{ color: 'var(--text-main)' }} />
            <span style={{ maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {assignedCashierName}
            </span>
            <ChevronDown size={10} style={{ color: 'var(--text-muted)' }} />
          </div>

          {/* Live Real-time Clock */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              padding: '3px 6px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              color: '#10b981',
              fontSize: '0.67rem',
              fontWeight: '800',
              fontFamily: 'var(--font-mono)'
            }}
          >
            <Clock size={11} />
            <span>{currentTime}</span>
          </div>

          {/* Quick Tools & Settings Drawer Button (gear) */}
          <button
            type="button"
            onClick={() => {
              hapticFeedback.light();
              playButtonClick();
              setShowToolsModal(true);
            }}
            style={{
              position: 'relative',
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: heldCarts.length > 0 ? 'rgba(245, 158, 11, 0.18)' : 'var(--bg-primary)',
              color: heldCarts.length > 0 ? '#f59e0b' : 'var(--text-main)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            title={lang === 'bn' ? 'কুইক টুলস ও অপশনস' : 'Quick Tools & Options'}
          >
            <SlidersHorizontal size={14} />
            {heldCarts.length > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-3px',
                  right: '-3px',
                  background: '#f59e0b',
                  color: '#000000',
                  borderRadius: '50%',
                  width: '12px',
                  height: '12px',
                  fontSize: '0.55rem',
                  fontWeight: '900',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {heldCarts.length}
              </span>
            )}
          </button>

          {/* Shift Status Button */}
          <button
            type="button"
            onClick={() => (isShiftActive ? setShowClosingModal(true) : setShowOpeningModal(true))}
            style={{
              padding: '3px 6px',
              borderRadius: '8px',
              border: isShiftActive ? '1px solid #10b981' : '1px solid #f59e0b',
              background: isShiftActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              color: isShiftActive ? '#10b981' : '#f59e0b',
              fontSize: '0.67rem',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              whiteSpace: 'nowrap'
            }}
            title={isShiftActive ? 'শিফট সক্রিয়' : 'শিফট বন্ধ'}
          >
            <span>{isShiftActive ? '🟢' : '🌅'}</span>
          </button>
        </div>
      </div>

      {/* 2. TAB CONTROLLER: PRODUCTS (পণ্য) vs CART (কার্ট) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '6px',
          background: 'var(--bg-primary)',
          padding: '4px',
          borderRadius: '14px',
          border: '1px solid var(--border-color)',
          marginBottom: '0.75rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('catalog')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '9px 12px',
            borderRadius: '10px',
            border: 'none',
            background: activeTab === 'catalog' ? 'var(--business-primary)' : 'transparent',
            color: activeTab === 'catalog' ? '#ffffff' : 'var(--text-muted)',
            fontWeight: '800',
            fontSize: '0.86rem',
            cursor: 'pointer',
            transition: 'all 0.18s ease'
          }}
        >
          <Package size={17} />
          <span>{lang === 'bn' ? '📦 পণ্য সম্ভার' : '📦 Products'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('cart')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '9px 12px',
            borderRadius: '10px',
            border: 'none',
            background: activeTab === 'cart' ? 'var(--business-primary)' : 'transparent',
            color: activeTab === 'cart' ? '#ffffff' : 'var(--text-muted)',
            fontWeight: '800',
            fontSize: '0.86rem',
            cursor: 'pointer',
            transition: 'all 0.18s ease',
            position: 'relative'
          }}
        >
          <ShoppingCart size={17} />
          <span>{lang === 'bn' ? '🛒 বিক্রয় কার্ট' : '🛒 Cart'}</span>
          {totalItemsCount > 0 && (
            <span
              style={{
                background: '#ef4444',
                color: '#ffffff',
                borderRadius: '10px',
                padding: '2px 7px',
                fontSize: '0.7rem',
                fontWeight: '800'
              }}
            >
              {totalItemsCount}
            </span>
          )}
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: PRODUCT CATALOG & SEARCH                           */}
      {/* ========================================================= */}
      {activeTab === 'catalog' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Search Input + Camera Barcode Scanner & Voice Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search
                size={17}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }}
              />
              <input
                type="text"
                className="input-field"
                placeholder={lang === 'bn' ? 'পণ্য বা বারকোড খুঁজুন...' : 'Search product or barcode...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: '36px',
                  paddingRight: searchTerm ? '64px' : '40px',
                  height: '44px',
                  fontSize: '0.9rem',
                  borderRadius: '12px',
                  background: 'var(--bg-secondary)',
                  border: '1.5px solid var(--border-color)'
                }}
              />
              <div style={{ position: 'absolute', right: searchTerm ? '32px' : '6px', top: '50%', transform: 'translateY(-50%)' }}>
                <VoiceInputButton
                  onTranscript={(txt) => {
                    setSearchTerm(txt);
                    hapticFeedback.light();
                  }}
                  title={lang === 'bn' ? 'মুখে পণ্যের নাম বলুন' : 'Voice Search'}
                />
              </div>
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  <X size={15} />
                </button>
              )}
            </div>


            {/* Direct Camera Scanner Button */}
            <button
              type="button"
              onClick={() => {
                if (typeof openScanner === 'function') {
                  openScanner((scannedCode, matchedProduct) => {
                    if (matchedProduct) {
                      addToCart(matchedProduct);
                    } else if (scannedCode) {
                      setSearchTerm(scannedCode);
                    }
                  }, 'pos', 'barcode');
                }
              }}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
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
              title={lang === 'bn' ? 'ক্যামেরা দিয়ে বারকোড স্ক্যান করুন' : 'Camera Barcode Scanner'}
            >
              <ScanLine size={20} />
            </button>

            {/* Voice Input Button */}
            <button
              type="button"
              onClick={() => setShowVoiceBillingModal(true)}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.18)',
                border: '1.5px solid rgba(239, 68, 68, 0.5)',
                color: '#f87171',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0
              }}
              title={lang === 'bn' ? 'মুখে পণ্যের নাম বলুন' : 'Voice POS'}
            >
              <Mic size={20} />
            </button>
          </div>

          {/* Favorites Fast Matrix (Fast Selling Pinned Chips) */}
          {favoriteProducts.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: '800', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Sparkles size={12} />
                  <span>{lang === 'bn' ? 'দ্রুত বিক্রয় (টপ ফেভারিটস):' : 'Fast Matrix:'}</span>
                </span>
                <span style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>
                  {lang === 'bn' ? '১-ট্যাপে যোগ' : '1-Tap Add'}
                </span>
              </div>
              <div className="horizontal-touch-strip" style={{ gap: '6px', paddingBottom: '3px' }}>
                {favoriteProducts.map((p) => (
                  <button
                    key={`fav-fast-${p.id}`}
                    type="button"
                    onClick={() => {
                      playCartPop();
                      addToCart(p);
                      hapticFeedback.light();
                    }}
                    className="favorites-fast-chip"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 9px',
                      borderRadius: '9px',
                      background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(99, 102, 241, 0.12))',
                      border: '1px solid rgba(245, 158, 11, 0.35)',
                      color: 'var(--text-main)',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                    title={p.name}
                  >
                    <span style={{ fontSize: '0.72rem' }}>⚡</span>
                    <span style={{ maxWidth: '82px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.name}
                    </span>
                    <span style={{ color: '#10b981', fontWeight: '800', fontFamily: 'var(--font-mono)', fontSize: '0.73rem' }}>
                      ৳{p.sellPrice}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Category Chips (Horizontally Scrollable) */}
          <div
            className="horizontal-touch-strip"
            style={{
              paddingBottom: '2px',
              gap: '6px'
            }}
          >
            {quickFilters.map((qf) => {
              const isSelected = selectedFilterId === qf.id;
              return (
                <button
                  key={qf.id}
                  type="button"
                  onClick={() => setSelectedFilterId(qf.id)}
                  style={{
                    padding: '7px 12px',
                    borderRadius: '10px',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    border: isSelected ? '1.5px solid var(--business-primary)' : '1px solid var(--border-color)',
                    background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'var(--bg-secondary)',
                    color: isSelected ? 'var(--business-primary)' : 'var(--text-main)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    flexShrink: 0
                  }}
                >
                  <span>{qf.icon}</span>
                  <span>{lang === 'bn' ? qf.label : qf.enLabel}</span>
                </button>
              );
            })}
          </div>

          {/* Product Items Grid (Touch Friendly 2-Column Responsive) */}
          {filteredProducts.length === 0 ? (
            <div
              className="glass-card"
              style={{
                padding: '2.5rem 1rem',
                textAlign: 'center',
                color: 'var(--text-muted)',
                borderRadius: '16px'
              }}
            >
              <Package size={36} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
              <div style={{ fontSize: '0.92rem', fontWeight: '700' }}>
                {lang === 'bn' ? 'কোনো পণ্য পাওয়া যায়নি' : 'No products found'}
              </div>
              <p style={{ fontSize: '0.76rem', margin: '4px 0 0' }}>
                {lang === 'bn' ? 'বানান চেক করুন বা অন্য ক্যাটাগরি বেছে নিন' : 'Try searching with another name or category'}
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px'
              }}
            >
              {(() => {
                const cartQtyMap = new Map((cart || []).map(ci => [ci.id, ci.qty]));
                return visibleProducts.map((p) => (
                  <MobilePOSProductCard
                    key={p.id}
                    product={p}
                    inCartQty={cartQtyMap.get(p.id) || 0}
                    onSelect={handleItemCardClick}
                  />
                ));
              })()}
            </div>
          )}

          {/* Load More Button for large inventories */}
          {filteredProducts.length > visibleProducts.length && (
            <div style={{ textAlign: 'center', marginTop: '0.75rem', marginBottom: '2rem' }}>
              <button
                type="button"
                onClick={() => setDisplayLimit((prev) => prev + 40)}
                className="btn press-scale"
                style={{
                  padding: '9px 18px',
                  borderRadius: '12px',
                  fontWeight: '700',
                  fontSize: '0.82rem',
                  width: '100%',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--business-primary)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  cursor: 'pointer'
                }}
              >
                ⚡ {lang === 'bn' ? `আরও পণ্য লোড করুন (${visibleProducts.length} / ${filteredProducts.length})` : `Load More (${visibleProducts.length} of ${filteredProducts.length})`}
              </button>
            </div>
          )}

          {/* Floating Checkout Bar (Sticky at Bottom) */}
          {cart.length > 0 && (
            <div
              className="pos-floating-checkout-bar animate-slide-up"
              onClick={() => setActiveTab('cart')}
              style={{
                position: 'fixed',
                bottom: '76px',
                left: '12px',
                right: '12px',
                zIndex: 900,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 18px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #4f46e5, #10b981)',
                color: '#ffffff',
                boxShadow: '0 8px 30px rgba(79, 70, 229, 0.5)',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <ShoppingCart size={19} />
                </div>
                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: '800', lineHeight: 1.1 }}>
                    {totalItemsCount}টি পণ্য কার্টে
                  </div>
                  <div style={{ fontSize: '0.72rem', opacity: 0.9 }}>
                    ট্যাপ করে বিল প্রস্তুত করুন
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', fontSize: '1.1rem', fontFamily: 'var(--font-mono)' }}>
                <span>৳{grandTotal.toLocaleString()}</span>
                <span>→</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: CART BILLING & CHECKOUT (১০০% ক্লিন মোবাইল কার্ট)  */}
      {/* ========================================================= */}
      {activeTab === 'cart' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingBottom: '140px' }}>
          {/* Cart Top Control: Back to Products + Clear Cart */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setActiveTab('catalog')}
              className="btn btn-secondary"
              style={{
                padding: '6px 12px',
                fontSize: '0.78rem',
                fontWeight: '700',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <ArrowLeft size={14} />
              <span>{lang === 'bn' ? '← পণ্য যোগ করুন' : '← Add More'}</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={handleHoldCart}
                  style={{
                    background: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(245, 158, 11, 0.35)',
                    color: '#f59e0b',
                    fontSize: '0.76rem',
                    fontWeight: '700',
                    borderRadius: '8px',
                    padding: '5px 8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title={lang === 'bn' ? 'বর্তমান কার্ট হোল্ড করে রাখুন' : 'Hold Cart'}
                >
                  <PauseCircle size={13} />
                  <span>{lang === 'bn' ? 'হোল্ড' : 'Hold'}</span>
                </button>
              )}

              {heldCarts.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    hapticFeedback.light();
                    setShowRecallModal(true);
                  }}
                  style={{
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    color: '#10b981',
                    fontSize: '0.76rem',
                    fontWeight: '700',
                    borderRadius: '8px',
                    padding: '5px 8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title={lang === 'bn' ? 'হোল্ড করা কার্ট রিকল করুন' : 'Recall Cart'}
                >
                  <PlayCircle size={13} />
                  <span>{lang === 'bn' ? `রিকল (${heldCarts.length})` : `Recall (${heldCarts.length})`}</span>
                </button>
              )}

              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#ef4444',
                    fontSize: '0.76rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    padding: '4px 6px'
                  }}
                >
                  <Trash2 size={13} />
                  <span>{lang === 'bn' ? 'খালি' : 'Clear'}</span>
                </button>
              )}
            </div>
          </div>


          {/* Cart Items List */}
          {cart.length === 0 ? (
            <div
              className="glass-card"
              style={{
                padding: '3rem 1rem',
                textAlign: 'center',
                borderRadius: '16px',
                color: 'var(--text-muted)'
              }}
            >
              <ShoppingCart size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)' }}>
                {lang === 'bn' ? 'কার্ট সম্পূর্ণ ফাঁকা!' : 'Cart is Empty!'}
              </div>
              <p style={{ fontSize: '0.8rem', margin: '6px 0 16px' }}>
                {lang === 'bn' ? 'পণ্য সম্ভার থেকে পণ্য বেছে নিন' : 'Select items from products tab'}
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('catalog')}
                className="btn btn-primary"
                style={{ padding: '8px 20px', fontSize: '0.85rem', fontWeight: '700', borderRadius: '10px' }}
              >
                পণ্য সম্ভারে যান →
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Digital Kitchen / Order Token Banner */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 12px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(16, 185, 129, 0.12))',
                  border: '1px solid rgba(99, 102, 241, 0.3)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1rem' }}>🎟️</span>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700' }}>
                      {lang === 'bn' ? 'অর্ডার / কিচেন টোকেন' : 'Digital Order Token'}
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '900', color: '#6366f1', fontFamily: 'var(--font-mono)' }}>
                      #TK-{String((salesHistory?.length || 0) + 1).padStart(3, '0')}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700' }}>
                  🕒 {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {cart.map((item) => (
                <div
                  key={item.id}
                  className="glass-card"
                  style={{
                    padding: '0.75rem',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    background: item.isReturn ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-secondary)',
                    border: item.isReturn ? '1px dashed #ef4444' : '1px solid var(--border-color)'
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ fontSize: '0.86rem', fontWeight: '800', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.name}
                      </div>
                      {item.isReturn && (
                        <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.64rem', fontWeight: '800', padding: '1px 5px', borderRadius: '4px', flexShrink: 0 }}>
                          {lang === 'bn' ? 'ফেরত' : 'RETURN'}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                      <span>৳{item.sellPrice} / {item.unit || 'পিস'}</span>
                      <button
                        type="button"
                        onClick={() => handleToggleReturn(item.id)}
                        style={{
                          background: item.isReturn ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                          border: '1px solid ' + (item.isReturn ? '#ef4444' : 'var(--border-color)'),
                          color: item.isReturn ? '#ef4444' : 'var(--text-muted)',
                          fontSize: '0.66rem',
                          fontWeight: '700',
                          padding: '1px 5px',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px'
                        }}
                        title={lang === 'bn' ? 'পণ্য ফেরত / ড্যামেজ হিসেবে অ্যাডজাস্ট করুন' : 'Toggle return adjustment'}
                      >
                        <RotateCcw size={10} />
                        <span>{item.isReturn ? (lang === 'bn' ? 'ফেরত বাতিল' : 'Undo Return') : (lang === 'bn' ? 'ফেরত?' : 'Return?')}</span>
                      </button>
                    </div>
                  </div>

                  {/* Quantity Stepper (Large Touch Targets) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => {
                        playButtonClick();
                        if (item.qty > 1) {
                          updateCartQty(item.id, item.qty - 1);
                        } else {
                          removeFromCart(item.id);
                        }
                      }}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-main)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <Minus size={14} />
                    </button>

                    <span style={{ fontSize: '0.92rem', fontWeight: '800', minWidth: '22px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                      {item.qty}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        playCartPop();
                        updateCartQty(item.id, item.qty + 1);
                      }}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'var(--business-primary)',
                        border: 'none',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Item Total Price */}
                  <div style={{ fontSize: '0.92rem', fontWeight: '800', color: item.isReturn ? '#ef4444' : '#10b981', minWidth: '60px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                    {item.isReturn ? '-' : ''}৳{(item.sellPrice * item.qty).toLocaleString()}
                  </div>
                </div>
              ))}

              {/* Customer Selector */}
              <div
                className="glass-card"
                style={{
                  padding: '0.75rem',
                  borderRadius: '12px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  👤 কাস্টমার নির্বাচন:
                </label>
                <select
                  className="input-field"
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  style={{ width: '100%', height: '38px', fontSize: '0.84rem', borderRadius: '8px' }}
                >
                  <option value="">সাধারণ ক্রেতা (Walk-in Customer)</option>
                  {(customers || []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ''} {c.due > 0 ? `[বাকি: ৳${c.due}]` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Methods (Large Touch Pills) */}
              <div
                className="glass-card"
                style={{
                  padding: '0.75rem',
                  borderRadius: '12px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  💳 পরিশোধের মাধ্যম:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                  {[
                    { id: 'cash', label: 'নগদ', icon: '💵', color: '#10b981' },
                    { id: 'bkash', label: 'বিকাশ', icon: '📱', color: '#ec4899' },
                    { id: 'card', label: 'কার্ড', icon: '💳', color: '#3b82f6' },
                    { id: 'due', label: 'বাকি', icon: '📝', color: '#f59e0b' }
                  ].map((pm) => {
                    const isSelected = paymentMethod === pm.id;
                    return (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => {
                          hapticFeedback.light();
                          setPaymentMethod(pm.id);
                        }}
                        style={{
                          padding: '8px 4px',
                          borderRadius: '8px',
                          border: isSelected ? `2px solid ${pm.color}` : '1px solid var(--border-color)',
                          background: isSelected ? `${pm.color}20` : 'transparent',
                          color: isSelected ? pm.color : 'var(--text-main)',
                          fontSize: '0.75rem',
                          fontWeight: '800',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '2px'
                        }}
                      >
                        <span style={{ fontSize: '1rem' }}>{pm.icon}</span>
                        <span>{pm.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Cash Helper (৳100, ৳500, ৳1000, ৳2000, Exact) */}
              {paymentMethod === 'cash' && (
                <div
                  className="glass-card"
                  style={{
                    padding: '0.75rem',
                    borderRadius: '12px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                      💵 ক্যাশ গ্রহণ (নোট বা বোতাম চাপুন):
                    </span>
                    {Number(cashReceived) >= grandTotal && Number(cashReceived) > 0 && (
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#10b981' }}>
                          ফেরত: ৳{(Number(cashReceived) - grandTotal).toLocaleString()}
                        </span>
                        {noteBreakdown.length > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '3px', flexWrap: 'wrap', marginTop: '2px' }}>
                            {noteBreakdown.map((nb, i) => (
                              <span
                                key={i}
                                style={{
                                  background: 'rgba(16, 185, 129, 0.15)',
                                  border: '1px solid rgba(16, 185, 129, 0.35)',
                                  color: '#10b981',
                                  padding: '1px 4px',
                                  borderRadius: '4px',
                                  fontSize: '0.66rem',
                                  fontWeight: '800',
                                  fontFamily: 'var(--font-mono)'
                                }}
                              >
                                ৳{nb.note}×{nb.count}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {[
                      { label: 'সঠিক টাকা', val: grandTotal },
                      { label: '৳১০০', val: 100 },
                      { label: '৳৫০০', val: 500 },
                      { label: '৳১,০০০', val: 1000 },
                      { label: '৳২,০০০', val: 2000 }
                    ].map((note, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          hapticFeedback.light();
                          playButtonClick();
                          setCashReceived(String(note.val));
                        }}
                        style={{
                          flex: '1 1 auto',
                          minWidth: '55px',
                          padding: '6px 8px',
                          borderRadius: '8px',
                          border: Number(cashReceived) === note.val ? '2px solid #10b981' : '1px solid var(--border-color)',
                          background: Number(cashReceived) === note.val ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-primary)',
                          color: Number(cashReceived) === note.val ? '#10b981' : 'var(--text-main)',
                          fontSize: '0.78rem',
                          fontWeight: '800',
                          cursor: 'pointer'
                        }}
                      >
                        {note.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Discount Input */}
              <div
                className="glass-card"
                style={{
                  padding: '0.65rem 0.75rem',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                  ডিসকাউন্ট (টাকা):
                </span>
                {posPerms.allowCashierDiscount === false ? (
                  <span style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-muted)', background: 'rgba(239, 68, 68, 0.1)', padding: '4px 8px', borderRadius: '6px' }}>
                    🔒 বন্ধ
                  </span>
                ) : (
                  <input
                    type="number"
                    placeholder="০"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                    style={{
                      width: '90px',
                      height: '32px',
                      textAlign: 'right',
                      padding: '4px 8px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-main)',
                      fontSize: '0.85rem',
                      fontWeight: '800'
                    }}
                  />
                )}
              </div>

              {/* Order Summary Breakdown Box */}
              <div
                className="glass-card"
                style={{
                  padding: '0.85rem',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(16, 185, 129, 0.08))',
                  border: '1.5px solid var(--border-color)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  <span>সাবটোটাল:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700' }}>৳{subtotal.toLocaleString()}</span>
                </div>

                {discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#ef4444', marginBottom: '4px' }}>
                    <span>ডিসকাউন্ট:</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700' }}>-৳{discount.toLocaleString()}</span>
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '1.15rem',
                    fontWeight: '800',
                    color: 'var(--text-main)',
                    paddingTop: '6px',
                    borderTop: '1px solid var(--border-color)',
                    marginTop: '4px'
                  }}
                >
                  <span>সর্বমোট বিল:</span>
                  <span style={{ color: '#10b981', fontFamily: 'var(--font-mono)' }}>৳{grandTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Digital Memo Dispatcher Button (WhatsApp & SMS) */}
              {posPerms.showDigitalMemo !== false && (
                <button
                  type="button"
                  onClick={() => {
                    hapticFeedback.light();
                    setShowDigitalMemoModal(true);
                  }}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '12px',
                    border: '1.5px solid #25D366',
                    background: 'rgba(37, 211, 102, 0.12)',
                    color: '#25D366',
                    fontWeight: '800',
                    fontSize: '0.84rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    marginBottom: '8px'
                  }}
                >
                  <span>📱 WhatsApp / SMS ডিজিটাল মেমো পাঠান</span>
                </button>
              )}

              {/* Big Touch Checkout Button */}
              <button
                type="button"
                onClick={handleCheckout}
                className="btn btn-primary press-scale"
                style={{
                  width: '100%',
                  padding: '14px',
                  fontSize: '1.05rem',
                  fontWeight: '800',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #4f46e5, #10b981)',
                  boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  marginBottom: '20px'
                }}
              >
                <CheckCircle2 size={22} />
                <span>✓ ৳{grandTotal.toLocaleString()} বিক্রি সম্পন্ন করুন</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: RECALL HELD CARTS MODAL */}

      {showRecallModal && (
        <div className="modal-overlay animate-fade-in" style={{ zIndex: 1100 }}>
          <div
            className="glass-card modal-container"
            style={{
              maxWidth: '460px',
              width: '92%',
              padding: '1.25rem',
              borderRadius: '16px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              maxHeight: '85vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <History size={18} style={{ color: '#10b981' }} />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  {lang === 'bn' ? `হোল্ড করা কার্ট তালিকা (${heldCarts.length})` : `Held Carts (${heldCarts.length})`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRecallModal(false)}
                className="btn-icon"
                style={{ width: '28px', height: '28px' }}
              >
                <X size={16} />
              </button>
            </div>

            {heldCarts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-dim)' }}>
                <History size={36} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: '0.85rem' }}>
                  {lang === 'bn' ? 'বর্তমানে কোনো হোল্ড করা কার্ট নেই।' : 'No carts on hold.'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {heldCarts.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '12px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                        ⏰ {item.date} {item.time}
                      </span>
                      <span style={{ fontSize: '0.92rem', fontWeight: '800', color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                        ৳{(item.totalAmount || 0).toLocaleString()}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.78rem', color: 'var(--text-main)', fontWeight: '600' }}>
                      {item.totalQty} টি পণ্য • {item.items.slice(0, 3).map(i => i.name).join(', ')}{item.items.length > 3 ? '...' : ''}
                    </div>

                    {item.customer && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--business-primary)', fontWeight: '700' }}>
                        👤 কাস্টমার: {item.customer}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <button
                        type="button"
                        onClick={() => handleRecallCart(item)}
                        className="btn btn-primary"
                        style={{ flex: 1, padding: '7px 10px', fontSize: '0.78rem', fontWeight: '800', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                      >
                        <RotateCcw size={13} />
                        <span>{lang === 'bn' ? 'কার্টে ফিরিয়ে আনুন (Recall)' : 'Recall to Cart'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteHeldCart(item.id)}
                        className="btn-icon"
                        style={{ color: '#ef4444', width: '32px', height: '32px', borderRadius: '8px' }}
                        title="মুছে ফেলুন"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: CASH DRAWER FLOAT RECONCILIATION MODAL */}
      {showDrawerFloatModal && (
        <div className="modal-overlay animate-fade-in" style={{ zIndex: 1100 }}>
          <div
            className="glass-card modal-container"
            style={{
              maxWidth: '460px',
              width: '92%',
              padding: '1.25rem',
              borderRadius: '16px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              maxHeight: '85vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Banknote size={18} style={{ color: '#10b981' }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)' }}>
                    {lang === 'bn' ? 'ক্যাশ ড্রয়ার হিসাব ও রিকনসিলিয়েশন' : 'Cash Drawer Reconciliation'}
                  </h3>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {activeCounter?.name || 'কাউন্টার ০১'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDrawerFloatModal(false)}
                className="btn-icon"
                style={{ width: '28px', height: '28px' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Cash Float Breakdown Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--bg-primary)', borderRadius: '10px', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>🌅 সকালের প্রারম্ভিক ক্যাশ (Opening Float):</span>
                <span style={{ fontWeight: '800', fontFamily: 'var(--font-mono)' }}>৳{openingFloat.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '10px', fontSize: '0.82rem' }}>
                <span style={{ color: '#10b981' }}>🛒 আজকের নগদ বিক্রয় (Cash Sales):</span>
                <span style={{ fontWeight: '800', color: '#10b981', fontFamily: 'var(--font-mono)' }}>+৳{todayCashSales.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(59, 130, 246, 0.08)', borderRadius: '10px', fontSize: '0.82rem' }}>
                <span style={{ color: '#3b82f6' }}>📥 ড্রয়ারে ক্যাশ জমা (Deposits):</span>
                <span style={{ fontWeight: '800', color: '#3b82f6', fontFamily: 'var(--font-mono)' }}>+৳{totalCashDeposited.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '10px', fontSize: '0.82rem' }}>
                <span style={{ color: '#ef4444' }}>📤 ড্রয়ার থেকে ক্যাশ উত্তোলন (Withdrawals):</span>
                <span style={{ fontWeight: '800', color: '#ef4444', fontFamily: 'var(--font-mono)' }}>-৳{totalCashWithdrawn.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'var(--bg-primary)', borderRadius: '10px', fontSize: '0.92rem', fontWeight: '800', border: '1.5px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-main)' }}>🎯 ড্রয়ারে প্রত্যাশিত ক্যাশ (Expected):</span>
                <span style={{ color: 'var(--business-primary)', fontFamily: 'var(--font-mono)' }}>৳{expectedDrawerCash.toLocaleString()}</span>
              </div>
            </div>

            {/* Actual Physical Cash Count Input */}
            <div style={{ padding: '12px', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '6px' }}>
                {lang === 'bn' ? 'ড্রয়ারে গুনে পাওয়া প্রকৃত নগদ টাকা (Physical Count):' : 'Actual Cash in Drawer:'}
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: '800', color: 'var(--text-muted)' }}>৳</span>
                <input
                  type="number"
                  className="input-field"
                  placeholder={lang === 'bn' ? 'টাকার পরিমাণ লিখুন...' : 'Enter actual counted cash...'}
                  value={actualDrawerCashInput}
                  onChange={(e) => setActualDrawerCashInput(e.target.value)}
                  style={{ width: '100%', paddingLeft: '28px', height: '42px', fontSize: '1rem', fontWeight: '800' }}
                />
              </div>

              {/* Live Reconciliation Discrepancy Box */}
              {actualCountNum !== null && (
                <div
                  style={{
                    marginTop: '10px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.84rem',
                    fontWeight: '800',
                    background: drawerDiscrepancy === 0 ? 'rgba(16, 185, 129, 0.15)' : drawerDiscrepancy > 0 ? 'rgba(59, 130, 246, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: drawerDiscrepancy === 0 ? '#10b981' : drawerDiscrepancy > 0 ? '#3b82f6' : '#ef4444',
                    border: `1px solid ${drawerDiscrepancy === 0 ? '#10b981' : drawerDiscrepancy > 0 ? '#3b82f6' : '#ef4444'}`
                  }}
                >
                  <span>
                    {drawerDiscrepancy === 0
                      ? (lang === 'bn' ? '✓ ক্যাশ সম্পূর্ণ মিলেছে!' : '✓ Perfect match!')
                      : drawerDiscrepancy > 0
                      ? (lang === 'bn' ? 'উদ্বৃত্ত (Surplus):' : 'Surplus:')
                      : (lang === 'bn' ? 'ঘাটতি (Shortage):' : 'Shortage:')}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>
                    {drawerDiscrepancy > 0 ? `+৳${drawerDiscrepancy.toLocaleString()}` : `৳${drawerDiscrepancy.toLocaleString()}`}
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                hapticFeedback.success();
                setShowDrawerFloatModal(false);
                if (showToast) {
                  showToast(lang === 'bn' ? 'ক্যাশ ড্রয়ার হিসাব যাচাই সম্পন্ন!' : 'Cash drawer verified!', 'success');
                }
              }}
              className="btn btn-primary"
              style={{ width: '100%', padding: '10px', borderRadius: '10px', fontWeight: '800', fontSize: '0.9rem' }}
            >
              ✓ {lang === 'bn' ? 'যাচাই সম্পন্ন' : 'Done Verification'}
            </button>
          </div>
        </div>
      )}

      {/* Digital Memo Share Modal (WhatsApp & SMS) */}
      {showDigitalMemoModal && (
        <DigitalMemoShareModal
          isOpen={showDigitalMemoModal}
          onClose={() => setShowDigitalMemoModal(false)}
          saleData={{
            cart,
            subtotal,
            discount,
            grandTotal,
            paidAmount: grandTotal,
            customerPhone: activeCustomer?.phone
          }}
          businessSettings={{
            shopName: activeBranch?.name || 'হিসাবকিতাব ৩৬০'
          }}
          customer={activeCustomer}
          lang={lang}
        />
      )}

      {/* QUICK TOOLS & TERMINAL CONTROL MODAL / DRAWER */}
      {showToolsModal && (
        <div className="modal-overlay animate-fade-in" style={{ zIndex: 1100 }}>
          <div
            className="glass-card modal-container"
            style={{
              maxWidth: '480px',
              width: '94%',
              padding: '1.15rem',
              borderRadius: '18px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              maxHeight: '88vh',
              overflowY: 'auto',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--business-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <SlidersHorizontal size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)' }}>
                    {lang === 'bn' ? 'পস টুলস ও টার্মিনাল কন্ট্রোল' : 'POS Tools & Terminals'}
                  </h3>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    🏢 {activeBranch?.name || 'প্রধান শাখা'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowToolsModal(false)}
                className="btn-icon"
                style={{ width: '28px', height: '28px', borderRadius: '8px' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* SECTION 1: BUSINESS TERMINAL & CASHIER MANAGEMENT */}
            <div style={{ padding: '12px', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#10b981', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Monitor size={14} />
                  <span>{lang === 'bn' ? 'টার্মিনাল ও কাউন্টার সেটিংস:' : 'Terminal & Counter Setup:'}</span>
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  {branchCounters.length} {lang === 'bn' ? 'টি কাউন্টার' : 'Counters'}
                </span>
              </div>

              {/* Active Counter Details */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.25)', marginBottom: '10px' }}>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🖥️ {activeCounter?.name || 'কাউন্টার ০১'}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: '#10b981', fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.2)', padding: '1px 5px', borderRadius: '4px' }}>
                      {activeCounter?.code || 'POS-01'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <User size={12} style={{ color: '#818cf8' }} />
                    <span>{lang === 'bn' ? 'ক্যাশিয়ার:' : 'Cashier:'} <strong style={{ color: 'var(--text-main)' }}>{assignedCashierName}</strong></span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{lang === 'bn' ? 'প্রারম্ভিক ক্যাশ' : 'Float'}</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                    ৳{(activeCounter?.openingFloat || 1000).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Configured Counters Switcher Chips */}
              {branchCounters.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                    {lang === 'bn' ? 'কাউন্টারে সুইচ করুন (১-ট্যাপ):' : 'Switch Counter:'}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {branchCounters.map((cnt) => {
                      const isSelected = cnt.id === activeCounter?.id;
                      return (
                        <button
                          key={`modal-cnt-${cnt.id}`}
                          type="button"
                          onClick={() => handleSelectCounter(cnt.id)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '8px',
                            border: isSelected ? '1.5px solid #10b981' : '1px solid var(--border-color)',
                            background: isSelected ? 'linear-gradient(135deg, #10b981, #059669)' : 'var(--bg-secondary)',
                            color: isSelected ? '#ffffff' : 'var(--text-main)',
                            fontSize: '0.74rem',
                            fontWeight: '800',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            boxShadow: isSelected ? '0 0 8px rgba(16, 185, 129, 0.4)' : 'none',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <Monitor size={12} />
                          <span>{cnt.code || cnt.name}</span>
                          {cnt.assignedCashierName && (
                            <span style={{ fontSize: '0.67rem', opacity: isSelected ? 0.9 : 0.65 }}>
                              ({cnt.assignedCashierName})
                            </span>
                          )}
                          {isSelected && <Check size={12} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Owner Action: Add New Counter Button */}
              {isOwner && (
                <button
                  type="button"
                  onClick={() => {
                    setShowToolsModal(false);
                    setShowTerminalSetupModal(true);
                  }}
                  className="btn btn-secondary"
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1.5px dashed rgba(99, 102, 241, 0.5)',
                    background: 'rgba(99, 102, 241, 0.08)',
                    color: 'var(--business-primary)',
                    fontSize: '0.76rem',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <PlusCircle size={14} />
                  <span>{lang === 'bn' ? '+ নতুন কাউন্টার তৈরি ও ক্যাশিয়ার অ্যাসাইন করুন' : '+ Add New Counter & Assign Cashier'}</span>
                </button>
              )}
            </div>

            {/* SECTION 2: TODAY LIVE SALES SUMMARY */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.12), rgba(99, 102, 241, 0.12))',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '12px',
                marginBottom: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={16} style={{ color: '#10b981' }} />
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700' }}>
                    {lang === 'bn' ? 'আজকের মোট বিক্রয়' : "Today's Sales"}
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: '900', color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                    ৳{todaySalesTotal.toLocaleString()}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: '800', padding: '3px 8px', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--business-primary)' }}>
                  {todaySalesCount} {lang === 'bn' ? 'টি মেমো' : 'Invoices'}
                </span>
              </div>
            </div>

            {/* SECTION 3: QUICK UTILITY TOOLS GRID */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-muted)' }}>
                {lang === 'bn' ? 'ইউটিলিটি ও হার্ডওয়্যার টুলস:' : 'Utility & Hardware Tools:'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {/* Desktop View Switch (PC Mode) */}
                {onSwitchToDesktop && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowToolsModal(false);
                      onSwitchToDesktop();
                    }}
                    style={{
                      padding: '9px 10px',
                      borderRadius: '10px',
                      border: '1px solid rgba(99, 102, 241, 0.35)',
                      background: 'rgba(99, 102, 241, 0.12)',
                      color: 'var(--business-primary)',
                      fontSize: '0.74rem',
                      fontWeight: '800',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <LayoutGrid size={15} />
                    <span>{lang === 'bn' ? '🖥️ পিসি মোড' : 'PC Desktop View'}</span>
                  </button>
                )}

                {/* Cash Drawer Reconciliation */}
                {posPerms.showCashDrawer !== false && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowToolsModal(false);
                      setShowDrawerFloatModal(true);
                    }}
                    style={{
                      padding: '9px 10px',
                      borderRadius: '10px',
                      border: '1px solid rgba(16, 185, 129, 0.35)',
                      background: 'rgba(16, 185, 129, 0.12)',
                      color: '#10b981',
                      fontSize: '0.74rem',
                      fontWeight: '800',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Banknote size={15} />
                    <span>{lang === 'bn' ? '💵 ক্যাশ ড্রয়ার' : 'Cash Drawer'}</span>
                  </button>
                )}

                {/* Held Carts */}
                {posPerms.showHoldCart !== false && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowToolsModal(false);
                      setShowRecallModal(true);
                    }}
                    style={{
                      padding: '9px 10px',
                      borderRadius: '10px',
                      border: heldCarts.length > 0 ? '1px solid #f59e0b' : '1px solid var(--border-color)',
                      background: heldCarts.length > 0 ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-primary)',
                      color: heldCarts.length > 0 ? '#f59e0b' : 'var(--text-main)',
                      fontSize: '0.74rem',
                      fontWeight: '800',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <History size={15} />
                    <span>{lang === 'bn' ? `⏳ হোল্ড (${heldCarts.length})` : `Held (${heldCarts.length})`}</span>
                  </button>
                )}

                {/* Soundbox Speaker Toggle */}
                {posPerms.showSoundbox !== false && (
                  <button
                    type="button"
                    onClick={() => setSoundboxActive(!soundboxActive)}
                    style={{
                      padding: '9px 10px',
                      borderRadius: '10px',
                      border: soundboxActive ? '1px solid #10b981' : '1px solid var(--border-color)',
                      background: soundboxActive ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-primary)',
                      color: soundboxActive ? '#10b981' : 'var(--text-muted)',
                      fontSize: '0.74rem',
                      fontWeight: '800',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    {soundboxActive ? <Volume2 size={15} /> : <VolumeX size={15} />}
                    <span>{soundboxActive ? (lang === 'bn' ? '🔊 সাউন্ড অন' : 'Sound On') : (lang === 'bn' ? '🔇 সাউন্ড অফ' : 'Mute')}</span>
                  </button>
                )}

                {/* Customer Display Mirror */}
                {posPerms.showCustomerMirror !== false && (
                  <button
                    type="button"
                    onClick={() => {
                      window.open('/?view=customer_mirror', '_blank');
                    }}
                    style={{
                      padding: '9px 10px',
                      borderRadius: '10px',
                      border: '1px solid rgba(99, 102, 241, 0.35)',
                      background: 'rgba(99, 102, 241, 0.12)',
                      color: 'var(--business-primary)',
                      fontSize: '0.74rem',
                      fontWeight: '800',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Monitor size={15} />
                    <span>{lang === 'bn' ? '🪞 মিরর ডিসপ্লে' : 'Customer Mirror'}</span>
                  </button>
                )}

                {/* Screen Wake Lock */}
                {posPerms.showWakeLock !== false && (
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <ScreenWakeLockToggle lang={lang} showToast={showToast} />
                  </div>
                )}
              </div>

              {/* Network Latency Indicator */}
              <div style={{ marginTop: '4px' }}>
                <NetworkQualityIndicator lang={lang} />
              </div>
            </div>

            {/* SECTION 4: ADAPTIVE POS MODE & INDUSTRY VARIATIONS */}
            <div style={{ padding: '10px', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '10px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '8px' }}>
                {lang === 'bn' ? 'ইন্ডাস্ট্রি ও পস মোড ভ্যারিয়েশন:' : 'Industry & POS Variations:'}
              </div>
              <AdaptivePosSwitcherBar
                activeEngine={activePosEngine}
                onSwitchEngine={onSwitchPosEngine}
                activeIndustryId={activeIndustryId}
                onOpenTemplateManager={onOpenTemplateManager}
                onBackToDashboard={handleExit}
              />
              <div style={{ marginTop: '6px' }}>
                <IndustryVariationsBar
                  orderType={orderType}
                  setOrderType={setOrderType}
                  selectedTable={selectedTable}
                  setSelectedTable={setSelectedTable}
                  selectedWaiter={selectedWaiter}
                  setSelectedWaiter={setSelectedWaiter}
                  cart={cart}
                  onOpenTemplateManager={onOpenTemplateManager}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowToolsModal(false)}
              className="btn btn-secondary"
              style={{ width: '100%', padding: '9px', borderRadius: '10px', fontWeight: '800', fontSize: '0.86rem' }}
            >
              ✕ {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
            </button>
          </div>
        </div>
      )}

      {/* MODAL: BUSINESS OWNER COUNTER & CASHIER SETUP */}
      {showTerminalSetupModal && (
        <div className="modal-overlay animate-fade-in" style={{ zIndex: 1200 }}>
          <div
            className="glass-card modal-container"
            style={{
              maxWidth: '440px',
              width: '92%',
              padding: '1.25rem',
              borderRadius: '18px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Monitor size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)' }}>
                    {lang === 'bn' ? 'নতুন কাউন্টার ও ক্যাশিয়ার সেটআপ' : 'New Counter & Cashier'}
                  </h3>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    🏢 {activeBranch?.name || 'প্রধান শাখা'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTerminalSetupModal(false)}
                className="btn-icon"
                style={{ width: '28px', height: '28px', borderRadius: '8px' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateCounter} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px' }}>
                  {lang === 'bn' ? 'কাউন্টারের নাম (উদা: কাউন্টার ০২ - এক্সপ্রেস ক্যাশ):' : 'Counter Name:'}
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder={lang === 'bn' ? 'কাউন্টারের নাম লিখুন...' : 'Enter counter name...'}
                  value={newCounterName}
                  onChange={(e) => setNewCounterName(e.target.value)}
                  style={{ width: '100%', height: '40px', fontSize: '0.88rem', fontWeight: '700' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px' }}>
                    {lang === 'bn' ? 'টার্মিনাল কোড:' : 'Terminal Code:'}
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="POS-02"
                    value={newCounterCode}
                    onChange={(e) => setNewCounterCode(e.target.value)}
                    style={{ width: '100%', height: '40px', fontSize: '0.88rem', fontWeight: '700', fontFamily: 'var(--font-mono)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px' }}>
                    {lang === 'bn' ? 'প্রারম্ভিক ক্যাশ (Float):' : 'Opening Float:'}
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="1000"
                    value={newCounterFloat}
                    onChange={(e) => setNewCounterFloat(e.target.value)}
                    style={{ width: '100%', height: '40px', fontSize: '0.88rem', fontWeight: '700', fontFamily: 'var(--font-mono)' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px' }}>
                  {lang === 'bn' ? 'দায়িত্বপ্রাপ্ত ক্যাশিয়ারের নাম:' : 'Assigned Cashier Name:'}
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder={lang === 'bn' ? 'ক্যাশিয়ারের নাম লিখুন...' : 'Enter cashier name...'}
                  value={newCounterCashier}
                  onChange={(e) => setNewCounterCashier(e.target.value)}
                  style={{ width: '100%', height: '40px', fontSize: '0.88rem', fontWeight: '700' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowTerminalSetupModal(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '10px', borderRadius: '10px', fontWeight: '800', fontSize: '0.86rem' }}
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 2, padding: '10px', borderRadius: '10px', fontWeight: '800', fontSize: '0.88rem' }}
                >
                  ✓ {lang === 'bn' ? 'কাউন্টার সংরক্ষণ করুন' : 'Save Counter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

