import React from 'react';
import {
  Sparkles,
  Download,
  AlertTriangle,
  CheckCircle2,
  X,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  RefreshCw
} from 'lucide-react';
import { dismissAppUpdate } from '../../services/appUpdateService';

export const AppUpdateModal = ({
  isOpen,
  onClose,
  updateInfo,
  isLight = false,
  lang = 'bn'
}) => {
  const isEn = lang === 'en';

  if (!isOpen || !updateInfo || !updateInfo.hasUpdate) return null;

  const isForce = Boolean(updateInfo.forceUpdate);
  const releaseNotesBn = updateInfo.releaseNotes?.bn || 'নতুন আপডেট প্রকাশিত হয়েছে। উন্নত পারফরম্যান্স ও নতুন ফিচারের জন্য এখনই আপডেট করে নিন।';
  const releaseNotesEn = updateInfo.releaseNotes?.en || 'A new update is available. Please update to enjoy latest features and optimizations.';

  const handleDismiss = () => {
    if (isForce) return;
    dismissAppUpdate(updateInfo.latestVersion);
    onClose();
  };

  const handleDownload = () => {
    if (updateInfo.apkDownloadUrl) {
      window.open(updateInfo.apkDownloadUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 999999,
      background: 'rgba(5, 8, 15, 0.88)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      fontFamily: "'Inter', 'Plus Jakarta Sans', 'Hind Siliguri', sans-serif"
    }}>
      <div style={{
        width: '100%',
        maxWidth: '520px',
        background: isLight ? '#ffffff' : '#0f172a',
        color: isLight ? '#0f172a' : '#f8fafc',
        borderRadius: '22px',
        border: isLight ? '1.5px solid #cbd5e1' : '1.5px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '24px 24px 18px',
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
          color: '#ffffff',
          position: 'relative'
        }}>
          {!isForce && (
            <button
              onClick={handleDismiss}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                cursor: 'pointer'
              }}
            >
              <X size={16} />
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}>
              <Smartphone size={28} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900' }}>
                  {isEn ? 'New Update Available!' : 'নতুন আপডেট উপলব্ধ রয়েছে!'}
                </h3>
              </div>
              <p style={{ margin: '3px 0 0', fontSize: '0.82rem', opacity: 0.9 }}>
                {isEn ? 'Somiti 360 Cross-Platform Release' : 'সমিতি ৩৬০ মাল্টি-প্ল্যাটফর্ম রিলিজ'}
              </p>
            </div>
          </div>
        </div>

        {/* Version Comparison Card */}
        <div style={{ padding: '20px 24px' }}>
          <div style={{
            background: isLight ? '#f1f5f9' : 'rgba(30, 41, 59, 0.6)',
            borderRadius: '14px',
            padding: '14px 18px',
            border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px'
          }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: isLight ? '#64748b' : '#94a3b8', fontWeight: '800', textTransform: 'uppercase' }}>
                {isEn ? 'Current Version' : 'বর্তমান ভার্সন'}
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: '900', color: isLight ? '#0f172a' : '#f8fafc' }}>
                {updateInfo.currentVersion}
              </div>
            </div>

            <div style={{ fontSize: '1.4rem', color: '#10b981', fontWeight: '900' }}>
              &rarr;
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: '800', textTransform: 'uppercase' }}>
                {isEn ? 'Latest Version' : 'সর্বশেষ ভার্সন'}
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: '900', color: '#10b981' }}>
                {updateInfo.latestVersion}
              </div>
            </div>
          </div>

          {/* Release Notes */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: '800', color: isLight ? '#475569' : '#cbd5e1', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} color="#f59e0b" />
              <span>{isEn ? 'What is New in this Update:' : 'এই আপডেটে যা যা নতুন রয়েছে:'}</span>
            </div>

            <div style={{
              background: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.6)',
              borderRadius: '12px',
              padding: '12px 14px',
              border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: '0.8rem',
              lineHeight: '1.5',
              color: isLight ? '#334155' : '#cbd5e1',
              maxHeight: '140px',
              overflowY: 'auto'
            }}>
              {isEn ? releaseNotesEn : releaseNotesBn}
            </div>
          </div>

          {/* Mandatory Update Warning */}
          {isForce && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '10px',
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#ef4444',
              fontSize: '0.75rem',
              fontWeight: '800',
              marginBottom: '16px'
            }}>
              <AlertTriangle size={16} flexShrink={0} />
              <span>{isEn ? 'This is a required security update to continue using the app.' : 'নিরাপত্তা ও ডাটা সিঙ্কের স্বার্থে এই আপডেটটি সম্পন্ন করা বাধ্যতামূলক।'}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            {!isForce && (
              <button
                type="button"
                onClick={handleDismiss}
                style={{
                  padding: '10px 18px',
                  borderRadius: '12px',
                  border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'transparent',
                  color: isLight ? '#475569' : '#cbd5e1',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                {isEn ? 'Later' : 'পরে মনে করিয়ে দিন'}
              </button>
            )}

            <button
              type="button"
              onClick={handleDownload}
              style={{
                flex: 1,
                padding: '11px 20px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                fontSize: '0.85rem',
                fontWeight: '900',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
              }}
            >
              <Download size={16} />
              <span>{isEn ? 'Update Now (Download APK)' : 'এখনই আপডেট করুন (APK ডাউনলোড)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
