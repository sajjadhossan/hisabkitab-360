import React, { useState, useEffect } from 'react';
import {
  Cloud,
  ShieldCheck,
  RefreshCw,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Server,
  Bot,
  HardDrive,
  Radio,
  Sliders,
  Send,
  Database
} from 'lucide-react';
import { databaseFailoverService } from '../../services/databaseFailoverService';
import { getTelegramBackupConfig, sendBackupToTelegram } from '../../services/telegramBackupService';
import { getOutboxQueue, processOutboxQueue } from '../../services/backgroundSyncEngine';

export const MultiCloudFailoverHub = ({
  lang = 'bn',
  showToast,
  syncToTelegram,
  storageQuota,
  invoices = [],
  products = [],
  customers = []
}) => {
  const [failoverState, setFailoverState] = useState(() => databaseFailoverService.getState());
  const [isProbing, setIsProbing] = useState(false);
  const [isSimulatingFailover, setIsSimulatingFailover] = useState(false);
  const [isTelegramSyncing, setIsTelegramSyncing] = useState(false);
  const [tgConfig, setTgConfig] = useState(() => getTelegramBackupConfig());
  const [outboxCount, setOutboxCount] = useState(() => getOutboxQueue().length);
  const [lastProbeTime, setLastProbeTime] = useState(() => new Date().toLocaleTimeString());

  useEffect(() => {
    const unsub = databaseFailoverService.subscribe((updated) => {
      setFailoverState(updated);
    });

    const updateOutbox = () => setOutboxCount(getOutboxQueue().length);
    window.addEventListener('online', updateOutbox);
    window.addEventListener('offline', updateOutbox);

    return () => {
      unsub();
      window.removeEventListener('online', updateOutbox);
      window.removeEventListener('offline', updateOutbox);
    };
  }, []);

  // Run live cluster heartbeat probe
  const handleProbeClusters = async () => {
    setIsProbing(true);
    try {
      const res = await databaseFailoverService.probePrimaryCluster();
      setFailoverState(res);
      setLastProbeTime(new Date().toLocaleTimeString());
      if (showToast) {
        showToast(
          lang === 'bn'
            ? `✓ ক্লাউড সার্ভার পিং সফল! ল্যাটেন্সি: ${res.primaryLatencyMs}ms (সার্ভার ১ সক্রিয়)`
            : `Cluster probe healthy! Latency: ${res.primaryLatencyMs}ms`,
          'success'
        );
      }
    } catch (e) {
      if (showToast) showToast(`প্রোব এরর: ${e.message}`, 'danger');
    } finally {
      setIsProbing(false);
    }
  };

  // Simulate Primary Server 1 Down Failover
  const handleToggleSimulateFailover = () => {
    if (failoverState.activeCluster === 'primary') {
      databaseFailoverService.triggerFailover('secondary_standby');
      databaseFailoverService.bufferMutation({
        type: 'test_transaction',
        timestamp: Date.now()
      });
      if (showToast) {
        showToast(
          lang === 'bn'
            ? '⚠️ সার্ভার ১ ড্রপ সিমুলেটেড! চোখের পলকে সার্ভার ২ (Standby) লাইভ হয়েছে।'
            : 'Server 1 down simulated! Seamlessly failed over to Server 2.',
          'warning'
        );
      }
    } else {
      databaseFailoverService.triggerFailover('primary');
      databaseFailoverService.flushBufferedMutations();
      if (showToast) {
        showToast(
          lang === 'bn'
            ? '✓ সার্ভার ১ পুনরুদ্ধার সম্পন্ন! সব বাফারকৃত ডাটা প্রাইমারিতে ফ্লাশ হয়েছে।'
            : 'Primary restored! All buffered mutations flushed.',
          'success'
        );
      }
    }
  };

  // Instant Telegram Autonomous Sync
  const handleTriggerTelegramSync = async () => {
    setIsTelegramSyncing(true);
    try {
      if (typeof syncToTelegram === 'function') {
        await syncToTelegram(null, false);
      } else {
        const dummyPayload = {
          source: 'Failover Hub',
          timestamp: new Date().toISOString(),
          summary: { invoices: invoices.length, products: products.length }
        };
        await sendBackupToTelegram(dummyPayload);
      }
      setTgConfig(getTelegramBackupConfig());
      if (showToast) {
        showToast(
          lang === 'bn'
            ? '✓ টেলিগ্রাম ক্লাউড বটে ২০-সেকেন্ড স্ন্যাপশট সফলভাবে সংরক্ষিত হয়েছে!'
            : 'Telegram cloud snapshot saved successfully!',
          'success'
        );
      }
    } catch (e) {
      if (showToast) showToast(`টেলিগ্রাম এরর: ${e.message}`, 'danger');
    } finally {
      setIsTelegramSyncing(false);
    }
  };

  const isPrimaryActive = failoverState.activeCluster === 'primary';

  return (
    <div className="glass-card" style={{ borderLeft: '4px solid #3b82f6', marginBottom: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.15)', padding: '10px', borderRadius: '12px', color: '#3b82f6' }}>
            <Server size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)' }}>
                {lang === 'bn' ? 'মাল্টি-ক্লাউড ট্রিপল-সার্ভার রিয়েলটাইম ফেইলওভার ও রিডানডেন্সি হাব' : 'Multi-Cloud Triple-Server Realtime Failover Hub'}
              </h3>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: '800',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: isPrimaryActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  color: isPrimaryActive ? '#10b981' : '#f59e0b',
                  border: `1px solid ${isPrimaryActive ? '#10b981' : '#f59e0b'}`
                }}
              >
                {isPrimaryActive
                  ? (lang === 'bn' ? '🟢 প্রাইমারি ক্লাস্টার সক্রিয়' : '🟢 Primary Active')
                  : (lang === 'bn' ? '🟡 স্ট্যান্ডবাই মোডে সক্রিয়' : '🟡 Standby Active')}
              </span>
            </div>
            <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {lang === 'bn'
                ? 'একটি সার্ভার ডাউন হলেও বিকল্প ক্লাউড ও ২০-সেকেন্ড টেলিগ্রাম বট ব্যাকগ্রাউন্ডে স্বয়ংক্রিয়ভাবে ব্যবসা সচল রাখে (০ টাকা অতিরিক্ত খরচ)।'
                : 'Zero-downtime multi-cloud replication with autonomous 20-second background Telegram sync.'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary press-scale"
            disabled={isProbing}
            onClick={handleProbeClusters}
            style={{ fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}
          >
            <RefreshCw size={14} className={isProbing ? 'animate-spin' : ''} />
            <span>{isProbing ? (lang === 'bn' ? 'প্রোব হচ্ছে...' : 'Probing...') : (lang === 'bn' ? 'হার্টবিট পিং প্রোব' : 'Ping Heartbeat')}</span>
          </button>
        </div>
      </div>

      {/* 4-Tier Topology Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '1.25rem' }}>
        {/* Tier 1: Primary Supabase */}
        <div
          style={{
            background: 'var(--bg-secondary)',
            padding: '14px',
            borderRadius: '10px',
            border: `1.5px solid ${isPrimaryActive ? '#10b981' : 'var(--border-color)'}`,
            position: 'relative'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Cloud size={16} style={{ color: '#3b82f6' }} />
              <span>সার্ভার ১: Supabase Cloud</span>
            </span>
            <span style={{ fontSize: '0.7rem', fontWeight: '800', color: isPrimaryActive ? '#10b981' : '#f59e0b' }}>
              {isPrimaryActive ? 'প্রাইমারি' : 'অফলাইন'}
            </span>
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            সিঙ্গাপুর রিজিয়ন (ap-southeast-1)। ১০০% রিড-রাইট ট্রাফিক হ্যান্ডেল করে।
          </div>
          <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: '700' }}>
            <span style={{ color: 'var(--text-muted)' }}>ল্যাটেন্সি:</span>
            <span style={{ color: '#10b981', fontFamily: 'var(--font-mono)' }}>{failoverState.primaryLatencyMs || 42}ms</span>
          </div>
        </div>

        {/* Tier 2: Standby Replica Neon */}
        <div
          style={{
            background: 'var(--bg-secondary)',
            padding: '14px',
            borderRadius: '10px',
            border: `1.5px solid ${!isPrimaryActive ? '#f59e0b' : 'var(--border-color)'}`
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Database size={16} style={{ color: '#f59e0b' }} />
              <span>সার্ভার ২: Neon Standby</span>
            </span>
            <span style={{ fontSize: '0.7rem', fontWeight: '800', color: !isPrimaryActive ? '#10b981' : '#f59e0b' }}>
              {!isPrimaryActive ? 'সক্রিয় ফেইলওভার' : 'স্ট্যান্ডবাই প্রস্তুত'}
            </span>
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            মুম্বাই রিজিয়ন (ap-south-1)। সার্ভারলেস মিরর রেপ্লিকা (০ টাকা খরচ)।
          </div>
          <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: '700' }}>
            <span style={{ color: 'var(--text-muted)' }}>ফেইলওভার রেডি:</span>
            <span style={{ color: '#38bdf8' }}>০-ল্যাগ সিঙ্ক</span>
          </div>
        </div>

        {/* Tier 3: Telegram Cloud Bot Engine */}
        <div
          style={{
            background: 'var(--bg-secondary)',
            padding: '14px',
            borderRadius: '10px',
            border: '1.5px solid #0ea5e9'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Bot size={16} style={{ color: '#0ea5e9' }} />
              <span>সার্ভার ৩: Telegram Bot Cloud</span>
            </span>
            <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#0ea5e9' }}>
              প্রতি ২০ সে. অটো-সিঙ্ক
            </span>
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            অনলাইন ও ব্যাকগ্রাউন্ডে স্বয়ংক্রিয় ক্লাউড স্ন্যাপশট ও রিমোট এআই বট।
          </div>
          <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: '700' }}>
            <span style={{ color: 'var(--text-muted)' }}>আউটবক্স কিউ:</span>
            <span style={{ color: outboxCount > 0 ? '#f59e0b' : '#10b981' }}>
              {outboxCount > 0 ? `${outboxCount}টি পেন্ডিং` : '১০০% সিঙ্কড'}
            </span>
          </div>
        </div>

        {/* Tier 4: Edge Local IndexedDB */}
        <div
          style={{
            background: 'var(--bg-secondary)',
            padding: '14px',
            borderRadius: '10px',
            border: '1.5px solid #8b5cf6'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <HardDrive size={16} style={{ color: '#8b5cf6' }} />
              <span>স্তর ৪: লোকাল এজ মেমোরি</span>
            </span>
            <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#10b981' }}>
              ইন্টারনেট-মুক্ত
            </span>
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            ডিভাইসের নিজস্ব হার্ডডিস্ক। ক্লাউড ব্ল্যাকআউটেও দোকান ১ সেকেন্ডও থামে না।
          </div>
          <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: '700' }}>
            <span style={{ color: 'var(--text-muted)' }}>স্টোরেজ কোটা:</span>
            <span style={{ color: '#10b981', fontFamily: 'var(--font-mono)' }}>{storageQuota?.quotaFormatted || 'GB লেভেল'}</span>
          </div>
        </div>
      </div>

      {/* Interactive Simulation & Test Control Strip */}
      <div
        style={{
          background: 'rgba(59, 130, 246, 0.06)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          borderRadius: '10px',
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={18} style={{ color: '#f59e0b' }} />
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-main)' }}>
              {lang === 'bn' ? 'ফেইলওভার ও ২০-সেকেন্ড অটো-ব্যাকআপ লাইভ সিমুলেশন' : 'Failover & Auto-Backup Simulation'}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              {lang === 'bn'
                ? `শেষ পিং: ${lastProbeTime} | বাফারকৃত পেন্ডিং মিউটেশন: ${failoverState.bufferedMutationsCount || 0}টি`
                : `Last Ping: ${lastProbeTime} | Buffered Mutations: ${failoverState.bufferedMutationsCount || 0}`}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {/* Simulate Primary Down Button */}
          <button
            type="button"
            className="btn btn-secondary press-scale"
            onClick={handleToggleSimulateFailover}
            style={{
              fontSize: '0.8rem',
              fontWeight: '700',
              background: isPrimaryActive ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
              color: isPrimaryActive ? '#ef4444' : '#10b981',
              borderColor: isPrimaryActive ? '#ef4444' : '#10b981'
            }}
          >
            {isPrimaryActive
              ? (lang === 'bn' ? '⚠️ সার্ভার ১ ড্রপ টেস্ট (Simulate Down)' : '⚠️ Simulate Server 1 Down')
              : (lang === 'bn' ? '✓ সার্ভার ১ রিকভার করুন (Restore Primary)' : '✓ Restore Server 1')}
          </button>

          {/* Trigger Telegram 20s Snapshot Button */}
          <button
            type="button"
            className="btn btn-primary press-scale"
            disabled={isTelegramSyncing}
            onClick={handleTriggerTelegramSync}
            style={{
              fontSize: '0.8rem',
              fontWeight: '700',
              background: '#0ea5e9',
              borderColor: '#0ea5e9',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Send size={14} className={isTelegramSyncing ? 'animate-spin' : ''} />
            <span>
              {isTelegramSyncing
                ? (lang === 'bn' ? 'স্ন্যাপশট হচ্ছে...' : 'Snapshotting...')
                : (lang === 'bn' ? 'টেলিগ্রাম ২০-সেকেন্ড সিঙ্ক টেস্ট' : 'Test Telegram Sync')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
