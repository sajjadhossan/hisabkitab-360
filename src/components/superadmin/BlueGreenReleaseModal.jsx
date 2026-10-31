import React, { useState, useEffect } from 'react';
import {
  Rocket,
  ShieldCheck,
  RefreshCw,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Download,
  Bell,
  X,
  Zap,
  Globe,
  Sliders,
  Sparkles
} from 'lucide-react';
import {
  getActiveOtaRelease,
  publishOtaRelease,
  executeEmergencyRollback
} from '../../services/blueGreenReleaseService';

export const BlueGreenReleaseModal = ({
  isOpen,
  onClose,
  isLight = false,
  lang = 'bn'
}) => {
  const isEn = lang === 'en';
  const [currentRelease, setCurrentRelease] = useState(() => getActiveOtaRelease());
  const [version, setVersion] = useState(currentRelease.version);
  const [buildNumber, setBuildNumber] = useState(currentRelease.buildNumber);
  const [selectedSlot, setSelectedSlot] = useState(currentRelease.currentSlot || 'green');
  const [forceUpdate, setForceUpdate] = useState(Boolean(currentRelease.forceUpdate));
  const [apkDownloadUrl, setApkDownloadUrl] = useState(currentRelease.apkDownloadUrl || '');
  const [releaseNotesBn, setReleaseNotesBn] = useState(currentRelease.releaseNotes?.bn || '');
  const [releaseNotesEn, setReleaseNotesEn] = useState(currentRelease.releaseNotes?.en || '');
  const [notice, setNotice] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const active = getActiveOtaRelease();
      setCurrentRelease(active);
      setVersion(active.version);
      setBuildNumber(active.buildNumber);
      setSelectedSlot(active.currentSlot || 'green');
      setForceUpdate(Boolean(active.forceUpdate));
      setApkDownloadUrl(active.apkDownloadUrl || '');
      setReleaseNotesBn(active.releaseNotes?.bn || '');
      setReleaseNotesEn(active.releaseNotes?.en || '');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const showToastNotice = (msg, type = 'success') => {
    setNotice({ msg, type });
    setTimeout(() => setNotice(null), 3500);
  };

  const handlePublish = (e) => {
    e.preventDefault();
    if (!version.trim()) {
      showToastNotice(isEn ? 'Please specify a version number' : 'দয়া করে ভার্সন নম্বর দিন', 'error');
      return;
    }

    setIsPublishing(true);
    try {
      const published = publishOtaRelease({
        version: version.trim(),
        buildNumber: parseInt(buildNumber, 10) || 23,
        releaseNotesBn: releaseNotesBn.trim(),
        releaseNotesEn: releaseNotesEn.trim(),
        apkDownloadUrl: apkDownloadUrl.trim(),
        forceUpdate,
        targetSlot: selectedSlot
      });

      setCurrentRelease(published);
      showToastNotice(
        isEn
          ? `🎉 OTA Broadcast Dispatched: v${published.version} (${published.currentSlot.toUpperCase()})`
          : `🎉 নতুন আপডেট v${published.version} সফলভাবে সকল ডিভাইসে পুশ করা হয়েছে!`,
        'success'
      );
    } catch (err) {
      showToastNotice(err.message || 'Error publishing release', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleRollback = () => {
    if (!window.confirm(isEn ? 'Are you sure you want to trigger 1-second Emergency Rollback?' : 'আপনি কি নিশ্চিত যে ১ সেকেন্ডে পূর্ববর্তী ভার্সনে রোলব্যাক করতে চান?')) {
      return;
    }

    const res = executeEmergencyRollback();
    if (res.success) {
      setCurrentRelease(res.restoredConfig);
      setVersion(res.restoredConfig.version);
      setSelectedSlot(res.restoredConfig.currentSlot);
      showToastNotice(res.messageBn, 'success');
    } else {
      showToastNotice(res.messageBn, 'error');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '720px',
          maxHeight: '90vh',
          background: isLight ? '#ffffff' : '#0f172a',
          borderRadius: '24px',
          border: isLight ? '1.5px solid #e2e8f0' : '1.5px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: isLight ? '#f8fafc' : 'rgba(30, 41, 59, 0.4)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
              }}
            >
              <Rocket size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '900', color: isLight ? '#0f172a' : '#f8fafc' }}>
                {isEn ? 'Blue-Green OTA Release & Push Engine' : 'ব্লু-গ্রিন ওটিএ রিলিজ ও গ্লোবাল পুশ ইঞ্জিন'}
              </h2>
              <div style={{ fontSize: '0.78rem', color: isLight ? '#64748b' : '#94a3b8' }}>
                {isEn
                  ? 'One-click instant update broadcast to all web, mobile & desktop clients'
                  : 'এক ক্লিকে সকল সমিতি, মাঠকর্মী ও সদস্যদের কাছে ইনস্ট্যান্ট আপডেট পাঠানোর কন্ট্রোল রুম'}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)',
              border: 'none',
              borderRadius: '12px',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: isLight ? '#475569' : '#94a3b8'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Live Slot Status Ribbon */}
        <div
          style={{
            padding: '12px 24px',
            background: currentRelease.currentSlot === 'green'
              ? 'rgba(16, 185, 129, 0.12)'
              : 'rgba(59, 130, 246, 0.12)',
            borderBottom: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: currentRelease.currentSlot === 'green' ? '#10b981' : '#3b82f6',
                boxShadow: `0 0 10px ${currentRelease.currentSlot === 'green' ? '#10b981' : '#3b82f6'}`
              }}
            />
            <span style={{ fontSize: '0.82rem', fontWeight: '800', color: currentRelease.currentSlot === 'green' ? '#10b981' : '#3b82f6' }}>
              {isEn ? `CURRENT ACTIVE SLOT: ${currentRelease.currentSlot.toUpperCase()}` : `বর্তমানে সক্রিয় স্লট: ${currentRelease.currentSlot === 'green' ? 'গ্রিন (Green)' : 'ব্লু (Blue)'}`}
            </span>
            <span style={{ fontSize: '0.82rem', fontWeight: '900', color: isLight ? '#0f172a' : '#ffffff' }}>
              v{currentRelease.version} (Build {currentRelease.buildNumber})
            </span>
          </div>

          <button
            type="button"
            onClick={handleRollback}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              fontSize: '0.75rem',
              fontWeight: '800',
              cursor: 'pointer'
            }}
          >
            <RotateCcw size={13} />
            <span>{isEn ? '1-Sec Emergency Rollback' : '১-সেকেন্ড ইমার্জেন্সি রোলব্যাক'}</span>
          </button>
        </div>

        {/* Notice alert */}
        {notice && (
          <div
            style={{
              margin: '12px 24px 0 24px',
              padding: '10px 14px',
              borderRadius: '10px',
              background: notice.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              border: `1px solid ${notice.type === 'error' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
              color: notice.type === 'error' ? '#ef4444' : '#10b981',
              fontSize: '0.82rem',
              fontWeight: '800'
            }}
          >
            {notice.msg}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handlePublish} style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Target Slot Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '800', color: isLight ? '#475569' : '#94a3b8', marginBottom: '8px' }}>
              {isEn ? 'Target Deployment Slot' : 'টার্গেট ডিপ্লয়মেন্ট স্লট নির্বাচন করুন'}
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setSelectedSlot('green')}
                style={{
                  padding: '12px 14px',
                  borderRadius: '14px',
                  background: selectedSlot === 'green'
                    ? (isLight ? '#f0fdf4' : 'rgba(16, 185, 129, 0.15)')
                    : (isLight ? '#f8fafc' : 'rgba(30, 41, 59, 0.4)'),
                  border: `2px solid ${selectedSlot === 'green' ? '#10b981' : 'transparent'}`,
                  color: selectedSlot === 'green' ? '#10b981' : (isLight ? '#64748b' : '#94a3b8'),
                  fontWeight: '800',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}
              >
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
                <span>🟢 গ্রিন স্লট (Green Stage / Next)</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedSlot('blue')}
                style={{
                  padding: '12px 14px',
                  borderRadius: '14px',
                  background: selectedSlot === 'blue'
                    ? (isLight ? '#eff6ff' : 'rgba(59, 130, 246, 0.15)')
                    : (isLight ? '#f8fafc' : 'rgba(30, 41, 59, 0.4)'),
                  border: `2px solid ${selectedSlot === 'blue' ? '#3b82f6' : 'transparent'}`,
                  color: selectedSlot === 'blue' ? '#3b82f6' : (isLight ? '#64748b' : '#94a3b8'),
                  fontWeight: '800',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}
              >
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#3b82f6' }} />
                <span>🔵 ব্লু স্লট (Blue Stable / Prod)</span>
              </button>
            </div>
          </div>

          {/* Version Inputs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '800', color: isLight ? '#475569' : '#94a3b8', marginBottom: '6px' }}>
                {isEn ? 'New Version Name *' : 'নতুন ভার্সন নাম (যেমন 2.3.0) *'}
              </label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="2.3.0"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: isLight ? '#ffffff' : 'rgba(30, 41, 59, 0.8)',
                  border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
                  color: isLight ? '#0f172a' : '#f8fafc',
                  fontSize: '0.88rem',
                  fontWeight: '700'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '800', color: isLight ? '#475569' : '#94a3b8', marginBottom: '6px' }}>
                {isEn ? 'Build Code Number *' : 'বিল্ড নম্বর (Build Code) *'}
              </label>
              <input
                type="number"
                value={buildNumber}
                onChange={(e) => setBuildNumber(e.target.value)}
                placeholder="23"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: isLight ? '#ffffff' : 'rgba(30, 41, 59, 0.8)',
                  border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
                  color: isLight ? '#0f172a' : '#f8fafc',
                  fontSize: '0.88rem',
                  fontWeight: '700'
                }}
              />
            </div>
          </div>

          {/* APK URL */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '800', color: isLight ? '#475569' : '#94a3b8', marginBottom: '6px' }}>
              {isEn ? 'Android APK Download URL' : 'অ্যান্ড্রয়েড APK ডাউনলোড সরাসরি লিঙ্ক'}
            </label>
            <input
              type="text"
              value={apkDownloadUrl}
              onChange={(e) => setApkDownloadUrl(e.target.value)}
              placeholder="https://..."
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '12px',
                background: isLight ? '#ffffff' : 'rgba(30, 41, 59, 0.8)',
                border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
                color: isLight ? '#0f172a' : '#f8fafc',
                fontSize: '0.82rem'
              }}
            />
          </div>

          {/* Release Notes Bangla */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '800', color: isLight ? '#475569' : '#94a3b8', marginBottom: '6px' }}>
              {isEn ? 'Release Notes (Bengali) — User Visible' : 'রিলিজ নোট (বাংলা) — ব্যবহারকারীরা যা নোটিফিকেশনে দেখবেন'}
            </label>
            <textarea
              rows={3}
              value={releaseNotesBn}
              onChange={(e) => setReleaseNotesBn(e.target.value)}
              placeholder="নতুন কী কী সুবিধা যুক্ত হয়েছে লিখুন..."
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '12px',
                background: isLight ? '#ffffff' : 'rgba(30, 41, 59, 0.8)',
                border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
                color: isLight ? '#0f172a' : '#f8fafc',
                fontSize: '0.85rem',
                lineHeight: '1.5'
              }}
            />
          </div>

          {/* Force Update Guard */}
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '14px',
              background: forceUpdate
                ? 'rgba(239, 68, 68, 0.12)'
                : (isLight ? '#f8fafc' : 'rgba(30, 41, 59, 0.4)'),
              border: `1.5px solid ${forceUpdate ? '#ef4444' : (isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)')}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer'
            }}
            onClick={() => setForceUpdate(!forceUpdate)}
          >
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: '800', color: forceUpdate ? '#ef4444' : (isLight ? '#0f172a' : '#f8fafc') }}>
                {isEn ? 'Mandatory Force Update' : 'বাধ্যতামূলক আপডেট (Mandatory Force Update)'}
              </div>
              <div style={{ fontSize: '0.74rem', color: isLight ? '#64748b' : '#94a3b8' }}>
                {isEn
                  ? 'Prevents user from performing any actions until they upgrade to this version'
                  : 'অন থাকলে ব্যবহারকারীরা আপডেট না করা পর্যন্ত পুরোনো ভার্সনে কাজ করতে পারবে না'}
              </div>
            </div>

            <input
              type="checkbox"
              checked={forceUpdate}
              onChange={() => {}}
              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#ef4444' }}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPublishing}
            style={{
              marginTop: '8px',
              padding: '14px 20px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #10b981, #06b6d4)',
              color: '#ffffff',
              border: 'none',
              fontWeight: '900',
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              cursor: isPublishing ? 'wait' : 'pointer',
              boxShadow: '0 8px 24px -6px rgba(16, 185, 129, 0.5)'
            }}
          >
            <Rocket size={20} />
            <span>{isPublishing ? (isEn ? 'Broadcasting...' : 'সবার কাছে পাঠানো হচ্ছে...') : (isEn ? 'Broadcast OTA Update to All Users' : '🚀 ১-ক্লিকে সবার কাছে পাঠান ও নোটিফিকেশন দিন')}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
