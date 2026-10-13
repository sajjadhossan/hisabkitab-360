import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  idbGet,
  idbSet,
  idbBulkSet,
  idbGetAllKeys,
  idbCompactAndOptimize
} from '../../utils/idbStorage';
import {
  getStorageQuotaEstimate,
  requestPersistentStorage
} from '../../services/storageQuotaService';
import {
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Zap,
  ShieldCheck,
  Layers,
  Sparkles,
  Database,
  ArrowDownCircle,
  FileCheck2,
  Activity
} from 'lucide-react';

export const LocalDatabaseManager = () => {
  const {
    lang,
    showToast,
    products,
    salesHistory,
    invoices,
    customers,
    businessDebts,
    personalExpenses,
    personalIncomes
  } = useApp();

  const [quotaInfo, setQuotaInfo] = useState({
    usageFormatted: '0 MB',
    quotaFormatted: '0 MB',
    percentUsed: 0,
    isPersisted: false
  });
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [idbKeyCount, setIdbKeyCount] = useState(0);
  const [diagResult, setDiagResult] = useState(null);

  const loadQuota = async () => {
    setLoading(true);
    try {
      const q = await getStorageQuotaEstimate();
      setQuotaInfo(q);
      const keys = await idbGetAllKeys();
      setIdbKeyCount(keys.length);
    } catch (err) {
      console.warn('Quota load failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuota();
  }, []);

  const handleEnablePersist = async () => {
    const granted = await requestPersistentStorage();
    if (granted) {
      showToast(lang === 'bn' ? '✓ পারসিস্টেন্ট স্টোরেজ সফলভাবে সক্রিয় হয়েছে!' : 'Persistent storage granted!', 'success');
      loadQuota();
    } else {
      showToast(lang === 'bn' ? 'পারসিস্টেন্ট অনুমতি প্রাপ্ত হয়নি' : 'Permission not granted', 'info');
    }
  };

  const handleSyncAllToIndexedDb = async () => {
    setOptimizing(true);
    try {
      const entries = [
        ['hk360_biz_products', products],
        ['hk360_biz_sales', salesHistory],
        ['hk360_biz_invoices', invoices],
        ['hk360_biz_customers', customers],
        ['hk360_biz_debts', businessDebts],
        ['hk360_personal_expenses', personalExpenses],
        ['hk360_personal_incomes', personalIncomes]
      ];

      await idbBulkSet(entries);
      await loadQuota();

      showToast(
        lang === 'bn'
          ? `✓ সফলভাবে ${products.length}টি পণ্য ও ${salesHistory.length}টি বিক্রয় IndexedDB-তে ব্যাকআপ হয়েছে!`
          : `Synced all ${products.length} products to IndexedDB!`,
        'success'
      );
    } catch (err) {
      showToast(lang === 'bn' ? 'সিঙ্ক ব্যর্থ হয়েছে' : 'Sync failed', 'error');
    } finally {
      setOptimizing(false);
    }
  };

  const handleCompactAndOptimize = async () => {
    setOptimizing(true);
    try {
      const res = await idbCompactAndOptimize();
      await loadQuota();
      setDiagResult({
        title: lang === 'bn' ? 'ডাটাবেজ অপটিমাইজেশন সম্পন্ন' : 'Optimization complete',
        message: lang === 'bn'
          ? `✓ লোকাল ডাটাবেজ সফলভাবে ডিফ্র্যাগমেন্ট ও অপটিমাইজ করা হয়েছে (${res.cleanedKeys || 0}টি অপ্রয়োজনীয় টেম্পোরারি রেকর্ড মুছে ফেলা হয়েছে)।`
          : `Cleaned ${res.cleanedKeys || 0} temporary keys.`
      });
      showToast(lang === 'bn' ? '✓ লোকাল ডাটাবেজ অপটিমাইজেশন সম্পন্ন!' : 'Database optimized!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setOptimizing(false);
    }
  };

  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        padding: '1.5rem',
        marginTop: '1rem'
      }}
    >
      {/* Header Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(99, 102, 241, 0.2))',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <HardDrive size={24} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{lang === 'bn' ? 'লোকাল-ফার্স্ট IndexedDB স্টোরেজ হাব' : 'Local-First IndexedDB Engine'}</span>
              <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontWeight: '800' }}>
                PHASE 2
              </span>
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {lang === 'bn'
                ? 'হাই-স্পিড নন-ব্লকিং লোকাল ডাটাবেজ (১০০,০০০+ পণ্য ও ভাউচার অফলাইন স্টোরেজ)'
                : 'High-speed non-blocking local storage (100k+ items & transactions offline)'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={loadQuota}
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
            <span>{lang === 'bn' ? 'স্ট্যাটাস রিফ্রেশ' : 'Refresh'}</span>
          </button>

          <button
            type="button"
            onClick={handleCompactAndOptimize}
            disabled={optimizing}
            className="btn btn-secondary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              fontSize: '0.8rem',
              fontWeight: '800',
              borderRadius: '8px',
              border: '1.5px solid #38bdf8',
              color: '#38bdf8',
              background: 'rgba(56, 189, 248, 0.1)',
              cursor: 'pointer'
            }}
          >
            <Sparkles size={14} className={optimizing ? 'animate-spin' : ''} />
            <span>{optimizing ? (lang === 'bn' ? 'অপটিমাইজ হচ্ছে...' : 'Optimizing...') : (lang === 'bn' ? 'ডাটাবেজ কম্প্যাক্ট ও অপটিমাইজ' : 'Optimize DB')}</span>
          </button>
        </div>
      </div>

      {/* Storage Gauge & Eviction Protection Card */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '12px',
          marginBottom: '1.25rem'
        }}
      >
        {/* Metric 1: Space Usage */}
        <div style={{ padding: '14px', borderRadius: '12px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700' }}>
              {lang === 'bn' ? 'লোকাল স্টোরেজ ব্যবহার' : 'Local Storage Usage'}
            </span>
            <Database size={16} color="var(--business-primary)" />
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)' }}>
            {quotaInfo.usageFormatted}{' '}
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>
              / {quotaInfo.quotaFormatted}
            </span>
          </div>
          <div style={{ marginTop: '8px', height: '6px', width: '100%', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${Math.min(100, Math.max(1, quotaInfo.percentUsed))}%`,
                background: quotaInfo.percentUsed > 80 ? '#ef4444' : 'var(--business-primary)',
                transition: 'width 0.4s ease'
              }}
            />
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            {quotaInfo.percentUsed}% কোটা ব্যবহৃত (অসীম ক্যাপাসিটি)
          </div>
        </div>

        {/* Metric 2: Persistent Storage Protection */}
        <div style={{ padding: '14px', borderRadius: '12px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700' }}>
              {lang === 'bn' ? 'ডাটাবেজ ইভিকশন সুরক্ষা' : 'Eviction Protection'}
            </span>
            <ShieldCheck size={16} color={quotaInfo.isPersisted ? '#10b981' : '#f59e0b'} />
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: '800', color: quotaInfo.isPersisted ? '#10b981' : 'var(--text-main)' }}>
            {quotaInfo.isPersisted
              ? (lang === 'bn' ? '🟢 পারসিস্টেন্ট স্টোরেজ সুরক্ষিত' : 'Protected (Never Evicted)')
              : (lang === 'bn' ? '🟡 স্ট্যান্ডার্ড স্টোরেজ' : 'Standard Mode')}
          </div>
          <p style={{ margin: '4px 0 8px', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
            {quotaInfo.isPersisted
              ? (lang === 'bn' ? 'ব্রাউজার বা মেমোরি ক্লিনার কখনো স্বয়ংক্রিয়ভাবে আপনার হিসাব মুছতে পারবে না।' : 'Browser will never auto-delete your business data.')
              : (lang === 'bn' ? 'সুরক্ষা সম্পূর্ণ নিশ্চিত করতে পারসিস্টেন্ট পারমিশন চালু করুন।' : 'Enable persistence to prevent OS eviction.')}
          </p>
          {!quotaInfo.isPersisted && (
            <button
              type="button"
              onClick={handleEnablePersist}
              style={{
                fontSize: '0.72rem',
                fontWeight: '800',
                padding: '4px 10px',
                borderRadius: '6px',
                background: '#10b981',
                color: '#fff',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              🛡️ পারসিস্টেন্স অন করুন
            </button>
          )}
        </div>

        {/* Metric 3: Active Records count */}
        <div style={{ padding: '14px', borderRadius: '12px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700' }}>
              {lang === 'bn' ? 'সক্রিয় রেকর্ড কাউন্ট' : 'IndexedDB Records'}
            </span>
            <Activity size={16} color="#6366f1" />
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)' }}>
            {products.length + salesHistory.length + customers.length} টি
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {products.length} পণ্য • {salesHistory.length} ইনভয়েস • {customers.length} গ্রাহক
          </div>
        </div>
      </div>

      {/* Manual Full Sync Trigger Button */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          padding: '12px 14px',
          borderRadius: '12px',
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.25)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={18} color="#10b981" />
          <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)' }}>
            {lang === 'bn'
              ? 'সকল পণ্য, বিক্রয় ও দেনা-পাওনা খতিয়ানকে এখনি IndexedDB-তে ব্যাকআপ রাখুন'
              : 'Sync all products, invoices & ledgers directly into IndexedDB now'}
          </span>
        </div>

        <button
          type="button"
          onClick={handleSyncAllToIndexedDb}
          disabled={optimizing}
          className="press-scale"
          style={{
            padding: '6px 14px',
            borderRadius: '8px',
            fontSize: '0.78rem',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <ArrowDownCircle size={14} />
          <span>{lang === 'bn' ? '১-ক্লিক সম্পূর্ণ লোকাল সিঙ্ক' : 'Sync All to IndexedDB'}</span>
        </button>
      </div>

      {diagResult && (
        <div
          className="animate-fade-in"
          style={{
            marginTop: '10px',
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            fontSize: '0.78rem',
            color: 'var(--text-main)'
          }}
        >
          <strong>{diagResult.title}:</strong> {diagResult.message}
        </div>
      )}
    </div>
  );
};
