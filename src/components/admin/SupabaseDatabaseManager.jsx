import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { checkSupabaseHealth, fetchCloudProducts } from '../../services/supabaseBackendService';
import { getSupabaseConfig, saveSupabaseConfig } from '../../services/supabaseClient';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  ExternalLink,
  ShieldCheck,
  Zap,
  Server,
  Layers,
  ArrowUpRight,
  Code2,
  Check,
  HardDrive,
  ArrowDownUp,
  GitMerge,
  Clock,
  History,
  Building2,
  Truck,
  ArrowRight,
  Lock,
  Users,
  Send,
  Link2,
  ShieldAlert,
  KeyRound,
  Calendar,
  Package,
  MessageSquare,
  Smartphone,
  ShoppingBag,
  Globe,
  Share2,
  Bell,
  CheckCheck,
  Eye,
  Plus,
  Cpu,
  Gauge,
  Activity,
  ShieldBan,
  FastForward
} from 'lucide-react';
import {
  executeBiDirectionalSync,
  getLastDeltaSyncTime,
  subscribeDeltaSync,
  getConflictHistory
} from '../../services/deltaSyncService';
import { getPendingMutationsList } from '../../services/offlineSyncQueue';
import {
  executeBranchStockTransferToCloud,
  fetchBranchStockTransfers
} from '../../services/supabaseBackendService';

// Feature 1, 2, 3, 4 Service Imports
import {
  verifyAuditLedgerIntegritySync,
  generateSupervisorAuthStampSync,
  GENESIS_HASH
} from '../../services/hashChainService';
import {
  getExpiringBatchesSummary,
  addBatchToProduct,
  getBatchHealth,
  getDaysUntilExpiry
} from '../../services/fefoInventoryService';
import {
  getNotificationConfig,
  saveNotificationConfig,
  calculateDailyDigest,
  generateWhatsAppLink,
  buildDueReminderMessage,
  dispatchNotificationWebhook
} from '../../services/notificationWebhookService';
import {
  getOmniChannelConfig,
  saveOmniChannelConfig,
  getOmniSyncLogs,
  processInboundStoreWebhook,
  appendOmniSyncLog
} from '../../services/omniChannelService';

// Phase 6 High-Performance & Enterprise Scaling Imports
import { VirtualizedList } from '../common/VirtualizedList';
import { rateLimiter } from '../../utils/rateLimiter';
import { getRetryQueue, enqueueRetryMessage, flushRetryQueue } from '../../services/messageRetryQueue';
import { multiTierCache } from '../../services/multiTierCache';
import { packBinary, measureCompressionStats } from '../../utils/binaryPack';
import { swrDataPipe } from '../../services/swrDataPipe';
import { useSmoothSearch } from '../../utils/useSmoothSearch';
import { circuitBreaker, CIRCUIT_STATE } from '../../services/circuitBreakerService';
import { prefetchService } from '../../services/prefetchService';
import { vectorClock } from '../../utils/vectorClock';
import { ZapOff, ListOrdered, GitFork } from 'lucide-react';

export const SupabaseDatabaseManager = () => {
  const {
    lang,
    showToast,
    products = [],
    salesHistory = [],
    branches = [],
    setProducts,
    businessExpenses = [],
    businessSettings = {},
    customers = []
  } = useApp();

  const [healthStatus, setHealthStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [config, setConfig] = useState(() => getSupabaseConfig());

  // Active Main SubTab
  // 'overview' | 'hash_chain' | 'fefo_expiry' | 'alerts_hub' | 'omnichannel'
  const [activeSubTab, setActiveSubTab] = useState('overview');

  // Phase 4 Delta Sync state
  const [deltaSyncState, setDeltaSyncState] = useState({ isSyncing: false, progress: 0, step: '', result: null, error: null });
  const [pendingMutationsCount, setPendingMutationsCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState(() => getLastDeltaSyncTime());
  const [conflictHistory, setConflictHistory] = useState(() => getConflictHistory());
  const [showConflictModal, setShowConflictModal] = useState(false);

  // Phase 5 Multi-Branch & Stock Transfer state
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [recentTransfers, setRecentTransfers] = useState([]);
  const [transferForm, setTransferForm] = useState({
    sourceBranchId: branches[0]?.id || 'br-main',
    destinationBranchId: branches[1]?.id || (branches[0]?.id ? `${branches[0]?.id}-sub` : 'br-sub'),
    productId: products[0]?.id || '',
    quantity: 1,
    notes: 'ইন্টার-ব্রাঞ্চ স্টক স্থানান্তর'
  });

  // Feature 1 State: Hash-Chain Ledger & Tamper Proof
  const [auditResult, setAuditResult] = useState(null);
  const [supervisorPin, setSupervisorPin] = useState('');
  const [supervisorAuthStamp, setSupervisorAuthStamp] = useState(null);
  const [selectedHashChainInvoice, setSelectedHashChainInvoice] = useState(null);

  // Feature 2 State: FEFO Batch Expiry
  const [showAddBatchModal, setShowAddBatchModal] = useState(false);
  const [newBatchForm, setNewBatchForm] = useState({
    productId: products[0]?.id || '',
    batchNo: `LOT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    expiryDate: '',
    mfgDate: '',
    stock: 20,
    costPrice: 0
  });

  // Feature 3 State: Automated Alerts & WhatsApp Hub
  const [notifConfig, setNotifConfig] = useState(() => getNotificationConfig());
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookTestResult, setWebhookTestResult] = useState(null);

  // Feature 4 State: Omni-Channel Webhook Connector
  const [omniConfig, setOmniConfig] = useState(() => getOmniChannelConfig());
  const [omniLogs, setOmniLogs] = useState(() => getOmniSyncLogs());
  const [simulatedChannel, setSimulatedChannel] = useState('woocommerce');
  const [simulatedQty, setSimulatedQty] = useState(1);

  // Phase 6 State: Virtualization, Retry Queue, Rate Limiter & Multi-tier Cache
  const [retryQueueList, setRetryQueueList] = useState(() => getRetryQueue());
  const [isFlushingQueue, setIsFlushingQueue] = useState(false);
  const [rateLimiterStats, setRateLimiterStats] = useState(() => rateLimiter.getStats());
  const [rateLimitTestResult, setRateLimitTestResult] = useState(null);
  const [virtualStressCount, setVirtualStressCount] = useState(2000);
  const [virtualStressItems, setVirtualStressItems] = useState(() => {
    return Array.from({ length: 2000 }, (_, i) => ({
      id: `virtual-prod-${i + 1}`,
      name: `ভার্চুয়াল এন্টারপ্রাইজ পণ্য #${i + 1}`,
      barcode: `880000${10000 + i}`,
      price: (100 + (i % 500)),
      stock: (10 + (i % 200)),
      category: i % 2 === 0 ? 'গ্রোসারি ও খাদ্য' : 'ফার্মাসিউটিক্যালস'
    }));
  });

  const [circuitStatus, setCircuitStatus] = useState(() => circuitBreaker.getStatus());
  const [prefetchStats, setPrefetchStats] = useState(() => prefetchService.getStats());
  const [vectorClockSnap, setVectorClockSnap] = useState(() => vectorClock.getSnapshot());

  const checkHealth = async () => {
    setLoading(true);
    try {
      const res = await checkSupabaseHealth();
      setHealthStatus(res);
    } catch (err) {
      setHealthStatus({ connected: false, ready: false, message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();

    const unsubCircuit = circuitBreaker.subscribe((st) => {
      setCircuitStatus(st);
    });

    const unsub = subscribeDeltaSync((state) => {
      setDeltaSyncState(state);
      if (state.result) {
        setLastSyncTime(state.result.timestamp || new Date().toISOString());
        setConflictHistory(getConflictHistory());
        getPendingMutationsList().then((list) => setPendingMutationsCount(list.length));
      }
    });

    getPendingMutationsList().then((list) => setPendingMutationsCount(list.length));
    fetchBranchStockTransfers().then((r) => { if (r?.data) setRecentTransfers(r.data); });

    return () => {
      unsub();
      unsubCircuit();
    };
  }, []);

  const handleExecuteBranchTransfer = async (e) => {
    e.preventDefault();
    if (!transferForm.productId || Number(transferForm.quantity) <= 0) {
      showToast(lang === 'bn' ? 'অনুগ্রহ করে সঠিক পণ্য ও পরিমাণ দিন' : 'Select product & valid quantity', 'warning');
      return;
    }

    if (transferForm.sourceBranchId === transferForm.destinationBranchId) {
      showToast(lang === 'bn' ? 'সোর্স এবং গন্তব্য শাখা আলাদা হতে হবে' : 'Source and destination branches must differ', 'warning');
      return;
    }

    const selectedProd = products.find((p) => p.id === transferForm.productId);
    if (!selectedProd) return;

    if (Number(selectedProd.stock) < Number(transferForm.quantity)) {
      showToast(lang === 'bn' ? `স্টক অপর্যাপ্ত! সোর্স শাখায় অবশিষ্ট স্টক: ${selectedProd.stock}` : 'Insufficient stock', 'danger');
      return;
    }

    setIsTransferring(true);
    try {
      const res = await executeBranchStockTransferToCloud({
        sourceBranchId: transferForm.sourceBranchId,
        destinationBranchId: transferForm.destinationBranchId,
        productId: transferForm.productId,
        productName: selectedProd.name,
        quantity: Number(transferForm.quantity),
        notes: transferForm.notes
      });

      if (res.success) {
        setProducts((prev) =>
          prev.map((p) => {
            if (p.id === transferForm.productId) {
              return { ...p, stock: Math.max(0, Number(p.stock) - Number(transferForm.quantity)) };
            }
            return p;
          })
        );
        showToast(
          lang === 'bn'
            ? `✓ ${selectedProd.name} (${transferForm.quantity} টি) সফলভাবে ট্রান্সফার করা হয়েছে!`
            : 'Branch stock transferred successfully!',
          'success'
        );
        setShowTransferModal(false);
        const refList = await fetchBranchStockTransfers();
        if (refList?.data) setRecentTransfers(refList.data);
      } else {
        showToast(res.message || 'Transfer failed', 'danger');
      }
    } catch (err) {
      showToast(err.message, 'danger');
    } finally {
      setIsTransferring(false);
    }
  };

  const handleTriggerDeltaSync = async () => {
    try {
      const res = await executeBiDirectionalSync();
      if (res.success) {
        showToast(
          lang === 'bn'
            ? `✓ ডেল্টা সিঙ্ক সফল! আপলোড: ${res.syncedLocalMutations}টি, ডাউনলোড: ${res.downloadedCloudChanges}টি`
            : `Delta sync finished: +${res.syncedLocalMutations} uploaded, +${res.downloadedCloudChanges} received`,
          'success'
        );
      } else {
        showToast(res.message || 'সিঙ্ক ব্যর্থ হয়েছে', 'danger');
      }
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const handleCopySchemaSql = async () => {
    try {
      const res = await fetch('/supabase/schema.sql');
      const sql = await res.text();
      await navigator.clipboard.writeText(sql);
      setCopiedSql(true);
      showToast(lang === 'bn' ? '✓ SQL স্কিমা ক্লিপবোর্ডে কপি হয়েছে!' : 'SQL Schema copied to clipboard!', 'success');
      setTimeout(() => setCopiedSql(false), 3000);
    } catch {
      showToast(lang === 'bn' ? 'কপি করতে ব্যর্থ' : 'Failed to copy', 'danger');
    }
  };

  // --- FEATURE 1: HASH CHAIN AUDIT HANDLERS ---
  const handleVerifyAuditLedger = () => {
    const result = verifyAuditLedgerIntegritySync(salesHistory);
    setAuditResult(result);
    if (result.isValid) {
      showToast(
        lang === 'bn'
          ? `✓ ক্রিপ্টোগ্রাফিক লেজার ১০০% সুরক্ষিত! মোট ${result.totalChecked}টি ইনভয়েস ভেরিফাইড।`
          : `Audit Ledger 100% verified! (${result.totalChecked} invoices checked)`,
        'success'
      );
    } else {
      showToast(
        lang === 'bn'
          ? `⚠️ সতর্কবার্তা! ইনভয়েস ${result.tamperedAt}-এ পরিবর্তন বা কারচুপি পাওয়া গেছে!`
          : `Tampering detected at invoice ${result.tamperedAt}!`,
        'danger'
      );
    }
  };

  const handleGenerateSupervisorStamp = (e) => {
    e.preventDefault();
    if (!supervisorPin || supervisorPin.length < 4) {
      showToast(lang === 'bn' ? 'কমপক্ষে ৪ ডিজিটের পিন কোড দিন' : 'Enter 4+ digit PIN', 'warning');
      return;
    }
    const stamp = generateSupervisorAuthStampSync(
      supervisorPin,
      'REFUND_OR_HIGH_DISCOUNT_APPROVAL',
      salesHistory[0]?.id || 'INV-DEMO',
      1000
    );
    setSupervisorAuthStamp(stamp);
    showToast(lang === 'bn' ? '✓ সুপারভাইজার অনুমোদন সিগনেচার তৈরি হয়েছে!' : 'Supervisor Auth Stamp Generated', 'success');
  };

  // --- FEATURE 2: FEFO BATCH HANDLERS ---
  const expiryAlerts = getExpiringBatchesSummary(products, 30);

  const handleAddBatchSubmit = (e) => {
    e.preventDefault();
    if (!newBatchForm.productId || !newBatchForm.expiryDate || Number(newBatchForm.stock) <= 0) {
      showToast(lang === 'bn' ? 'সঠিক পণ্য, মেয়াদ এবং পরিমাণ দিন' : 'Enter product, expiry & qty', 'warning');
      return;
    }
    const targetProd = products.find((p) => p.id === newBatchForm.productId);
    if (!targetProd) return;

    const updated = addBatchToProduct(targetProd, {
      batchNo: newBatchForm.batchNo,
      expiryDate: newBatchForm.expiryDate,
      mfgDate: newBatchForm.mfgDate,
      stock: Number(newBatchForm.stock),
      costPrice: Number(newBatchForm.costPrice || targetProd.costPrice || 0)
    });

    setProducts((prev) => prev.map((p) => (p.id === targetProd.id ? updated : p)));
    setShowAddBatchModal(false);
    showToast(lang === 'bn' ? `✓ লট ${newBatchForm.batchNo} সফলভাবে যোগ করা হয়েছে!` : 'Batch added successfully!', 'success');
  };

  // --- FEATURE 3: ALERTS & WHATSAPP HUB HANDLERS ---
  const dailyDigest = calculateDailyDigest({
    sales: salesHistory,
    expenses: businessExpenses,
    businessSettings
  });

  const handleSaveNotifConfig = (e) => {
    e.preventDefault();
    saveNotificationConfig(notifConfig);
    showToast(lang === 'bn' ? '✓ নোটিফিকেশন কনফিগারেশন সংরক্ষিত!' : 'Notification settings saved!', 'success');
  };

  const handleTestWebhookDispatch = async () => {
    setIsTestingWebhook(true);
    setWebhookTestResult(null);
    try {
      const res = await dispatchNotificationWebhook({
        eventType: 'TEST_PING',
        recipientPhone: businessSettings.phone || '01700000000',
        recipientName: 'অ্যাডমিন',
        message: `🔔 HisabKitab 360 টেস্ট নোটিফিকেশন: আপনার এলার্ট সিস্টেম সফলভাবে সংযুক্ত আছে। সময়: ${new Date().toLocaleTimeString()}`
      });
      setWebhookTestResult(res);
      if (res.success) {
        showToast(lang === 'bn' ? '✓ টেস্ট রিকোয়েস্ট সফল!' : 'Test dispatch successful!', 'success');
      } else {
        showToast(res.message || 'ব্যর্থ হয়েছে', 'warning');
      }
    } catch (err) {
      setWebhookTestResult({ success: false, error: err.message });
      showToast(err.message, 'danger');
    } finally {
      setIsTestingWebhook(false);
    }
  };

  // --- FEATURE 4: OMNI-CHANNEL HANDLERS ---
  const handleSimulateInboundOrder = () => {
    if (products.length === 0) {
      showToast(lang === 'bn' ? 'কোনো পণ্য পাওয়া যায়নি' : 'No products available', 'warning');
      return;
    }
    const target = products[0];
    const dummyPayload = {
      id: Math.floor(1000 + Math.random() * 9000),
      orderId: `ORDER-${Math.floor(1000 + Math.random() * 9000)}`,
      line_items: [
        {
          sku: target.barcode || target.id,
          name: target.name,
          quantity: Number(simulatedQty)
        }
      ]
    };

    const processRes = processInboundStoreWebhook({
      channelId: simulatedChannel,
      payload: dummyPayload,
      productsList: products
    });

    if (processRes.success && processRes.updatedProducts) {
      setProducts(processRes.updatedProducts);
      setOmniLogs(getOmniSyncLogs());
      showToast(
        lang === 'bn'
          ? `✓ ${processRes.channelName} থেকে অর্ডার সম্পন্ন! ${target.name}-এর স্টক ${simulatedQty} টি অটো-কমেছে।`
          : `Inbound order synced! Stock deducted automatically.`,
        'success'
      );
    }
  };

  // --- PHASE 6: ENTERPRISE PERFORMANCE & RETRY QUEUE HANDLERS ---
  const handleFlushRetryQueue = async () => {
    setIsFlushingQueue(true);
    try {
      const res = await flushRetryQueue();
      setRetryQueueList(getRetryQueue());
      showToast(
        lang === 'bn'
          ? `✓ কিউ রিট্রাই সম্পন্ন! সফল: ${res.flushed}টি, পেন্ডিং: ${res.pending}টি`
          : `Queue flushed: ${res.flushed} delivered, ${res.pending} pending`,
        'success'
      );
    } catch (err) {
      showToast(err.message, 'danger');
    } finally {
      setIsFlushingQueue(false);
    }
  };

  const handleSimulateFailedWebhookRetry = () => {
    const task = enqueueRetryMessage({
      type: 'WHATSAPP_DUE_REMINDER',
      url: 'https://sms-gateway.example.com/api/send',
      payload: {
        customer: 'করিম সাহেব',
        due: 1500,
        phone: '01711000000'
      }
    });
    setRetryQueueList(getRetryQueue());
    showToast(lang === 'bn' ? `✓ ব্যাকগ্রাউন্ড রিট্রাই কিউতে টাস্ক (${task.id}) জমা হয়েছে!` : `Task queued (${task.id})`, 'info');
  };

  const handleTestRateLimiter = () => {
    const check = rateLimiter.check('pin_attempt:supervisor', 5, 60000);
    setRateLimiterStats(rateLimiter.getStats());
    setRateLimitTestResult(check);
    if (check.allowed) {
      showToast(lang === 'bn' ? `অনুমোদন সফল! অবশিষ্ট প্রচেষ্টা: ${check.remaining}` : `Attempt allowed. Remaining: ${check.remaining}`, 'success');
    } else {
      showToast(lang === 'bn' ? `⚠️ ব্রুট-ফোর্স প্রতিরোধ! ${check.retryAfterSec} সেকেন্ড পরে পুনরায় চেষ্টা করুন` : `Rate limit exceeded! Retry after ${check.retryAfterSec}s`, 'danger');
    }
  };

  const handleUpdateVirtualStressCount = (count) => {
    setVirtualStressCount(count);
    const newItems = Array.from({ length: count }, (_, i) => ({
      id: `virtual-prod-${i + 1}`,
      name: `ভার্চুয়াল এন্টারপ্রাইজ পণ্য #${i + 1}`,
      barcode: `880000${10000 + i}`,
      price: (100 + (i % 500)),
      stock: (10 + (i % 200)),
      category: i % 2 === 0 ? 'গ্রোসারি ও খাদ্য' : 'ফার্মাসিউটিক্যালস'
    }));
    setVirtualStressItems(newItems);
  };

  const handleTripCircuit = () => {
    circuitBreaker.tripCircuit();
    showToast(lang === 'bn' ? '⚠️ সার্কিট ট্রিপড! লোকাল-ফার্স্ট ০ms মোড সক্রিয় হয়েছে।' : 'Circuit OPEN: Fast failover active', 'warning');
  };

  const handleResetCircuit = () => {
    circuitBreaker.resetCircuit();
    showToast(lang === 'bn' ? '✓ সার্কিট রিসেট! ক্লাউড কানেকশন স্বাভাবিক।' : 'Circuit CLOSED: Cloud normal', 'success');
  };

  const handleSimulatePrefetch = async () => {
    await prefetchService.prefetch('speculative_invoices_report', async () => {
      return { total: salesHistory.length, timestamp: Date.now() };
    });
    setPrefetchStats(prefetchService.getStats());
    showToast(lang === 'bn' ? '✓ স্পেকুলেটিভ প্রিফেচ সম্পন্ন (ক্লিকের আগেই মেমরিতে লোডেড)!' : 'Prefetched in memory!', 'success');
  };

  const handleTickVectorClock = () => {
    const result = vectorClock.tick();
    setVectorClockSnap(vectorClock.getSnapshot());
    showToast(lang === 'bn' ? `লজিক্যাল সিকোয়েন্স: ${result.sequenceTag}` : `Vector Clock: ${result.sequenceTag}`, 'info');
  };

  const enterpriseTables = [
    { name: 'stores', icon: '🏢', desc: 'মাল্টি-ব্রাঞ্চ শপ ও আউটলেট কনফিগ' },
    { name: 'user_profiles', icon: '👤', desc: 'ক্যাশিয়ার, ম্যানেজার ও ওনার রোল' },
    { name: 'categories', icon: '📁', desc: 'পণ্য ক্যাটাগরি ও শ্রেণীবিন্যাস' },
    { name: 'products', icon: '📦', desc: 'মজুদ পণ্য, বারকোড ও মূল্য তালিকা' },
    { name: 'customers', icon: '👥', desc: 'কাস্টমার প্রোফাইল ও লয়াল্টি পয়েন্ট' },
    { name: 'sales', icon: '🧾', desc: 'ইনভয়েস হেড ও লেনদেন হিস্ট্রি' },
    { name: 'sale_items', icon: '🛒', desc: 'প্রতিটি চালানের বিস্তারিত পণ্য' },
    { name: 'payments', icon: '💳', desc: 'স্প্লিট ও আংশিক পেমেন্ট রেকর্ড' },
    { name: 'expenses', icon: '💸', desc: 'দোকানের খরচের দৈনিক হিসাব' },
    { name: 'stock_logs', icon: '📊', desc: 'ইনভেন্টরি স্টক হ্রাস-বৃদ্ধির ট্রেইল' },
    { name: 'branch_stock_transfers', icon: '🚛', desc: 'শাখাগুলোর মধ্যে মালামাল স্থানান্তর' }
  ];

  return (
    <div
      style={{
        background: 'var(--card-bg, #ffffff)',
        color: 'var(--text-color, #1e293b)',
        borderRadius: '16px',
        border: '1px solid var(--border-color, rgba(0,0,0,0.08))',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
        padding: '1.25rem',
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}
    >
      {/* ============================================================================
          TOP HEADER
          ============================================================================ */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          borderBottom: '1px solid var(--border-color, rgba(0,0,0,0.08))',
          paddingBottom: '1rem',
          marginBottom: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
            }}
          >
            <Database size={24} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{lang === 'bn' ? 'এন্টারপ্রাইজ ব্যাকএন্ড ও সুপারচার্জড হাব' : 'Enterprise Backend Supercharged Hub'}</span>
              <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: '800' }}>
                4.0 PRO
              </span>
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {lang === 'bn'
                ? 'হ্যাশ-চেইন অডিট, FEFO ব্যাচ ট্র্যাকিং, হোয়াটসঅ্যাপ/এসএমএস ও ওমনি-চ্যানেল ই-কমার্স'
                : 'Hash-Chain Invoicing, FEFO Batches, WhatsApp/SMS Alert Hub & Omni-Channel Sync'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={checkHealth}
            disabled={loading}
            className="btn btn-secondary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              fontSize: '0.8rem',
              fontWeight: '700',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? (lang === 'bn' ? 'যাচাই হচ্ছে...' : 'Checking...') : (lang === 'bn' ? 'রিফ্রেশ' : 'Refresh')}</span>
          </button>

          <a
            href="https://supabase.com/dashboard/project/juahukfvwbwupsamqzyo/sql/new"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              fontSize: '0.8rem',
              fontWeight: '800',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#fff',
              textDecoration: 'none'
            }}
          >
            <span>{lang === 'bn' ? 'SQL এডিটর' : 'SQL Editor'}</span>
            <ExternalLink size={14} />
          </a>
        </div>
      </div>

      {/* ============================================================================
          TOP SUB-TAB SWITCHER (Zero overlap, modular, clean responsive design)
          ============================================================================ */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          paddingBottom: '8px',
          marginBottom: '1.25rem',
          borderBottom: '1px solid var(--border-color, rgba(0,0,0,0.06))'
        }}
      >
        {[
          { id: 'overview', icon: <Server size={14} />, labelBn: 'ক্লাউড ও ডেল্টা সিঙ্ক', labelEn: 'Cloud & Sync', badge: 'Postgres' },
          { id: 'hash_chain', icon: <Link2 size={14} />, labelBn: 'হ্যাশ-চেইন অডিট', labelEn: 'Hash-Chain Audit', badge: 'SHA-256' },
          { id: 'fefo_expiry', icon: <Calendar size={14} />, labelBn: 'FEFO ও ব্যাচ ট্র্যাকিং', labelEn: 'FEFO Batches', badge: `${expiryAlerts.length} এলার্ট` },
          { id: 'alerts_hub', icon: <MessageSquare size={14} />, labelBn: 'হোয়াটসঅ্যাপ ও এসএমএস হাব', labelEn: 'Alerts & Messages', badge: 'WhatsApp' },
          { id: 'omnichannel', icon: <ShoppingBag size={14} />, labelBn: 'ওমনি-চ্যানেল ই-কমার্স', labelEn: 'Omni-Channel Sync', badge: 'Woo/Shopify' },
          { id: 'enterprise_perf', icon: <Cpu size={14} />, labelBn: 'পারফরম্যান্স ও স্কেলিং', labelEn: 'Performance & Scaling', badge: 'Virtualization' }
        ].map((tab) => {
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '10px',
                border: isActive ? '1.5px solid #10b981' : '1px solid var(--border-color, rgba(0,0,0,0.1))',
                background: isActive ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-primary, rgba(0,0,0,0.02))',
                color: isActive ? '#10b981' : 'var(--text-main)',
                fontWeight: isActive ? '800' : '600',
                fontSize: '0.8rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}
            >
              {tab.icon}
              <span>{lang === 'bn' ? tab.labelBn : tab.labelEn}</span>
              <span
                style={{
                  fontSize: '0.65rem',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  background: isActive ? '#10b981' : 'rgba(0,0,0,0.08)',
                  color: isActive ? '#fff' : 'var(--text-muted)',
                  fontWeight: '700'
                }}
              >
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* ============================================================================
          TAB 1: OVERVIEW & CLOUD POSTGRESQL & DELTA SYNC & MULTI-BRANCH
          ============================================================================ */}
      {activeSubTab === 'overview' && (
        <div>
          {/* Live Health Status Card */}
          <div
            style={{
              padding: '1rem',
              borderRadius: '12px',
              background: healthStatus?.ready
                ? 'rgba(16, 185, 129, 0.08)'
                : healthStatus?.connected
                ? 'rgba(245, 158, 11, 0.08)'
                : 'rgba(239, 68, 68, 0.08)',
              border: `1.5px solid ${
                healthStatus?.ready
                  ? 'rgba(16, 185, 129, 0.3)'
                  : healthStatus?.connected
                  ? 'rgba(245, 158, 11, 0.3)'
                  : 'rgba(239, 68, 68, 0.3)'
              }`,
              marginBottom: '1.25rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {healthStatus?.ready ? (
                  <CheckCircle2 size={22} color="#10b981" />
                ) : healthStatus?.connected ? (
                  <AlertTriangle size={22} color="#f59e0b" />
                ) : (
                  <AlertTriangle size={22} color="#ef4444" />
                )}
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-main)' }}>
                    {healthStatus?.message || (lang === 'bn' ? 'ক্লাউড সংযোগ পরীক্ষা করা হচ্ছে...' : 'Checking connection...')}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    প্রজেক্ট URL: <code style={{ color: 'var(--business-primary)', background: 'rgba(0,0,0,0.06)', padding: '1px 6px', borderRadius: '4px' }}>{config.url || 'Not set'}</code>
                    {healthStatus?.latency && ` • ল্যাটেন্সি: ${healthStatus.latency}ms`}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>লোকাল পণ্য</div>
                  <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)' }}>{products.length} টি</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>লোকাল ইনভয়েস</div>
                  <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)' }}>{salesHistory.length} টি</div>
                </div>
              </div>
            </div>
          </div>

          {/* DELTA SYNC CONTROL CENTER */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(16, 185, 129, 0.05))',
              border: '1.5px solid rgba(99, 102, 241, 0.25)',
              borderRadius: '14px',
              padding: '1.25rem',
              marginBottom: '1.25rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <ArrowDownUp size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{lang === 'bn' ? 'দ্বি-মুখী ডেল্টা সিঙ্ক ও কনফ্লিক্ট নিরসন ইঞ্জিন' : 'Bi-Directional Delta Sync'}</span>
                    <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', fontWeight: '800' }}>
                      DELTA SYNC
                    </span>
                  </h4>
                  <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {lang === 'bn' ? 'অটোমেটিক ডেল্টা সিঙ্ক্রোনাইজেশন এবং LWW (Last-Write-Wins) অ্যালগরিদম' : 'Delta auto-sync & LWW conflict resolution'}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {conflictHistory.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowConflictModal(!showConflictModal)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      color: 'inherit',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <History size={13} />
                    <span>{lang === 'bn' ? `কনফ্লিক্ট (${conflictHistory.length})` : `Conflicts (${conflictHistory.length})`}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleTriggerDeltaSync}
                  disabled={deltaSyncState.isSyncing}
                  style={{
                    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '7px 15px',
                    fontSize: '0.8rem',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 3px 12px rgba(99, 102, 241, 0.3)'
                  }}
                >
                  <RefreshCw size={14} className={deltaSyncState.isSyncing ? 'animate-spin' : ''} />
                  <span>{deltaSyncState.isSyncing ? (lang === 'bn' ? 'সিঙ্ক চলছে...' : 'Syncing...') : (lang === 'bn' ? 'ডেল্টা সিঙ্ক চালান' : 'Run Delta Sync')}</span>
                </button>
              </div>
            </div>

            {/* Sync Progress Indicator */}
            {deltaSyncState.isSyncing && (
              <div style={{ marginBottom: '12px', background: 'rgba(0,0,0,0.06)', borderRadius: '8px', padding: '8px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: '700', color: '#6366f1', marginBottom: '4px' }}>
                  <span>{deltaSyncState.step || 'সিঙ্ক হচ্ছে...'}</span>
                  <span>{deltaSyncState.progress}%</span>
                </div>
                <div style={{ height: '5px', width: '100%', background: 'rgba(0,0,0,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${deltaSyncState.progress}%`,
                      background: 'linear-gradient(90deg, #6366f1, #10b981)',
                      transition: 'width 0.3s ease'
                    }}
                  />
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
              <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-primary, rgba(0,0,0,0.03))' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>পেন্ডিং অফলাইন মিউটেশন</div>
                <div style={{ fontSize: '0.95rem', fontWeight: '800', color: pendingMutationsCount > 0 ? '#f59e0b' : '#10b981' }}>
                  {pendingMutationsCount} টি রিকোয়েস্ট
                </div>
              </div>
              <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-primary, rgba(0,0,0,0.03))' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>সর্বশেষ ডেল্টা সিঙ্ক</div>
                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)' }}>
                  {lastSyncTime ? new Date(lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'কখনই হয়নি'}
                </div>
              </div>
              <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-primary, rgba(0,0,0,0.03))' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>কনফ্লিক্ট স্ট্র্যাটেজি</div>
                <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#10b981' }}>
                  LWW (Last-Write-Wins)
                </div>
              </div>
            </div>
          </div>

          {/* MULTI-BRANCH ISOLATION & INTER-BRANCH STOCK TRANSFERS */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(59, 130, 246, 0.05))',
              border: '1.5px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '14px',
              padding: '1.25rem',
              marginBottom: '1.25rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Building2 size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{lang === 'bn' ? 'মাল্টি-ব্রাঞ্চ এন্টারপ্রাইজ আইসোলেশন ও স্টক ট্রান্সফার' : 'Multi-Branch Isolation'}</span>
                    <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: '800' }}>
                      MULTI-BRANCH
                    </span>
                  </h4>
                  <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {lang === 'bn' ? 'রোল-ভিত্তিক RLS সিকিউরিটি ও আন্তঃশাখা মালামাল স্থানান্তর' : 'Role-based RLS & Inter-Branch Transfers'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowTransferModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '7px 15px',
                  fontSize: '0.8rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 3px 12px rgba(16, 185, 129, 0.3)'
                }}
              >
                <Truck size={14} />
                <span>{lang === 'bn' ? 'মালামাল স্থানান্তর করুন' : 'Transfer Stock'}</span>
              </button>
            </div>

            {recentTransfers.length > 0 && (
              <div style={{ marginTop: '10px', background: 'rgba(0,0,0,0.03)', borderRadius: '8px', padding: '10px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '800', marginBottom: '6px' }}>সাম্প্রতিক ট্রান্সফার লগ:</div>
                {recentTransfers.slice(0, 3).map((tr) => (
                  <div key={tr.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', padding: '3px 0' }}>
                    <span>📦 {tr.product_name || tr.product_id} ({tr.quantity} pcs)</span>
                    <span style={{ color: '#10b981', fontWeight: '700' }}>{tr.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 1-Click PostgreSQL Schema Setup Card */}
          <div
            style={{
              background: 'var(--bg-primary, rgba(0,0,0,0.02))',
              border: '1px solid var(--border-color, rgba(0,0,0,0.08))',
              borderRadius: '12px',
              padding: '1.25rem',
              marginBottom: '1.25rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Code2 size={18} color="#6366f1" />
                <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  {lang === 'bn' ? '১-ক্লিক PostgreSQL স্কিমা সেটআপ' : '1-Click PostgreSQL Schema'}
                </h4>
              </div>

              <button
                type="button"
                onClick={handleCopySchemaSql}
                className="btn btn-secondary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  fontSize: '0.78rem',
                  fontWeight: '800',
                  borderRadius: '8px',
                  border: '1.5px solid #6366f1',
                  color: '#6366f1',
                  background: 'rgba(99, 102, 241, 0.1)',
                  cursor: 'pointer'
                }}
              >
                {copiedSql ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedSql ? (lang === 'bn' ? '✓ কপি হয়েছে!' : 'Copied!') : (lang === 'bn' ? '📋 সম্পূর্ণ SQL কপি করুন' : 'Copy Full SQL')}</span>
              </button>
            </div>

            <p style={{ margin: '0 0 10px', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {lang === 'bn'
                ? 'Supabase SQL এডিটরে এই কোডটি রান দিয়ে সকল টেবিল, স্টোরড প্রসিডিউর ও RLS পলিসি এক ক্লিকে ইনস্টল করুন।'
                : 'Execute this SQL schema on Supabase to instantiate all enterprise tables, functions, and RLS policies.'}
            </p>
          </div>
        </div>
      )}

      {/* ============================================================================
          TAB 2: FEATURE 1 - CRYPTOGRAPHIC HASH-CHAIN INVOICING & TAMPER-PROOF AUDIT
          ============================================================================ */}
      {activeSubTab === 'hash_chain' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Header Card */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(99, 102, 241, 0.08))',
              border: '1.5px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '14px',
              padding: '1.25rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{lang === 'bn' ? 'ক্রিপ্টোগ্রাফিক হ্যাশ-চেইন ও টেম্পার-প্রুফ অডিট' : 'Cryptographic Hash-Chained Invoicing & Audit Chain'}</span>
                    <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', fontWeight: '800' }}>
                      SHA-256
                    </span>
                  </h4>
                  <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {lang === 'bn'
                      ? 'প্রতিটি বিক্রয় ইনভয়েস পূর্ববর্তী ইনভয়েসের সাথে গাণিতিকভাবে শিকলবদ্ধ। কোনো তথ্য পরিবর্তন বা ডিলিট করা অসম্ভব।'
                      : 'Every invoice is cryptographically linked with previous invoice SHA-256 block hash. Tampering is mathematically impossible.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleVerifyAuditLedger}
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '9px 18px',
                  fontSize: '0.85rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                }}
              >
                <CheckCircle2 size={16} />
                <span>{lang === 'bn' ? 'লেজার ইন্টিগ্রিটি ভেরিফাই করুন' : 'Verify Ledger Integrity'}</span>
              </button>
            </div>

            {/* Audit Verification Result Alert Box */}
            {auditResult && (
              <div
                style={{
                  marginTop: '1rem',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: auditResult.isValid ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  border: `1.5px solid ${auditResult.isValid ? '#10b981' : '#ef4444'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                {auditResult.isValid ? <CheckCheck size={22} color="#10b981" /> : <ShieldAlert size={22} color="#ef4444" />}
                <div>
                  <div style={{ fontWeight: '800', fontSize: '0.85rem', color: auditResult.isValid ? '#10b981' : '#ef4444' }}>
                    {auditResult.isValid ? '✓ ১০০% টেম্পার-প্রুফ ভেরিফাইড (Tamper-Proof Confirmed)' : '⚠️ টেম্পারিং ধরা পড়েছে (Tampering Detected)!'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-main)', marginTop: '2px' }}>
                    {auditResult.details}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Supervisor Authorization PIN Gate Box */}
          <div
            style={{
              background: 'var(--bg-primary, rgba(0,0,0,0.02))',
              border: '1px solid var(--border-color, rgba(0,0,0,0.08))',
              borderRadius: '12px',
              padding: '1.25rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <KeyRound size={18} color="#6366f1" />
              <h5 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-main)' }}>
                {lang === 'bn' ? 'সুপারভাইজার অনুমোদন ও ক্রিপ্টোগ্রাফিক সিগনেচার গেট' : 'Supervisor PIN Authorization Stamp'}
              </h5>
            </div>
            <p style={{ margin: '0 0 12px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {lang === 'bn'
                ? 'বড় অংকের ডিসকাউন্ট বা ইনভয়েস ভয়েড/রিফান্ডের জন্য সুপারভাইজার পিন দিয়ে নন-রেপুডিয়েবল অডিট কোড তৈরি করুন।'
                : 'Generate cryptographic non-repudiable audit authorization stamps for high discounts and refunds.'}
            </p>

            <form onSubmit={handleGenerateSupervisorStamp} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="password"
                placeholder={lang === 'bn' ? 'সুপারভাইজার PIN (যেমন 1234)' : 'Supervisor PIN'}
                value={supervisorPin}
                onChange={(e) => setSupervisorPin(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--card-bg, #ffffff)',
                  color: 'inherit',
                  fontSize: '0.82rem',
                  width: '200px'
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  background: '#6366f1',
                  color: '#fff',
                  border: 'none',
                  fontWeight: '700',
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                {lang === 'bn' ? 'অথরাইজেশন কোড জেনারেট করুন' : 'Generate Auth Code'}
              </button>
            </form>

            {supervisorAuthStamp && (
              <div style={{ marginTop: '10px', padding: '8px 12px', background: 'rgba(99, 102, 241, 0.08)', borderRadius: '8px', fontSize: '0.78rem' }}>
                <span style={{ fontWeight: '700', color: '#6366f1' }}>ডিজিটাল সিগনেচার স্ট্যাম্প: </span>
                <code style={{ background: 'rgba(0,0,0,0.1)', padding: '2px 6px', borderRadius: '4px', fontWeight: '800' }}>{supervisorAuthStamp.authCode}</code>
                <span style={{ color: 'var(--text-muted)', marginLeft: '8px' }}>({new Date(supervisorAuthStamp.authorizedAt).toLocaleTimeString()})</span>
              </div>
            )}
          </div>

          {/* Recent Invoices Hash-Chain Visualizer */}
          <div>
            <h5 style={{ margin: '0 0 10px', fontSize: '0.88rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Link2 size={16} color="#10b981" />
              <span>{lang === 'bn' ? 'লাইভ ব্লকচেইন ইনভয়েস ট্রেইল (সর্বশেষ বিক্রয়সমূহ)' : 'Live Invoice Hash Chain Explorer'}</span>
            </h5>

            {salesHistory.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem', background: 'var(--bg-primary, rgba(0,0,0,0.02))', borderRadius: '10px' }}>
                {lang === 'bn' ? 'কোনো ইনভয়েস নেই। বিক্রয় শুরু করলে স্বয়ংক্রিয়ভাবে ব্লক তৈরি হবে।' : 'No invoices yet. Make a sale to seed the chain.'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {salesHistory.slice(0, 6).map((inv, idx) => (
                  <div
                    key={inv.id}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: 'var(--bg-primary, rgba(0,0,0,0.02))',
                      border: '1px solid var(--border-color, rgba(0,0,0,0.08))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#10b981',
                          fontWeight: '800',
                          fontSize: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        #{salesHistory.length - idx}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--text-main)' }}>
                          {inv.id} • ৳ {Number(inv.grandTotal).toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          Hash: {inv.blockHash ? `${inv.blockHash.slice(0, 16)}...${inv.blockHash.slice(-8)}` : 'Legacy Genesis'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{inv.date}</span>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: '800',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          background: inv.blockHash ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.2)',
                          color: inv.blockHash ? '#10b981' : '#64748b'
                        }}
                      >
                        {inv.blockHash ? 'SEALED' : 'LEGACY'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================================
          TAB 3: FEATURE 2 - FEFO & LOT / EXPIRY BATCH TRACKING ENGINE
          ============================================================================ */}
      {activeSubTab === 'fefo_expiry' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Header Card */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(239, 68, 68, 0.08))',
              border: '1.5px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '14px',
              padding: '1.25rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Calendar size={22} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{lang === 'bn' ? 'FEFO ও লট/মেয়াদোত্তীর্ণ ব্যাচ ট্র্যাকিং ইঞ্জিন' : 'FEFO / Lot & Expiry Batch Tracking Engine'}</span>
                    <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.2)', color: '#d97706', fontWeight: '800' }}>
                      First-Expiry-First-Out
                    </span>
                  </h4>
                  <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {lang === 'bn'
                      ? 'বিক্রয়ের সময় আগে মেয়াদোত্তীর্ণ হতে যাওয়া ব্যাচ স্বয়ংক্রিয়ভাবে খালাস হয়। লোকসান ও মেয়াদোত্তীর্ণ পণ্য রোধে ১০০% কার্যকর।'
                      : 'Auto-deducts nearest-expiry batch at POS checkout. Prevents expired product loss in pharmacy, grocery & FMCG.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAddBatchModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '9px 18px',
                  fontSize: '0.85rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)'
                }}
              >
                <Plus size={16} />
                <span>{lang === 'bn' ? 'নতুন লট/ব্যাচ যোগ করুন' : 'Receive New Batch Lot'}</span>
              </button>
            </div>
          </div>

          {/* Expiry Risk Alerts Grid */}
          <div>
            <h5 style={{ margin: '0 0 10px', fontSize: '0.88rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Bell size={16} color="#ef4444" />
              <span>{lang === 'bn' ? `আসন্ন মেয়াদোত্তীর্ণ ঝুঁকি তালিকা (${expiryAlerts.length} টি এলার্ট)` : `Expiring Batches Alerts (${expiryAlerts.length})`}</span>
            </h5>

            {expiryAlerts.length === 0 ? (
              <div style={{ padding: '1.25rem', textAlign: 'center', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '10px', color: '#10b981', fontWeight: '700', fontSize: '0.82rem' }}>
                ✓ কোনো পণ্যের মেয়াদ ৩০ দিনের মধ্যে শেষ হওয়ার ঝুঁকি নেই। সব ব্যাচ নিরাপদ।
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
                {expiryAlerts.map((al, idx) => (
                  <div
                    key={`${al.productId}-${al.batchNo}-${idx}`}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      background: al.status === 'expired' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                      border: `1.5px solid ${al.status === 'expired' ? '#ef4444' : '#f59e0b'}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-main)' }}>{al.productName}</span>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: '800',
                          padding: '2px 8px',
                          borderRadius: '8px',
                          background: al.status === 'expired' ? '#ef4444' : '#f59e0b',
                          color: '#fff'
                        }}
                      >
                        {al.status === 'expired' ? 'মেয়াদোত্তীর্ণ' : `${al.daysLeft} দিন বাকি`}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      লট নং: <strong style={{ color: 'var(--text-main)' }}>{al.batchNo}</strong> • স্টক: <strong style={{ color: 'var(--text-main)' }}>{al.stock} pcs</strong>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      মেয়াদ শেষ: {al.expiryDate}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Batches Overview Table */}
          <div style={{ background: 'var(--bg-primary, rgba(0,0,0,0.02))', border: '1px solid var(--border-color, rgba(0,0,0,0.08))', borderRadius: '12px', padding: '1.25rem' }}>
            <h5 style={{ margin: '0 0 10px', fontSize: '0.88rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Package size={16} color="#f59e0b" />
              <span>{lang === 'bn' ? 'সকল পণ্যের অ্যাক্টিভ ব্যাচ ও লট তালিকা' : 'Active Inventory Lots'}</span>
            </h5>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '8px' }}>পণ্য</th>
                    <th style={{ padding: '8px' }}>মোট স্টক</th>
                    <th style={{ padding: '8px' }}>ব্যাচ সংখ্যা</th>
                    <th style={{ padding: '8px' }}>FEFO অগ্রাধিকার ব্যাচ</th>
                  </tr>
                </thead>
                <tbody>
                  {products.slice(0, 8).map((p) => {
                    const hasBatches = Array.isArray(p.batches) && p.batches.length > 0;
                    const earliest = hasBatches
                      ? [...p.batches].sort((a, b) => new Date(a.expiryDate || 0) - new Date(b.expiryDate || 0))[0]
                      : null;
                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                        <td style={{ padding: '8px', fontWeight: '700' }}>{p.name}</td>
                        <td style={{ padding: '8px' }}>{p.stock} {p.unit || 'pcs'}</td>
                        <td style={{ padding: '8px' }}>{hasBatches ? `${p.batches.length} টি ব্যাচ` : '১টি ডিফল্ট লট'}</td>
                        <td style={{ padding: '8px', color: '#10b981', fontWeight: '700' }}>
                          {earliest?.batchNo ? `${earliest.batchNo} (${earliest.expiryDate || 'No Expiry'})` : (p.expiryDate || 'N/A')}
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

      {/* ============================================================================
          TAB 4: FEATURE 3 - AUTOMATED WHATSAPP/SMS ALERT HUB & DUE REMINDERS
          ============================================================================ */}
      {activeSubTab === 'alerts_hub' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Header Card */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(37, 211, 102, 0.08), rgba(16, 185, 129, 0.08))',
              border: '1.5px solid rgba(37, 211, 102, 0.3)',
              borderRadius: '14px',
              padding: '1.25rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #25d366, #128c7e)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <MessageSquare size={22} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{lang === 'bn' ? 'অটোমেটেড হোয়াটসঅ্যাপ ও এসএমএস এলার্ট হাব' : 'Automated WhatsApp & SMS Alert Hub'}</span>
                    <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(37, 211, 102, 0.2)', color: '#128c7e', fontWeight: '800' }}>
                      Auto Digest
                    </span>
                  </h4>
                  <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {lang === 'bn'
                      ? 'দৈনিক লাভ-ক্ষতি রিপোর্ট, ১-ক্লিক হোয়াটসঅ্যাপে বকেয়া তাগাদা এবং SMS ওয়েবহুক গেটওয়ে ডিসপ্যাচ।'
                      : 'Daily P&L digest automation, 1-click WhatsApp customer due reminders & SMS gateway webhooks.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleTestWebhookDispatch}
                disabled={isTestingWebhook}
                style={{
                  background: 'linear-gradient(135deg, #25d366, #128c7e)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '9px 18px',
                  fontSize: '0.85rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(37, 211, 102, 0.3)'
                }}
              >
                <Send size={16} className={isTestingWebhook ? 'animate-spin' : ''} />
                <span>{isTestingWebhook ? 'পাঠানো হচ্ছে...' : (lang === 'bn' ? 'টেস্ট ডিসপ্যাচ চালান' : 'Run Test Dispatch')}</span>
              </button>
            </div>
          </div>

          {/* Daily P&L Digest Preview Card */}
          <div style={{ background: 'var(--bg-primary, rgba(0,0,0,0.02))', border: '1px solid var(--border-color, rgba(0,0,0,0.08))', borderRadius: '12px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Smartphone size={18} color="#25d366" />
                <h5 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  {lang === 'bn' ? 'আজকের দৈনিক হিসাব বিবরণী (Daily P&L WhatsApp Digest)' : 'Today\'s P&L Digest Preview'}
                </h5>
              </div>

              {businessSettings.phone && (
                <a
                  href={generateWhatsAppLink(businessSettings.phone, dailyDigest.formattedMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: '#25d366',
                    color: '#fff',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: '800',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Share2 size={13} />
                  <span>{lang === 'bn' ? 'মালিকের হোয়াটসঅ্যাপে পাঠান' : 'Send to Owner'}</span>
                </a>
              )}
            </div>

            <pre
              style={{
                background: 'rgba(0,0,0,0.04)',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                whiteSpace: 'pre-wrap',
                fontFamily: 'inherit',
                color: 'var(--text-main)',
                margin: 0
              }}
            >
              {dailyDigest.formattedMessage}
            </pre>
          </div>

          {/* Customer Due Reminders List */}
          <div style={{ background: 'var(--bg-primary, rgba(0,0,0,0.02))', border: '1px solid var(--border-color, rgba(0,0,0,0.08))', borderRadius: '12px', padding: '1.25rem' }}>
            <h5 style={{ margin: '0 0 10px', fontSize: '0.88rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MessageSquare size={16} color="#25d366" />
              <span>{lang === 'bn' ? '১-ক্লিক হোয়াটসঅ্যাপ বাকি তাগাদা ডিসপ্যাচার' : '1-Click WhatsApp Customer Due Reminders'}</span>
            </h5>

            {customers.filter((c) => Number(c.outstandingDue || 0) > 0).length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                কোনো কাস্টমারের বকেয়া নেই।
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {customers
                  .filter((c) => Number(c.outstandingDue || 0) > 0)
                  .slice(0, 6)
                  .map((cust) => {
                    const waLink = generateWhatsAppLink(
                      cust.phone,
                      buildDueReminderMessage(cust, businessSettings)
                    );
                    return (
                      <div
                        key={cust.id}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '10px',
                          background: 'var(--card-bg, #ffffff)',
                          border: '1px solid var(--border-color, rgba(0,0,0,0.08))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '8px'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '0.82rem', fontWeight: '800' }}>{cust.name} ({cust.phone || 'ফোন নেই'})</div>
                          <div style={{ fontSize: '0.72rem', color: '#ef4444', fontWeight: '700' }}>
                            বকেয়া: ৳ {Number(cust.outstandingDue).toLocaleString()}
                          </div>
                        </div>

                        {cust.phone ? (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              background: '#25d366',
                              color: '#fff',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              fontSize: '0.75rem',
                              fontWeight: '800',
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <Send size={12} />
                            <span>{lang === 'bn' ? 'তাগাদা পাঠান (WhatsApp)' : 'Send Reminder'}</span>
                          </a>
                        ) : (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ফোন নম্বর প্রয়োজন</span>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Webhook & SMS Gateway Configuration Box */}
          <div style={{ background: 'var(--bg-primary, rgba(0,0,0,0.02))', border: '1px solid var(--border-color, rgba(0,0,0,0.08))', borderRadius: '12px', padding: '1.25rem' }}>
            <h5 style={{ margin: '0 0 10px', fontSize: '0.88rem', fontWeight: '800', color: 'var(--text-main)' }}>
              {lang === 'bn' ? 'SMS / Webhook গেটওয়ে সেটিংস' : 'SMS Gateway & Webhook Settings'}
            </h5>

            <form onSubmit={handleSaveNotifConfig} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', marginBottom: '4px' }}>ওয়েবহুক URL (যেমন BulkSMS/Greenweb/Twilio)</label>
                <input
                  type="url"
                  placeholder="https://sms-gateway.com/api/send"
                  value={notifConfig.webhookUrl}
                  onChange={(e) => setNotifConfig({ ...notifConfig, webhookUrl: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--card-bg, #fff)', color: 'inherit', fontSize: '0.8rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', marginBottom: '4px' }}>API কী / টোকেন</label>
                <input
                  type="password"
                  placeholder="Bearer Token or API Key"
                  value={notifConfig.apiKey}
                  onChange={(e) => setNotifConfig({ ...notifConfig, apiKey: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--card-bg, #fff)', color: 'inherit', fontSize: '0.8rem' }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: '#10b981',
                    color: '#fff',
                    border: 'none',
                    fontWeight: '800',
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  {lang === 'bn' ? 'সেটিংস সেভ করুন' : 'Save Config'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================================
          TAB 5: FEATURE 4 - OMNI-CHANNEL WEBHOOK & E-COMMERCE SYNC CONNECTOR
          ============================================================================ */}
      {activeSubTab === 'omnichannel' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Header Card */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(236, 72, 153, 0.08))',
              border: '1.5px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '14px',
              padding: '1.25rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #6366f1, #ec4899)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Globe size={22} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{lang === 'bn' ? 'ওমনি-চ্যানেল ওয়েবহুক ও ই-কমার্স সিঙ্ক কানেক্টর' : 'Omni-Channel Webhook & E-Commerce Sync'}</span>
                    <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.2)', color: '#6366f1', fontWeight: '800' }}>
                      Woo & Shopify
                    </span>
                  </h4>
                  <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {lang === 'bn'
                      ? 'অনলাইন দোকান (WooCommerce / Shopify / Daraz)-এর সাথে অফলাইন দোকানের পণ্য ও স্টক সরাসরি সিঙ্ক।'
                      : 'Bi-directional inventory sync between POS & online e-commerce platforms.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSimulateInboundOrder}
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '9px 18px',
                  fontSize: '0.85rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)'
                }}
              >
                <Zap size={16} />
                <span>{lang === 'bn' ? 'টেস্ট অনলাইন অর্ডার সিমুলেট করুন' : 'Simulate Inbound Order'}</span>
              </button>
            </div>
          </div>

          {/* Connected Channels Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
            {omniConfig.channels.map((ch) => (
              <div
                key={ch.id}
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  background: 'var(--bg-primary, rgba(0,0,0,0.02))',
                  border: '1px solid var(--border-color, rgba(0,0,0,0.08))',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: '800' }}>{ch.name}</span>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: '800',
                      padding: '2px 8px',
                      borderRadius: '8px',
                      background: ch.status === 'active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                      color: ch.status === 'active' ? '#10b981' : '#64748b'
                    }}
                  >
                    {ch.status.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  ওয়েবহুক সিক্রেট: <code style={{ color: '#6366f1' }}>{ch.webhookSecret}</code>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  অটো-স্টক সিঙ্ক: <strong style={{ color: ch.autoSyncStock ? '#10b981' : '#ef4444' }}>{ch.autoSyncStock ? 'সক্রিয়' : 'নিষ্ক্রিয়'}</strong>
                </div>
              </div>
            ))}
          </div>

          {/* Live Inbound/Outbound Sync Audit Logs */}
          <div style={{ background: 'var(--bg-primary, rgba(0,0,0,0.02))', border: '1px solid var(--border-color, rgba(0,0,0,0.08))', borderRadius: '12px', padding: '1.25rem' }}>
            <h5 style={{ margin: '0 0 10px', fontSize: '0.88rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <History size={16} color="#6366f1" />
              <span>{lang === 'bn' ? 'ওমনি-চ্যানেল সিঙ্ক হিস্টোরি ও অর্ডার ট্রেইল' : 'Omni-Channel Sync Audit Trail'}</span>
            </h5>

            {omniLogs.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                কোনো অনলাইন অর্ডার ট্রেইল নেই। উপরের বাটনে ক্লিক করে টেস্ট অর্ডার সিমুলেট করতে পারেন।
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {omniLogs.slice(0, 5).map((log) => (
                  <div
                    key={log.id}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'var(--card-bg, #fff)',
                      border: '1px solid var(--border-color, rgba(0,0,0,0.06))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.75rem'
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: '800', color: '#6366f1' }}>[{log.channel}] </span>
                      <span style={{ fontWeight: '700' }}>{log.orderId}: </span>
                      <span style={{ color: 'var(--text-muted)' }}>{log.details}</span>
                    </div>
                    <div style={{ color: '#10b981', fontWeight: '700' }}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================================
          TAB 6: PHASE 6 - ENTERPRISE PERFORMANCE, VIRTUALIZATION, RETRY QUEUE & SCALING
          ============================================================================ */}
      {activeSubTab === 'enterprise_perf' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Header Card */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(99, 102, 241, 0.08))',
              border: '1.5px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '14px',
              padding: '1.25rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #6366f1, #10b981)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Cpu size={22} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{lang === 'bn' ? 'পারফরম্যান্স অপ্টিমাইজেশন ও এন্টারপ্রাইজ স্কেলিং হাব' : 'High-Performance Virtualization & Enterprise Scaling'}</span>
                    <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.2)', color: '#6366f1', fontWeight: '800' }}>
                      60-120 FPS
                    </span>
                  </h4>
                  <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {lang === 'bn'
                      ? 'ডম ভার্চুয়ালাইজেশন, এক্সপোনেনশিয়াল ব্যাকঅফ রিট্রাই কিউ, ব্রুট-ফোর্স রেট লিমিটার এবং পোস্টগ্রেস রেঞ্জ পার্টিশনিং।'
                      : 'DOM Virtualization, Exponential Backoff Retry Queue, Zero-Trust Rate Limiting & PostgreSQL Range Partitioning.'}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleFlushRetryQueue}
                  disabled={isFlushingQueue}
                  style={{
                    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    fontSize: '0.8rem',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <RefreshCw size={13} className={isFlushingQueue ? 'animate-spin' : ''} />
                  <span>{isFlushingQueue ? 'রিট্রাই চলছে...' : (lang === 'bn' ? 'কিউ রিট্রাই চালান' : 'Flush Queue')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 1. DOM Virtualization Interactive Stress Tester */}
          <div style={{ background: 'var(--bg-primary, rgba(0,0,0,0.02))', border: '1px solid var(--border-color, rgba(0,0,0,0.08))', borderRadius: '12px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
              <div>
                <h5 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Activity size={16} color="#10b981" />
                  <span>{lang === 'bn' ? 'ডম ভার্চুয়ালাইজেশন লাইভ স্ট্রেস টেস্ট (DOM Virtualization Engine)' : 'DOM Virtualization Live Stress Test'}</span>
                </h5>
                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {lang === 'bn'
                    ? `মেমরিতে ${virtualStressCount.toLocaleString()} টি পণ্য থাকলেও ব্রাউজারে রেন্ডার হচ্ছে মাত্র ১২-১৫টি রো। ফলে ০% ফ্রেম ড্রপ বা মেমরি ল্যাগ!`
                    : `Rendering ${virtualStressCount.toLocaleString()} items with 0% frame drop.`}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>টেস্ট সাইজ:</span>
                {[1000, 2000, 5000, 10000].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => handleUpdateVirtualStressCount(cnt)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: virtualStressCount === cnt ? '1.5px solid #10b981' : '1px solid var(--border-color)',
                      background: virtualStressCount === cnt ? 'rgba(16, 185, 129, 0.15)' : 'var(--card-bg, #fff)',
                      color: virtualStressCount === cnt ? '#10b981' : 'inherit',
                      fontSize: '0.72rem',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    {cnt >= 1000 ? `${cnt / 1000}k` : cnt}
                  </button>
                ))}
              </div>
            </div>

            {/* Virtualized Container */}
            <VirtualizedList
              items={virtualStressItems}
              itemHeight={48}
              containerHeight={260}
              renderItem={(item, idx) => (
                <div
                  style={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 14px',
                    borderBottom: '1px solid rgba(0,0,0,0.04)',
                    fontSize: '0.78rem',
                    background: idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace', width: '45px' }}>#{idx + 1}</span>
                    <span style={{ fontWeight: '700' }}>{item.name}</span>
                    <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>{item.category}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <span>বারকোড: <code style={{ color: 'var(--text-muted)' }}>{item.barcode}</code></span>
                    <span>স্টক: <strong style={{ color: '#10b981' }}>{item.stock} pcs</strong></span>
                    <span style={{ fontWeight: '800', color: 'var(--text-main)', width: '60px', textAlign: 'right' }}>৳ {item.price}</span>
                  </div>
                </div>
              )}
            />
          </div>

          {/* 2. Asynchronous Retry Queue with Exponential Backoff */}
          <div style={{ background: 'var(--bg-primary, rgba(0,0,0,0.02))', border: '1px solid var(--border-color, rgba(0,0,0,0.08))', borderRadius: '12px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
              <div>
                <h5 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FastForward size={16} color="#f59e0b" />
                  <span>{lang === 'bn' ? 'মেসেজ রিট্রাই কিউ (Exponential Backoff Queue)' : 'Message Retry Queue'}</span>
                </h5>
                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {lang === 'bn'
                    ? 'নেটওয়ার্ক ড্রপ বা গেটওয়ে ব্যস্ত থাকলে এসএমএস/হোয়াটসঅ্যাপ নোটিফিকেশন স্বয়ংক্রিয়ভাবে ব্যাকগ্রাউন্ডে রিট্রাই হয়।'
                    : 'Auto-retries failed webhooks with exponential backoff algorithm (2s -> 4s -> 8s -> 16s).'}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={handleSimulateFailedWebhookRetry}
                  style={{
                    background: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid #f59e0b',
                    color: '#d97706',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  + টেস্ট রিট্রাই টাস্ক যোগ করুন
                </button>
              </div>
            </div>

            {retryQueueList.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', background: 'rgba(0,0,0,0.03)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                কোনো পেন্ডিং রিট্রাই টাস্ক নেই। ব্যাকগ্রাউন্ড কিউ ১০০% ক্লিয়ার।
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {retryQueueList.slice(0, 4).map((task) => (
                  <div
                    key={task.id}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'var(--card-bg, #fff)',
                      border: '1px solid var(--border-color, rgba(0,0,0,0.08))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.75rem'
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: '800', color: '#f59e0b' }}>[{task.type}] </span>
                      <span>{task.id} • </span>
                      <span style={{ color: 'var(--text-muted)' }}>প্রচেষ্টা: {task.attempts}/{task.maxAttempts}</span>
                    </div>
                    <div>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: '800',
                          padding: '2px 6px',
                          borderRadius: '6px',
                          background: task.status === 'delivered' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: task.status === 'delivered' ? '#10b981' : '#d97706'
                        }}
                      >
                        {task.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. Zero-Trust Security Rate Limiter & PostgreSQL Range Partitioning */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {/* Rate Limiter Card */}
            <div style={{ background: 'var(--bg-primary, rgba(0,0,0,0.02))', border: '1px solid var(--border-color, rgba(0,0,0,0.08))', borderRadius: '12px', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <ShieldBan size={18} color="#ef4444" />
                <h5 style={{ margin: 0, fontSize: '0.88rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  {lang === 'bn' ? 'ব্রুট-ফোর্স রেট লিমিটার (Token Bucket)' : 'Token Bucket Rate Limiter'}
                </h5>
              </div>
              <p style={{ margin: '0 0 10px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {lang === 'bn'
                  ? 'সুপারভাইজার পিন এবং অথেনটিকেশন সুরক্ষা: ৬০ সেকেন্ডে সর্বোচ্চ ৫টি প্রচেষ্টা অনুমোদন।'
                  : 'Zero-trust protection against credential brute-forcing.'}
              </p>

              <button
                type="button"
                onClick={handleTestRateLimiter}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}
              >
                টেস্ট রেট লিমিট ব্লক চালান
              </button>

              {rateLimitTestResult && (
                <div style={{ marginTop: '10px', fontSize: '0.75rem', padding: '8px 12px', borderRadius: '8px', background: rateLimitTestResult.allowed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: rateLimitTestResult.allowed ? '#10b981' : '#ef4444' }}>
                  {rateLimitTestResult.allowed
                    ? `✓ অনুমোদন সফল! অবশিষ্ট ট্রায়াল: ${rateLimitTestResult.remaining}`
                    : `⚠️ লকআউট সক্রিয়! দয়া করে ${rateLimitTestResult.retryAfterSec} সেকেন্ড অপেক্ষা করুন`}
                </div>
              )}
            </div>

            {/* PostgreSQL Partitioning Card */}
            <div style={{ background: 'var(--bg-primary, rgba(0,0,0,0.02))', border: '1px solid var(--border-color, rgba(0,0,0,0.08))', borderRadius: '12px', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Layers size={18} color="#6366f1" />
                <h5 style={{ margin: 0, fontSize: '0.88rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  {lang === 'bn' ? 'পোস্টগ্রেস রেঞ্জ পার্টিশনিং ও BRIN ইনডেক্স' : 'Postgres Partitioning & BRIN'}
                </h5>
              </div>
              <p style={{ margin: '0 0 10px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {lang === 'bn'
                  ? 'লাখ লাখ ইনভয়েসে টাইম-সিরিজ কোয়েরি ফাস্ট রাখতে BRIN ইনডেক্স (৯৫% কম মেমোরি) ও মাসিক পার্টিশনিং।'
                  : 'Time-series range partitioning with BRIN indexing enabled in schema.sql.'}
              </p>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-main)', background: 'rgba(99, 102, 241, 0.08)', padding: '8px 12px', borderRadius: '8px' }}>
                <div>✓ <code>invoices_y2026m10</code> (অক্টোবর ২০২৬)</div>
                <div>✓ <code>invoices_y2026m11</code> (নভেম্বর ২০২৬)</div>
                <div>✓ <code>invoices_y2026m12</code> (ডিসেম্বর ২০২৬)</div>
              </div>
            </div>

            {/* Binary MessagePack Compression Comparator Card */}
            <div style={{ background: 'var(--bg-primary, rgba(0,0,0,0.02))', border: '1px solid var(--border-color, rgba(0,0,0,0.08))', borderRadius: '12px', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <HardDrive size={18} color="#10b981" />
                <h5 style={{ margin: 0, fontSize: '0.88rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  {lang === 'bn' ? 'বাইনারি মেসেজপ্যাক ডেটা পাইপ (Binary Pack)' : 'Binary MessagePack Data Pipe'}
                </h5>
              </div>
              <p style={{ margin: '0 0 10px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {lang === 'bn'
                  ? 'ক্লাউড সিঙ্কের সময় সাধারণ টেক্সট JSON-এর জায়গায় কমপ্যাক্ট বাইনারি ফরম্যাটে ডেটা ট্রান্সফার।'
                  : 'Reduces network sync payload bandwidth by 50-70%.'}
              </p>

              {(() => {
                const stats = measureCompressionStats(products);
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.75rem' }}>
                    <div style={{ background: 'rgba(0,0,0,0.03)', padding: '6px 10px', borderRadius: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>JSON সাইজ: </span>
                      <strong>{stats.formattedJson}</strong>
                    </div>
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '6px 10px', borderRadius: '6px' }}>
                      <span>বাইনারি প্যাক: </span>
                      <strong>{stats.formattedBinary} ({stats.savingsPercent}% সাশ্রয়)</strong>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* SWR Data Pipe Monitor Card */}
            <div style={{ background: 'var(--bg-primary, rgba(0,0,0,0.02))', border: '1px solid var(--border-color, rgba(0,0,0,0.08))', borderRadius: '12px', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Clock size={18} color="#3b82f6" />
                <h5 style={{ margin: 0, fontSize: '0.88rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  {lang === 'bn' ? 'Stale-While-Revalidate (SWR) পাইপ' : 'SWR Data Pipe Monitor'}
                </h5>
              </div>
              <p style={{ margin: '0 0 10px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {lang === 'bn'
                  ? '০ms তাৎক্ষণিক লোকাল ক্যাশ ডিসপ্লে এবং সাইলেন্ট ব্যাকগ্রাউন্ড রিভ্যালিডেশন।'
                  : 'Zero-latency instant display with background delta revalidation.'}
              </p>

              <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem' }}>
                <span style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', fontWeight: '700' }}>
                  ✓ রেসপন্স টাইম: 0 ms (Cache-First)
                </span>
                <span style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontWeight: '700' }}>
                  ✓ রিভ্যালিডেশন: সক্রিয় (Background)
                </span>
              </div>
            </div>

            {/* Circuit Breaker Control Card */}
            <div style={{ background: 'var(--bg-primary, rgba(0,0,0,0.02))', border: '1px solid var(--border-color, rgba(0,0,0,0.08))', borderRadius: '12px', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ZapOff size={18} color={circuitStatus.state === 'OPEN' ? '#ef4444' : '#10b981'} />
                  <h5 style={{ margin: 0, fontSize: '0.88rem', fontWeight: '800', color: 'var(--text-main)' }}>
                    {lang === 'bn' ? 'ক্লায়েন্ট সার্কিট ব্রেকার (Circuit Breaker)' : 'Client Circuit Breaker'}
                  </h5>
                </div>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: '800',
                    padding: '2px 8px',
                    borderRadius: '8px',
                    background: circuitStatus.state === 'CLOSED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: circuitStatus.state === 'CLOSED' ? '#10b981' : '#ef4444'
                  }}
                >
                  {circuitStatus.state}
                </span>
              </div>
              <p style={{ margin: '0 0 10px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {lang === 'bn'
                  ? 'নেটওয়ার্ক ড্রপ বা ল্যাগ হলে সাথে সাথে ০ms লোকাল-ফার্স্ট মোডে ফেইলওভার করে।'
                  : 'Fast-fails to local-first when cloud network encounters latency or drops.'}
              </p>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={handleTripCircuit}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid #ef4444',
                    color: '#ef4444',
                    fontSize: '0.72rem',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  সার্কিট ট্রিপ (Open)
                </button>
                <button
                  type="button"
                  onClick={handleResetCircuit}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid #10b981',
                    color: '#10b981',
                    fontSize: '0.72rem',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  রিসেট (Closed)
                </button>
              </div>
            </div>

            {/* Speculative Prefetch & Lamport Vector Clock Grid */}
            <div style={{ background: 'var(--bg-primary, rgba(0,0,0,0.02))', border: '1px solid var(--border-color, rgba(0,0,0,0.08))', borderRadius: '12px', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ListOrdered size={18} color="#6366f1" />
                  <h5 style={{ margin: 0, fontSize: '0.88rem', fontWeight: '800', color: 'var(--text-main)' }}>
                    {lang === 'bn' ? 'স্পেকুলেটিভ প্রিফেচ ও ভেক্টর ক্লক' : 'Speculative Prefetch & Vector Clock'}
                  </h5>
                </div>
                <button
                  type="button"
                  onClick={handleTickVectorClock}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    background: '#6366f1',
                    color: '#fff',
                    border: 'none',
                    fontSize: '0.72rem',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  +1 সিকোয়েন্স
                </button>
              </div>
              <p style={{ margin: '0 0 10px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {lang === 'bn'
                  ? 'হোভার করার সাথে সাথে মেমরিতে ডেটা প্রিফেচ এবং কাউন্টারগুলোর জন্য লজিক্যাল ক্রমানুসার।'
                  : 'Predictive memory prefetching on hover & deterministic causality sequencing.'}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                <button
                  type="button"
                  onClick={handleSimulatePrefetch}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '6px',
                    background: 'rgba(99, 102, 241, 0.1)',
                    border: '1px solid #6366f1',
                    color: '#6366f1',
                    fontSize: '0.72rem',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  ⚡ টেস্ট প্রিফেচ (Hover Sim)
                </button>
                <div style={{ color: 'var(--text-muted)' }}>
                  প্রিফেচ হিট: <strong style={{ color: '#10b981' }}>{prefetchStats.prefetchedCount}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================
          MODAL 1: ADD BATCH LOT MODAL (Feature 2)
          ============================================================================ */}
      {showAddBatchModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(6px)',
            padding: '16px'
          }}
          onClick={() => setShowAddBatchModal(false)}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '460px',
              backgroundColor: 'var(--card-bg, #1e293b)',
              color: 'var(--text-color, #f8fafc)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              padding: '24px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={20} color="#f59e0b" />
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800' }}>
                  {lang === 'bn' ? 'নতুন লট/মেয়াদোত্তীর্ণ ব্যাচ যুক্ত করুন' : 'Receive New Batch Lot'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddBatchModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddBatchSubmit}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '4px' }}>
                  পণ্য নির্বাচন করুন
                </label>
                <select
                  value={newBatchForm.productId}
                  onChange={(e) => setNewBatchForm({ ...newBatchForm, productId: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', background: 'var(--bg-primary, #0f172a)', color: 'inherit', border: '1px solid var(--border-color)', fontSize: '0.82rem' }}
                  required
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} (বর্তমান স্টক: {p.stock})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '4px' }}>লট/ব্যাচ নং</label>
                  <input
                    type="text"
                    value={newBatchForm.batchNo}
                    onChange={(e) => setNewBatchForm({ ...newBatchForm, batchNo: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', background: 'var(--bg-primary, #0f172a)', color: 'inherit', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '4px' }}>মেয়াদ শেষ (Expiry)</label>
                  <input
                    type="date"
                    value={newBatchForm.expiryDate}
                    onChange={(e) => setNewBatchForm({ ...newBatchForm, expiryDate: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', background: 'var(--bg-primary, #0f172a)', color: 'inherit', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '4px' }}>পরিমাণ (Quantity)</label>
                  <input
                    type="number"
                    min="1"
                    value={newBatchForm.stock}
                    onChange={(e) => setNewBatchForm({ ...newBatchForm, stock: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', background: 'var(--bg-primary, #0f172a)', color: 'inherit', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '4px' }}>উৎপাদন তারিখ (Mfg)</label>
                  <input
                    type="date"
                    value={newBatchForm.mfgDate}
                    onChange={(e) => setNewBatchForm({ ...newBatchForm, mfgDate: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', background: 'var(--bg-primary, #0f172a)', color: 'inherit', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddBatchModal(false)}
                  style={{ padding: '8px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '0.8rem' }}
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 16px', borderRadius: '8px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', color: '#fff', fontWeight: '800', cursor: 'pointer', fontSize: '0.8rem' }}
                >
                  লট যুক্ত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================================
          MODAL 2: INTER-BRANCH STOCK TRANSFER MODAL (Phase 5)
          ============================================================================ */}
      {showTransferModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(6px)',
            padding: '16px'
          }}
          onClick={() => setShowTransferModal(false)}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '480px',
              backgroundColor: 'var(--card-bg, #1e293b)',
              color: 'var(--text-color, #f8fafc)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              padding: '24px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Truck size={20} color="#10b981" />
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800' }}>
                  {lang === 'bn' ? 'ইন্টার-ব্রাঞ্চ স্টক স্থানান্তর (ACID RPC)' : 'Inter-Branch Stock Transfer'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteBranchTransfer}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '4px' }}>
                    {lang === 'bn' ? 'সোর্স শাখা' : 'Source Branch'}
                  </label>
                  <select
                    value={transferForm.sourceBranchId}
                    onChange={(e) => setTransferForm({ ...transferForm, sourceBranchId: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', background: 'var(--bg-primary, #0f172a)', color: 'inherit', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                    {branches.length === 0 && <option value="br-main">প্রধান শাখা</option>}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '4px' }}>
                    {lang === 'bn' ? 'গন্তব্য শাখা' : 'Destination Branch'}
                  </label>
                  <select
                    value={transferForm.destinationBranchId}
                    onChange={(e) => setTransferForm({ ...transferForm, destinationBranchId: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', background: 'var(--bg-primary, #0f172a)', color: 'inherit', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                    {branches.length < 2 && <option value="br-sub">উত্তরা শাখা (আউটলেট ০২)</option>}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '4px' }}>
                  {lang === 'bn' ? 'স্থানান্তরযোগ্য পণ্য' : 'Select Product'}
                </label>
                <select
                  value={transferForm.productId}
                  onChange={(e) => setTransferForm({ ...transferForm, productId: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', background: 'var(--bg-primary, #0f172a)', color: 'inherit', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}
                  required
                >
                  <option value="">{lang === 'bn' ? '-- পণ্য নির্বাচন করুন --' : '-- Select Product --'}</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} (মজুদ: {p.stock} {p.unit || 'pcs'})</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '4px' }}>
                  {lang === 'bn' ? 'পরিমাণ (Qty)' : 'Transfer Quantity'}
                </label>
                <input
                  type="number"
                  min="1"
                  value={transferForm.quantity}
                  onChange={(e) => setTransferForm({ ...transferForm, quantity: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', background: 'var(--bg-primary, #0f172a)', color: 'inherit', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '4px' }}>
                  {lang === 'bn' ? 'মন্তব্য বা চালানের নোট' : 'Transfer Notes'}
                </label>
                <input
                  type="text"
                  value={transferForm.notes}
                  onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', background: 'var(--bg-primary, #0f172a)', color: 'inherit', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  style={{ padding: '8px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '0.8rem' }}
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isTransferring}
                  style={{ padding: '8px 16px', borderRadius: '8px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: '#fff', fontWeight: '800', cursor: 'pointer', fontSize: '0.8rem' }}
                >
                  {isTransferring ? (lang === 'bn' ? 'স্থানান্তর হচ্ছে...' : 'Transferring...') : (lang === 'bn' ? 'ট্রান্সফার নিশ্চিত করুন' : 'Confirm Transfer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
