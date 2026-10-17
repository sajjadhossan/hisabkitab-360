import React, { useState, useEffect } from 'react';
import {
  Send,
  Bot,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  X,
  ShieldCheck,
  FolderOpen,
  ShoppingBag,
  Home,
  FileText,
  UserPlus,
  Package,
  CreditCard,
  Lock,
  Radio,
  Terminal,
  HelpCircle,
  Cloud,
  Mic,
  Key,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { hapticFeedback } from '../../services/nativeAppService';
import {
  getTelegramBackupConfig,
  saveTelegramBackupConfig,
  testTelegramBackupBot,
  registerTelegramCommands
} from '../../services/telegramBackupService';
import { testGeminiApiKey } from '../../services/telegramVoiceToTextService';

export const TelegramBotModal = ({ isOpen, onClose }) => {
  const {
    lang = 'bn',
    showToast,
    syncToTelegram,
    driveUser
  } = useApp();

  const { user } = useAuth();

  const [tgConfig, setTgConfig] = useState(() => getTelegramBackupConfig());
  const [isTesting, setIsTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState(null);
  const [testError, setTestError] = useState(null);
  const [isTestingGemini, setIsTestingGemini] = useState(false);
  const [geminiTestStatus, setGeminiTestStatus] = useState(null); // 'success' | 'error' | null
  const [geminiTestMsg, setGeminiTestMsg] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [copiedKey, setCopiedKey] = useState('');
  const [activeTab, setActiveTab] = useState('config'); // 'config' | 'folders' | 'commands' | 'voice'

  const activeUserEmail = user?.email || (typeof window !== 'undefined' ? localStorage.getItem('hk360_connected_user_account') : '') || 'hossansajjad1994@gmail.com';
  const driveAccount = driveUser?.email || (typeof window !== 'undefined' ? localStorage.getItem('hk360_connected_drive_account') : '') || activeUserEmail;

  useEffect(() => {
    if (isOpen) {
      setTgConfig(getTelegramBackupConfig());
      setTestSuccess(null);
      setTestError(null);
      setGeminiTestStatus(null);
      setGeminiTestMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    hapticFeedback?.light?.();
    setTimeout(() => setCopiedKey(''), 2000);
    if (showToast) {
      showToast(lang === 'bn' ? 'ক্লিপবোর্ডে কপি হয়েছে!' : 'Copied to clipboard!', 'info');
    }
  };

  const handleTestGemini = async () => {
    const key = (tgConfig.geminiApiKey || '').trim();
    if (!key) {
      if (showToast) {
        showToast(lang === 'bn' ? 'দয়া করে Gemini API Key ফিল্ডে কি লিখুন।' : 'Please enter Gemini API Key.', 'warning');
      }
      return;
    }
    setIsTestingGemini(true);
    setGeminiTestStatus(null);
    setGeminiTestMsg('');
    hapticFeedback?.light?.();
    try {
      await testGeminiApiKey(key);
      setGeminiTestStatus('success');
      setGeminiTestMsg(lang === 'bn' ? 'Gemini API Key ভেরিফাই সম্পন্ন! ভয়েস-টু-টেক্সট ১০০% প্রস্তুত।' : 'Gemini Key verified successfully!');
      if (typeof window !== 'undefined') {
        localStorage.setItem('hk360_gemini_api_key', key);
      }
      hapticFeedback?.success?.();
      if (showToast) {
        showToast(lang === 'bn' ? 'Gemini এআই কি সফলভাবে ভেরিফাই হয়েছে!' : 'Gemini Key verified!', 'success');
      }
    } catch (err) {
      setGeminiTestStatus('error');
      setGeminiTestMsg(err.message || 'ভেরিফিকেশন ব্যর্থ হয়েছে।');
      hapticFeedback?.warning?.();
      if (showToast) {
        showToast(lang === 'bn' ? `ত্রুটি: ${err.message}` : `Error: ${err.message}`, 'danger');
      }
    } finally {
      setIsTestingGemini(false);
    }
  };

  const handleSave = () => {
    const payload = {
      ...tgConfig,
      enabled: tgConfig.botToken ? true : Boolean(tgConfig.enabled)
    };
    saveTelegramBackupConfig(payload);
    setTgConfig(payload);
    if (payload.geminiApiKey && typeof window !== 'undefined') {
      localStorage.setItem('hk360_gemini_api_key', payload.geminiApiKey);
    }
    if (payload.botToken) {
      registerTelegramCommands(payload.botToken).catch(() => {});
    }
    hapticFeedback?.success?.();
    if (showToast) {
      showToast(
        lang === 'bn' ? 'টেলিগ্রাম বট ও ভয়েস এআই কনফিগারেশন সংরক্ষিত হয়েছে!' : 'Telegram & Voice AI configuration saved!',
        'success'
      );
    }
  };

  const handleTestBot = async () => {
    if (!tgConfig.botToken || !tgConfig.chatId) {
      if (showToast) {
        showToast(
          lang === 'bn' ? 'দয়া করে Bot Token ও Chat ID উভয় ফিল্ড পূরণ করুন।' : 'Please fill both Bot Token and Chat ID.',
          'warning'
        );
      }
      return;
    }

    setIsTesting(true);
    setTestSuccess(null);
    setTestError(null);
    hapticFeedback?.light?.();

    try {
      const res = await testTelegramBackupBot(tgConfig.botToken, tgConfig.chatId);
      setTestSuccess(res.botUsername);
      registerTelegramCommands(tgConfig.botToken).catch(() => {});
      hapticFeedback?.success?.();
      if (showToast) {
        showToast(
          lang === 'bn'
            ? `✅ বট @${res.botUsername} সফলভাবে ভেরিফাই হয়েছে ও টেস্ট মেসেজ পাঠানো হয়েছে!`
            : `Bot @${res.botUsername} verified & test message sent!`,
          'success'
        );
      }
    } catch (err) {
      setTestError(err.message || 'টেস্ট সংযোগ ব্যর্থ হয়েছে।');
      hapticFeedback?.warning?.();
      if (showToast) {
        showToast(lang === 'bn' ? `❌ টেস্ট ব্যর্থ: ${err.message}` : `Test failed: ${err.message}`, 'danger');
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handleManualBackup = async () => {
    if (!tgConfig.botToken || !tgConfig.chatId) {
      if (showToast) {
        showToast(lang === 'bn' ? 'দয়া করে আগে টেলিগ্রাম বট সেভ করুন।' : 'Please save Telegram bot first.', 'warning');
      }
      return;
    }
    setIsSyncing(true);
    hapticFeedback?.light?.();
    try {
      const res = await syncToTelegram(tgConfig, true);
      if (res?.success) {
        setTgConfig(prev => ({ ...prev, lastSync: res.timestamp, lastFileName: res.fileName }));
        hapticFeedback?.success?.();
        if (showToast) {
          showToast(lang === 'bn' ? 'টেলিগ্রামে ব্যাকআপ সফলভাবে পাঠানো হয়েছে!' : 'Backup sent to Telegram!', 'success');
        }
      }
    } catch (err) {
      console.warn('Sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const isConfigured = Boolean(tgConfig.botToken && tgConfig.chatId);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--card-bg, #1e293b)',
          color: 'var(--text-main, #f8fafc)',
          borderRadius: '18px',
          border: '1px solid var(--border-color, #334155)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          width: '100%',
          maxWidth: '640px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.12), rgba(2, 132, 199, 0.05))'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(14, 165, 233, 0.4)'
              }}
            >
              <Send size={22} style={{ transform: 'rotate(-20deg) translate(1px, -1px)' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800' }}>
                  {lang === 'bn' ? 'টেলিগ্রাম ক্লাউড বট ও রিমোট কন্ট্রোল' : 'Telegram Bot & Remote Control Hub'}
                </h3>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: '800',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: isConfigured ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    color: isConfigured ? '#10b981' : '#f59e0b',
                    border: `1px solid ${isConfigured ? '#10b981' : '#f59e0b'}`
                  }}
                >
                  {isConfigured ? (lang === 'bn' ? '● সংযুক্ত (Live)' : '● Active') : (lang === 'bn' ? 'সেটআপ প্রয়োজন' : 'Setup Required')}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {lang === 'bn'
                  ? 'মোবাইল থেকে সরাসরি মেসেজ বা বাটনে হিসাব এন্ট্রি, লাইভ রিপোর্ট ও ৩-প্ল্যাটফর্ম সিঙ্ক'
                  : 'Remote entries, instant live reports, and cross-platform synchronization'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Unified 4-Platform Ecosystem Bar */}
        <div
          style={{
            background: 'var(--bg-primary, #0f172a)',
            padding: '10px 16px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
            fontSize: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
            <Radio size={14} style={{ color: '#0ea5e9' }} />
            <span>{lang === 'bn' ? 'সংযুক্ত ইকোসিস্টেম:' : 'Connected Ecosystem:'}</span>
            <strong style={{ color: '#3b82f6' }}>💻 পিসি</strong> •
            <strong style={{ color: '#10b981' }}>📱 মোবাইল</strong> •
            <strong style={{ color: '#8b5cf6' }}>🌐 ওয়েব</strong> •
            <strong style={{ color: '#0ea5e9' }}>🤖 টেলিগ্রাম বট</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Cloud size={14} style={{ color: '#10b981' }} />
            <span style={{ color: 'var(--text-muted)' }}>{lang === 'bn' ? 'অ্যাডমিন ড্রাইভ:' : 'Admin Drive:'}</span>
            <strong style={{ color: '#10b981' }}>{driveAccount}</strong>
          </div>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-color)',
            background: 'rgba(255, 255, 255, 0.02)'
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              background: activeTab === 'config' ? 'var(--card-bg)' : 'transparent',
              color: activeTab === 'config' ? '#0ea5e9' : 'var(--text-muted)',
              borderBottom: activeTab === 'config' ? '2.5px solid #0ea5e9' : 'none',
              fontWeight: '800',
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Bot size={15} />
            <span>{lang === 'bn' ? '১. বট সংযোগ ও টোকেন' : '1. Bot Credentials'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('folders')}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              background: activeTab === 'folders' ? 'var(--card-bg)' : 'transparent',
              color: activeTab === 'folders' ? '#0ea5e9' : 'var(--text-muted)',
              borderBottom: activeTab === 'folders' ? '2.5px solid #0ea5e9' : 'none',
              fontWeight: '800',
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <FolderOpen size={15} />
            <span>{lang === 'bn' ? '২. ফোল্ডার রিমোট মেনু' : '2. Remote Folders'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('commands')}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              background: activeTab === 'commands' ? 'var(--card-bg)' : 'transparent',
              color: activeTab === 'commands' ? '#0ea5e9' : 'var(--text-muted)',
              borderBottom: activeTab === 'commands' ? '2.5px solid #0ea5e9' : 'none',
              fontWeight: '800',
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Zap size={15} />
            <span>{lang === 'bn' ? '৩. সরাসরি কমান্ড' : '3. Text Commands'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('voice')}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              background: activeTab === 'voice' ? 'var(--card-bg)' : 'transparent',
              color: activeTab === 'voice' ? '#ec4899' : 'var(--text-muted)',
              borderBottom: activeTab === 'voice' ? '2.5px solid #ec4899' : 'none',
              fontWeight: '800',
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Mic size={15} />
            <span>{lang === 'bn' ? '৪. 🎤 ভয়েস এআই' : '4. Voice AI'}</span>
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1 }}>
          {/* TAB 1: Bot Credentials & Test */}
          {activeTab === 'config' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{
                  background: 'rgba(14, 165, 233, 0.08)',
                  border: '1px solid rgba(14, 165, 233, 0.3)',
                  borderRadius: '12px',
                  padding: '12px 14px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0ea5e9', fontWeight: '800', fontSize: '0.85rem' }}>
                  <ShieldCheck size={16} />
                  <span>{lang === 'bn' ? '১০০% ফ্রি ও আনলিমিটেড লাইভ রিমোট কন্ট্রোল' : '100% Free & Unlimited Remote Control'}</span>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {lang === 'bn'
                    ? 'টেলিগ্রামে আপনার নিজস্ব বট তৈরি করে দোকানে না থেকেও যেকোনো স্থান থেকে বিক্রয়, খরচ, বকেয়া এবং লাভ-ক্ষতি পরিচালনা করুন।'
                    : 'Remotely control your business and personal accounting via Telegram with instant 2-way live sync.'}
                </p>
              </div>

              {/* Bot Token */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: '800' }}>
                    {lang === 'bn' ? '১. টেলিগ্রাম বট টোকেন (Bot Token):' : '1. Telegram Bot Token:'}
                  </label>
                  <a
                    href="https://t.me/BotFather"
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: '0.74rem', color: '#0ea5e9', display: 'inline-flex', alignItems: 'center', gap: '3px', textDecoration: 'none', fontWeight: '700' }}
                  >
                    <span>@BotFather থেকে টোকেন নিন</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
                <input
                  type="text"
                  value={tgConfig.botToken || ''}
                  onChange={(e) => setTgConfig(prev => ({ ...prev, botToken: e.target.value.trim() }))}
                  placeholder="উদা: 7123456789:AAHk...qweRTY"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-main)',
                    fontSize: '0.85rem',
                    fontFamily: 'monospace'
                  }}
                />
              </div>

              {/* Chat ID */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: '800' }}>
                    {lang === 'bn' ? '২. আপনার টেলিগ্রাম চ্যাট আইডি (Chat ID):' : '2. Your Telegram Chat ID:'}
                  </label>
                  <a
                    href="https://t.me/userinfobot"
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: '0.74rem', color: '#0ea5e9', display: 'inline-flex', alignItems: 'center', gap: '3px', textDecoration: 'none', fontWeight: '700' }}
                  >
                    <span>@userinfobot থেকে আইডি জানুন</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
                <input
                  type="text"
                  value={tgConfig.chatId || ''}
                  onChange={(e) => setTgConfig(prev => ({ ...prev, chatId: e.target.value.trim() }))}
                  placeholder="উদা: 123456789"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-main)',
                    fontSize: '0.85rem',
                    fontFamily: 'monospace'
                  }}
                />
              </div>

              {/* Google Gemini AI Key for Voice-to-Text */}
              <div
                style={{
                  background: 'rgba(236, 72, 153, 0.05)',
                  border: '1px solid rgba(236, 72, 153, 0.25)',
                  borderRadius: '12px',
                  padding: '12px 14px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px', color: '#ec4899' }}>
                    <Sparkles size={15} />
                    <span>{lang === 'bn' ? '৩. ভয়েস-টু-টেক্সট এআই কি (Google Gemini API Key):' : '3. Voice-to-Text AI Key (Gemini):'}</span>
                  </label>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: '0.74rem', color: '#ec4899', display: 'inline-flex', alignItems: 'center', gap: '3px', textDecoration: 'none', fontWeight: '700' }}
                  >
                    <span>ফ্রি কি নিন (Free)</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  {lang === 'bn'
                    ? 'টেলিগ্রামে অডিও রেকর্ড বা ভয়েস নোট পাঠালে তা সরাসরি বাংলায় টেক্সট ও হিসাবে রূপান্তরের জন্য ব্যবহৃত হয়।'
                    : 'Transcribes Telegram voice notes directly into Bengali software entries.'}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="password"
                    value={tgConfig.geminiApiKey || ''}
                    onChange={(e) => setTgConfig(prev => ({ ...prev, geminiApiKey: e.target.value.trim() }))}
                    placeholder="উদা: AIzaSyD..."
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-main)',
                      fontSize: '0.85rem',
                      fontFamily: 'monospace'
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleTestGemini}
                    disabled={isTestingGemini || !tgConfig.geminiApiKey}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: '1px solid #ec4899',
                      background: 'rgba(236, 72, 153, 0.15)',
                      color: '#ec4899',
                      fontWeight: '800',
                      fontSize: '0.78rem',
                      cursor: (isTestingGemini || !tgConfig.geminiApiKey) ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {isTestingGemini ? <RefreshCw size={13} className="animate-spin" /> : <Key size={13} />}
                    <span>{lang === 'bn' ? 'যাচাই' : 'Verify'}</span>
                  </button>
                </div>

                {geminiTestStatus === 'success' && (
                  <div style={{ marginTop: '8px', color: '#10b981', fontSize: '0.76rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <CheckCircle2 size={14} />
                    <span>{geminiTestMsg}</span>
                  </div>
                )}
                {geminiTestStatus === 'error' && (
                  <div style={{ marginTop: '8px', color: '#ef4444', fontSize: '0.76rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <AlertTriangle size={14} />
                    <span>{geminiTestMsg}</span>
                  </div>
                )}
              </div>

              {/* Auto Sync Toggle */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: '800' }}>
                    {lang === 'bn' ? 'স্বয়ংক্রিয় ব্যাকআপ ও নোটিফিকেশন' : 'Auto Sync & Notifications'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {lang === 'bn' ? 'দোকানের সেল বা পরিবর্তনের ব্যাকআপ কপি সরাসরি টেলিগ্রামে যাবে' : 'Automatic backups and real-time alerts'}
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={tgConfig.autoSync !== false}
                  onChange={(e) => setTgConfig(prev => ({ ...prev, autoSync: e.target.checked }))}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </div>

              {/* Instant Backup on Sale & Expense */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'rgba(14, 165, 233, 0.08)',
                  border: '1px solid rgba(14, 165, 233, 0.25)'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: '800', color: '#0ea5e9', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span>⚡ {lang === 'bn' ? 'প্রতি বিক্রয় ও খরচে ইনস্ট্যান্ট ব্যাকআপ' : 'Instant Backup on Sale & Expense'}</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {lang === 'bn' ? 'দোকানে বিক্রি বা খরচ এন্ট্রি হওয়ামাত্রই টেলিগ্রাম বটে তাৎক্ষণিক ব্যাকআপ যাবে' : 'Sends instant backup on every sale or cost record'}
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={tgConfig.syncOnSaleOrExpense !== false}
                  onChange={(e) => setTgConfig(prev => ({ ...prev, syncOnSaleOrExpense: e.target.checked }))}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </div>

              {/* Backup Frequency Dropdown */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: '800' }}>
                    ⏱️ {lang === 'bn' ? 'রুটিন ব্যাকআপ সময় বিরতি:' : 'Routine Backup Interval:'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {lang === 'bn' ? 'নির্দিষ্ট সময় পর পর স্বয়ংক্রিয় ব্যাকআপ' : 'Scheduled periodic cloud backup'}
                  </div>
                </div>
                <select
                  value={tgConfig.intervalMinutes || 5}
                  onChange={(e) => setTgConfig(prev => ({ ...prev, intervalMinutes: Number(e.target.value) }))}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--card-bg)',
                    color: 'var(--text-main)',
                    fontSize: '0.8rem',
                    fontWeight: '700'
                  }}
                >
                  <option value={5}>⚡ {lang === 'bn' ? 'প্রতি ৫ মিনিট (সুপার ফাস্ট)' : 'Every 5 Minutes'}</option>
                  <option value={15}>⏱️ {lang === 'bn' ? 'প্রতি ১৫ মিনিট' : 'Every 15 Minutes'}</option>
                  <option value={30}>⭐ {lang === 'bn' ? 'প্রতি ৩০ মিনিট (প্রস্তাবিত)' : 'Every 30 Minutes'}</option>
                  <option value={60}>🕒 {lang === 'bn' ? 'প্রতি ১ ঘণ্টা (Hourly)' : 'Every 1 Hour'}</option>
                  <option value={1440}>📅 {lang === 'bn' ? 'প্রতিদিন একবার (Daily)' : 'Daily Once'}</option>
                </select>
              </div>

              {/* Feedback messages */}
              {testSuccess && (
                <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#10b981', padding: '10px 14px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={18} />
                  <span>সফল! বট @{testSuccess} ভেরিফাই হয়েছে এবং আপনার টেলিগ্রামে টেস্ট বার্তা পৌঁছেছে।</span>
                </div>
              )}

              {testError && (
                <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#ef4444', padding: '10px 14px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={18} />
                  <span>ত্রুটি: {testError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={handleTestBot}
                  disabled={isTesting}
                  style={{
                    flex: 1,
                    background: 'rgba(14, 165, 233, 0.15)',
                    border: '1.5px solid #0ea5e9',
                    color: '#0ea5e9',
                    padding: '9px 14px',
                    borderRadius: '8px',
                    fontWeight: '800',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <RefreshCw size={15} className={isTesting ? 'animate-spin' : ''} />
                  <span>{isTesting ? 'টেস্ট চলছে...' : 'সংযোগ টেস্ট করুন'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                    border: 'none',
                    color: '#fff',
                    padding: '9px 14px',
                    borderRadius: '8px',
                    fontWeight: '800',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)'
                  }}
                >
                  <Check size={16} />
                  <span>সেটিংস সংরক্ষণ করুন</span>
                </button>

                <button
                  type="button"
                  onClick={handleManualBackup}
                  disabled={isSyncing || !isConfigured}
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-main)',
                    padding: '9px 14px',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  title="এখনই সম্পূর্ণ ডাটাবেজ ব্যাকআপ টেলিগ্রামে পাঠান"
                >
                  <Send size={14} className={isSyncing ? 'animate-spin' : ''} />
                  <span>{isSyncing ? 'পাঠানো হচ্ছে...' : 'এখনই ব্যাকআপ পাঠান'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Interactive Folder Remote Menu Tree */}
          {activeTab === 'folders' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                টেলিগ্রাম বটের চ্যাটে <strong>/menu</strong> বা <strong>/help</strong> লিখলেই নিচের ইন্টারেক্টিভ ফোল্ডার বাটনগুলো ভেসে উঠবে:
              </div>

              {/* Folder 1: Add New */}
              <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', fontSize: '0.9rem', color: '#10b981', marginBottom: '8px' }}>
                  <FolderOpen size={16} />
                  <span>➕ নতুন এন্ট্রি ফোল্ডার (Add Records)</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
                  <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '8px', padding: '8px 10px' }}>
                    <div style={{ fontWeight: '800', fontSize: '0.8rem', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ShoppingBag size={14} />
                      <span>🏢 ব্যবসা শাখা:</span>
                    </div>
                    <ul style={{ margin: '4px 0 0 16px', padding: 0, fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                      <li>⚡ কুইক সেল (Quick Sale)</li>
                      <li>🧾 মেমো / ইনভয়েস তৈরি</li>
                      <li>👥 কাস্টমার যোগ</li>
                      <li>📦 নতুন পণ্য যুক্ত</li>
                      <li>💸 দোকানের খরচ</li>
                      <li>📒 বকেয়া / দেনা-পাওনা</li>
                    </ul>
                  </div>

                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', padding: '8px 10px' }}>
                    <div style={{ fontWeight: '800', fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Home size={14} />
                      <span>🏠 ব্যক্তিগত শাখা:</span>
                    </div>
                    <ul style={{ margin: '4px 0 0 16px', padding: 0, fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                      <li>🛒 দৈনিক বাজারের ফর্দ ও খরচ</li>
                      <li>👨‍👩‍👧‍👦 পারিবারিক মাসিক ব্যয়</li>
                      <li>💵 ব্যক্তিগত আয় / বেতন</li>
                      <li>🤝 ধার ও ব্যাক্তিগত দেনা</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Folder 2: Live Reports */}
              <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', fontSize: '0.9rem', color: '#3b82f6', marginBottom: '8px' }}>
                  <FolderOpen size={16} />
                  <span>📊 লাইভ রিপোর্ট ফোল্ডার (Live Intelligence)</span>
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  <div>💰 <strong>ক্যাশ ড্রয়ার ব্যালেন্স:</strong> ক্যাশ কাউন্টারের বর্তমান নগদ টাকার মোট পরিমাণ।</div>
                  <div>📈 <strong>আজকের বিক্রি ও মেমো:</strong> আজকের মোট বিক্রয় সংখ্যা ও মোট টাকার হিসাব।</div>
                  <div>💎 <strong>লাভ-ক্ষতি বিশ্লেষণ:</strong> বিক্রিত পণ্যের লাভ ও খরচের নেট মুনাফা।</div>
                  <div>📦 <strong>লো-স্টক অ্যালার্ট:</strong> যেসকল পণ্যের স্টক শেষ হয়ে আসছে তার তালিকা।</div>
                  <div>📒 <strong>কাস্টমার বকেয়া:</strong> কার কার কাছে কত টাকা পাওনা আছে তার পূর্ণাঙ্গ লিস্ট।</div>
                </div>
              </div>

              {/* Folder 3: Remote Control */}
              <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', fontSize: '0.9rem', color: '#f59e0b', marginBottom: '8px' }}>
                  <FolderOpen size={16} />
                  <span>⚙️ দূরবর্তী কমান্ড ফোল্ডার (Remote Control)</span>
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  <div>🔒 <strong>কাউন্টার স্ক্রিন লক:</strong> দূর থেকে দোকানের পিসি বা মোবাইল সাথে সাথে পিন লক করে দেওয়া।</div>
                  <div>☁️ <strong>গুগল ড্রাইভ ব্যাকআপ:</strong> দূর থেকে ১ ক্লিকে ফুল ডাটাবেজ ব্যাকআপ সম্পন্ন করা।</div>
                  <div>🖥️ <strong>টার্মিনাল ও প্রিভিউ লিংক:</strong> পিসি ও মোবাইলের হোস্ট প্রিভিউ আইপি এবং ভার্সেল লিংক পাওয়া।</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Natural Language Fast Text Commands */}
          {activeTab === 'commands' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                বটে কোনো বাটন না চেপেই সরাসরি সাধারণ বাংলায় যেকোনো মেসেজ পাঠালে তা স্বয়ংক্রিয়ভাবে বুঝে অ্যাপে যুক্ত হয়ে যাবে:
              </div>

              {[
                { label: 'কুইক সেল এন্ট্রি', example: 'সেল নাপা ১০ ৫০', desc: 'নাপা ১০ পিস ৫০ টাকা বিক্রি এন্ট্রি হবে' },
                { label: 'ইনভয়েস / মেমো তৈরি', example: 'মেমো রফিক চাল ১ বস্তা ৩২০০', desc: 'রফিক নামের ক্রেতার মেমো ৩২০০ টাকা যুক্ত হবে' },
                { label: 'নতুন কাস্টমার যোগ', example: 'কাস্টমার রহিম ০১৭০০০০০০০০ ৫০০', desc: 'রহিম নামে ৫০০ টাকা বকেয়াসহ কাস্টমার সেভ হবে' },
                { label: 'নতুন পণ্য এন্ট্রি', example: 'পণ্য চিনি ১০০ ১২০ ৫০', desc: 'চিনি ক্রয়মূল্য ১০০, বিক্রয়মূল্য ১২০, স্টক ৫০ পিস' },
                { label: 'দোকানের খরচ', example: 'খরচ ৫০০ নাস্তা', desc: 'দোকানের খাতে ৫০০ টাকা নাস্তা খরচ রেকর্ড হবে' },
                { label: 'ব্যক্তিগত বাজারের খরচ', example: 'বাজার ৪০০ মাছ', desc: 'ব্যক্তিগত খাতে ৪০০ টাকা মাছ বাজার যুক্ত হবে' },
                { label: 'ব্যক্তিগত আয় / বেতন', example: 'আয় ৫০০০০ বেতন', desc: 'ব্যক্তিগত অ্যাকাউন্টে ৫০,০০০ টাকা আয় যুক্ত হবে' },
                { label: 'কাউন্টার লক করা', example: 'লক', desc: 'দোকানের স্ক্রিন সাথে সাথে পিন দিয়ে লক হয়ে যাবে' }
              ].map((cmd, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-main)' }}>
                      {cmd.label}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {cmd.desc}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <code
                      style={{
                        background: 'rgba(14, 165, 233, 0.15)',
                        border: '1px solid rgba(14, 165, 233, 0.3)',
                        color: '#0ea5e9',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: '700'
                      }}
                    >
                      {cmd.example}
                    </code>
                    <button
                      type="button"
                      onClick={() => handleCopy(cmd.example, `cmd-${idx}`)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: copiedKey === `cmd-${idx}` ? '#10b981' : 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '4px'
                      }}
                      title="কপি করুন"
                    >
                      {copiedKey === `cmd-${idx}` ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: Voice-to-Text AI Guide */}
          {activeTab === 'voice' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.12), rgba(168, 85, 247, 0.08))',
                  border: '1.5px solid rgba(236, 72, 153, 0.3)',
                  borderRadius: '12px',
                  padding: '12px 14px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ec4899', fontWeight: '800', fontSize: '0.88rem' }}>
                  <Mic size={18} />
                  <span>{lang === 'bn' ? 'টেলিগ্রাম ভয়েস-টু-টেক্সট এআই সহকারী' : 'Telegram Voice-to-Text AI Assistant'}</span>
                </div>
                <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  {lang === 'bn'
                    ? 'টাইপ করার কোনো প্রয়োজন নেই! টেলিগ্রাম চ্যাটে মাইক্রোফোন আইকন চেপে মুখে বাংলায় অডিও রেকর্ড পাঠালেই গুগল জেমিনি এআই তা মুহূর্তের মধ্যে টেক্সটে রূপান্তর করে সফটওয়্যারে হিসাব যুক্ত করে দেবে।'
                    : 'Speak naturally in Bengali! Google Gemini AI transcribes your voice recordings directly into retail accounting actions.'}
                </p>
              </div>

              {/* Status Box */}
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'var(--bg-primary)',
                  border: `1.5px solid ${tgConfig.geminiApiKey ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: tgConfig.geminiApiKey ? '#10b981' : '#f59e0b',
                      boxShadow: `0 0 8px ${tgConfig.geminiApiKey ? '#10b981' : '#f59e0b'}`
                    }}
                  />
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: '800' }}>
                      {tgConfig.geminiApiKey ? (lang === 'bn' ? 'ভয়েস এআই সক্রিয় (Gemini Ready)' : 'Voice AI Active') : (lang === 'bn' ? 'Gemini Key প্রয়োজন' : 'Gemini Key Needed')}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {tgConfig.geminiApiKey
                        ? 'টেলিগ্রামে ভয়েস মেসেজ পাঠাতে আপনি প্রস্তুত!'
                        : 'ট্যাব ১ থেকে অথবা টেলিগ্রামে /setkey লিখে কি সেট করুন'}
                    </div>
                  </div>
                </div>

                {!tgConfig.geminiApiKey && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('config')}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      background: '#ec4899',
                      color: '#fff',
                      fontSize: '0.75rem',
                      fontWeight: '800',
                      cursor: 'pointer'
                    }}
                  >
                    কি সেট করুন
                  </button>
                )}
              </div>

              {/* Voice Commands Showcase */}
              <div style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-main)', marginTop: '2px' }}>
                🎙️ {lang === 'bn' ? 'যেভাবে মুখে বলে কমান্ড পাঠাবেন (উদাহরণ):' : 'Spoken Voice Examples:'}
              </div>

              {[
                {
                  cat: 'বিক্রি / সেল',
                  speech: 'সেল নাপা দশ পাতা পঞ্চাশ টাকা',
                  result: '১০টি নাপা ৫০ টাকায় বিক্রি হবে ও স্টক কমবে'
                },
                {
                  cat: 'দোকানের খরচ',
                  speech: 'খরচ পাঁচশত টাকা বিকালের নাস্তা',
                  result: 'দোকানের সাধারণ খরচে ৫০০ টাকা জমা হবে'
                },
                {
                  cat: 'পারিবারিক বাজার',
                  speech: 'বাজার চারশত টাকা ইলিশ মাছ',
                  result: 'ব্যক্তিগত বাজার খরচে ৪০০ টাকা যোগ হবে'
                },
                {
                  cat: 'কাস্টমার বকেয়া',
                  speech: 'বাকি রহিম পাঁচশত টাকা',
                  result: 'রহিম নামের গ্রাহকের খাতায় ৫০০ টাকা বকেয়া যুক্ত হবে'
                },
                {
                  cat: 'লাইভ হিসাব ও রিপোর্ট',
                  speech: 'আজকের মোট বিক্রি কত হয়েছে',
                  result: 'আজকের মোট বিক্রি ও ইনভয়েস রিপোর্ট ফেরত পাঠাবে'
                },
                {
                  cat: 'এআই পণ্য ইতিহাস',
                  speech: 'বাদাম কতবার কিনেছি কোন দিন কত টাকা',
                  result: 'অতীতে বাদাম ক্রয়ের সম্পূর্ণ হিস্ট্রি বিশ্লেষণ করবে'
                },
                {
                  cat: 'রিমোট স্ক্রিন লক',
                  speech: 'দোকানের স্ক্রিন লক করো',
                  result: 'কাউন্টারের স্ক্রিন অবিলম্বে লক হয়ে যাবে'
                }
              ].map((v, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: '800',
                        color: '#ec4899',
                        background: 'rgba(236, 72, 153, 0.1)',
                        padding: '1px 6px',
                        borderRadius: '4px'
                      }}
                    >
                      {v.cat}
                    </span>
                    <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-main)', marginTop: '2px' }}>
                      🗣️ "{v.speech}"
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      ➔ {v.result}
                    </div>
                  </div>
                  <Mic size={16} style={{ color: '#ec4899', flexShrink: 0 }} />
                </div>
              ))}

              {/* Setkey Shortcut Notice */}
              <div
                style={{
                  background: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  fontSize: '0.74rem',
                  color: 'var(--text-muted)',
                  lineHeight: 1.5
                }}
              >
                💡 <strong>টেলিগ্রাম চ্যাট থেকেও কি সেট করা যায়:</strong> টেলিগ্রামে শুধু লিখুন <code>/setkey আপনার_GEMINI_KEY</code>। বট স্বয়ংক্রিয়ভাবে কি সংরক্ষণ করে ভয়েস এআই সক্রিয় করে নেবে।
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border-color)',
            background: 'rgba(255, 255, 255, 0.02)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px'
          }}
        >
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            💡 সব এন্ট্রি তাৎক্ষণিকভাবে <strong>পিসি, মোবাইল ও ওয়েব</strong> টার্মিনালে সিঙ্ক হয়।
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '7px 20px',
              borderRadius: '8px',
              border: 'none',
              background: '#0ea5e9',
              color: '#fff',
              fontWeight: '800',
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            সম্পন্ন
          </button>
        </div>
      </div>
    </div>
  );
};
