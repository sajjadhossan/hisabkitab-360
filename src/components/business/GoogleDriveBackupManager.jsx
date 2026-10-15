import React, { useState, useEffect, useMemo } from 'react';
import {
  Cloud,
  CloudUpload,
  RefreshCw,
  LogOut,
  Sparkles,
  Check,
  Copy,
  Clock,
  Shield,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sliders,
  FolderOpen,
  Info,
  CheckCircle2,
  Lock,
  Unlock,
  Key,
  HelpCircle,
  Smartphone,
  Server,
  Send,
  MessageSquare,
  Bot,
  Zap,
  Radio
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { hapticFeedback } from '../../services/nativeAppService';
import { registerTelegramCommands } from '../../services/telegramBackupService';

export const GoogleDriveBackupManager = ({
  formState,
  setFormState,
  updateBusinessSettings,
  onSave
}) => {
  const {
    lang = 'bn',
    isDriveConnected,
    driveUser,
    connectDriveOAuth,
    disconnectDriveOAuth,
    switchDriveOAuth,
    syncToGoogleDrive,
    syncToTelegram,
    getGoogleClientId,
    saveGoogleClientId,
    getTelegramBackupConfig,
    saveTelegramBackupConfig,
    testTelegramBackupBot,
    showToast
  } = useApp();

  const { isOwner, isSuperAdmin } = useAuth();

  // Primary Platform Selector: 'gdrive' | 'telegram'
  const [activePlatform, setActivePlatform] = useState('gdrive');

  // Google Drive State
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);
  const [isConnectingOAuth, setIsConnectingOAuth] = useState(false);
  const [clientIdInput, setClientIdInput] = useState(() => getGoogleClientId() || '');
  const [showAdminPanel, setShowAdminPanel] = useState(() => isOwner || isSuperAdmin);
  const [activeGuideTab, setActiveGuideTab] = useState('oauth'); // 'oauth' | 'script' | 'troubleshoot'
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedOrigin, setCopiedOrigin] = useState(false);
  const [copiedKey, setCopiedKey] = useState('');

  // Telegram Cloud Backup State
  const [tgConfig, setTgConfig] = useState(() => getTelegramBackupConfig ? getTelegramBackupConfig() : {
    botToken: '',
    chatId: '',
    enabled: false,
    autoSync: true,
    lastSync: null
  });
  const [isTestingTg, setIsTestingTg] = useState(false);
  const [tgTestSuccess, setTgTestSuccess] = useState(null);
  const [tgTestError, setTgTestError] = useState(null);
  const [isSyncingTg, setIsSyncingTg] = useState(false);

  const [nowTime, setNowTime] = useState(() => Date.now());

  // Periodically update relative time counter
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTime(Date.now());
    }, 30000); // every 30 seconds
    return () => clearInterval(timer);
  }, []);

  // Compute Human-friendly Relative Last Sync Time for Google Drive
  const relativeDriveSyncTime = useMemo(() => {
    const lastSync = formState?.googleDriveLastSync;
    if (!lastSync) return null;

    try {
      const parsedDate = new Date(lastSync);
      if (isNaN(parsedDate.getTime())) return lastSync;
      const diffSec = Math.floor((nowTime - parsedDate.getTime()) / 1000);
      if (diffSec < 60) return lang === 'bn' ? 'এইমাত্র' : 'Just now';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return lang === 'bn' ? `${diffMin} মিনিট আগে` : `${diffMin} min ago`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return lang === 'bn' ? `${diffHr} ঘণ্টা আগে` : `${diffHr} hr ago`;
      const diffDay = Math.floor(diffHr / 24);
      return lang === 'bn' ? `${diffDay} দিন আগে` : `${diffDay} days ago`;
    } catch {
      return lastSync;
    }
  }, [formState?.googleDriveLastSync, nowTime, lang]);

  // Compute Human-friendly Relative Last Sync Time for Telegram
  const relativeTgSyncTime = useMemo(() => {
    const lastSync = tgConfig?.lastSync;
    if (!lastSync) return null;

    try {
      const parsedDate = new Date(lastSync);
      if (isNaN(parsedDate.getTime())) return lastSync;
      const diffSec = Math.floor((nowTime - parsedDate.getTime()) / 1000);
      if (diffSec < 60) return lang === 'bn' ? 'এইমাত্র' : 'Just now';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return lang === 'bn' ? `${diffMin} মিনিট আগে` : `${diffMin} min ago`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return lang === 'bn' ? `${diffHr} ঘণ্টা আগে` : `${diffHr} hr ago`;
      const diffDay = Math.floor(diffHr / 24);
      return lang === 'bn' ? `${diffDay} দিন আগে` : `${diffDay} days ago`;
    } catch {
      return lastSync;
    }
  }, [tgConfig?.lastSync, nowTime, lang]);

  // Google Apps Script source code
  const googleAppsScriptCode = `function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var folderName = "HisabKitab-360-Backups";
    var folders = DriveApp.getFoldersByName(folderName);
    var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
    var dateStr = Utilities.formatDate(new Date(), "GMT+6", "yyyy-MM-dd_HH-mm");
    var filename = "hisabkitab_backup_" + dateStr + ".json";
    var file = folder.createFile(filename, JSON.stringify(payload, null, 2), "application/json");
    
    // Auto-prune old files: Keep latest 30 backups to save space
    var allFiles = folder.getFiles();
    var fileList = [];
    while (allFiles.hasNext()) {
      var f = allFiles.next();
      fileList.push({ file: f, date: f.getDateCreated() });
    }
    if (fileList.length > 30) {
      fileList.sort(function(a, b) { return a.date - b.date; });
      while (fileList.length > 30) {
        var oldItem = fileList.shift();
        oldItem.file.setTrashed(true);
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "success", 
      fileId: file.getId(),
      fileName: filename 
    })).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "error", 
      error: err.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(googleAppsScriptCode);
    setCopiedScript(true);
    hapticFeedback?.success?.();
    if (showToast) showToast(lang === 'bn' ? 'গুগল স্ক্রিপ্ট কোড কপি হয়েছে!' : 'Script code copied!', 'success');
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleCopyOrigin = () => {
    const origin = typeof window !== 'undefined' ? (window.location.origin || 'http://localhost:5173') : 'http://localhost:5173';
    navigator.clipboard.writeText(origin);
    setCopiedOrigin(true);
    hapticFeedback?.success?.();
    if (showToast) showToast(lang === 'bn' ? `অরিজিন লিঙ্ক কপি হয়েছে: ${origin}` : `Origin URL copied: ${origin}`, 'success');
    setTimeout(() => setCopiedOrigin(false), 2500);
  };

  const handleCopyUri = (uri, key) => {
    navigator.clipboard.writeText(uri);
    setCopiedKey(key);
    hapticFeedback?.success?.();
    if (showToast) showToast(lang === 'bn' ? `লিংক কপি হয়েছে: ${uri}` : `Copied: ${uri}`, 'success');
    setTimeout(() => setCopiedKey(''), 2500);
  };

  const handleManualDriveSync = async () => {
    if (!isDriveConnected && !formState.googleDriveWebhookUrl) {
      if (showToast) {
        showToast(lang === 'bn' ? 'দয়া করে আগে Google Drive কানেক্ট করুন অথবা স্ক্রিপ্ট Webhook লিঙ্ক দিন।' : 'Please connect Google Drive or enter Webhook URL first.', 'warning');
      }
      return;
    }

    setIsSyncingDrive(true);
    hapticFeedback?.light?.();
    try {
      if (updateBusinessSettings) {
        updateBusinessSettings(formState);
      }
      const res = await syncToGoogleDrive(formState.googleDriveWebhookUrl);
      if (res?.success) {
        hapticFeedback?.success?.();
      }
    } finally {
      setIsSyncingDrive(false);
    }
  };

  const handleOAuthConnect = async () => {
    setIsConnectingOAuth(true);
    hapticFeedback?.light?.();
    try {
      if (clientIdInput && clientIdInput.trim()) {
        saveGoogleClientId(clientIdInput.trim());
      }
      await connectDriveOAuth(clientIdInput);
      const updated = { ...formState, googleDriveEnabled: true };
      setFormState(updated);
      if (updateBusinessSettings) {
        updateBusinessSettings(updated);
      }
      hapticFeedback?.success?.();
    } catch (err) {
      console.warn('OAuth Connect Error:', err);
    } finally {
      setIsConnectingOAuth(false);
    }
  };

  const handleSwitchAccount = async () => {
    setIsConnectingOAuth(true);
    try {
      if (clientIdInput && clientIdInput.trim()) {
        saveGoogleClientId(clientIdInput.trim());
      }
      await switchDriveOAuth(clientIdInput);
      const updated = { ...formState, googleDriveEnabled: true };
      setFormState(updated);
      if (updateBusinessSettings) {
        updateBusinessSettings(updated);
      }
    } finally {
      setIsConnectingOAuth(false);
    }
  };

  const handleSaveClientId = () => {
    saveGoogleClientId(clientIdInput);
    if (showToast) {
      showToast(lang === 'bn' ? 'গুগল ক্লায়েন্ট আইডি সংরক্ষিত হয়েছে!' : 'Client ID saved successfully!', 'success');
    }
  };

  // Telegram Handlers
  const handleTestTelegram = async () => {
    if (!tgConfig.botToken || !tgConfig.chatId) {
      if (showToast) showToast(lang === 'bn' ? 'দয়া করে Bot Token ও Chat ID দুটিই লিখুন।' : 'Please provide Bot Token and Chat ID.', 'warning');
      return;
    }
    setIsTestingTg(true);
    setTgTestSuccess(null);
    setTgTestError(null);
    hapticFeedback?.light?.();
    try {
      const res = await testTelegramBackupBot(tgConfig.botToken, tgConfig.chatId);
      setTgTestSuccess(res.botUsername);
      registerTelegramCommands(tgConfig.botToken).catch(() => {});
      hapticFeedback?.success?.();
      if (showToast) showToast(lang === 'bn' ? `✅ টেলিগ্রাম বট @${res.botUsername} সফলভাবে ভেরিফাই হয়েছে এবং টেস্ট মেসেজ পাঠানো হয়েছে!` : `Bot @${res.botUsername} verified!`, 'success');
    } catch (err) {
      setTgTestError(err.message || 'টেস্ট ব্যর্থ হয়েছে।');
      hapticFeedback?.warning?.();
      if (showToast) showToast(lang === 'bn' ? `❌ টেলিগ্রাম টেস্ট ব্যর্থ: ${err.message}` : `Test failed: ${err.message}`, 'danger');
    } finally {
      setIsTestingTg(false);
    }
  };

  const handleSaveTelegram = (updated = null) => {
    const raw = updated || tgConfig;
    const configToSave = {
      ...raw,
      enabled: raw.botToken ? true : Boolean(raw.enabled)
    };
    saveTelegramBackupConfig(configToSave);
    setTgConfig(configToSave);
    if (configToSave.botToken) {
      registerTelegramCommands(configToSave.botToken).catch(() => {});
    }
    hapticFeedback?.success?.();
    if (showToast) showToast(lang === 'bn' ? 'টেলিগ্রাম ব্যাকআপ কনফিগারেশন সংরক্ষিত হয়েছে!' : 'Telegram configuration saved!', 'success');
  };

  const handleManualTelegramSync = async () => {
    if (!tgConfig.botToken || !tgConfig.chatId) {
      if (showToast) showToast(lang === 'bn' ? 'দয়া করে আগে টেলিগ্রাম বট কনফিগার করুন।' : 'Configure Telegram bot first.', 'warning');
      return;
    }
    setIsSyncingTg(true);
    hapticFeedback?.light?.();
    try {
      const res = await syncToTelegram(tgConfig);
      if (res?.success) {
        setTgConfig(prev => ({ ...prev, lastSync: res.timestamp, lastFileName: res.fileName }));
        hapticFeedback?.success?.();
      }
    } catch (err) {
      console.warn('Telegram manual sync failed:', err);
    } finally {
      setIsSyncingTg(false);
    }
  };

  const isDriveActive = isDriveConnected || !!formState.googleDriveWebhookUrl;
  const isTgActive = tgConfig.enabled && tgConfig.botToken && tgConfig.chatId;

  return (
    <div className="glass-card" style={{ borderLeft: '4px solid #4285F4', padding: '1.25rem', borderRadius: '14px', background: 'var(--bg-card)' }}>
      
      {/* ======================================================== */}
      {/* 1. TOP HEADER & MULTI-CLOUD PLATFORM SELECTOR TABS       */}
      {/* ======================================================== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: activePlatform === 'gdrive'
              ? (isDriveActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(66, 133, 244, 0.12)')
              : (isTgActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(14, 165, 233, 0.12)'),
            padding: '10px',
            borderRadius: '12px',
            color: activePlatform === 'gdrive' ? (isDriveActive ? '#10b981' : '#4285F4') : (isTgActive ? '#10b981' : '#0ea5e9'),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
          }}>
            {activePlatform === 'gdrive' ? <Cloud size={26} /> : <Send size={26} />}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: '1.18rem', fontWeight: '900', color: 'var(--text-main)' }}>
                {lang === 'bn' ? 'ক্লাউড অটো-ব্যাকআপ ও ডাটাবেজ সিকিউরিটি' : 'Cloud Auto-Backup & Security Suite'}
              </h3>
              
              {/* Active Pulse Status */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '20px',
                fontSize: '0.74rem',
                fontWeight: '800',
                background: (activePlatform === 'gdrive' ? isDriveActive : isTgActive)
                  ? 'rgba(16, 185, 129, 0.15)'
                  : 'rgba(245, 158, 11, 0.15)',
                color: (activePlatform === 'gdrive' ? isDriveActive : isTgActive) ? '#10b981' : '#f59e0b',
                border: `1px solid ${(activePlatform === 'gdrive' ? isDriveActive : isTgActive) ? '#10b981' : '#f59e0b'}`
              }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: (activePlatform === 'gdrive' ? isDriveActive : isTgActive) ? '#10b981' : '#f59e0b',
                  boxShadow: (activePlatform === 'gdrive' ? isDriveActive : isTgActive) ? '0 0 8px #10b981' : 'none'
                }} />
                <span>
                  {(activePlatform === 'gdrive' ? isDriveActive : isTgActive)
                    ? (lang === 'bn' ? 'সরাসরি ক্লাউডে সংযুক্ত (Live)' : 'Connected & Active')
                    : (lang === 'bn' ? 'সেটআপ প্রয়োজন' : 'Setup Required')}
                </span>
              </div>
            </div>

            <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {lang === 'bn'
                ? 'দোকানের প্রতিটি হিসাব স্বয়ংক্রিয়ভাবে ক্লাউডে সংরক্ষিত থাকে যাতে ফোন বা কম্পিউটার নষ্ট হলেও হিসাব সুরক্ষিত থাকে।'
                : 'All business accounts securely synced to the cloud with instant disaster recovery.'}
            </p>
          </div>
        </div>

        {/* Platform Switching Pill Buttons */}
        <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-primary)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <button
            type="button"
            onClick={() => setActivePlatform('gdrive')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              background: activePlatform === 'gdrive' ? '#4285F4' : 'transparent',
              color: activePlatform === 'gdrive' ? '#ffffff' : 'var(--text-muted)',
              fontWeight: '800',
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: activePlatform === 'gdrive' ? '0 2px 8px rgba(66, 133, 244, 0.35)' : 'none'
            }}
          >
            <Cloud size={14} />
            <span>Google Drive</span>
            {isDriveActive && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />}
          </button>

          <button
            type="button"
            onClick={() => setActivePlatform('telegram')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              background: activePlatform === 'telegram' ? 'linear-gradient(135deg, #0ea5e9, #0284c7)' : 'transparent',
              color: activePlatform === 'telegram' ? '#ffffff' : 'var(--text-muted)',
              fontWeight: '800',
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: activePlatform === 'telegram' ? '0 2px 8px rgba(14, 165, 233, 0.35)' : 'none'
            }}
          >
            <Send size={14} />
            <span>Telegram Bot</span>
            {isTgActive && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />}
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. TAB A: GOOGLE DRIVE BACKUP SYSTEM                     */}
      {/* ======================================================== */}
      {activePlatform === 'gdrive' && (
        <div>
          {/* Realtime Last Sync Banner */}
          <div style={{
            background: isDriveActive ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-primary)',
            padding: '10px 14px',
            borderRadius: '10px',
            border: `1px solid ${isDriveActive ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-color)'}`,
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: isDriveActive ? '#10b981' : '#4285F4',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Clock size={16} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700' }}>
                  {lang === 'bn' ? 'ড্রাইভে সর্বশেষ সফল ব্যাকআপ:' : 'Last Drive Backup:'}
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: '800', color: isDriveActive ? '#10b981' : 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{formState?.googleDriveLastSync || (lang === 'bn' ? 'এখনও ব্যাকআপ নেওয়া হয়নি' : 'Never synced')}</span>
                  {relativeDriveSyncTime && (
                    <span style={{ fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-muted)', background: 'var(--bg-card)', padding: '2px 8px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                      ({relativeDriveSyncTime})
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-primary"
                disabled={isSyncingDrive}
                onClick={handleManualDriveSync}
                style={{
                  background: '#4285F4',
                  borderColor: '#4285F4',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: '700',
                  padding: '7px 14px',
                  fontSize: '0.8rem',
                  boxShadow: '0 4px 12px rgba(66, 133, 244, 0.25)'
                }}
              >
                <CloudUpload size={15} className={isSyncingDrive ? 'animate-spin' : ''} />
                <span>{isSyncingDrive ? (lang === 'bn' ? 'সিঙ্ক হচ্ছে...' : 'Syncing...') : (lang === 'bn' ? 'এখনই ড্রাইভে ব্যাকআপ নিন' : 'Sync to Drive Now')}</span>
              </button>
            </div>
          </div>

          {/* Businessman 1-Click Connection Box */}
          <div style={{
            background: 'rgba(66, 133, 244, 0.05)',
            padding: '1.25rem',
            borderRadius: '12px',
            border: '1px solid rgba(66, 133, 244, 0.25)',
            marginBottom: '1.25rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4285F4', fontWeight: '800', fontSize: '0.95rem' }}>
                  <Sparkles size={16} />
                  <span>{lang === 'bn' ? 'পদ্ধতি ১: ১-ক্লিক গুগল ড্রাইভ সংযোগ (OAuth ২.০)' : 'Method 1: 1-Click Google Drive OAuth (Instant)'}</span>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: '580px' }}>
                  {lang === 'bn'
                    ? 'বিজনেসম্যান শুধু "Connect with Google" বাটনে চাপবেন। গুগলের উইন্ডোতে তার জিমেইল সিলেক্ট করে অনুমোদন (Allow) দিলেই ড্রাইভ কানেক্ট হয়ে যাবে।'
                    : 'The client clicks Connect with Google, selects their Google account and grants approval.'}
                </p>
                <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAdminPanel(true);
                      setActiveGuideTab('oauth');
                      setTimeout(() => {
                        const el = document.getElementById('oauth-step-guide');
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 50);
                    }}
                    style={{
                      background: 'rgba(66, 133, 244, 0.1)',
                      border: '1px solid rgba(66, 133, 244, 0.4)',
                      borderRadius: '8px',
                      padding: '5px 12px',
                      fontSize: '0.76rem',
                      fontWeight: '800',
                      color: '#4285F4',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Key size={13} />
                    <span>{lang === 'bn' ? '📘 ১-ক্লিক সেটআপ ও ক্লাউড কনসোল এ টু জেড গাইড দেখুন' : '📘 View Full A-to-Z OAuth Setup Guide'}</span>
                  </button>
                </div>
              </div>

              {isDriveConnected ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'var(--bg-card)',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: '1px solid #10b981'
                  }}>
                    {driveUser?.picture ? (
                      <img src={driveUser.picture} alt="Avatar" style={{ width: '26px', height: '26px', borderRadius: '50%' }} />
                    ) : (
                      <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#4285F4', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold' }}>
                        G
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#10b981', lineHeight: 1.2 }}>
                        {driveUser?.name || 'Google Connected'}
                      </div>
                      {driveUser?.email && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.2 }}>
                          {driveUser.email}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={isConnectingOAuth}
                    onClick={handleSwitchAccount}
                    style={{ padding: '7px 12px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <RefreshCw size={13} className={isConnectingOAuth ? 'animate-spin' : ''} />
                    <span>{lang === 'bn' ? 'অ্যাকাউন্ট বদল' : 'Switch'}</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={disconnectDriveOAuth}
                    style={{ padding: '7px 12px', color: '#ef4444', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <LogOut size={13} />
                    <span>{lang === 'bn' ? 'সংযোগ বিচ্ছিন্ন' : 'Disconnect'}</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={isConnectingOAuth}
                  onClick={handleOAuthConnect}
                  style={{
                    background: '#4285F4',
                    borderColor: '#4285F4',
                    fontWeight: '700',
                    padding: '9px 20px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.85rem',
                    boxShadow: '0 4px 12px rgba(66, 133, 244, 0.25)'
                  }}
                >
                  {isConnectingOAuth ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path fill="#ffffff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#ffffff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#ffffff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#ffffff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                  )}
                  <span>{isConnectingOAuth ? (lang === 'bn' ? 'সংযোগ হচ্ছে...' : 'Connecting...') : (lang === 'bn' ? 'Google Drive দিয়ে ১-ক্লিকে কানেক্ট করুন' : '1-Click Connect Google Drive')}</span>
                </button>
              )}
            </div>
          </div>

          {/* Admin & Developer Settings Panel */}
          <div style={{
            background: 'var(--bg-primary)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            overflow: 'hidden',
            marginBottom: '1rem'
          }}>
            <div
              onClick={() => setShowAdminPanel(!showAdminPanel)}
              style={{
                padding: '12px 16px',
                background: 'rgba(0,0,0,0.02)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                borderBottom: showAdminPanel ? '1px solid var(--border-color)' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sliders size={15} style={{ color: '#4285F4' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  {lang === 'bn' ? '⚙️ গুগল ড্রাইভ অ্যাডমিন ও ডেভেলপার কনফিগারেশন' : '⚙️ Google Drive Admin Config'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#4285F4', fontSize: '0.78rem', fontWeight: '700' }}>
                <span>{showAdminPanel ? (lang === 'bn' ? 'লুকান' : 'Hide') : (lang === 'bn' ? 'খুলুন' : 'Expand')}</span>
                {showAdminPanel ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </div>

            {showAdminPanel && (
              <div style={{ padding: '14px 16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div>
                    <label className="field-label" style={{ fontSize: '0.78rem', fontWeight: '700' }}>
                      {lang === 'bn' ? 'Google Cloud OAuth Client ID (পদ্ধতি ১ এর জন্য):' : 'Google OAuth Client ID:'}
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        className="input-field"
                        style={{ fontSize: '0.78rem', fontFamily: 'monospace' }}
                        value={clientIdInput}
                        onChange={(e) => setClientIdInput(e.target.value)}
                        placeholder="442090260759-...apps.googleusercontent.com"
                      />
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleSaveClientId}
                        style={{ fontSize: '0.75rem', whiteSpace: 'nowrap', padding: '6px 12px' }}
                      >
                        {lang === 'bn' ? 'সংরক্ষণ' : 'Save'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="field-label" style={{ fontSize: '0.78rem', fontWeight: '700' }}>
                      {lang === 'bn' ? 'Apps Script Webhook URL (পদ্ধতি ২ এর জন্য):' : 'Apps Script Webhook URL:'}
                    </label>
                    <input
                      type="url"
                      className="input-field"
                      style={{ fontSize: '0.78rem', fontFamily: 'monospace' }}
                      placeholder="https://script.google.com/macros/s/.../exec"
                      value={formState.googleDriveWebhookUrl || ''}
                      onChange={(e) => setFormState({ ...formState, googleDriveWebhookUrl: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="field-label" style={{ fontSize: '0.78rem', fontWeight: '700' }}>
                      {lang === 'bn' ? 'ড্রাইভ ফোল্ডারের নাম:' : 'Drive Folder Name:'}
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      style={{ fontSize: '0.8rem' }}
                      value={formState.googleDriveFolder || 'HisabKitab-360-Backups'}
                      onChange={(e) => setFormState({ ...formState, googleDriveFolder: e.target.value })}
                    />
                  </div>
                </div>

                {/* Google Drive Guide Tabs */}
                <div id="oauth-step-guide" style={{ border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setActiveGuideTab('oauth')}
                      style={{
                        flex: '1 1 200px',
                        padding: '11px 14px',
                        fontSize: '0.82rem',
                        fontWeight: activeGuideTab === 'oauth' ? '800' : '600',
                        border: 'none',
                        background: activeGuideTab === 'oauth' ? '#4285F4' : 'transparent',
                        color: activeGuideTab === 'oauth' ? '#fff' : 'var(--text-main)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.2s'
                      }}
                    >
                      <Key size={14} />
                      <span>🔑 ১-ক্লিক Google OAuth গাইড (A to Z)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveGuideTab('script')}
                      style={{
                        flex: '1 1 180px',
                        padding: '11px 14px',
                        fontSize: '0.82rem',
                        fontWeight: activeGuideTab === 'script' ? '800' : '600',
                        border: 'none',
                        background: activeGuideTab === 'script' ? '#4285F4' : 'transparent',
                        color: activeGuideTab === 'script' ? '#fff' : 'var(--text-main)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.2s'
                      }}
                    >
                      <Zap size={14} />
                      <span>⚡ বিকল্প স্ক্রিপ্ট পদ্ধতি (Webhook)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveGuideTab('troubleshoot')}
                      style={{
                        flex: '1 1 140px',
                        padding: '11px 14px',
                        fontSize: '0.82rem',
                        fontWeight: activeGuideTab === 'troubleshoot' ? '800' : '600',
                        border: 'none',
                        background: activeGuideTab === 'troubleshoot' ? '#4285F4' : 'transparent',
                        color: activeGuideTab === 'troubleshoot' ? '#fff' : 'var(--text-main)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.2s'
                      }}
                    >
                      <HelpCircle size={14} />
                      <span>❓ সমস্যা ও সমাধান (টিপস)</span>
                    </button>
                  </div>

                  {/* TAB 1: 1-CLICK GOOGLE OAUTH STEP-BY-STEP (A to Z) */}
                  {activeGuideTab === 'oauth' && (
                    <div style={{ padding: '16px 18px', background: 'var(--bg-primary)', fontSize: '0.8rem', lineHeight: 1.65 }}>
                      
                      {/* Guide Top Banner */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'rgba(66, 133, 244, 0.08)',
                        border: '1px solid rgba(66, 133, 244, 0.25)',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        marginBottom: '16px',
                        flexWrap: 'wrap',
                        gap: '10px'
                      }}>
                        <div>
                          <div style={{ fontWeight: '800', color: '#4285F4', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Sparkles size={16} />
                            <span>গুগল ক্লাউড কনসোল (OAuth 2.0) ১-ক্লিক ব্যাকআপ মাস্টার গাইড</span>
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            সাধারণ জিমেইল দিয়ে সম্পূর্ণ বিনামূল্যে মাত্র ৩ মিনিটে সেটআপ করুন (কোনো ক্রেডিট কার্ড লাগবে না)।
                          </div>
                        </div>

                        <a
                          href="https://console.cloud.google.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary"
                          style={{
                            background: '#4285F4',
                            borderColor: '#4285F4',
                            padding: '6px 14px',
                            fontSize: '0.76rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontWeight: '700',
                            textDecoration: 'none'
                          }}
                        >
                          <span>Google Cloud Console খুলুন</span>
                          <ExternalLink size={13} />
                        </a>
                      </div>

                      {/* Step-by-Step Ultra-Detailed Roadmap Cards */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        
                        {/* Step 1 */}
                        <div style={{ background: 'var(--bg-card)', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#4285F4', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '900' }}>১</span>
                            <span style={{ fontWeight: '800', color: 'var(--text-main)', fontSize: '0.88rem' }}>ধাপ ১: নতুন প্রজেক্ট তৈরি করুন (Create Project)</span>
                          </div>
                          <div style={{ paddingLeft: '32px', color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.6 }}>
                            ১. ব্রাউজারে <strong>console.cloud.google.com</strong>-এ গিয়ে আপনার জিমেইল দিয়ে সাইন ইন করুন।<br/>
                            ২. উপরের নীল বারের বাম পাশে <strong>Select a project</strong> ড্রপডাউনে ক্লিক করুন এবং পপআপের উপরে ডানপাশে <strong>NEW PROJECT</strong> বাটনে চাপুন।<br/>
                            ৩. <strong>Project name:</strong> ঘরে লিখুন: <code style={{ color: '#4285F4', fontWeight: 'bold' }}>HisabKitab-360-Backup</code> (বা আপনার পছন্দমতো নাম)।<br/>
                            ৪. <strong>Organization:</strong> No organization থাকবে। নিচে নীল রঙের <strong>CREATE</strong> বাটনে চাপুন। ৫-১০ সেকেন্ড পর প্রজেক্ট তৈরি হবে।
                          </div>
                        </div>

                        {/* Step 2 */}
                        <div style={{ background: 'var(--bg-card)', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#4285F4', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '900' }}>২</span>
                            <span style={{ fontWeight: '800', color: 'var(--text-main)', fontSize: '0.88rem' }}>ধাপ ২: Google Drive API এনাবল করুন (Enable API)</span>
                          </div>
                          <div style={{ paddingLeft: '32px', color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.6 }}>
                            ১. বাম পাশের প্রধান মেনু (☰ Navigation menu)-তে ক্লিক করুন।<br/>
                            ২. <strong>APIs & Services</strong> ➔ <strong>Enabled APIs & services</strong>-এ ক্লিক করুন।<br/>
                            ৩. পেজের উপরে থাকা <strong>+ ENABLE APIS AND SERVICES</strong> বাটনে চাপুন।<br/>
                            ৪. সার্চ বক্সে টাইপ করুন: <code>Google Drive API</code> এবং কীবোর্ডে Enter চাপুন।<br/>
                            ৫. রেজাল্ট থেকে <strong>Google Drive API</strong> কার্ডের ওপর ক্লিক করুন এবং নীল রঙের <strong>ENABLE</strong> বাটনে চাপ দিন।
                          </div>
                        </div>

                        {/* Step 3 */}
                        <div style={{ background: 'var(--bg-card)', padding: '14px 16px', borderRadius: '12px', border: '1px solid rgba(66, 133, 244, 0.4)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#4285F4', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '900' }}>৩</span>
                            <span style={{ fontWeight: '800', color: '#4285F4', fontSize: '0.88rem' }}>ধাপ ৩: OAuth Consent Screen ও টেস্ট ইউজার সেটআপ (সবচেয়ে গুরুত্বপূর্ণ)</span>
                          </div>
                          <div style={{ paddingLeft: '32px', color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.6 }}>
                            ১. বাম মেনু থেকে <strong>APIs & Services</strong> ➔ <strong>OAuth consent screen</strong>-এ ক্লিক করুন।<br/>
                            ২. <strong>User Type:</strong> অবশ্যই <strong style={{ color: '#10b981' }}>External</strong> সিলেক্ট করুন (সাধারণ জিমেইলের জন্য Internal দেওয়া যায় না) এবং <strong>CREATE</strong> চাপুন।<br/>
                            ৩. <strong>App Information ফর্ম পূরণ:</strong>
                            <ul style={{ margin: '4px 0 8px 16px', padding: 0 }}>
                              <li><strong>App name:</strong> লিখুন <code>HisabKitab 360</code></li>
                              <li><strong>User support email:</strong> ড্রপডাউন থেকে আপনার জিমেইল সিলেক্ট করুন।</li>
                              <li><strong>App logo / App domain:</strong> এগুলো ফাঁকা রাখুন (কিছু লেখার দরকার নেই)।</li>
                              <li><strong>Developer contact information:</strong> নিচের ঘরে আপনার জিমেইল ঠিকানা লিখুন।</li>
                              <li>একদম নিচে নেমে <strong>SAVE AND CONTINUE</strong> বাটনে চাপুন।</li>
                            </ul>
                            ৪. <strong>Scopes (২য় পাতা):</strong> এখানে কোনো পরিবর্তন করবেন না, সরাসরি নিচে গিয়ে <strong>SAVE AND CONTINUE</strong> চাপুন।<br/>
                            ৫. <strong>Test users (৩য় পাতা - টেস্ট ইউজার যোগ):</strong>
                            <ul style={{ margin: '4px 0 8px 16px', padding: 0 }}>
                              <li>এখানে থাকা <strong style={{ color: '#4285F4' }}>+ ADD USERS</strong> বাটনে ক্লিক করুন।</li>
                              <li>যে যে জিমেইল দিয়ে আপনি বা আপনার কর্মীরা গুগল ড্রাইভ কানেক্ট করবেন (যেমন আপনার জিমেইল <code>hossansajjad1994@gmail.com</code>), সেটি লিখে <strong>ADD</strong> বা <strong>SAVE</strong> করুন।</li>
                              <li>নিচে <strong>SAVE AND CONTINUE</strong> চাপুন।</li>
                            </ul>
                            ৬. <strong>Summary (৪র্থ পাতা):</strong> নিচে নেমে <strong>BACK TO DASHBOARD</strong> চাপুন।<br/>
                            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)', marginTop: '6px' }}>
                              💡 <strong>টিপস:</strong> আপনি যদি বারবার ইউজার অ্যাড না করে যেকোনো জিমেইলের জন্য উন্মুক্ত রাখতে চান, তবে ড্যাশবোর্ডে <strong>Publishing status</strong>-এর নিচে থাকা <strong>PUBLISH APP</strong> বাটনে চাপ দিয়ে <strong>Confirm</strong> করে দিতে পারেন।
                            </div>
                          </div>
                        </div>

                        {/* Step 4 */}
                        <div style={{ background: 'var(--bg-card)', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#4285F4', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '900' }}>৪</span>
                            <span style={{ fontWeight: '800', color: 'var(--text-main)', fontSize: '0.88rem' }}>ধাপ ৪: Web Application OAuth Client ID তৈরি করুন</span>
                          </div>
                          <div style={{ paddingLeft: '32px', color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.6 }}>
                            ১. বাম মেনু থেকে <strong>Credentials</strong> (🔑)-এ ক্লিক করুন।<br/>
                            ২. পেজের উপরে থাকা <strong>+ CREATE CREDENTIALS</strong> বাটনে চাপ দিয়ে <strong>OAuth client ID</strong> সিলেক্ট করুন।<br/>
                            ৩. <strong>Application type:</strong> ড্রপডাউন থেকে অবশ্যই <strong style={{ color: '#4285F4' }}>Web application</strong> সিলেক্ট করুন (এটি ব্রাউজার ও অ্যাপের জন্য আবশ্যক)।<br/>
                            ৪. <strong>Name:</strong> নাম দিন <code>HisabKitab Web Client</code>।<br/>
                            ৫. <strong>Authorized JavaScript origins (খুব জরুরি - এই ৩টি লিংক যোগ করুন):</strong>
                            <div style={{ margin: '6px 0 8px', color: 'var(--text-main)', fontSize: '0.8rem' }}>
                              গুগল কনসোলে <strong>+ ADD URI</strong> বাটনে ক্লিক করে নিচের ৩টি লিংক এক এক করে হুবহু যোগ করুন:
                            </div>

                            {/* 3 Copyable Origin Cards */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '8px 0 12px' }}>
                              
                              {/* 1. PC Localhost */}
                              <div style={{ background: 'var(--bg-primary)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                                <div>
                                  <div style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--text-main)' }}>১. ল্যাপটপ / পিসি লোকালহোস্ট (Localhost PC):</div>
                                  <code style={{ fontSize: '0.82rem', color: '#4285F4', fontWeight: 'bold' }}>http://localhost:5173</code>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleCopyUri('http://localhost:5173', 'localhost')}
                                  className="btn btn-secondary"
                                  style={{ padding: '4px 12px', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: '700' }}
                                >
                                  {copiedKey === 'localhost' ? <Check size={12} style={{ color: '#10b981' }} /> : <Copy size={12} />}
                                  <span>{copiedKey === 'localhost' ? 'কপি হয়েছে' : 'লিংক কপি'}</span>
                                </button>
                              </div>

                              {/* 2. Mobile WiFi Testing */}
                              <div style={{ background: 'var(--bg-primary)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                                <div>
                                  <div style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--text-main)' }}>২. মোবাইল ওয়াইফাই টেস্ট (Mobile LAN Testing):</div>
                                  <code style={{ fontSize: '0.82rem', color: '#10b981', fontWeight: 'bold' }}>http://192.168.1.5:5173</code>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleCopyUri('http://192.168.1.5:5173', 'mobile_lan')}
                                  className="btn btn-secondary"
                                  style={{ padding: '4px 12px', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: '700' }}
                                >
                                  {copiedKey === 'mobile_lan' ? <Check size={12} style={{ color: '#10b981' }} /> : <Copy size={12} />}
                                  <span>{copiedKey === 'mobile_lan' ? 'কপি হয়েছে' : 'লিংক কপি'}</span>
                                </button>
                              </div>

                              {/* 3. Vercel Live Production */}
                              <div style={{ background: 'var(--bg-primary)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                                <div>
                                  <div style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--text-main)' }}>৩. ভার্সেল লাইভ ওয়েবসাইট (Vercel Live Web App):</div>
                                  <code style={{ fontSize: '0.82rem', color: '#8b5cf6', fontWeight: 'bold' }}>https://hisabkitab-360.vercel.app</code>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleCopyUri('https://hisabkitab-360.vercel.app', 'vercel')}
                                  className="btn btn-secondary"
                                  style={{ padding: '4px 12px', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: '700' }}
                                >
                                  {copiedKey === 'vercel' ? <Check size={12} style={{ color: '#10b981' }} /> : <Copy size={12} />}
                                  <span>{copiedKey === 'vercel' ? 'কপি হয়েছে' : 'লিংক কপি'}</span>
                                </button>
                              </div>

                            </div>
                            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '8px', background: 'rgba(99, 102, 241, 0.08)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.25)', lineHeight: 1.5 }}>
                              📌 <strong>নিয়ম:</strong> গুগল ক্লাউড কনসোলে <strong>+ ADD URI</strong>-তে একবার চাপ দিয়ে <code>http://localhost:5173</code> পেস্ট করবেন, আবার <strong>+ ADD URI</strong> চেপে <code>http://192.168.1.5:5173</code> পেস্ট করবেন, এবং পুনরায় <strong>+ ADD URI</strong> চেপে <code>https://hisabkitab-360.vercel.app</code> পেস্ট করবেন।
                            </div>
                            ৬. <strong>Authorized redirect URIs:</strong> এটি সম্পূর্ণ ফাঁকা (খালি) রাখবেন।<br/>
                            ৭. এবার একদম নিচে থাকা নীল রঙের <strong>CREATE</strong> বাটনে চাপ দিন।
                          </div>
                        </div>

                        {/* Step 5 */}
                        <div style={{ background: 'var(--bg-card)', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '900' }}>৫</span>
                            <span style={{ fontWeight: '800', color: 'var(--text-main)', fontSize: '0.88rem' }}>ধাপ ৫: ক্লায়েন্ট আইডি কপি করে অ্যাপে সেভ করুন</span>
                          </div>
                          <div style={{ paddingLeft: '32px', color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.6 }}>
                            ১. CREATE চাপার পর স্ক্রিনে <strong>OAuth client created</strong> পপআপ আসবে।<br/>
                            ২. সেখানে <strong>Client ID</strong>-র পাশে থাকা কপি আইকনে ক্লিক করে পুরো কোডটি কপি করুন (এটি দেখতে এমন হয়: <code>xxxxxxxxxxxx-xxxx.apps.googleusercontent.com</code>)।<br/>
                            ৩. এবার এই অ্যাপে ফিরে এসে উপরের <strong>Google OAuth Client ID</strong> ইনপুট বক্সে পেস্ট করুন এবং ডানপাশে থাকা <strong>"সংরক্ষণ করুন"</strong> বাটনে চাপুন।
                          </div>
                        </div>

                        {/* Step 6 */}
                        <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '14px 16px', borderRadius: '12px', border: '1.5px solid rgba(16, 185, 129, 0.4)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <CheckCircle2 size={20} style={{ color: '#10b981' }} />
                            <span style={{ fontWeight: '800', color: '#10b981', fontSize: '0.9rem' }}>ধাপ ৬: ১-ক্লিক সংযোগ সম্পন্ন করুন!</span>
                          </div>
                          <div style={{ paddingLeft: '28px', color: 'var(--text-main)', fontSize: '0.8rem', lineHeight: 1.6 }}>
                            ১. উপরে থাকা নীল রঙের <strong>"Google Drive দিয়ে ১-ক্লিকে কানেক্ট করুন"</strong> বাটনে চাপুন।<br/>
                            ২. গুগলের অফিসিয়াল পপআপ উইন্ডো আসবে—আপনার জিমেইল সিলেক্ট করুন।<br/>
                            ৩. যদি <em>"Google hasn't verified this app"</em> লেখা আসে, কোনো ভয় নেই—নিচে থাকা <strong>Advanced</strong> লিংকে ক্লিক করে <strong>Go to HisabKitab 360 (unsafe)</strong> সিলেক্ট করুন এবং <strong>Continue / Allow</strong> চাপুন।<br/>
                            ৪. সাথে সাথে আপনার গুগল ড্রাইভ স্থায়ীভাবে কানেক্ট হয়ে যাবে এবং হিসাবের প্রতিটি ব্যাকআপ স্বয়ংক্রিয়ভাবে আপনার গুগল ড্রাইভের <code>HisabKitab360_Backups</code> ফোল্ডারে সেভ হওয়া শুরু হবে!
                          </div>
                        </div>

                      </div>
                    </div>
                  )}

                  {/* TAB 2: APPS SCRIPT WEBHOOK METHOD */}
                  {activeGuideTab === 'script' && (
                    <div style={{ padding: '14px 16px', background: 'var(--bg-primary)' }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '10px', lineHeight: 1.5 }}>
                        কোনো ক্লাউড কনসোল বা ক্রেডেনশিয়াল ছাড়া যদি মাত্র ১ মিনিটে ব্যাকআপ চালু করতে চান, তবে <strong>script.google.com</strong>-এ গিয়ে <strong>+ New project</strong> খুলে নিচের কোডটি পেস্ট করে Web app হিসেবে Deploy করুন:
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#4285F4' }}>Google Apps Script কোড:</span>
                        <button type="button" onClick={handleCopyCode} className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '0.74rem' }}>
                          {copiedScript ? <Check size={12} style={{ color: '#10b981' }} /> : <Copy size={12} />}
                          <span>{copiedScript ? 'কপি হয়েছে' : 'কোড কপি করুন'}</span>
                        </button>
                      </div>
                      <pre style={{ background: '#0f172a', color: '#38bdf8', padding: '10px 12px', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace', overflowX: 'auto', margin: '0 0 12px', maxHeight: '180px' }}>
                        {googleAppsScriptCode}
                      </pre>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                        ডিপ্লয় করার সময় <strong>Execute as: "Me"</strong> এবং <strong>Who has access: "Anyone"</strong> সিলেক্ট করে প্রাপ্ত Web app URL টি ওপরের Webhook URL ফিল্ডে পেস্ট করে সেভ করুন।
                      </div>
                    </div>
                  )}

                  {/* TAB 3: TROUBLESHOOTING & COMMON FIXES */}
                  {activeGuideTab === 'troubleshoot' && (
                    <div style={{ padding: '16px 18px', background: 'var(--bg-primary)', fontSize: '0.78rem', lineHeight: 1.65 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ background: 'var(--bg-card)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                          <strong style={{ color: '#ef4444' }}>১. Error 403: access_denied / App is being tested</strong><br/>
                          <strong>কারণ:</strong> অ্যাপটি Testing মোডে রয়েছে এবং আপনার জিমেইল টেস্ট ইউজার লিস্টে নেই।<br/>
                          <strong>সমাধান:</strong> Google Cloud Console ➔ <code>OAuth consent screen</code> ➔ <code>Test users</code>-এ গিয়ে <strong>+ ADD USERS</strong> দিয়ে আপনার জিমেইল যোগ করুন। অথবা ওপরে থাকা <strong>PUBLISH APP</strong> বাটনে ক্লিক করে কনফার্ম করুন।
                        </div>

                        <div style={{ background: 'var(--bg-card)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                          <strong style={{ color: '#f59e0b' }}>২. "Google hasn't verified this app" (সতর্কতা)</strong><br/>
                          <strong>সমাধান:</strong> এটি ব্যক্তিগত ডেভলপমেন্ট অ্যাপের সাধারণ সতর্কবার্তা। পপআপের নিচে থাকা <strong>Advanced</strong> লিংকে ক্লিক করে <strong>Go to HisabKitab 360 (unsafe)</strong> ➔ <strong>Continue / Allow</strong> চাপুন।
                        </div>

                        <div style={{ background: 'var(--bg-card)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                          <strong style={{ color: '#4285F4' }}>৩. Origin Mismatch Error (local vs live)</strong><br/>
                          <strong>সমাধান:</strong> Google Console ➔ <code>Credentials</code> ➔ আপনার Web Client-এ যান এবং <code>Authorized JavaScript origins</code>-এ আপনার ব্রাউজারের বর্তমান URL (যেমন: <code>http://localhost:5173</code> অথবা লাইভ সাইট <code>https://your-domain.vercel.app</code>) হুবহু যোগ করুন।
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. TAB B: TELEGRAM BOT CLOUD BACKUP SYSTEM               */}
      {/* ======================================================== */}
      {activePlatform === 'telegram' && (
        <div className="fade-in">
          {/* Telegram Status Banner */}
          <div style={{
            background: isTgActive ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-primary)',
            padding: '10px 14px',
            borderRadius: '10px',
            border: `1px solid ${isTgActive ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-color)'}`,
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: isTgActive ? '#10b981' : '#0ea5e9',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Send size={16} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700' }}>
                  {lang === 'bn' ? 'টেলিগ্রামে সর্বশেষ ব্যাকআপ:' : 'Last Telegram Backup:'}
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: '800', color: isTgActive ? '#10b981' : 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{tgConfig?.lastSync || (lang === 'bn' ? 'এখনও ব্যাকআপ পাঠানো হয়নি' : 'Never synced')}</span>
                  {relativeTgSyncTime && (
                    <span style={{ fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-muted)', background: 'var(--bg-card)', padding: '2px 8px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                      ({relativeTgSyncTime})
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-primary"
                disabled={isSyncingTg || !tgConfig.botToken || !tgConfig.chatId}
                onClick={handleManualTelegramSync}
                style={{
                  background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                  borderColor: '#0ea5e9',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: '700',
                  padding: '7px 14px',
                  fontSize: '0.8rem',
                  boxShadow: '0 4px 12px rgba(14, 165, 233, 0.25)'
                }}
              >
                <Send size={15} className={isSyncingTg ? 'animate-spin' : ''} />
                <span>{isSyncingTg ? (lang === 'bn' ? 'পাঠানো হচ্ছে...' : 'Sending...') : (lang === 'bn' ? 'এখনই টেলিগ্রামে ব্যাকআপ পাঠান' : 'Send Backup to Telegram Now')}</span>
              </button>
            </div>
          </div>

          {/* Telegram Bot Setup Form */}
          <div style={{
            background: 'rgba(14, 165, 233, 0.05)',
            padding: '1.25rem',
            borderRadius: '12px',
            border: '1px solid rgba(14, 165, 233, 0.25)',
            marginBottom: '1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: '#0ea5e9', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Bot size={18} />
                  <span>{lang === 'bn' ? 'টেলিগ্রাম ক্লাউড বট কনফিগারেশন (১০০% ফ্রি)' : 'Telegram Cloud Bot Configuration'}</span>
                </h4>
                <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {lang === 'bn'
                    ? 'আপনার তৈরি করা টেলিগ্রাম বট প্রতি ক্লিকে ও প্রতিদিন স্বয়ংক্রিয়ভাবে ডাটাবেজ ব্যাকআপ ফাইল আপনার টেলিগ্রাম চ্যাটে পাঠিয়ে দেবে।'
                    : 'Your bot sends database backup files directly to your Telegram chat or channel with instant alerts.'}
                </p>
              </div>

              {/* Enable Toggle */}
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: 'var(--bg-card)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <input
                  type="checkbox"
                  checked={tgConfig.enabled}
                  onChange={(e) => {
                    const updated = { ...tgConfig, enabled: e.target.checked };
                    handleSaveTelegram(updated);
                  }}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.8rem', fontWeight: '800', color: tgConfig.enabled ? '#10b981' : 'var(--text-muted)' }}>
                  {tgConfig.enabled ? 'টেলিগ্রাম ব্যাকআপ সক্রিয়' : 'টেলিগ্রাম ব্যাকআপ নিষ্ক্রিয়'}
                </span>
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              {/* Bot Token */}
              <div>
                <label className="field-label" style={{ fontSize: '0.78rem', fontWeight: '700' }}>
                  {lang === 'bn' ? 'টেলিগ্রাম Bot Token *' : 'Telegram Bot Token *'}
                </label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="যেমন: 7489201845:AAH-..."
                  value={tgConfig.botToken || ''}
                  onChange={(e) => setTgConfig({ ...tgConfig, botToken: e.target.value })}
                  style={{ fontSize: '0.82rem', fontFamily: 'monospace' }}
                />
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {lang === 'bn' ? 'টেলিগ্রামে @BotFather থেকে পাওয়া গোপন টোকেন' : 'Secret token from @BotFather'}
                </div>
              </div>

              {/* Chat ID */}
              <div>
                <label className="field-label" style={{ fontSize: '0.78rem', fontWeight: '700' }}>
                  {lang === 'bn' ? 'টেলিগ্রাম Chat ID / Channel ID *' : 'Telegram Chat ID *'}
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="যেমন: 123456789 বা -1001234567890"
                  value={tgConfig.chatId || ''}
                  onChange={(e) => setTgConfig({ ...tgConfig, chatId: e.target.value })}
                  style={{ fontSize: '0.82rem', fontFamily: 'monospace' }}
                />
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {lang === 'bn' ? 'আপনার ব্যক্তিগত Chat ID অথবা প্রাইভেট চ্যানেলের ID' : 'Your Chat ID or Channel ID'}
                </div>
              </div>
            </div>

            {/* Test & Save Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={isTestingTg || !tgConfig.botToken || !tgConfig.chatId}
                  onClick={handleTestTelegram}
                  style={{ fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px' }}
                >
                  <Send size={13} className={isTestingTg ? 'animate-spin' : ''} />
                  <span>{isTestingTg ? (lang === 'bn' ? 'যাচাই হচ্ছে...' : 'Testing...') : (lang === 'bn' ? 'কানেকশন টেস্ট করুন (Ping)' : 'Test Connection')}</span>
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleSaveTelegram()}
                  style={{ fontSize: '0.78rem', background: '#0ea5e9', borderColor: '#0ea5e9', padding: '6px 16px', fontWeight: '800' }}
                >
                  <Check size={14} />
                  <span>{lang === 'bn' ? 'কনফিগারেশন সংরক্ষণ' : 'Save Config'}</span>
                </button>
              </div>

              {tgTestSuccess && (
                <div style={{
                  fontSize: '0.82rem',
                  color: '#10b981',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: '1px solid rgba(16, 185, 129, 0.3)'
                }}>
                  <CheckCircle2 size={16} />
                  <span>✅ টেস্ট সফল! কানেক্টেড বট: @{tgTestSuccess}</span>
                </div>
              )}
            </div>

            {/* Detailed Diagnostic Error Box if Test Fails */}
            {tgTestError && (
              <div style={{
                marginTop: '12px',
                padding: '12px 14px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: 'var(--text-main)',
                fontSize: '0.8rem',
                lineHeight: 1.6
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontWeight: '800', marginBottom: '4px' }}>
                  <AlertTriangle size={16} />
                  <span>টেলিগ্রাম টেস্ট রিপোর্ট ও সমাধান:</span>
                </div>
                <div style={{ color: '#ef4444', fontWeight: '700', marginBottom: '6px' }}>
                  {tgTestError}
                </div>
                <div style={{ background: 'var(--bg-card)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  💡 <strong>দ্রুত সমাধান চেকলিস্ট:</strong>
                  <ul style={{ margin: '4px 0 0', paddingLeft: '1.2rem' }}>
                    <li><strong>১. বট চালু করেছেন কি?</strong> টেলিগ্রামে আপনার তৈরি করা বটে গিয়ে একবার নিচে থাকা <strong>"START"</strong> বাটনে চাপ দিন (বটে /start না চাপলে টেলিগ্রাম বট আপনাকে মেসেজ পাঠাতে পারে না)।</li>
                    <li><strong>২. সঠিক Chat ID:</strong> টেলিগ্রামে <code>@userinfobot</code> এ গিয়ে আপনার সঠিক সংখ্যা আইডিটি (যেমন <code>123456789</code>) কপি করে Chat ID বক্সে পেস্ট করুন।</li>
                    <li><strong>৩. ইন্টারনেট বা ভিপিএন:</strong> আপনার ওয়াইফাই বা সিমে টেলিগ্রাম ব্লক থাকলে VPN বা Cloudflare WARP অন রাখুন।</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* 3-Step Telegram Setup Guide */}
          <div style={{
            background: 'var(--bg-primary)',
            padding: '1.25rem',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            fontSize: '0.82rem',
            lineHeight: 1.7,
            color: 'var(--text-main)'
          }}>
            <div style={{ fontWeight: '800', color: '#0ea5e9', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={16} />
              <span>{lang === 'bn' ? 'কীভাবে মাত্র ২ মিনিটে নিজের টেলিগ্রাম ব্যাকআপ বট তৈরি করবেন:' : 'How to set up your Telegram Backup Bot in 2 minutes:'}</span>
            </div>

            <ol style={{ margin: 0, paddingLeft: '1.25rem' }}>
              <li>
                টেলিগ্রাম অ্যাপে গিয়ে সার্চ করুন: <strong><a href="https://t.me/BotFather" target="_blank" rel="noreferrer" style={{ color: '#0ea5e9', textDecoration: 'underline' }}>@BotFather</a></strong>
              </li>
              <li>
                তাকে মেসেজ দিন: <code>/newbot</code> ➔ এরপর বটের একটি নাম দিন (যেমন: <code>MyShopBackupBot</code>) ➔ শেষে <code>bot</code> দিয়ে শেষ হওয়া ইউজারনেম দিন (যেমন: <code>myshop_backup_bot</code>)।
              </li>
              <li>
                BotFather আপনাকে একটি <strong>HTTP API Token</strong> দেবে। সেটি কপি করে ওপরের <strong>Bot Token</strong> ঘরে পেস্ট করুন।
              </li>
              <li>
                আপনার Chat ID জানতে টেলিগ্রামে সার্চ করুন <strong><a href="https://t.me/userinfobot" target="_blank" rel="noreferrer" style={{ color: '#0ea5e9', textDecoration: 'underline' }}>@userinfobot</a></strong> ➔ স্টার্ট দিলেই আপনার <strong>Id</strong> দেখাবে। সেটি ওপরের <strong>Chat ID</strong> ঘরে পেস্ট করুন।
              </li>
              <li>
                আপনার নতুন তৈরি করা বটের চ্যাটে গিয়ে একবার <strong>/start</strong> চাপুন (যাতে বট আপনাকে মেসেজ পাঠাতে পারে)।
              </li>
              <li>
                সবশেষে এখানে <strong>"কানেকশন টেস্ট করুন"</strong> এবং <strong>"কনফিগারেশন সংরক্ষণ"</strong> করুন। ব্যাস! এখন থেকে সম্পূর্ণ ডাটাবেজ ব্যাকআপ ফাইল আপনার টেলিগ্রামে চলে আসবে!
              </li>
            </ol>
          </div>
        </div>
      )}

    </div>
  );
};
