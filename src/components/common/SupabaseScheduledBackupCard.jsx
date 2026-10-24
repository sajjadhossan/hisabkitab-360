import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Power,
  Calendar,
  Send,
  Cloud,
  Check,
  Zap,
  Sliders
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  getScheduledBackupConfig,
  saveScheduledBackupConfig,
  getFormattedNextRun,
  executeScheduledBackupNow
} from '../../services/supabaseScheduledBackupService';

export const SupabaseScheduledBackupCard = ({ compact = false, onBackupSuccess }) => {
  const { lang, showToast, getActiveStateSnapshot } = useApp() || {};

  const [config, setConfig] = useState(() => getScheduledBackupConfig());
  const [nextRunText, setNextRunText] = useState(() => getFormattedNextRun(lang));
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [saveNotify, setSaveNotify] = useState(false);

  // Sync config on external changes
  useEffect(() => {
    const handleConfigChange = (e) => {
      if (e?.detail) {
        setConfig(e.detail);
        setNextRunText(getFormattedNextRun(lang));
      }
    };

    const handleBackupExecuted = (e) => {
      setConfig(getScheduledBackupConfig());
      setNextRunText(getFormattedNextRun(lang));
      if (e?.detail?.timeFormatted) {
        setFeedbackMsg(lang === 'bn' ? `✅ স্বয়ংক্রিয় ব্যাকআপ সফল (${e.detail.timeFormatted})` : `✅ Auto-backup succeeded (${e.detail.timeFormatted})`);
        setTimeout(() => setFeedbackMsg(''), 5000);
      }
    };

    window.addEventListener('hk360_supabase_scheduled_backup_config_changed', handleConfigChange);
    window.addEventListener('hk360_supabase_scheduled_backup_executed', handleBackupExecuted);

    // Refresh countdown every 30 seconds
    const timer = setInterval(() => {
      setNextRunText(getFormattedNextRun(lang));
    }, 30000);

    return () => {
      window.removeEventListener('hk360_supabase_scheduled_backup_config_changed', handleConfigChange);
      window.removeEventListener('hk360_supabase_scheduled_backup_executed', handleBackupExecuted);
      clearInterval(timer);
    };
  }, [lang]);

  const updateConfig = (updates) => {
    const updated = saveScheduledBackupConfig(updates);
    if (updated) {
      setConfig(updated);
      setNextRunText(getFormattedNextRun(lang));
      setSaveNotify(true);
      setTimeout(() => setSaveNotify(false), 2500);
    }
  };

  const handleToggle = () => {
    const nextState = !config.enabled;
    updateConfig({ enabled: nextState });
    showToast?.(
      nextState
        ? (lang === 'bn' ? '✓ সুপারবেস শিডিউল ব্যাকআপ চালু হয়েছে (ON)' : '✓ Scheduled backup enabled')
        : (lang === 'bn' ? '✕ সুপারবেস শিডিউল ব্যাকআপ বন্ধ করা হয়েছে (OFF)' : '✕ Scheduled backup disabled'),
      nextState ? 'success' : 'info'
    );
  };

  const handleManualTestRun = async () => {
    if (isRunningTest) return;
    setIsRunningTest(true);
    setFeedbackMsg('');

    try {
      const res = await executeScheduledBackupNow({
        getStateSnapshot: getActiveStateSnapshot,
        force: true,
        triggerReason: 'manual_test_click'
      });

      if (res?.success) {
        const timeStr = res.timeFormatted || new Date().toLocaleTimeString('bn-BD');
        setFeedbackMsg(lang === 'bn'
          ? `✅ টেস্ট সফল! সুপারবেসে স্ন্যাপশট সংরক্ষিত হয়েছে (${timeStr})${res.telegramSuccess ? ' + টেলিগ্রাম বট' : ''}`
          : `✅ Test succeeded! Snapshot saved to Supabase (${timeStr})`
        );
        showToast?.(lang === 'bn' ? '✓ শিডিউল ব্যাকআপ টেস্ট শতভাগ সফল!' : '✓ Backup test succeeded!', 'success');
        onBackupSuccess?.();
      } else {
        throw new Error(res?.error || 'ব্যর্থ হয়েছে');
      }
    } catch (err) {
      setFeedbackMsg(`❌ এরর: ${err.message}`);
      showToast?.(err.message, 'danger');
    } finally {
      setIsRunningTest(false);
      setNextRunText(getFormattedNextRun(lang));
    }
  };

  return (
    <div
      style={{
        background: config.enabled
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(59, 130, 246, 0.06) 100%)'
          : 'var(--bg-primary, #0f172a)',
        border: `1.5px solid ${config.enabled ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-color, #334155)'}`,
        borderRadius: '14px',
        padding: compact ? '12px 14px' : '16px 18px',
        marginBottom: '14px',
        boxShadow: config.enabled ? '0 4px 18px rgba(16, 185, 129, 0.12)' : 'none',
        transition: 'all 0.3s ease'
      }}
    >
      {/* Header with Master Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: config.enabled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.15)',
              color: config.enabled ? '#10b981' : '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: config.enabled ? '0 0 10px rgba(16, 185, 129, 0.3)' : 'none'
            }}
          >
            <Clock size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: '800', fontSize: '0.92rem', color: 'var(--text-main, #f8fafc)' }}>
                {lang === 'bn' ? 'সুপারবেস শিডিউল অটো-ব্যাকআপ' : 'Supabase Scheduled Auto-Backup'}
              </span>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: '800',
                  padding: '1px 7px',
                  borderRadius: '6px',
                  background: config.enabled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.2)',
                  color: config.enabled ? '#10b981' : '#94a3b8',
                  border: `1px solid ${config.enabled ? '#10b981' : '#64748b'}`
                }}
              >
                {config.enabled ? '● সক্রিয় (ON)' : '○ নিষ্ক্রিয় (OFF)'}
              </span>
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted, #94a3b8)', marginTop: '2px' }}>
              {lang === 'bn'
                ? 'প্রতিদিন নির্দিষ্ট সময়ে স্বয়ংক্রিয় ক্লাউড ব্যাকআপ • ইউজারকে ম্যানুয়ালি কিছু করতে হবে না'
                : 'Fully autonomous cloud backup at scheduled time • Zero manual effort'}
            </div>
          </div>
        </div>

        {/* Master ON/OFF Switch */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={handleToggle}
            style={{
              background: config.enabled
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : 'rgba(148, 163, 184, 0.2)',
              color: '#fff',
              border: 'none',
              borderRadius: '20px',
              padding: '6px 14px',
              fontSize: '0.78rem',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: config.enabled ? '0 2px 10px rgba(16, 185, 129, 0.4)' : 'none',
              transition: 'all 0.2s ease',
              minHeight: '34px'
            }}
          >
            <Power size={13} />
            <span>{config.enabled ? 'চালু আছে (ON)' : 'চালু করুন (OFF)'}</span>
          </button>
        </div>
      </div>

      {saveNotify && (
        <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Check size={13} />
          <span>{lang === 'bn' ? 'সেটিংস সফলভাবে সংরক্ষিত হয়েছে!' : 'Settings saved!'}</span>
        </div>
      )}

      {/* Settings Panel (Visible when ON) */}
      {config.enabled && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
          {/* Mode Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: '700', color: 'var(--text-muted, #94a3b8)' }}>
              {lang === 'bn' ? 'শিডিউলের ধরন:' : 'Schedule Mode:'}
            </span>

            <div style={{ display: 'inline-flex', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '8px', padding: '3px', border: '1px solid var(--border-color, #334155)' }}>
              <button
                type="button"
                onClick={() => updateConfig({ scheduleMode: 'daily' })}
                style={{
                  background: config.scheduleMode === 'daily' ? '#10b981' : 'transparent',
                  color: config.scheduleMode === 'daily' ? '#fff' : 'var(--text-muted, #94a3b8)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '0.74rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Calendar size={12} />
                <span>{lang === 'bn' ? 'প্রতিদিন নির্দিষ্ট সময়' : 'Daily Fixed Time'}</span>
              </button>

              <button
                type="button"
                onClick={() => updateConfig({ scheduleMode: 'interval' })}
                style={{
                  background: config.scheduleMode === 'interval' ? '#3b82f6' : 'transparent',
                  color: config.scheduleMode === 'interval' ? '#fff' : 'var(--text-muted, #94a3b8)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '0.74rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <RefreshCw size={12} />
                <span>{lang === 'bn' ? 'নির্দিষ্ট ব্যবধানে (Interval)' : 'Fixed Interval'}</span>
              </button>
            </div>
          </div>

          {/* Time Picker / Interval Controls */}
          {config.scheduleMode === 'daily' ? (
            <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted, #94a3b8)', fontWeight: '700' }}>
                  {lang === 'bn' ? 'প্রতিদিন কয়টায় ব্যাকআপ হবে:' : 'Daily backup time:'}
                </span>
                <input
                  type="time"
                  value={config.dailyTime || '23:00'}
                  onChange={(e) => updateConfig({ dailyTime: e.target.value })}
                  style={{
                    background: 'var(--card-bg, #1e293b)',
                    border: '1px solid #10b981',
                    borderRadius: '8px',
                    color: '#fff',
                    padding: '4px 8px',
                    fontSize: '0.82rem',
                    fontWeight: '800',
                    fontFamily: 'monospace',
                    cursor: 'pointer'
                  }}
                />
              </div>

              {/* Time Presets */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted, #94a3b8)' }}>প্রিসেট:</span>
                {[
                  { time: '22:00', label: 'রাত ১০:০০' },
                  { time: '23:00', label: 'রাত ১১:০০ (দোকান বন্ধ)' },
                  { time: '00:00', label: 'রাত ১২:০০' },
                  { time: '09:00', label: 'সকাল ৯:০০' }
                ].map((p) => (
                  <button
                    key={p.time}
                    type="button"
                    onClick={() => updateConfig({ dailyTime: p.time })}
                    style={{
                      background: config.dailyTime === p.time ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                      border: `1px solid ${config.dailyTime === p.time ? '#10b981' : 'rgba(255, 255, 255, 0.1)'}`,
                      color: config.dailyTime === p.time ? '#10b981' : 'var(--text-muted, #94a3b8)',
                      padding: '3px 7px',
                      borderRadius: '6px',
                      fontSize: '0.7rem',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-muted, #94a3b8)', fontWeight: '700' }}>
                {lang === 'bn' ? 'কতক্ষণ পর পর ব্যাকআপ হবে:' : 'Repeat interval:'}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  { hours: 1, label: 'প্রতি ১ ঘণ্টা' },
                  { hours: 3, label: 'প্রতি ৩ ঘণ্টা' },
                  { hours: 6, label: 'প্রতি ৬ ঘণ্টা (আদর্শ)' },
                  { hours: 12, label: 'প্রতি ১২ ঘণ্টা' },
                  { hours: 24, label: 'প্রতি ২৪ ঘণ্টা' }
                ].map((item) => (
                  <button
                    key={item.hours}
                    type="button"
                    onClick={() => updateConfig({ intervalHours: item.hours })}
                    style={{
                      background: Number(config.intervalHours) === item.hours ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                      border: `1px solid ${Number(config.intervalHours) === item.hours ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)'}`,
                      color: Number(config.intervalHours) === item.hours ? '#60a5fa' : 'var(--text-muted, #94a3b8)',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Telegram Sync Checkbox */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.76rem', color: 'var(--text-main, #f8fafc)', margin: '2px 0' }}>
            <input
              type="checkbox"
              checked={config.backupTelegramAlso !== false}
              onChange={(e) => updateConfig({ backupTelegramAlso: e.target.checked })}
              style={{ width: '15px', height: '15px', accentColor: '#0ea5e9', cursor: 'pointer' }}
            />
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Send size={13} style={{ color: '#0ea5e9' }} />
              <span>{lang === 'bn' ? 'একই সাথে টেলিগ্রাম বটেও ফাইল ব্যাকআপ পাঠাও (টেলিগ্রাম সিঙ্ক)' : 'Also push backup snapshot to Telegram Bot'}</span>
            </span>
          </label>

          {/* Status & Next Run Box */}
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '10px',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={15} style={{ color: '#10b981', flexShrink: 0 }} />
              <div style={{ fontSize: '0.76rem' }}>
                <span style={{ color: 'var(--text-muted, #94a3b8)' }}>{lang === 'bn' ? 'পরবর্তী শিডিউল রান: ' : 'Next Run: '}</span>
                <strong style={{ color: '#10b981' }}>{nextRunText}</strong>
              </div>
            </div>

            {config.lastMessage && (
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                {config.lastMessage}
              </div>
            )}
          </div>

          {/* Feedback message */}
          {feedbackMsg && (
            <div style={{ fontSize: '0.76rem', fontWeight: '700', color: feedbackMsg.startsWith('✅') ? '#10b981' : '#ef4444', background: feedbackMsg.startsWith('✅') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', padding: '6px 10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>{feedbackMsg}</span>
            </div>
          )}

          {/* Instant Test Action */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button
              type="button"
              disabled={isRunningTest}
              onClick={handleManualTestRun}
              style={{
                background: 'rgba(16, 185, 129, 0.18)',
                border: '1px solid #10b981',
                color: '#10b981',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '0.74rem',
                fontWeight: '800',
                cursor: isRunningTest ? 'wait' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="শিডিউল ব্যাকআপ অবিলম্বে টেস্ট রান করুন"
            >
              <RefreshCw size={12} className={isRunningTest ? 'animate-spin' : ''} />
              <span>{isRunningTest ? 'টেস্ট রান হচ্ছে...' : 'এখনই শিডিউল ব্যাকআপ টেস্ট করুন'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupabaseScheduledBackupCard;
