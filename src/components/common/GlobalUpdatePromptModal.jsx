import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Download,
  RefreshCw,
  X,
  AlertTriangle,
  CheckCircle2,
  Rocket,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import {
  getActiveOtaRelease,
  checkClientNeedsUpdate
} from '../../services/blueGreenReleaseService';

export const GlobalUpdatePromptModal = ({
  isLight = false,
  lang = 'bn',
  currentClientVersion = '2.2.0'
}) => {
  const isEn = lang === 'en';
  const [updateInfo, setUpdateInfo] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [dismissedVersion, setDismissedVersion] = useState(null);

  const evaluateUpdate = () => {
    const status = checkClientNeedsUpdate(currentClientVersion);
    if (status.needsUpdate) {
      // Don't show if dismissed and not force update
      if (dismissedVersion === status.activeRelease.version && !status.isForceUpdate) {
        return;
      }
      setUpdateInfo(status);
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    evaluateUpdate();

    // Listen to real-time OTA release broadcast event across tabs & windows
    const handleBroadcast = (e) => {
      const release = e?.detail?.release;
      if (release) {
        setDismissedVersion(null); // Reset dismissed state on new release
        evaluateUpdate();
      }
    };

    window.addEventListener('somiti_ota_release_broadcast', handleBroadcast);
    // Poll every 60 seconds
    const interval = setInterval(evaluateUpdate, 60000);

    return () => {
      window.removeEventListener('somiti_ota_release_broadcast', handleBroadcast);
      clearInterval(interval);
    };
  }, [currentClientVersion, dismissedVersion]);

  if (!isOpen || !updateInfo) return null;

  const { activeRelease, isForceUpdate } = updateInfo;

  const handleUpdateNow = () => {
    // 1. If running as PWA or in browser, reload service worker cache
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (let reg of registrations) {
          reg.update();
        }
      });
    }

    // 2. Open APK download URL if specified
    if (activeRelease.apkDownloadUrl) {
      window.open(activeRelease.apkDownloadUrl, '_blank');
    }

    // 3. Clear transient caches and hard reload
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  const handleDismiss = () => {
    if (isForceUpdate) return;
    setDismissedVersion(activeRelease.version);
    setIsOpen(false);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999, // Topmost overlay
        background: isForceUpdate ? 'rgba(0, 0, 0, 0.88)' : 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.25s ease-out'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          background: isLight ? '#ffffff' : '#0f172a',
          borderRadius: '26px',
          border: isLight ? '1.5px solid #e2e8f0' : '1.5px solid rgba(255, 255, 255, 0.12)',
          boxShadow: isLight
            ? '0 25px 60px -15px rgba(16, 185, 129, 0.25)'
            : '0 30px 70px -15px rgba(0, 0, 0, 0.85)',
          padding: '32px 28px',
          textAlign: 'center',
          position: 'relative'
        }}
      >
        {/* Dismiss Button (Only if not force update) */}
        {!isForceUpdate && (
          <button
            onClick={handleDismiss}
            style={{
              position: 'absolute',
              top: '18px',
              right: '18px',
              background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)',
              border: 'none',
              borderRadius: '12px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: isLight ? '#64748b' : '#94a3b8'
            }}
          >
            <X size={16} />
          </button>
        )}

        {/* Icon & Badge */}
        <div
          style={{
            width: '74px',
            height: '74px',
            borderRadius: '22px',
            background: 'linear-gradient(135deg, #10b981, #06b6d4)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 18px auto',
            boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.5)'
          }}
        >
          <Rocket size={38} />
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 14px',
            borderRadius: '20px',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#10b981',
            fontSize: '0.75rem',
            fontWeight: '800',
            marginBottom: '14px'
          }}
        >
          <Sparkles size={13} />
          <span>{isEn ? 'NEW VERSION AVAILABLE' : 'নতুন ভার্সন অবমুক্ত হয়েছে'}</span>
        </div>

        <h2 style={{ fontSize: '1.45rem', fontWeight: '900', color: isLight ? '#0f172a' : '#f8fafc', margin: '0 0 6px 0' }}>
          {isEn ? `Upgrade to Somiti 360 v${activeRelease.version}` : `সমিতি ৩৬০ v${activeRelease.version} আপডেট করুন`}
        </h2>

        <div style={{ fontSize: '0.82rem', color: isLight ? '#64748b' : '#94a3b8', marginBottom: '20px', fontWeight: '700' }}>
          {isEn
            ? `Your version: v${currentClientVersion} • New build: ${activeRelease.buildNumber}`
            : `আপনার বর্তমান ভার্সন: v${currentClientVersion} • নতুন বিল্ড: ${activeRelease.buildNumber}`}
        </div>

        {/* Release Notes Card */}
        <div
          style={{
            background: isLight ? '#f8fafc' : 'rgba(30, 41, 59, 0.5)',
            border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '16px',
            textAlign: 'left',
            marginBottom: '24px'
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: '800', color: isLight ? '#475569' : '#94a3b8', marginBottom: '8px' }}>
            {isEn ? "What's New in this release:" : 'নতুন কী কী যুক্ত হয়েছে:'}
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: isLight ? '#1e293b' : '#e2e8f0', lineHeight: '1.6' }}>
            {activeRelease.releaseNotes?.[lang] || activeRelease.releaseNotes?.bn || activeRelease.releaseNotes?.en}
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={handleUpdateNow}
            style={{
              width: '100%',
              padding: '14px 20px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #10b981, #06b6d4)',
              color: '#ffffff',
              border: 'none',
              fontWeight: '900',
              fontSize: '0.96rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              cursor: 'pointer',
              boxShadow: '0 8px 25px -6px rgba(16, 185, 129, 0.6)'
            }}
          >
            <Download size={20} />
            <span>{isEn ? 'Download & Upgrade Now' : 'এখনই ডাউনলোড ও আপডেট করুন'}</span>
          </button>

          {!isForceUpdate && (
            <button
              onClick={handleDismiss}
              style={{
                width: '100%',
                padding: '11px 18px',
                borderRadius: '14px',
                background: isLight ? '#f1f5f9' : 'rgba(30, 41, 59, 0.6)',
                color: isLight ? '#475569' : '#cbd5e1',
                border: 'none',
                fontWeight: '700',
                fontSize: '0.84rem',
                cursor: 'pointer'
              }}
            >
              {isEn ? 'Remind Me Later' : 'পরে মনে করিয়ে দিন'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
